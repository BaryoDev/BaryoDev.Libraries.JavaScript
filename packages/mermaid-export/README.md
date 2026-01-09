# mermaid-export

Export Mermaid diagrams to SVG or image formats with a simple API.

## Installation

```bash
npm install mermaid-export
# or
pnpm add mermaid-export
# or
yarn add mermaid-export
```

> **Note**: This package uses Puppeteer to render Mermaid diagrams. On first install, Puppeteer will download a Chromium binary (~300MB).

## Usage

### Export to SVG

```typescript
import { exportToSvg } from 'mermaid-export';

const diagram = `
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[OK]
    B -->|No| D[Cancel]
`;

const svg = await exportToSvg(diagram);
console.log(svg); // <svg>...</svg>
```

### Export to PNG

```typescript
import { exportToPng } from 'mermaid-export';
import { writeFileSync } from 'fs';

const png = await exportToPng(diagram, { 
    scale: 2,  // Higher quality
    theme: 'dark' 
});

writeFileSync('diagram.png', png);
```

### Export to File

```typescript
import { exportToFile } from 'mermaid-export';

// Format is automatically detected from file extension
await exportToFile(diagram, './output/diagram.svg');
await exportToFile(diagram, './output/diagram.png', { scale: 2 });
await exportToFile(diagram, './output/diagram.jpeg');
await exportToFile(diagram, './output/diagram.webp');
```

### Generic Export

```typescript
import { exportDiagram } from 'mermaid-export';

// Returns string for SVG, Buffer for raster formats
const svgString = await exportDiagram(diagram, { format: 'svg' });
const pngBuffer = await exportDiagram(diagram, { format: 'png' });
```

### Close Browser

When done with multiple exports, close the browser instance to free resources:

```typescript
import { closeBrowser } from 'mermaid-export';

// After all exports are done
await closeBrowser();
```

## API

### `exportToSvg(diagram, options?)`

Export a Mermaid diagram to SVG string.

**Parameters:**
- `diagram` (string) - The Mermaid diagram definition
- `options` (SvgExportOptions) - Optional settings
  - `backgroundColor` (string) - Background color (default: 'transparent')
  - `theme` ('default' | 'forest' | 'dark' | 'neutral' | 'base') - Mermaid theme

**Returns:** `Promise<string>` - SVG string

### `exportToPng(diagram, options?)`

Export a Mermaid diagram to PNG buffer.

**Parameters:**
- `diagram` (string) - The Mermaid diagram definition
- `options` (RasterExportOptions) - Optional settings
  - `width` (number) - Width in pixels
  - `height` (number) - Height in pixels
  - `scale` (number) - Scale factor (default: 1)
  - `backgroundColor` (string) - Background color (default: 'white')
  - `theme` - Mermaid theme

**Returns:** `Promise<Buffer>` - PNG buffer

### `exportToJpeg(diagram, options?)`

Same as `exportToPng` but returns JPEG buffer.

### `exportToWebp(diagram, options?)`

Same as `exportToPng` but returns WebP buffer.

### `exportToFile(diagram, filePath, options?)`

Export a Mermaid diagram directly to a file. Format is inferred from file extension.

**Supported extensions:** `.svg`, `.png`, `.jpg`, `.jpeg`, `.webp`

### `exportDiagram(diagram, options?)`

Generic export function that supports all formats.

**Additional option:**
- `format` ('svg' | 'png' | 'jpeg' | 'webp') - Output format (default: 'svg')

### `closeBrowser()`

Close the shared browser instance. Call this when done with all exports.

## Supported Diagram Types

All Mermaid diagram types are supported:

- Flowcharts
- Sequence diagrams
- Class diagrams
- State diagrams
- Entity Relationship diagrams
- Gantt charts
- Pie charts
- Git graphs
- And more...

## License

MIT
