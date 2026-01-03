/**
 * @digitalkhatt/quran-engine - Core Module
 *
 * Framework-agnostic core services for Quran text rendering
 */

// Types
export type {
  MushafLayoutType,
  MushafLayoutTypeString,
  LineType,
  SpaceType,
  HBFeature,
  GlyphInformation,
  HarfBuzzDirection,
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
  TajweedColorMap,
  WordRect,
  LineRect,
  PageFormat,
  RenderResult,
  LoadingStatus,
  RendererType,
} from './types';

export {
  MushafLayoutType as MushafLayoutTypeEnum,
  LineType as LineTypeEnum,
  SpaceType as SpaceTypeEnum,
  JustStyle as JustStyleEnum,
  LAYOUT_TYPE_MAP,
  PAGE_WIDTH,
  INTERLINE,
  TOP,
  MARGIN,
  FONTSIZE,
} from './types';

// HarfBuzz
export {
  HarfBuzzExports,
  HarfBuzzBlob,
  HarfBuzzFace,
  HarfBuzzFont,
  HarfBuzzBuffer,
  shape,
  getWidth,
  hb_tag,
  harfbuzzFonts,
  loadHarfbuzz,
  loadAndCacheFont,
  getHarfBuzz,
  isHarfBuzzReady,
  getArabScript,
  getArabLanguage,
} from './harfbuzz';

// Quran Text Service
export { QuranTextService, createQuranTextService, loadQuranTextService } from './quran-text';

// Tajweed
export type { TajweedClass } from './tajweed';
export { applyTajweedByPage, DEFAULT_TAJWEED_COLORS } from './tajweed';

// Justification
export type { QuranTextServiceLike } from './justification';
export { justifyLine, analyzeLineForJust, clearJustificationCache } from './justification';

// Rendering States
export type { BufferableView } from './rendering-states';
export { RenderingStates, PageViewBuffer, DEFAULT_CACHE_SIZE } from './rendering-states';

// PageViewer
export type { PageViewerConfig, PageViewerRenderOptions } from './PageViewer';
export { PageViewer } from './PageViewer';

// QuranViewer
export type {
  VisiblePageInfo,
  VisiblePages,
  QuranViewerConfig,
  ScrollState,
} from './QuranViewer';
export { QuranViewer } from './QuranViewer';
