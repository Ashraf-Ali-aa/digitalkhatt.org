/**
 * SinglePageDemo - Demonstrates a single Quran page
 */

import React, { useState, useCallback } from 'react';
import { QuranPage, type WordClickInfo, type MushafLayoutTypeString } from '../lib';

interface SinglePageDemoProps {
  layoutType: MushafLayoutTypeString;
}

export function SinglePageDemo({ layoutType }: SinglePageDemoProps) {
  const [pageNumber, setPageNumber] = useState(1);
  const [selectedWord, setSelectedWord] = useState<WordClickInfo | null>(null);
  const [hoveredWord, setHoveredWord] = useState<WordClickInfo | null>(null);
  const [tajweedEnabled, setTajweedEnabled] = useState(true);
  const [scale, setScale] = useState(1);

  const totalPages = layoutType === 'indoPak15' ? 604 : 604; // Adjust based on layout

  const handleWordClick = useCallback((info: WordClickInfo) => {
    setSelectedWord(info);
    console.log('Word clicked:', info);
  }, []);

  const handleWordHover = useCallback((info: WordClickInfo | null) => {
    setHoveredWord(info);
  }, []);

  const handlePrevPage = () => {
    setPageNumber((p) => Math.max(1, p - 1));
    setSelectedWord(null);
  };

  const handleNextPage = () => {
    setPageNumber((p) => Math.min(totalPages, p + 1));
    setSelectedWord(null);
  };

  const handlePageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= totalPages) {
      setPageNumber(value);
      setSelectedWord(null);
    }
  };

  // Calculate highlighted words from selected word
  const highlightedWords = selectedWord
    ? [{ line: selectedWord.lineIndex, word: selectedWord.wordIndex }]
    : [];

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <h2 style={{ marginBottom: 20 }}>Single Page Demo</h2>

      {/* Controls */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          marginBottom: 20,
          flexWrap: 'wrap',
        }}
      >
        <button onClick={handlePrevPage} disabled={pageNumber === 1}>
          ← Previous
        </button>

        <div>
          Page{' '}
          <input
            type="number"
            value={pageNumber}
            onChange={handlePageInput}
            min={1}
            max={totalPages}
            style={{ width: 60 }}
          />{' '}
          / {totalPages}
        </div>

        <button onClick={handleNextPage} disabled={pageNumber === totalPages}>
          Next →
        </button>

        <span style={{ marginLeft: 20 }}>|</span>

        <label style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <input
            type="checkbox"
            checked={tajweedEnabled}
            onChange={(e) => setTajweedEnabled(e.target.checked)}
          />
          Tajweed Colors
        </label>

        <span>|</span>

        <label style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          Scale:
          <input
            type="range"
            min={0.5}
            max={2}
            step={0.1}
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
          />
          {scale.toFixed(1)}x
        </label>
      </div>

      {/* Page container */}
      <div
        style={{
          border: '1px solid #ccc',
          borderRadius: 8,
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'center',
          backgroundColor: '#f9f9f9',
          padding: 20,
        }}
      >
        <QuranPage
          pageNumber={pageNumber}
          layoutType={layoutType}
          width={400}
          scale={scale}
          tajweedEnabled={tajweedEnabled}
          backgroundColor="#fff9f0"
          highlightedWords={highlightedWords}
          highlightColor="rgba(255, 200, 0, 0.4)"
          onWordClick={handleWordClick}
          onWordHover={handleWordHover}
        />
      </div>

      {/* Info panel */}
      <div
        style={{
          marginTop: 20,
          padding: 15,
          backgroundColor: '#f5f5f5',
          borderRadius: 8,
        }}
      >
        <h4 style={{ marginTop: 0 }}>Word Information</h4>

        {hoveredWord && (
          <div style={{ marginBottom: 10 }}>
            <strong>Hovered:</strong> "{hoveredWord.text}" (Line {hoveredWord.lineIndex + 1}, Word{' '}
            {hoveredWord.wordIndex + 1})
            {hoveredWord.surah && hoveredWord.ayah && (
              <span>
                {' '}
                - Surah {hoveredWord.surah}, Ayah {hoveredWord.ayah}
              </span>
            )}
          </div>
        )}

        {selectedWord ? (
          <div>
            <strong>Selected:</strong> "{selectedWord.text}" (Line {selectedWord.lineIndex + 1},
            Word {selectedWord.wordIndex + 1})
            {selectedWord.surah && selectedWord.ayah && (
              <div>
                Surah {selectedWord.surah}, Ayah {selectedWord.ayah}
              </div>
            )}
          </div>
        ) : (
          <div style={{ color: '#666' }}>Click on a word to select it</div>
        )}
      </div>

      {/* Instructions */}
      <div style={{ marginTop: 20, fontSize: 14, color: '#666' }}>
        <p>
          <strong>Instructions:</strong>
        </p>
        <ul>
          <li>Click on any word to select it and see its details</li>
          <li>Hover over words to see quick info</li>
          <li>Use the scale slider to zoom in/out</li>
          <li>Toggle Tajweed colors on/off</li>
          <li>Navigate using Previous/Next buttons or enter a page number</li>
        </ul>
      </div>
    </div>
  );
}

export default SinglePageDemo;
