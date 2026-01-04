/**
 * ViewerDemo - Demonstrates the multi-page QuranViewer
 */

import { useState, useCallback, useMemo } from 'react';
import {
  QuranViewer,
  useDigitalKhatt,
  isAyahMarker,
  getWordsForVerse,
  LAYOUT_TYPE_MAP,
  type WordClickInfo,
  type MushafLayoutTypeString,
  type VerseNumberFormat,
} from '../lib';

interface ViewerDemoProps {
  layoutType: MushafLayoutTypeString;
}

export function ViewerDemo({ layoutType }: ViewerDemoProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedWord, setSelectedWord] = useState<WordClickInfo | null>(null);
  const [selectedVerse, setSelectedVerse] = useState<{ surah: number; ayah: number } | null>(null);
  const [tajweedEnabled, setTajweedEnabled] = useState(true);
  const [verseNumberFormat, setVerseNumberFormat] = useState<VerseNumberFormat>(() => {
    const saved = localStorage.getItem('verseNumberFormat');
    return (saved === 'english' ? 'english' : 'arabic') as VerseNumberFormat;
  });

  // Get verse mapping from context
  const { getVerseMapping } = useDigitalKhatt();
  const mushafType = LAYOUT_TYPE_MAP[layoutType];
  const verseMapping = useMemo(() => getVerseMapping(mushafType), [getVerseMapping, mushafType]);

  const toggleVerseNumberFormat = () => {
    const newFormat = verseNumberFormat === 'arabic' ? 'english' : 'arabic';
    setVerseNumberFormat(newFormat);
    localStorage.setItem('verseNumberFormat', newFormat);
  };

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleWordClick = useCallback(
    (info: WordClickInfo) => {
      console.log('Word clicked:', info);

      // Check if clicked word is an ayah marker
      if (isAyahMarker(info.text)) {
        // Highlight entire verse for ayah marker clicks
        if (info.surah !== undefined && info.ayah !== undefined) {
          setSelectedVerse({ surah: info.surah, ayah: info.ayah });
          setSelectedWord(null);
        }
      } else {
        // Highlight just this word for regular word clicks
        setSelectedWord(info);
        setSelectedVerse(null);
      }
    },
    []
  );

  // Calculate highlighted words - either a single word or all words of a verse
  const highlightedWords = useMemo(() => {
    if (selectedVerse && verseMapping) {
      // Get all words for the selected verse
      const verseWords = getWordsForVerse(verseMapping, selectedVerse.surah, selectedVerse.ayah);
      return verseWords.map((w) => ({
        page: w.page + 1, // Convert from 0-indexed to 1-indexed
        line: w.line,
        word: w.word,
      }));
    } else if (selectedWord) {
      return [
        {
          page: selectedWord.pageNumber,
          line: selectedWord.lineIndex,
          word: selectedWord.wordIndex,
        },
      ];
    }
    return [];
  }, [selectedWord, selectedVerse, verseMapping]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        style={{
          padding: '10px 20px',
          backgroundColor: '#333',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
        }}
      >
        <h3 style={{ margin: 0 }}>Quran Viewer Demo</h3>

        <span>Current Page: {currentPage}</span>

        <label style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <input
            type="checkbox"
            checked={tajweedEnabled}
            onChange={(e) => setTajweedEnabled(e.target.checked)}
          />
          Tajweed
        </label>

        <button
          onClick={toggleVerseNumberFormat}
          style={{
            padding: '4px 12px',
            backgroundColor: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 4,
            color: 'white',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
          title="Toggle verse number format"
        >
          {verseNumberFormat === 'arabic' ? '١٢٣' : '123'}
        </button>

        {selectedVerse && (
          <span style={{ marginLeft: 'auto' }}>
            Selected Ayah: Surah {selectedVerse.surah}, Ayah {selectedVerse.ayah}
          </span>
        )}
        {selectedWord && !selectedVerse && (
          <span style={{ marginLeft: 'auto' }}>
            Selected: "{selectedWord.text}" (Page {selectedWord.pageNumber}, Line{' '}
            {selectedWord.lineIndex + 1})
          </span>
        )}
      </div>

      {/* Viewer */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <QuranViewer
          layoutType={layoutType}
          initialPage={1}
          width="100%"
          height="100%"
          pageWidth={450}
          tajweedEnabled={tajweedEnabled}
          verseNumberFormat={verseNumberFormat}
          backgroundColor="#f5f0e6"
          pageGap={30}
          highlightedWords={highlightedWords}
          highlightColor="rgba(255, 200, 0, 0.4)"
          onPageChange={handlePageChange}
          onWordClick={handleWordClick}
          overscanPages={2}
        />
      </div>

      {/* Instructions footer */}
      <div
        style={{
          padding: '10px 20px',
          backgroundColor: '#f5f5f5',
          fontSize: 13,
          color: '#666',
          borderTop: '1px solid #ddd',
        }}
      >
        <strong>Controls:</strong> Scroll to navigate • Pinch to zoom (touch) • Arrow keys or
        Page Up/Down to navigate • Home/End for first/last page
      </div>
    </div>
  );
}

export default ViewerDemo;
