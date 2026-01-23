# FormatToolbar Component
**Last Updated:** January 21, 2026  
**Version:** 1.0  
**Status:** ✅ Production Ready

---

## Overview

`FormatToolbar` is a compact, accessible toolbar that provides quick markdown formatting options for text editors. It includes heading levels, text formatting (bold, italic, strikethrough), code formatting, lists, quotes, and links, all with tooltips and keyboard shortcuts.

---

## Purpose

Provide intuitive markdown formatting interface with:
- Heading levels (H1, H2, H3)
- Text formatting (bold, italic, strikethrough)
- Code formatting (inline code, code blocks)
- List formatting (bullet, numbered)
- Quote and link insertion
- Dark mode support
- Accessibility features (ARIA labels, tooltips)
- Consistent button styling

---

## Key Responsibilities

### 1. Formatting Options
- Headings (H1, H2, H3)
- Text styling (bold, italic, strikethrough)
- Code formatting (inline, block)
- List creation (bullet, numbered)
- Block quotes
- Link insertion

### 2. User Experience
- Visual grouping with dividers
- Tooltips for guidance
- Keyboard shortcuts displayed
- Consistent hover effects
- Dark mode styling

### 3. Accessibility
- ARIA labels on all buttons
- Keyboard shortcuts in tooltips
- Focus visible on buttons
- Semantic HTML structure

---

## Component Structure

```
FormatToolbar
├── Toolbar Container
│   └── Button Groups
│       ├── Headings Group
│       │   ├── Heading 1 Button
│       │   ├── Heading 2 Button
│       │   ├── Heading 3 Button
│       │   └── Divider
│       ├── Text Formatting Group
│       │   ├── Bold Button
│       │   ├── Italic Button
│       │   ├── Strikethrough Button
│       │   └── Divider
│       ├── Code Group
│       │   ├── Inline Code Button
│       │   ├── Code Block Button
│       │   └── Divider
│       └── Lists & Quote Group
│           ├── Quote Button
│           ├── Bullet List Button
│           ├── Numbered List Button
│           └── Link Button
```

---

## Props

```javascript
{
  dark: boolean,           // Dark mode enabled (default: false)
  onAction: (type: string) => void  // Action callback (required)
}
```

### dark
- **Type:** `boolean`
- **Default:** `false`
- **Purpose:** Enable dark mode styling
- **Usage:** Controls text colors and hover effects

### onAction
- **Type:** `(type: string) => void`
- **Default:** Required
- **Purpose:** Callback when a format button is clicked
- **Arguments:** Format type string (e.g., "bold", "h1", "code")
- **Usage:** Called when user clicks a format button

---

## Action Types

```javascript
type FormatAction =
  | 'h1'           // Heading 1 (#)
  | 'h2'           // Heading 2 (##)
  | 'h3'           // Heading 3 (###)
  | 'bold'          // Bold (**)
  | 'italic'        // Italic (*)
  | 'strike'        // Strikethrough (~~)
  | 'code'          // Inline code (`)
  | 'codeblock'      // Code block (```)
  | 'quote'         // Quote (>)
  | 'ul'           // Bullet list (-)
  | 'ol'           // Numbered list (1.)
  | 'link'          // Link ([text](url))
```

---

## Key Features

### 1. Toolbar Container

```javascript
<div className={`fmt-pop px-3 py-2 rounded-lg shadow-lg ${
  dark 
    ? "bg-gray-800 text-gray-100 border border-gray-700" 
    : "bg-white text-gray-800 border border-gray-200"
}`}>
  <div className="flex items-center gap-1">
    {/* Buttons */}
  </div>
</div>
```

**Classes:**
- `fmt-pop` - Format popover base styles
- `px-3 py-2` - Padding
- `rounded-lg` - Rounded corners
- `shadow-lg` - Large shadow
- `bg-gray-800` / `bg-white` - Background color
- `text-gray-100` / `text-gray-800` - Text color
- `border border-gray-700` / `border border-gray-200` - Border
- `flex items-center gap-1` - Flex layout with gap

---

### 2. Button Styling

```javascript
const base = `toolbar-btn p-2 rounded-md transition-all duration-200 ${
  dark 
    ? "hover:bg-white/10 text-gray-200" 
    : "hover:bg-black/5 text-gray-700"
}`;

// Usage
<button className={base} onClick={() => onAction("bold")} aria-label="Bold">
  <Bold />
</button>
```

**Classes:**
- `toolbar-btn` - Base button styles
- `p-2` - Padding
- `rounded-md` - Rounded corners
- `transition-all` - Smooth transitions
- `duration-200` - 200ms transition
- `hover:bg-white/10` - Dark mode hover (white at 10% opacity)
- `hover:bg-black/5` - Light mode hover (black at 5% opacity)
- `text-gray-200` / `text-gray-700` - Text color

---

### 3. Dividers

```javascript
const divider = (
  <span className={`mx-1 w-px h-6 ${
    dark ? "bg-gray-600" : "bg-gray-300"
  }`} />
);
```

**Classes:**
- `mx-1` - Horizontal margin
- `w-px h-6` - Width 1px, height 24px
- `bg-gray-600` / `bg-gray-300` - Background color

**Purpose:** Visual separation between button groups

---

### 4. Tooltips

```javascript
<Tooltip text="Bold (Ctrl+B)">
  <button className={base} onClick={() => onAction("bold")} aria-label="Bold">
    <Bold />
  </button>
</Tooltip>
```

**Features:**
- Hover to show tooltip
- Displays keyboard shortcuts
- ARIA label for screen readers
- Consistent positioning

---

### 5. Heading Buttons

```javascript
<Tooltip text="Heading 1">
  <button className={base} onClick={() => onAction("h1")} aria-label="Heading 1">
    <Heading1 />
  </button>
</Tooltip>
<Tooltip text="Heading 2">
  <button className={base} onClick={() => onAction("h2")} aria-label="Heading 2">
    <Heading2 />
  </button>
</Tooltip>
<Tooltip text="Heading 3">
  <button className={base} onClick={() => onAction("h3")} aria-label="Heading 3">
    <Heading3 />
  </button>
</Tooltip>
```

**Actions:**
- `h1` → Inserts `# ` (heading 1)
- `h2` → Inserts `## ` (heading 2)
- `h3` → Inserts `### ` (heading 3)

---

### 6. Text Formatting Buttons

```javascript
<Tooltip text="Bold (Ctrl+B)">
  <button className={base} onClick={() => onAction("bold")} aria-label="Bold">
    <Bold />
  </button>
</Tooltip>
<Tooltip text="Italic (Ctrl+I)">
  <button className={base} onClick={() => onAction("italic")} aria-label="Italic">
    <Italic />
  </button>
</Tooltip>
<Tooltip text="Strikethrough">
  <button className={base} onClick={() => onAction("strike")} aria-label="Strikethrough">
    <Strikethrough />
  </button>
</Tooltip>
```

**Actions:**
- `bold` → Inserts `**` (bold)
- `italic` → Inserts `*` (italic)
- `strike` → Inserts `~~` (strikethrough)

---

### 7. Code Buttons

```javascript
<Tooltip text="Inline Code">
  <button className={base} onClick={() => onAction("code")} aria-label="Inline Code">
    <InlineCode />
  </button>
</Tooltip>
<Tooltip text="Code Block">
  <button className={base} onClick={() => onAction("codeblock")} aria-label="Code Block">
    <CodeBlock />
  </button>
</Tooltip>
```

**Actions:**
- `code` → Inserts `` ` `` (inline code)
- `codeblock` → Inserts ` ``` ` (code block)

---

### 8. List & Quote Buttons

```javascript
<Tooltip text="Quote">
  <button className={base} onClick={() => onAction("quote")} aria-label="Quote">
    <Quote />
  </button>
</Tooltip>
<Tooltip text="Bullet List">
  <button className={base} onClick={() => onAction("ul")} aria-label="Bullet List">
    <BulletList />
  </button>
</Tooltip>
<Tooltip text="Numbered List">
  <button className={base} onClick={() => onAction("ol")} aria-label="Numbered List">
    <NumberedList />
  </button>
</Tooltip>
<Tooltip text="Link">
  <button className={base} onClick={() => onAction("link")} aria-label="Link">
    <Link />
  </button>
</Tooltip>
```

**Actions:**
- `quote` → Inserts `> ` (block quote)
- `ul` → Inserts `- ` (bullet list)
- `ol` → Inserts `1. ` (numbered list)
- `link` → Inserts `[]()` (link placeholder)

---

## Styling

### Dark Mode

```javascript
dark ? "bg-gray-800 text-gray-100 border border-gray-700" : "bg-white text-gray-800 border border-gray-200"
```

**Dark Mode Colors:**
- Background: `#1f2937` (gray-800)
- Text: `#f3f4f6` (gray-100)
- Border: `#374151` (gray-700)
- Divider: `#4b5563` (gray-600)
- Button Hover: `rgba(255, 255, 255, 0.1)` (white at 10%)
- Button Text: `#e5e7eb` (gray-200)

### Light Mode

```javascript
"bg-white text-gray-800 border border-gray-200"
```

**Light Mode Colors:**
- Background: `#ffffff` (white)
- Text: `#1f2937` (gray-800)
- Border: `#e5e7eb` (gray-200)
- Divider: `#d1d5db` (gray-300)
- Button Hover: `rgba(0, 0, 0, 0.05)` (black at 5%)
- Button Text: `#374151` (gray-700)

---

## Accessibility

### ARIA Labels

```javascript
<button aria-label="Heading 1">...</button>
<button aria-label="Bold">...</button>
<button aria-label="Italic">...</button>
```

**Purpose:** Provide screen reader context for buttons

### Tooltips

```javascript
<Tooltip text="Bold (Ctrl+B)">
  <button>...</button>
</Tooltip>
```

**Purpose:** Display keyboard shortcuts and action descriptions

### Focus Management

```javascript
className="... focus:outline-none"
```

**Note:** Focus outline is handled by the parent or global styles

---

## Usage Examples

### Basic Usage

```javascript
import { FormatToolbar } from './components/FormatToolbar'

function MyEditor() {
  const handleFormat = (type) => {
    console.log('Format:', type)
    // Handle formatting logic
  }

  return (
    <FormatToolbar
      dark={false}
      onAction={handleFormat}
    />
  )
}
```

### With Dark Mode

```javascript
function MyEditor() {
  const [darkMode, setDarkMode] = useState(true)
  
  const handleFormat = (type) => {
    // Insert markdown based on type
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <FormatToolbar
        dark={darkMode}
        onAction={handleFormat}
      />
    </div>
  )
}
```

### With Modal

```javascript
function NoteEditor() {
  const [showToolbar, setShowToolbar] = useState(false)
  const btnRef = useRef(null)
  
  const handleFormat = (type) => {
    // Apply formatting
    setShowToolbar(false)
  }

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setShowToolbar(v => !v)}
      >
        Format
      </button>
      
      <Popover
        anchorRef={btnRef}
        open={showToolbar}
        onClose={() => setShowToolbar(false)}
      >
        <FormatToolbar
          dark={isDarkMode}
          onAction={handleFormat}
        />
      </Popover>
    </>
  )
}
```

---

## Data Flow

```mermaid
graph LR
    A[User Clicks Button] --> B[onAction Callback]
    B --> C[Format Type]
    C --> D{Format Type}
    
    D -->|h1|h2|h3|E[Insert Heading]
    D -->|bold|italic|strike|F[Insert Text Formatting]
    D -->|code|codeblock|G[Insert Code]
    D -->|quote|ul|ol|link|H[Insert List/Quote/Link]
    
    E --> I[Update Textarea]
    F --> I
    G --> I
    H --> I
    
    I --> J[Close Toolbar]
```

---

## Performance

### Lightweight Component
- No internal state
- No side effects
- Minimal re-renders
- Pure function component

### Optimized Rendering
- Consistent class names (computed once)
- Memoized dividers (constant)
- Conditional dark mode class (prop-based)

---

## Testing

### Unit Tests

```javascript
describe('FormatToolbar Component', () => {
  it('should render all format buttons', () => {
    // Test button rendering
  });
  
  it('should call onAction with correct type', () => {
    // Test callback with "bold"
  });
  
  it('should apply dark mode styles', () => {
    // Test dark={true} styling
  });
  
  it('should have ARIA labels on all buttons', () => {
    // Test accessibility
  });
  
  it('should display tooltips on hover', () => {
    // Test tooltip rendering
  });
});
```

### Integration Tests

```javascript
describe('FormatToolbar Integration', () => {
  it('should integrate with text editor', () => {
    // Test: click -> format -> update textarea
  });
  
  it('should close popover after action', () => {
    // Test: click -> onAction -> close
  });
});
```

### E2E Tests (Playwright)

```javascript
test('Text formatting', async ({ page }) => {
  await page.goto('/#/notes');
  await page.click('[data-testid="note-1"]');
  
  // Open format toolbar
  await page.click('[data-testid="format-button"]');
  
  // Click bold
  await page.click('[aria-label="Bold"]');
  
  // Verify formatting
  await expect(page.locator('[data-testid="modal-body"]')).toContainText('**');
});
```

---

## Troubleshooting

### Issue: Toolbar not showing

**Possible Causes:**
- Parent component not rendering
- Popover position issue
- Z-index conflict

**Solutions:**
1. Verify parent component renders
2. Check Popover anchorRef
3. Verify z-index values
4. Test with inline styles

---

### Issue: Buttons not clickable

**Possible Causes:**
- Click event intercepted
- Pointer events disabled
- Overlay covering toolbar

**Solutions:**
1. Check event propagation
2. Verify pointer-events CSS
3. Check overlay z-index
4. Test with different browsers

---

### Issue: Dark mode not applying

**Possible Causes:**
- dark prop not passed
- CSS override issue
- Class name mismatch

**Solutions:**
1. Verify dark prop value
2. Check CSS specificity
3. Inspect rendered classes
4. Test with explicit dark={true}

---

### Issue: onAction not firing

**Possible Causes:**
- Callback not passed
- Function reference issue
- Event not propagating

**Solutions:**
1. Verify onAction is passed
2. Check function is defined
3. Test with console.log
4. Verify event handling

---

## Related Components

- [Tooltip](./Tooltip.md) - Tooltip component
- [Popover](./Popover.md) - Popover container
- [Modal](./Modal.md) - Note editor modal
- [Composer](./Composer.md) - Note creation component

---

## Related Icons

- [Heading1](./Icons.md) - H1 icon
- [Heading2](./Icons.md) - H2 icon
- [Heading3](./Icons.md) - H3 icon
- [Bold](./Icons.md) - Bold icon
- [Italic](./Icons.md) - Italic icon
- [Strikethrough](./Icons.md) - Strikethrough icon
- [InlineCode](./Icons.md) - Inline code icon
- [CodeBlock](./Icons.md) - Code block icon
- [Quote](./Icons.md) - Quote icon
- [BulletList](./Icons.md) - Bullet list icon
- [NumberedList](./Icons.md) - Numbered list icon
- [Link](./Icons.md) - Link icon

---

## Best Practices

1. **Always provide onAction callback**
2. **Use ARIA labels for accessibility**
3. **Display keyboard shortcuts in tooltips**
4. **Group related buttons with dividers**
5. **Support dark mode for consistency**
6. **Use consistent button styling**
7. **Close toolbar after action**
8. **Test with screen readers**

---

**Component Version:** 1.0  
**Last Updated:** January 21, 2026  
**Status:** ✅ Production Ready