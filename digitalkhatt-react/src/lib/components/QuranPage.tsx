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
  HighlightGroup,
} from '../core/types';
import { LAYOUT_TYPE_MAP, PAGE_WIDTH } from '../core/types';
import { useDigitalKhatt } from './QuranProvider';
import { CanvasRenderer } from '../canvas/CanvasRenderer';
import type { RenderOptions } from '../canvas/CanvasRenderer';
import { HitTestManager } from '../canvas/HitTestManager';
import { DEFAULT_TAJWEED_COLORS } from '../core/tajweed';
import { getWordsForVerse } from '../core/verse-mapping';

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
  /** Verses to highlight (single color, uses highlightColor) */
  highlightedVerses?: Array<{ surah: number; ayah: number }>;
  /** Words to highlight (single color, uses highlightColor) */
  highlightedWords?: Array<{ line: number; word: number }>;
  /** Highlight background color (used for highlightedVerses and highlightedWords) */
  highlightColor?: string;
  /** Multiple highlight groups with different colors */
  highlightGroups?: HighlightGroup[];

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
  highlightedVerses = [],
  highlightedWords = [],
  highlightColor = 'rgba(255, 255, 0, 0.3)',
  highlightGroups = [],
  onWordClick,
  onVerseClick,
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

  const { status, isReady, getFont, getTextService, getVerseMapping } = useDigitalKhatt();

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

  // Get font, text service, and verse mapping
  const font = useMemo(() => getFont(mushafType), [getFont, mushafType]);
  const textService = useMemo(() => getTextService(mushafType), [getTextService, mushafType]);
  const verseMapping = useMemo(() => getVerseMapping(mushafType), [getVerseMapping, mushafType]);

  // Convert highlightGroups and legacy props to renderer format
  const rendererHighlightGroups = useMemo(() => {
    const pageIndex = pageNumber - 1;
    const groups: Array<{ words: Array<{ lineIndex: number; wordIndex: number }>; color: string }> = [];

    // Process highlightGroups prop
    for (const group of highlightGroups) {
      const words: Array<{ lineIndex: number; wordIndex: number }> = [];

      // Add words from verses
      if (group.verses && verseMapping) {
        for (const verse of group.verses) {
          const verseWords = getWordsForVerse(verseMapping, verse.surah, verse.ayah);
          for (const w of verseWords) {
            if (w.page === pageIndex) {
              words.push({ lineIndex: w.line, wordIndex: w.word });
            }
          }
        }
      }

      // Add direct word references
      if (group.words) {
        for (const w of group.words) {
          if (w.page === pageIndex) {
            words.push({ lineIndex: w.line, wordIndex: w.word });
          }
        }
      }

      if (words.length > 0) {
        groups.push({ words, color: group.color });
      }
    }

    // Process legacy highlightedVerses prop
    if (highlightedVerses.length > 0 && verseMapping) {
      const words: Array<{ lineIndex: number; wordIndex: number }> = [];
      for (const verse of highlightedVerses) {
        const verseWords = getWordsForVerse(verseMapping, verse.surah, verse.ayah);
        for (const w of verseWords) {
          if (w.page === pageIndex) {
            words.push({ lineIndex: w.line, wordIndex: w.word });
          }
        }
      }
      if (words.length > 0) {
        groups.push({ words, color: highlightColor });
      }
    }

    // Process legacy highlightedWords prop
    if (highlightedWords.length > 0) {
      const words = highlightedWords.map((w) => ({ lineIndex: w.line, wordIndex: w.word }));
      groups.push({ words, color: highlightColor });
    }

    return groups;
  }, [pageNumber, highlightGroups, highlightedVerses, highlightedWords, highlightColor, verseMapping]);

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
      highlightGroups: rendererHighlightGroups,
      verseMapping,
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
    rendererHighlightGroups,
    verseMapping,
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

      if (word) {
        if (onWordClick) {
          onWordClick(createWordClickInfo(word));
        }

        // Also fire verse click if word has surah/ayah info
        if (onVerseClick && word.surah !== undefined && word.ayah !== undefined) {
          onVerseClick({
            surah: word.surah,
            ayah: word.ayah,
            pageNumber,
          });
        }
      }
    },
    [getCanvasCoords, createWordClickInfo, onWordClick, onVerseClick, pageNumber]
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
