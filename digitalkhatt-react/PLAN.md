# React App Feature Parity Plan

## Overview
Migrate all features from the Angular Quran viewer to the React app, using Tailwind CSS for styling. The React app will have a single main viewer (multi-page scroll) instead of the current 3 demo tabs. Priority is feature parity first, then extracting shared logic to quran-engine.

## User Preferences
- **Design**: Tailwind CSS (lightweight, utility-first)
- **Default View**: Multi-page scroll viewer (like Angular)
- **App Structure**: Single main viewer (remove demo tabs)
- **Priority**: Feature parity first, then refactor to quran-engine

---

## Feature Gap Analysis

### Already Working in React
| Feature | Notes |
|---------|-------|
| 3 Mushaf Layouts | NewMadinah, OldMadinah, IndoPak15 |
| Tajweed Colors | 8 color rules with toggle |
| Word/Verse Clicking | Click detection + highlighting |
| Multiple Highlight Groups | Custom colors |
| Verse Number Format | Arabic (١٢٣) / English (123) |
| Surah Header Rendering | With decorative frame |
| Touch Gestures | Pinch-to-zoom |
| Basic Keyboard Nav | Arrows, Page Up/Down, Home/End |

### Missing in React (to implement)
| Feature | Priority | Notes |
|---------|----------|-------|
| Professional Toolbar | High | Navigation, zoom, settings |
| Sidebar Navigation | High | Surah list, page jump |
| Zoom Presets | High | page-fit, page-width, page-height |
| Page Input Field | High | Type page number to jump |
| localStorage Persistence | High | Page, zoom, settings |
| Full Screen Mode | Medium | Toggle button |
| Page Indicator Overlay | Medium | Shows during scroll |
| Responsive Breakpoints | Medium | Mobile/desktop zoom defaults |
| About/Info Dialog | Low | Project info, links |
| PWA Support | Low | Service worker, manifest |
| Keyboard Zoom | Low | Ctrl++, Ctrl+- |

---

## Implementation Plan

### Step 1: Add Tailwind CSS
**Files:**
- `package.json` - Add tailwindcss, postcss, autoprefixer
- `tailwind.config.js` - Create config
- `postcss.config.js` - Create config
- `src/index.css` - Add Tailwind directives

### Step 2: Create New App Structure (Remove Demo Tabs)
**Files to modify:**
- `src/App.tsx` - Replace demo tabs with single viewer + toolbar + sidebar

**New structure:**
```tsx
<QuranProvider>
  <div className="flex h-screen">
    <Sidebar />
    <div className="flex-1 flex flex-col">
      <Toolbar />
      <QuranViewer />
    </div>
  </div>
</QuranProvider>
```

### Step 3: Create Toolbar Component
**New file:** `src/components/Toolbar.tsx`

**Features:**
- Menu icon (hamburger) for sidebar toggle
- Navigation: |< < [page input] / total > >|
- Layout dropdown (New Madinah, Old Madinah, IndoPak 15)
- Tajweed toggle button
- Verse format toggle (١٢٣ / 123)
- Zoom dropdown (Page Fit, Page Width, Page Height, 50%, 75%, 100%, 125%, 150%, 200%)
- Full screen button
- Info button
- GitHub/Twitter links

**Props:**
```tsx
interface ToolbarProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  layoutType: MushafLayoutTypeString;
  onLayoutChange: (layout: MushafLayoutTypeString) => void;
  tajweedEnabled: boolean;
  onTajweedChange: (enabled: boolean) => void;
  verseNumberFormat: VerseNumberFormat;
  onVerseFormatChange: (format: VerseNumberFormat) => void;
  zoom: ZoomMode;
  onZoomChange: (zoom: ZoomMode) => void;
  onMenuClick: () => void;
  onFullScreen: () => void;
  onAboutClick: () => void;
}
```

### Step 4: Create Sidebar Component
**New file:** `src/components/Sidebar.tsx`

**Features:**
- Surah list (114 surahs) with names
- Click surah → jump to page
- Responsive: overlay on mobile, side-by-side on desktop (992px breakpoint)
- Close button on mobile overlay

**Data source:** Use `outline` from QuranTextService (already in quran-engine)

### Step 5: Implement Zoom Modes
**Modify:** `src/lib/components/QuranViewer.tsx`

**Add ZoomMode type:**
```tsx
type ZoomMode = 'page-fit' | 'page-width' | 'page-height' | 'custom' | number;
```

**Zoom calculation logic (from Angular):**
- `page-fit`: Scale to fit entire page in viewport
- `page-width`: Scale to fit page width in viewport
- `page-height`: Scale to fit page height in viewport
- `custom` / number: Fixed scale factor (0.5, 0.75, 1, 1.25, etc.)

**Responsive defaults:**
- Desktop (hover: pointer): `page-fit`
- Mobile (hover: none): `page-width`

### Step 6: localStorage Persistence
**New file:** `src/hooks/useLocalStorage.ts`

**Keys to persist:**
```tsx
const STORAGE_KEYS = {
  lastPage: 'digitalkhatt-lastPage',
  layout: 'digitalkhatt-layout',  // Already exists
  zoom: 'digitalkhatt-zoom',
  tajweed: 'digitalkhatt-tajweed',
  verseFormat: 'verseNumberFormat',  // Already exists
};
```

**Save on change, restore on mount.**

### Step 7: Full Screen Mode
**Modify:** Toolbar + App.tsx

**Implementation:**
```tsx
const toggleFullScreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
};
```

### Step 8: Page Indicator Overlay
**New file:** `src/components/PageIndicator.tsx`

**Features:**
- Appears when scrolling
- Shows current page number in corner
- Auto-hide after 2s of no scrolling

### Step 9: About Dialog
**New file:** `src/components/AboutDialog.tsx`

**Content:**
- DigitalKhatt description
- Version info
- Links to GitHub, project site

### Step 10: Keyboard Shortcuts Enhancement
**Modify:** QuranViewer + App

**Add:**
- Ctrl++ / Ctrl+= → Zoom in
- Ctrl+- → Zoom out
- Existing: Arrows, Page Up/Down, Home/End

### Step 11: Responsive Breakpoints
**Behavior:**
- < 992px (mobile): Sidebar as overlay, zoom default `page-width`
- >= 992px (desktop): Sidebar inline, zoom default `page-fit`

---

## Files Summary

### New Files to Create
| File | Description |
|------|-------------|
| `src/components/Toolbar.tsx` | Main toolbar |
| `src/components/Sidebar.tsx` | Surah navigation |
| `src/components/PageIndicator.tsx` | Page overlay |
| `src/components/AboutDialog.tsx` | Info modal |
| `src/hooks/useLocalStorage.ts` | Storage hook |
| `tailwind.config.js` | Tailwind config |
| `postcss.config.js` | PostCSS config |

### Files to Modify
| File | Changes |
|------|---------|
| `package.json` | Add Tailwind deps |
| `src/index.css` | Tailwind directives |
| `src/App.tsx` | New layout with toolbar + sidebar |
| `src/App.css` | Remove or minimize |
| `src/lib/components/QuranViewer.tsx` | Zoom modes, expose API |

### Files to Remove/Archive
| File | Reason |
|------|--------|
| `src/demo/SinglePageDemo.tsx` | Consolidating to single viewer |
| `src/demo/ViewerDemo.tsx` | Logic moves to main App |
| `src/demo/InteractiveDemo.tsx` | Features merged into main viewer |

---

## State Management

**App-level state (in App.tsx):**
```tsx
const [sidebarOpen, setSidebarOpen] = useState(false);
const [currentPage, setCurrentPage] = useState(1);
const [layoutType, setLayoutType] = useState<MushafLayoutTypeString>('oldMadinah');
const [tajweedEnabled, setTajweedEnabled] = useState(true);
const [verseNumberFormat, setVerseNumberFormat] = useState<VerseNumberFormat>('arabic');
const [zoom, setZoom] = useState<ZoomMode>('page-fit');
const [selectedVerse, setSelectedVerse] = useState<{surah: number; ayah: number} | null>(null);
const [aboutOpen, setAboutOpen] = useState(false);
```

---

## Future: Logic to Extract to quran-engine

After feature parity, consider moving these to the shared engine:

1. **Zoom calculation logic** - Currently duplicated
2. **Storage keys/defaults** - Standardize across apps
3. **Surah outline data** - Already partially in QuranTextService
4. **Page visibility calculation** - Used by both apps

---

## Implementation Order

1. ✅ Planning complete
2. Add Tailwind CSS
3. Create Toolbar component
4. Restructure App.tsx (remove demos)
5. Create Sidebar component
6. Implement zoom modes
7. Add localStorage persistence
8. Add full screen mode
9. Add page indicator
10. Add about dialog
11. Add keyboard zoom shortcuts
12. Polish responsive behavior
13. (Optional) PWA setup
