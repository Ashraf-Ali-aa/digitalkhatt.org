/**
 * @digitalkhatt/quran-engine - SVG Line Renderer
 *
 * Renders a line of Quran text to SVG elements using HarfBuzz shaping.
 */

import type { HBFeature, GlyphInformation, MushafLayoutType } from '../core/types';
import { SpaceType, MushafLayoutType as MushafLayoutTypeEnum } from '../core/types';
import {
  HarfBuzzBuffer,
  HarfBuzzFont,
  getArabLanguage,
  getArabScript,
} from '../core/harfbuzz';

// Re-export SpaceType for convenience
export { SpaceType };

/**
 * Verse number format options
 */
export type VerseNumberFormat = 'arabic' | 'english';

/**
 * Arabic-Indic numerals to Western Arabic numerals mapping
 */
const ARABIC_INDIC_TO_WESTERN: Record<string, string> = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
};

/**
 * Convert Arabic-Indic numerals to Western Arabic (English) numerals
 * @param text - Text containing Arabic-Indic numerals
 * @returns Text with Western Arabic numerals
 */
export function convertArabicToEnglishNumber(text: string): string {
  return text.replace(/[٠-٩]/g, (char) => ARABIC_INDIC_TO_WESTERN[char] || char);
}

/**
 * Get the aya (verse marker) digit count to remove from glyph path
 * based on mushaf type
 */
export function getAyaDigitCountForMushaf(mushafType: MushafLayoutType): number {
  switch (mushafType) {
    case MushafLayoutTypeEnum.OldMadinah:
      return 3;
    case MushafLayoutTypeEnum.NewMadinah:
      return 14;
    case MushafLayoutTypeEnum.IndoPak15Lines:
      return 0;
    default:
      return 0;
  }
}

/**
 * Get mushaf-specific positioning values for aya (verse) numbers
 */
export function getAyaPositioningForMushaf(mushafType: MushafLayoutType): {
  yOffset: number;
  fontSize: number;
  centerX: number;
  centerY: number;
  circleRadius: number;
} {
  switch (mushafType) {
    case MushafLayoutTypeEnum.OldMadinah:
      return {
        yOffset: -800,
        fontSize: 500,
        centerX: 586,
        centerY: 230,
        circleRadius: 0,
      };
    case MushafLayoutTypeEnum.NewMadinah:
      return {
        yOffset: -885,
        fontSize: 400,
        centerX: 435,
        centerY: 250,
        circleRadius: 0,
      };
    case MushafLayoutTypeEnum.IndoPak15Lines:
    default:
      return {
        yOffset: 0,
        fontSize: 350,
        centerX: 0, // Will be calculated from glyph.XAdvance
        centerY: 200,
        circleRadius: 240, // White circle to cover Arabic numbers
      };
  }
}

/**
 * Sajda (prostration) information for a line
 */
export interface SajdaRenderInfo {
  startIndex: number;
  endIndex: number;
}

/**
 * Options for SVG rendering
 */
export interface SVGRenderOptions {
  /** Scale factor for glyph rendering */
  glyphScale: number;
  /** X scale factor (for justification) */
  xScale?: number;
  /** Y scale factor */
  yScale?: number;
  /** Optional tajweed class map (cluster index -> CSS class) */
  tajweedClasses?: Map<number, string>;
  /** Number of digits to remove from aya number glyph paths */
  ayaDigitCount?: number;
  /** Optional SVG group element to clone for aya numbers */
  ayaSvgGroup?: SVGGElement;
  /** Y offset for aya number group */
  ayaYOffset?: number;
  /** Verse number format - 'arabic' uses font glyphs, 'english' renders text */
  verseNumberFormat?: VerseNumberFormat;
  /** Mushaf type for positioning calculations */
  mushafType?: MushafLayoutType;
  /** Sajda information for rendering prostration markers */
  sajdaInfo?: SajdaRenderInfo;
}

/**
 * Result of SVG line rendering
 */
export interface SVGLineRenderResult {
  /** The SVG element containing the rendered line */
  svg: SVGSVGElement;
  /** The line group element */
  lineGroup: SVGGElement;
  /** Total width of the rendered line in scaled units */
  lineWidth: number;
  /** Current X position after rendering (for layout calculations) */
  currentXPos: number;
  /** Start position of sajda marker (if present) */
  sajdaStartPos?: number;
  /** End position of sajda marker (if present) */
  sajdaEndPos?: number;
}


/**
 * SVG Line Renderer
 *
 * Renders shaped text to SVG path elements.
 */
export class SVGLineRenderer {
  private font: HarfBuzzFont;
  private glyphPathCache = new Map<number, string | string[]>();

  constructor(font: HarfBuzzFont) {
    this.font = font;
  }

  /**
   * Shape text and return glyph information
   */
  shapeText(text: string, features: HBFeature[] | null): GlyphInformation[] {
    const buffer = new HarfBuzzBuffer();
    buffer.setDirection('rtl');
    buffer.setLanguage(getArabLanguage());
    buffer.setScript(getArabScript());
    buffer.setClusterLevel(1);
    buffer.addText(text);
    const result = buffer.shape(this.font, features);
    buffer.destroy();
    return result;
  }

  /**
   * Render shaped glyphs to an SVG element
   */
  renderToSVG(
    lineText: string,
    shapedGlyphs: GlyphInformation[],
    spaces: Map<number, SpaceType>,
    simpleSpacing: number,
    ayaSpacing: number,
    options: SVGRenderOptions
  ): SVGLineRenderResult {
    const {
      glyphScale,
      xScale = 1,
      yScale = 1,
      tajweedClasses,
      ayaDigitCount = 0,
      ayaSvgGroup,
      ayaYOffset = 0,
      verseNumberFormat = 'arabic',
      mushafType = MushafLayoutTypeEnum.NewMadinah,
      sajdaInfo,
    } = options;

    // Create SVG element
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('shape-rendering', 'geometricPrecision');
    svg.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:xlink', 'http://www.w3.org/1999/xlink');

    const lineGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svg.appendChild(lineGroup);

    let currentXPos = 0;
    let sajdaStartPos: number | undefined;
    let sajdaEndPos: number | undefined;

    // Render glyphs in reverse order (RTL)
    for (let glyphIndex = shapedGlyphs.length - 1; glyphIndex >= 0; glyphIndex--) {
      const glyph = shapedGlyphs[glyphIndex];

      // Get or compute glyph path
      let pathString = this.glyphPathCache.get(glyph.GlyphId);
      const isAyaNumberChar = lineText.charCodeAt(glyph.Cluster) === 0x06dd;
      if (pathString === undefined) {
        pathString = this.font.glyphToSvgPath(glyph.GlyphId);

        // Handle aya number glyphs (split path for digit overlay if needed)
        if (isAyaNumberChar && ayaDigitCount > 0) {
          pathString = [pathString.split('Z').slice(ayaDigitCount).filter((a) => a.length).join('Z')];
        } else if (isAyaNumberChar) {
          // For mushaf types with ayaDigitCount=0 (like IndoPak), wrap in array to mark as aya number
          pathString = [pathString];
        }

        this.glyphPathCache.set(glyph.GlyphId, pathString);
      }

      // Track sajda positions
      if (sajdaInfo) {
        if (glyph.Cluster === sajdaInfo.startIndex && sajdaStartPos === undefined) {
          sajdaStartPos = currentXPos;
        }
        if (glyph.Cluster === sajdaInfo.endIndex && sajdaEndPos === undefined) {
          sajdaEndPos = currentXPos;
        }
      }

      // Handle spacing
      const space = spaces.get(glyph.Cluster);
      if (space === SpaceType.Aya) {
        currentXPos -= ayaSpacing;
      } else if (space === SpaceType.Simple) {
        currentXPos -= simpleSpacing;
      } else {
        currentXPos -= glyph.XAdvance;
      }

      if (pathString) {
        // Use isAyaNumberChar (character-based detection) as the primary check
        // The cache stores arrays for aya number glyphs, but we check the character
        // to handle edge cases and be more explicit about the intent
        const isAyaNumber = isAyaNumberChar;

        if (isAyaNumber) {
          // Render aya frame from external SVG group
          if (ayaSvgGroup) {
            const ayaGroup = ayaSvgGroup.cloneNode(true) as SVGGElement;
            ayaGroup.setAttribute(
              'transform',
              `scale(1,-1) translate(${currentXPos + glyph.XOffset} ${ayaYOffset})`
            );
            lineGroup.appendChild(ayaGroup);
          }

          // Render English verse numbers if requested
          if (verseNumberFormat === 'english') {
            // pathString might be a string or array depending on cache state
            const pathArray = typeof pathString === 'string' ? [pathString] : pathString;
            const englishElements = this.renderEnglishVerseNumber(
              lineText,
              glyph,
              currentXPos,
              mushafType,
              pathArray as string[],
              lineGroup
            );
            if (englishElements.skipGlyphPath) {
              continue;
            }
          }

          // Extract the path string if it's an array
          if (typeof pathString !== 'string') {
            pathString = pathString[0];
          }
        }

        // Create path element
        const newPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        newPath.setAttribute('d', pathString as string);
        newPath.setAttribute(
          'transform',
          `translate(${currentXPos + glyph.XOffset} ${glyph.YOffset})`
        );

        // Apply tajweed coloring
        if (tajweedClasses) {
          const tajweedClass = tajweedClasses.get(glyph.Cluster);
          if (tajweedClass) {
            newPath.classList.add(tajweedClass);
          } else if (lineText[glyph.Cluster] === '\u034F') {
            // CGJ character handling
            const nextIndex = glyphIndex - 1;
            if (nextIndex >= 0) {
              const nextCluster = shapedGlyphs[nextIndex].Cluster;
              const currCluster = glyph.Cluster + 1;
              if (nextCluster > currCluster) {
                const nextTajweedClass = tajweedClasses.get(currCluster);
                if (nextTajweedClass) {
                  newPath.classList.add(nextTajweedClass);
                }
              }
            }
          }
        }

        lineGroup.appendChild(newPath);
      }
    }

    // Render sajda (prostration) line marker
    if (sajdaStartPos !== undefined && sajdaEndPos !== undefined) {
      const sajdaLine = this.renderSajdaLine(sajdaStartPos, sajdaEndPos);
      lineGroup.appendChild(sajdaLine);
    }

    // Apply transform to line group
    lineGroup.setAttribute(
      'transform',
      `scale(${glyphScale * xScale},${-glyphScale * yScale})`
    );

    const lineWidth = -glyphScale * xScale * currentXPos;

    return {
      svg,
      lineGroup,
      lineWidth,
      currentXPos,
      sajdaStartPos,
      sajdaEndPos,
    };
  }

  /**
   * Render English verse number overlay
   * @returns Object indicating whether to skip the Arabic glyph path
   */
  private renderEnglishVerseNumber(
    lineText: string,
    glyph: GlyphInformation,
    currentXPos: number,
    mushafType: MushafLayoutType,
    pathStringArray: string[],
    lineGroup: SVGGElement
  ): { skipGlyphPath: boolean } {
    // Extract verse number from the text (characters after 0x06DD until next non-digit)
    let verseNumStr = '';
    for (let i = glyph.Cluster + 1; i < lineText.length; i++) {
      const char = lineText[i];
      if (char >= '٠' && char <= '٩') {
        verseNumStr += char;
      } else {
        break;
      }
    }
    const englishNum = convertArabicToEnglishNumber(verseNumStr);

    // Get mushaf-specific positioning
    const positioning = getAyaPositioningForMushaf(mushafType);

    // Scale font size based on number of digits
    const digitCount = englishNum.length;
    let fontSizeScale = 1;
    if (digitCount === 2) {
      fontSizeScale = 0.95;
    } else if (digitCount >= 3) {
      fontSizeScale = 0.70;
    }

    const fontSize = positioning.fontSize * fontSizeScale;

    // Calculate center position
    let xCenter: number;
    if (mushafType === MushafLayoutTypeEnum.IndoPak15Lines) {
      xCenter = currentXPos + glyph.XOffset + (glyph.XAdvance / 2);
    } else {
      xCenter = currentXPos + glyph.XOffset + positioning.centerX;
    }
    const yCenter = positioning.centerY;

    // For IndoPak: render the frame glyph first, then overlay with white circle + English number
    if (mushafType === MushafLayoutTypeEnum.IndoPak15Lines) {
      // IndoPak: render the full glyph path first (contains frame + Arabic numbers)
      const fullPath = pathStringArray[0];
      if (fullPath) {
        const framePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        framePath.setAttribute('d', fullPath);
        framePath.setAttribute('transform', `translate(${currentXPos + glyph.XOffset} ${glyph.YOffset})`);
        lineGroup.appendChild(framePath);
      }

      // Add white circle background to cover Arabic numbers
      if (positioning.circleRadius > 0) {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', xCenter.toString());
        circle.setAttribute('cy', yCenter.toString());
        circle.setAttribute('r', positioning.circleRadius.toString());
        circle.setAttribute('fill', 'white');
        lineGroup.appendChild(circle);
      }
    }

    // Create text element for English number
    const textElem = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textElem.textContent = englishNum;
    textElem.setAttribute('font-family', 'Arial, sans-serif');
    textElem.setAttribute('font-weight', 'bold');
    textElem.setAttribute('text-anchor', 'middle');
    textElem.setAttribute('dominant-baseline', 'middle');
    textElem.setAttribute('font-size', fontSize.toString());
    textElem.setAttribute('transform', `translate(${xCenter} ${yCenter}) scale(1, -1)`);

    lineGroup.appendChild(textElem);

    // Always skip rendering the Arabic number glyph path after this
    // For IndoPak: we already rendered the full glyph path above (frame + Arabic numbers),
    //              then overlaid with white circle + English text
    // For other types: the frame is rendered via ayaSvgGroup, we just add English text
    return { skipGlyphPath: true };
  }

  /**
   * Render sajda (prostration) line marker
   */
  private renderSajdaLine(startPos: number, endPos: number): SVGLineElement {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', startPos.toString());
    line.setAttribute('x2', endPos.toString());
    line.setAttribute('y1', '1200');
    line.setAttribute('y2', '1200');
    line.setAttribute('stroke', 'black');
    line.setAttribute('stroke-width', '60');
    return line;
  }

  /**
   * Clear the glyph path cache
   */
  clearCache(): void {
    this.glyphPathCache.clear();
  }
}
