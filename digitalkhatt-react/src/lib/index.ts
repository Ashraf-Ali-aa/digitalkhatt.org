/**
 * DigitalKhatt React - Library Exports
 *
 * A React component library for rendering Quran text with proper
 * Arabic typography using the DigitalKhatt engine.
 */

// ============================================
// Core Types
// ============================================
export type {
  MushafLayoutType,
  MushafLayoutTypeString,
  LineType,
  SpaceType,
  HBFeature,
  GlyphInformation,
  SubWordInfo,
  WordInfo,
  LineTextInfo,
  TextFontFeature,
  JustResultByLine,
  JustStyle,
  SajdaInfo,
  LineInfo,
  QuranOutlineItem,
  QuranTextData,
  VerseRef,
  WordRef,
  WordClickInfo,
  VerseClickInfo,
  HighlightStyle,
  HighlightGroup,
  TajweedColorMap,
  WordRect,
  LineRect,
  PageFormat,
  RenderResult,
  LoadingStatus,
} from './core/types';

// DigitalKhattContextValue is exported from QuranProvider

export {
  LAYOUT_TYPE_MAP,
  PAGE_WIDTH,
  INTERLINE,
  TOP,
  MARGIN,
  FONTSIZE,
} from './core/types';

// ============================================
// Core Services
// ============================================
export { loadHarfbuzz, loadAndCacheFont } from './core/harfbuzz';
export type { HarfBuzzFont, HarfBuzzExports } from './core/harfbuzz';

export { QuranTextService, createQuranTextService } from './core/quran-text';
export { applyTajweedByPage, DEFAULT_TAJWEED_COLORS } from './core/tajweed';
export { justifyLine, analyzeLineForJust } from './core/justification';
export type { VerseWordMapping, WordPosition } from './core/verse-mapping';
export { buildVerseMapping, getVerseForWord, getWordsForVerse, getWordsForVerses } from './core/verse-mapping';

// ============================================
// Canvas Utilities
// ============================================
export { CanvasRenderer } from './canvas/CanvasRenderer';
export type { RenderOptions } from './canvas/CanvasRenderer';
export { HitTestManager } from './canvas/HitTestManager';
export { GlyphCache, glyphCache } from './canvas/GlyphCache';

// ============================================
// React Components
// ============================================
export { QuranProvider } from './components/QuranProvider';
export type { QuranProviderConfig, QuranProviderProps, DigitalKhattContextValue } from './components/QuranProvider';

export { QuranPage } from './components/QuranPage';
export type { QuranPageProps } from './components/QuranPage';

export { QuranViewer } from './components/QuranViewer';
export type { QuranViewerProps, QuranViewerRef } from './components/QuranViewer';

export { useDigitalKhatt } from './components/QuranProvider';
