# Student Score Page - Visual Component Guide

## Component Structure

```
StudentScoreDetailPage
├── State Management
│   ├── loading: boolean
│   ├── error: string | null
│   ├── data: evaluation + submission objects
│   └── viewer: ImageViewerState (for modal)
│
├── Header Section (Card)
│   ├── Left Side
│   │   ├── Test Title (text-2xl bold)
│   │   └── Evaluated Date (formatted)
│   └── Right Side
│       ├── Score (text-4xl bold)
│       └── Percentage (text-lg)
│
├── Main Content Grid (lg:grid-cols-3)
│   ├── Left Column (col-span-2)
│   │   ├── Student Submission Card
│   │   │   ├── Header: "Your Submission"
│   │   │   ├── Placeholder Box (min-h-80)
│   │   │   │   ├── Image Icon (SVG)
│   │   │   │   ├── "Student Submission" Text
│   │   │   │   └── View Image Button (orange)
│   │   │   └── onClick: openImageViewer()
│   │   │
│   │   ├── Teacher Reference Card
│   │   │   ├── Header: "Teacher Reference"
│   │   │   ├── Placeholder Box (min-h-80)
│   │   │   │   ├── Image Icon (SVG)
│   │   │   │   ├── "Teacher Reference" Text
│   │   │   │   └── View Image Button (orange)
│   │   │   └── onClick: openImageViewer()
│   │   │
│   │   └── Detailed Breakdown Card
│   │       ├── Header: "Detailed breakdown"
│   │       └── 6 Metric Cards (responsive grid)
│   │           ├── Drawing Quality
│   │           ├── Coloring
│   │           ├── Speed
│   │           ├── Neatness
│   │           ├── Creativity
│   │           └── Accuracy
│   │               (Each has: label, score/5, progress bar, percentage)
│   │
│   └── Right Column (Sidebar)
│       ├── Remarks Card
│       │   ├── Header: "Remarks"
│       │   └── Content: remarks or "No remarks provided"
│       │
│       └── Back Button Card
│           └── Full-width Orange Button
│
└── Image Viewer Modal (Dialog)
    ├── Header
    │   ├── Title (left)
    │   └── Toolbar (right)
    │       ├── Zoom In Button
    │       ├── Zoom Out Button
    │       ├── Reset Zoom Button
    │       ├── Download Button
    │       └── Close Button (X)
    │
    ├── Image Container
    │   ├── Background: black
    │   └── Image
    │       ├── Zoom: 50% - 300%
    │       ├── Transform: scale()
    │       ├── Smooth transition
    │       └── Object contain
    │
    └── Interactions
        ├── Click outside: close
        ├── ESC key: close
        ├── Zoom buttons: adjust scale
        ├── Reset: back to 100%
        └── Download: trigger file download
```

## UI Layout Flow

### 1. Header Card (100% width)
```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Flower Still Life                            25/30          │
│  Evaluated: 19 June 2026, 11:06 AM                     83%  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 2. Main Content Grid
```
┌──────────────────────────────────────────┬──────────────────┐
│           LEFT COLUMN                    │  RIGHT SIDEBAR   │
│        (col-span-2)                      │   (1 column)     │
├──────────────────────────────────────────┼──────────────────┤
│                                          │                  │
│  ┌──────────────────────────────────┐  │ ┌──────────────┐ │
│  │ Your Submission                  │  │ │  Remarks     │ │
│  │                                  │  │ │              │ │
│  │  ┌────────────────────────────┐  │  │ │ Great effort!│ │
│  │  │     [Image Icon]           │  │  │ │              │ │
│  │  │  Student Submission        │  │  │ │ Work on      │ │
│  │  │  [View Image Button]       │  │  │ │ speed and    │ │
│  │  └────────────────────────────┘  │  │ │ accuracy.    │ │
│  └──────────────────────────────────┘  │ │              │ │
│                                        │ └──────────────┘ │
│  ┌──────────────────────────────────┐  │                  │
│  │ Teacher Reference                │  │ ┌──────────────┐ │
│  │                                  │  │ │ [Back Button]│ │
│  │  ┌────────────────────────────┐  │  │ │              │ │
│  │  │     [Image Icon]           │  │  │ │              │ │
│  │  │  Teacher Reference         │  │  │ │              │ │
│  │  │  [View Image Button]       │  │  │ │              │ │
│  │  └────────────────────────────┘  │  │ └──────────────┘ │
│  └──────────────────────────────────┘  │                  │
│                                        │                  │
│  ┌──────────────────────────────────┐  │                  │
│  │ Detailed breakdown               │  │                  │
│  │                                  │  │                  │
│  │ [Metric] [Metric] [Metric]      │  │                  │
│  │ [Metric] [Metric] [Metric]      │  │                  │
│  └──────────────────────────────────┘  │                  │
│                                        │                  │
└──────────────────────────────────────────┴──────────────────┘
```

### 3. Image Viewer Modal (Full Screen)
```
┌────────────────────────────────────────────────────────────────┐
│ Student Submission      [🔍+ 🔍- 🔄 💾 X]                    │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│                                                                │
│                                                                │
│                     [ZOOMED IMAGE]                            │
│                                                                │
│                                                                │
│                                                                │
│ Zoom: 100% | Scale: 50% - 300%                               │
│ Background: Black | Scroll: Enabled when zoomed              │
└────────────────────────────────────────────────────────────────┘
```

## Responsive Breakpoints

### Desktop (lg: 1024px+)
- 3-column grid: 2-col main + 1-col sidebar
- Full-width cards
- All controls visible

### Tablet (md: 768px)
- 2-column grid with wrap
- Cards adjust sizing
- Touch-friendly buttons

### Mobile (sm: 640px)
- Single column, full width
- Cards stack vertically
- Optimized button sizes
- Touch targets: 44px minimum

## Color Scheme

| Element | Color | Usage |
|---------|-------|-------|
| Buttons (Primary) | `bg-orange-500 hover:bg-orange-600` | "View Image", "Back" |
| Card Background | `bg-white` | All cards |
| Card Border | `border-gray-200` | Card edges |
| Placeholder BG | `bg-gray-50` | Image placeholder area |
| Text Primary | `text-gray-900` | Headers, main text |
| Text Secondary | `text-gray-600` | Metadata, dates |
| Muted Text | `text-muted-foreground` | Labels, hints |
| Modal BG | `bg-black` | Image viewer background |
| Icon Color | `text-gray-400` | SVG icons |

## Typography Scale

| Element | Style | Size |
|---------|-------|------|
| Test Title | Bold | text-2xl (28px) |
| Score | Bold | text-4xl (36px) |
| Percentage | Medium | text-lg (18px) |
| Section Headers | Semibold | text-sm (14px) |
| Card Labels | Medium | text-xs (12px) |
| Body Text | Regular | text-sm (14px) |

## Spacing System

| Component | Padding | Margin |
|-----------|---------|--------|
| Cards | p-6 | gap-6 (between cards) |
| Placeholder Box | p-12 | - |
| Button Area | - | mb-4 (above button) |
| Grid Gap | - | gap-4 / gap-6 |
| Modal Content | p-4 | - |

## Interactive Elements

### Buttons
- **View Image**: Opens modal with specific image
- **Back**: Uses `window.history.back()`
- **Zoom In**: Increases zoom by 20% (max 300%)
- **Zoom Out**: Decreases zoom by 20% (min 50%)
- **Reset**: Sets zoom back to 100%
- **Download**: Triggers image download
- **Close (X)**: Closes modal

### Modal Triggers
1. Click "View Image" button → Opens modal with that image
2. ESC key → Closes modal
3. Click outside modal → Closes modal
4. Click X button → Closes modal

### State Management
- `viewer.isOpen`: Controls modal visibility
- `viewer.imageUrl`: Current image to display
- `viewer.title`: Modal title (image type)
- `viewer.zoom`: Current zoom level (50-300%)

## Performance Features

1. **Lazy Image Loading**: Images only load when modal opens
2. **CSS Transform Zoom**: GPU-accelerated, smooth performance
3. **Conditional Rendering**: Modal only renders when open
4. **Memoized Calculations**: Percentage calculations only when data changes
5. **Event Handlers**: Efficient state updates with proper dependencies

## Accessibility Features

- Semantic HTML structure
- Button labels clearly describe action
- Modal properly nested with Dialog component
- Keyboard support (ESC to close)
- Icon buttons have title attributes
- Color contrast meets WCAG standards
- Touch targets meet 44px minimum

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (iOS 14+)
- Mobile browsers: ✅ Touch-optimized

## Animation & Transitions

| Element | Animation | Duration |
|---------|-----------|----------|
| Zoom | CSS transform scale | 0.2s ease-in-out |
| Hover effects | Background color | Instant |
| Modal open | Fade in | 200ms (Dialog default) |
| Modal close | Fade out | 200ms (Dialog default) |
