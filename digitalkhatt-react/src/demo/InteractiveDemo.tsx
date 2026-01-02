/**
 * InteractiveDemo - Demonstrates interactive features like highlighting
 */

import { useState, useCallback } from 'react';
import { QuranPage, type WordClickInfo, type MushafLayoutTypeString } from '../lib';

interface InteractiveDemoProps {
  layoutType: MushafLayoutTypeString;
}

interface HighlightedWord {
  page: number;
  line: number;
  word: number;
  text: string;
}

export function InteractiveDemo({ layoutType }: InteractiveDemoProps) {
  const [pageNumber, setPageNumber] = useState(1);
  const [highlightedWords, setHighlightedWords] = useState<HighlightedWord[]>([]);
  const [highlightMode, setHighlightMode] = useState<'single' | 'multi'>('multi');
  const [highlightColor, setHighlightColor] = useState('rgba(255, 255, 0, 0.4)');
  const [tajweedEnabled, setTajweedEnabled] = useState(true);
  const [textColor, setTextColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#fffaf0');

  const handleWordClick = useCallback(
    (info: WordClickInfo) => {
      const newWord: HighlightedWord = {
        page: info.pageNumber,
        line: info.lineIndex,
        word: info.wordIndex,
        text: info.text,
      };

      if (highlightMode === 'single') {
        // Single mode: replace selection
        setHighlightedWords([newWord]);
      } else {
        // Multi mode: toggle selection
        const exists = highlightedWords.some(
          (w) => w.page === newWord.page && w.line === newWord.line && w.word === newWord.word
        );

        if (exists) {
          setHighlightedWords((prev) =>
            prev.filter(
              (w) =>
                !(w.page === newWord.page && w.line === newWord.line && w.word === newWord.word)
            )
          );
        } else {
          setHighlightedWords((prev) => [...prev, newWord]);
        }
      }
    },
    [highlightMode, highlightedWords]
  );

  const clearHighlights = () => {
    setHighlightedWords([]);
  };

  // Filter highlights for current page
  const currentPageHighlights = highlightedWords
    .filter((w) => w.page === pageNumber)
    .map((w) => ({ line: w.line, word: w.word }));

  const colorPresets = [
    { name: 'Yellow', value: 'rgba(255, 255, 0, 0.4)' },
    { name: 'Green', value: 'rgba(0, 255, 0, 0.3)' },
    { name: 'Blue', value: 'rgba(0, 150, 255, 0.3)' },
    { name: 'Pink', value: 'rgba(255, 100, 150, 0.3)' },
    { name: 'Orange', value: 'rgba(255, 165, 0, 0.4)' },
  ];

  const bgPresets = [
    { name: 'Cream', value: '#fffaf0' },
    { name: 'White', value: '#ffffff' },
    { name: 'Gray', value: '#f5f5f5' },
    { name: 'Sepia', value: '#f4ecd8' },
    { name: 'Dark', value: '#2a2a2a' },
  ];

  return (
    <div style={{ padding: 20, maxWidth: 1000, margin: '0 auto' }}>
      <h2 style={{ marginBottom: 20 }}>Interactive Demo</h2>

      <div style={{ display: 'flex', gap: 30 }}>
        {/* Page */}
        <div style={{ flex: '0 0 auto' }}>
          <div
            style={{
              border: '1px solid #ccc',
              borderRadius: 8,
              overflow: 'hidden',
              display: 'inline-block',
            }}
          >
            <QuranPage
              pageNumber={pageNumber}
              layoutType={layoutType}
              width={420}
              tajweedEnabled={tajweedEnabled}
              backgroundColor={bgColor}
              textColor={textColor}
              highlightedWords={currentPageHighlights}
              highlightColor={highlightColor}
              onWordClick={handleWordClick}
            />
          </div>

          {/* Page navigation */}
          <div
            style={{
              marginTop: 10,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <button onClick={() => setPageNumber((p) => Math.max(1, p - 1))} disabled={pageNumber === 1}>
              ← Prev
            </button>
            <span>
              Page {pageNumber} / 604
            </span>
            <button onClick={() => setPageNumber((p) => Math.min(604, p + 1))} disabled={pageNumber === 604}>
              Next →
            </button>
          </div>
        </div>

        {/* Controls panel */}
        <div style={{ flex: 1 }}>
          {/* Highlight mode */}
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ marginBottom: 10 }}>Highlight Mode</h4>
            <label style={{ marginRight: 15 }}>
              <input
                type="radio"
                name="mode"
                checked={highlightMode === 'single'}
                onChange={() => setHighlightMode('single')}
              />
              Single (click replaces)
            </label>
            <label>
              <input
                type="radio"
                name="mode"
                checked={highlightMode === 'multi'}
                onChange={() => setHighlightMode('multi')}
              />
              Multi (click toggles)
            </label>
          </div>

          {/* Highlight color */}
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ marginBottom: 10 }}>Highlight Color</h4>
            <div style={{ display: 'flex', gap: 5 }}>
              {colorPresets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => setHighlightColor(preset.value)}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: preset.value,
                    border: highlightColor === preset.value ? '2px solid #333' : '1px solid #ccc',
                    borderRadius: 4,
                    cursor: 'pointer',
                  }}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Background color */}
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ marginBottom: 10 }}>Background</h4>
            <div style={{ display: 'flex', gap: 5 }}>
              {bgPresets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => {
                    setBgColor(preset.value);
                    setTextColor(preset.value === '#2a2a2a' ? '#d4c4a0' : '#000000');
                  }}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: preset.value,
                    color: preset.value === '#2a2a2a' ? '#fff' : '#000',
                    border: bgColor === preset.value ? '2px solid #007bff' : '1px solid #ccc',
                    borderRadius: 4,
                    cursor: 'pointer',
                  }}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Tajweed toggle */}
          <div style={{ marginBottom: 20 }}>
            <label>
              <input
                type="checkbox"
                checked={tajweedEnabled}
                onChange={(e) => setTajweedEnabled(e.target.checked)}
              />
              Enable Tajweed Colors
            </label>
          </div>

          {/* Highlighted words list */}
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ marginBottom: 10 }}>
              Highlighted Words ({highlightedWords.length})
              {highlightedWords.length > 0 && (
                <button
                  onClick={clearHighlights}
                  style={{
                    marginLeft: 10,
                    padding: '2px 8px',
                    fontSize: 12,
                  }}
                >
                  Clear All
                </button>
              )}
            </h4>

            {highlightedWords.length === 0 ? (
              <p style={{ color: '#666', fontSize: 14 }}>
                Click on words to highlight them
              </p>
            ) : (
              <div
                style={{
                  maxHeight: 200,
                  overflowY: 'auto',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  padding: 10,
                }}
              >
                {highlightedWords.map((w, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '4px 0',
                      borderBottom: i < highlightedWords.length - 1 ? '1px solid #eee' : 'none',
                    }}
                  >
                    <span>
                      "{w.text}" <span style={{ color: '#666', fontSize: 12 }}>(p{w.page} l{w.line + 1} w{w.word + 1})</span>
                    </span>
                    <button
                      onClick={() =>
                        setHighlightedWords((prev) =>
                          prev.filter(
                            (hw) =>
                              !(hw.page === w.page && hw.line === w.line && hw.word === w.word)
                          )
                        )
                      }
                      style={{
                        padding: '2px 6px',
                        fontSize: 11,
                        color: '#666',
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Export/API info */}
          <div
            style={{
              backgroundColor: '#f9f9f9',
              padding: 15,
              borderRadius: 8,
              fontSize: 13,
            }}
          >
            <h4 style={{ margin: '0 0 10px 0' }}>API Example</h4>
            <pre
              style={{
                backgroundColor: '#2a2a2a',
                color: '#e0e0e0',
                padding: 10,
                borderRadius: 4,
                overflow: 'auto',
                fontSize: 11,
              }}
            >
{`<QuranPage
  pageNumber={${pageNumber}}
  layoutType="${layoutType}"
  tajweedEnabled={${tajweedEnabled}}
  backgroundColor="${bgColor}"
  highlightedWords={${JSON.stringify(currentPageHighlights, null, 2)}}
  highlightColor="${highlightColor}"
  onWordClick={(info) => ...}
/>`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InteractiveDemo;
