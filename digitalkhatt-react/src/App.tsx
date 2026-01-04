/**
 * DigitalKhatt React Demo App
 */

import { useState } from 'react';
import { QuranProvider, type MushafLayoutTypeString } from './lib';
import { SinglePageDemo } from './demo/SinglePageDemo';
import { ViewerDemo } from './demo/ViewerDemo';
import { InteractiveDemo } from './demo/InteractiveDemo';
import { quranText as indoPakText } from './lib/data/quran_text_indopak_15';
import { quranText as newMadinahText } from './lib/data/quran_text_madina';
import { quranText as oldMadinahText } from './lib/data/quran_text_old_madinah';
import './App.css';

type DemoType = 'single' | 'viewer' | 'interactive';

// Asset URLs - configure these based on your deployment
const WASM_URL = '/wasm/hb.wasm';
const FONT_URLS = {
  newMadinah: '/fonts/newmadinah.otf',
  oldMadinah: '/fonts/oldmadinah.otf',
  indoPak15: '/fonts/indopak15.otf',
};

const QURAN_TEXT = {
  newMadinah: newMadinahText,
  oldMadinah: oldMadinahText,
  indoPak15: indoPakText,
};

function App() {
  const [demo, setDemo] = useState<DemoType>('single');
  const [layoutType, setLayoutType] = useState<MushafLayoutTypeString>(() => {
    const saved = localStorage.getItem('digitalkhatt-layout');
    if (saved && ['newMadinah', 'oldMadinah', 'indoPak15'].includes(saved)) {
      return saved as MushafLayoutTypeString;
    }
    return 'oldMadinah';
  });

  const handleLayoutChange = (newLayout: MushafLayoutTypeString) => {
    setLayoutType(newLayout);
    localStorage.setItem("digitalkhatt-layout", newLayout);
    window.location.reload();
  };

  const layoutOptions: { value: MushafLayoutTypeString; label: string }[] = [
    { value: 'newMadinah', label: 'New Madinah' },
    { value: 'oldMadinah', label: 'Old Madinah' },
    { value: 'indoPak15', label: 'IndoPak 15-Line' },
  ];

  return (
    <QuranProvider
      wasmUrl={WASM_URL}
      fonts={FONT_URLS}
      quranText={QURAN_TEXT}
    >
      <div className="app">
        {/* Navigation header */}
        <header className="app-header">
          <h1>DigitalKhatt React</h1>

          <nav className="demo-nav">
            <button
              className={demo === 'single' ? 'active' : ''}
              onClick={() => setDemo('single')}
            >
              Single Page
            </button>
            <button
              className={demo === 'viewer' ? 'active' : ''}
              onClick={() => setDemo('viewer')}
            >
              Viewer
            </button>
            <button
              className={demo === 'interactive' ? 'active' : ''}
              onClick={() => setDemo('interactive')}
            >
              Interactive
            </button>
          </nav>

          <div className="layout-selector">
            <label>Layout: </label>
            <select
              value={layoutType}
              onChange={(e) => handleLayoutChange(e.target.value as MushafLayoutTypeString)}
            >
              {layoutOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </header>

        {/* Demo content */}
        <main className="app-content">
          {demo === 'single' && <SinglePageDemo layoutType={layoutType} />}
          {demo === 'viewer' && <ViewerDemo layoutType={layoutType} />}
          {demo === 'interactive' && <InteractiveDemo layoutType={layoutType} />}
        </main>
      </div>
    </QuranProvider>
  );
}

export default App;
