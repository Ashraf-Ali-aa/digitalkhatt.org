/**
 * QuranPage - React component for rendering a single Quran page
 *
 * Uses Canvas 2D for rendering with HarfBuzz text shaping
 */

import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import type {
  MushafLayoutType,
  MushafLayoutTypeString,
  WordClickInfo,
  VerseClickInfo,
  WordRect,
  PageFormat,
} from '../core/types';
import { LAYOUT_TYPE_MAP, PAGE_WIDTH } from '../core/types';
import { useDigitalKhatt } from './QuranProvider';
import { CanvasRenderer } from '../canvas/CanvasRenderer';
import type { RenderOptions } from '../canvas/CanvasRenderer';
import { HitTestManager } from '../canvas/HitTestManager';
import { DEFAULT_TAJWEED_COLORS } from '../core/tajweed';

// ============================================
// Types
// ============================================

export interface QuranPageProps {
  /** Page number (1-indexed) */
  pageNumber: number;
  /** Mushaf layout type */
  layoutType: MushafLayoutTypeString;

  // Dimensions
  /** Canvas width in pixels (default: 400) */
  width?: number;
  /** Scale factor (default: 1) */
  scale?: number;

  // Styling
  /** Enable Tajweed coloring (default: true) */
  tajweedEnabled?: boolean;
  /** Page background color */
  backgroundColor?: string;
  /** Text color (default: black) */
  textColor?: string;
  /** Custom Tajweed colors */
  tajweedColors?: Record<string, string>;

  // Highlighting
  /** Verses to highlight */
  highlightedVerses?: Array<{ surah: number; ayah: number }>;
  /** Words to highlight */
  highlightedWords?: Array<{ line: number; word: number }>;
  /** Highlight background color */
  highlightColor?: string;

  // Events
  /** Called when a word is clicked */
  onWordClick?: (info: WordClickInfo) => void;
  /** Called when a verse is clicked */
  onVerseClick?: (info: VerseClickInfo) => void;
  /** Called when mouse hovers over a word */
  onWordHover?: (info: WordClickInfo | null) => void;
  /** Called when rendering completes */
  onRenderComplete?: () => void;

  // Accessibility
  /** Enable hidden text for screen readers (default: true) */
  enableAccessibility?: boolean;
  /** Custom aria-label */
  ariaLabel?: string;

  /** Custom class name */
  className?: string;
  /** Custom style */
  style?: React.CSSProperties;
}

// ============================================
// Component
// ============================================

export function QuranPage({
  pageNumber,
  layoutType,
  width = 400,
  scale = 1,
  tajweedEnabled = true,
  backgroundColor,
  textColor = '#000000',
  tajweedColors = DEFAULT_TAJWEED_COLORS,
  highlightedWords = [],
  highlightColor = 'rgba(255, 255, 0, 0.3)',
  onWordClick,
  // onVerseClick - reserved for future use
  onWordHover,
  onRenderComplete,
  enableAccessibility = true,
  ariaLabel,
  className,
  style,
}: QuranPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const hitTestRef = useRef<HitTestManager>(new HitTestManager());
  const [hoveredWord, setHoveredWord] = useState<WordRect | null>(null);

  const { status, isReady, getFont, getTextService } = useDigitalKhatt();

  // Convert layout type string to enum
  const mushafType: MushafLayoutType = LAYOUT_TYPE_MAP[layoutType];

  // Calculate viewport dimensions
  const viewport: PageFormat = useMemo(() => {
    // Default page dimensions based on PAGE_WIDTH and aspect ratio
    const pageHeight = (width * 410) / 255; // Maintain aspect ratio
    const fontSize = (width / PAGE_WIDTH) * 1000; // Scale font size
    return {
      width: width * scale,
      height: pageHeight * scale,
      fontSize: fontSize * scale,
    };
  }, [width, scale]);

  // Get font and text service
  const font = useMemo(() => getFont(mushafType), [getFont, mushafType]);
  const textService = useMemo(() => getTextService(mushafType), [getTextService, mushafType]);

  // Render page
  useEffect(() => {
    if (!isReady || !font || !textService || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const pageIndex = pageNumber - 1;

    // Validate page index
    if (pageIndex < 0 || pageIndex >= textService.nbPages) {
      console.warn(`Invalid page number: ${pageNumber}`);
      return;
    }

    // Set canvas size
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Create or reuse renderer
    if (!rendererRef.current || rendererRef.current.getContext().canvas !== canvas) {
      rendererRef.current = new CanvasRenderer(canvas, font, textService);
    }

    // Render options
    const options: RenderOptions = {
      backgroundColor,
      textColor,
      tajweedEnabled,
      tajweedColors,
      highlightedWords: highlightedWords.map((w) => ({ lineIndex: w.line, wordIndex: w.word })),
      highlightColor,
    };

    // Render the page
    const result = rendererRef.current.renderPage(pageIndex, viewport, options);

    // Update hit test manager
    hitTestRef.current.setWordRects(result.wordRects);
    hitTestRef.current.setLineRects(result.lineRects);

    // Notify completion
    onRenderComplete?.();
  }, [
    isReady,
    font,
    textService,
    pageNumber,
    viewport,
    backgroundColor,
    textColor,
    tajweedEnabled,
    tajweedColors,
    highlightedWords,
    highlightColor,
    onRenderComplete,
  ]);

  // Convert canvas coordinates to hit test coordinates
  const getCanvasCoords = useCallback((event: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in event ? event.touches[0]?.clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0]?.clientY : event.clientY;

    if (clientX === undefined || clientY === undefined) return null;

    // Account for CSS scaling
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  // Create word click info from word rect
  const createWordClickInfo = useCallback(
    (wordRect: WordRect): WordClickInfo => {
      return {
        pageNumber,
        lineIndex: wordRect.lineIndex,
        wordIndex: wordRect.wordIndex,
        text: wordRect.text,
        surah: wordRect.surah,
        ayah: wordRect.ayah,
      };
    },
    [pageNumber]
  );

  // Handle click
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const coords = getCanvasCoords(event);
      if (!coords) return;

      const { word } = hitTestRef.current.hitTest(coords.x, coords.y);

      if (word && onWordClick) {
        onWordClick(createWordClickInfo(word));
      }
    },
    [getCanvasCoords, createWordClickInfo, onWordClick]
  );

  // Handle mouse move (hover)
  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const coords = getCanvasCoords(event);
      if (!coords) return;

      const { word } = hitTestRef.current.hitTest(coords.x, coords.y);

      if (word !== hoveredWord) {
        setHoveredWord(word);
        onWordHover?.(word ? createWordClickInfo(word) : null);
      }
    },
    [getCanvasCoords, hoveredWord, createWordClickInfo, onWordHover]
  );

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    if (hoveredWord) {
      setHoveredWord(null);
      onWordHover?.(null);
    }
  }, [hoveredWord, onWordHover]);

  // Loading state
  if (status === 'loading') {
    return (
      <div
        className={className}
        style={{
          width: viewport.width,
          height: viewport.height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: backgroundColor || '#f5f5f5',
          ...style,
        }}
      >
        <span>Loading...</span>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <div
        className={className}
        style={{
          width: viewport.width,
          height: viewport.height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffeeee',
          color: '#cc0000',
          ...style,
        }}
      >
        <span>Error loading Quran engine</span>
      </div>
    );
  }

  // Not ready yet
  if (!isReady || !font || !textService) {
    return (
      <div
        className={className}
        style={{
          width: viewport.width,
          height: viewport.height,
          ...style,
        }}
      />
    );
  }

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: viewport.width,
        height: viewport.height,
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          width: '100%',
          height: '100%',
          cursor: hoveredWord ? 'pointer' : 'default',
        }}
        aria-label={ariaLabel || `Quran page ${pageNumber}`}
        role="img"
      />

      {/* Accessibility: Hidden text for screen readers */}
      {enableAccessibility && textService && (
        <div
          className="sr-only"
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            border: 0,
          }}
          role="article"
          aria-label={`Quran page ${pageNumber} text content`}
        >
          {textService.quranText[pageNumber - 1]?.map((line, lineIndex) => (
            <p key={lineIndex}>{line}</p>
          ))}
        </div>
      )}
    </div>
  );
}

export default QuranPage;
