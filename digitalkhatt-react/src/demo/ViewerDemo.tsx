/**
 * ViewerDemo - Demonstrates the multi-page QuranViewer
 */

import { useState, useCallback } from 'react';
import { QuranViewer, type WordClickInfo, type MushafLayoutTypeString } from '../lib';

interface ViewerDemoProps {
  layoutType: MushafLayoutTypeString;
}

export function ViewerDemo({ layoutType }: ViewerDemoProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedWord, setSelectedWord] = useState<WordClickInfo | null>(null);
  const [tajweedEnabled, setTajweedEnabled] = useState(true);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleWordClick = useCallback((info: WordClickInfo) => {
    setSelectedWord(info);
    console.log('Word clicked:', info);
  }, []);

  // Calculate highlighted words
  const highlightedWords = selectedWord
    ? [
        {
          page: selectedWord.pageNumber,
          line: selectedWord.lineIndex,
          word: selectedWord.wordIndex,
        },
      ]
    : [];

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

        {selectedWord && (
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
