import { writeFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { renderToSvg, renderToBuffer, closeBrowser } from './renderer.js';
import type { ExportOptions, RasterExportOptions, SvgExportOptions } from './types.js';

export type { ExportOptions, RasterExportOptions, SvgExportOptions };
export { closeBrowser };

/**
 * Export a Mermaid diagram to the specified format
 * 
 * @param diagram - The Mermaid diagram definition string
 * @param options - Export options
 * @returns Buffer for raster formats (png/jpeg/webp) or string for SVG
 * 
 * @example
 * ```typescript
 * import { exportDiagram } from 'mermaid-export';
 * 
 * const diagram = `
 *   graph TD
 *     A[Start] --> B{Decision}
 *     B -->|Yes| C[OK]
 *     B -->|No| D[Cancel]
 * `;
 * 
 * // Export as SVG
 * const svg = await exportDiagram(diagram, { format: 'svg' });
 * 
 * // Export as PNG
 * const png = await exportDiagram(diagram, { format: 'png', scale: 2 });
 * ```
 */
export async function exportDiagram(
    diagram: string,
    options: ExportOptions = {}
): Promise<Buffer | string> {
    const { format = 'svg', ...rest } = options;

    if (format === 'svg') {
        return exportToSvg(diagram, rest);
    }

    return exportToImage(diagram, format, rest);
}

/**
 * Export a Mermaid diagram to SVG string
 * 
 * @param diagram - The Mermaid diagram definition string
 * @param options - SVG export options
 * @returns SVG string
 * 
 * @example
 * ```typescript
 * import { exportToSvg } from 'mermaid-export';
 * 
 * const svg = await exportToSvg(`
 *   sequenceDiagram
 *     Alice->>Bob: Hello!
 *     Bob-->>Alice: Hi!
 * `);
 * ```
 */
export async function exportToSvg(
    diagram: string,
    options: SvgExportOptions = {}
): Promise<string> {
    return renderToSvg(diagram, options);
}

/**
 * Export a Mermaid diagram to PNG buffer
 * 
 * @param diagram - The Mermaid diagram definition string
 * @param options - Raster export options
 * @returns PNG buffer
 * 
 * @example
 * ```typescript
 * import { exportToPng } from 'mermaid-export';
 * import { writeFileSync } from 'fs';
 * 
 * const png = await exportToPng(`
 *   pie title Pets
 *     "Dogs" : 45
 *     "Cats" : 30
 *     "Birds" : 25
 * `, { scale: 2 });
 * 
 * writeFileSync('diagram.png', png);
 * ```
 */
export async function exportToPng(
    diagram: string,
    options: RasterExportOptions = {}
): Promise<Buffer> {
    return renderToBuffer(diagram, 'png', options);
}

/**
 * Export a Mermaid diagram to JPEG buffer
 * 
 * @param diagram - The Mermaid diagram definition string
 * @param options - Raster export options
 * @returns JPEG buffer
 */
export async function exportToJpeg(
    diagram: string,
    options: RasterExportOptions = {}
): Promise<Buffer> {
    return renderToBuffer(diagram, 'jpeg', options);
}

/**
 * Export a Mermaid diagram to WebP buffer
 * 
 * @param diagram - The Mermaid diagram definition string
 * @param options - Raster export options
 * @returns WebP buffer
 */
export async function exportToWebp(
    diagram: string,
    options: RasterExportOptions = {}
): Promise<Buffer> {
    return renderToBuffer(diagram, 'webp', options);
}

/**
 * Export a Mermaid diagram to an image buffer (PNG, JPEG, or WebP)
 * 
 * @param diagram - The Mermaid diagram definition string
 * @param format - Image format
 * @param options - Raster export options
 * @returns Image buffer
 */
export async function exportToImage(
    diagram: string,
    format: 'png' | 'jpeg' | 'webp',
    options: RasterExportOptions = {}
): Promise<Buffer> {
    return renderToBuffer(diagram, format, options);
}

/**
 * Export a Mermaid diagram directly to a file
 * 
 * @param diagram - The Mermaid diagram definition string
 * @param filePath - Output file path (format inferred from extension)
 * @param options - Export options (format will be overridden if provided)
 * 
 * @example
 * ```typescript
 * import { exportToFile } from 'mermaid-export';
 * 
 * // Format is inferred from file extension
 * await exportToFile(`
 *   graph LR
 *     A --> B --> C
 * `, './output/diagram.png', { scale: 2 });
 * ```
 */
export async function exportToFile(
    diagram: string,
    filePath: string,
    options: Omit<ExportOptions, 'format'> = {}
): Promise<void> {
    const ext = extname(filePath).toLowerCase().slice(1);
    const format = getFormatFromExtension(ext);

    const result = await exportDiagram(diagram, { ...options, format });

    if (typeof result === 'string') {
        await writeFile(filePath, result, 'utf-8');
    } else {
        await writeFile(filePath, result);
    }
}

/**
 * Get export format from file extension
 */
function getFormatFromExtension(ext: string): ExportOptions['format'] {
    switch (ext) {
        case 'svg':
            return 'svg';
        case 'png':
            return 'png';
        case 'jpg':
        case 'jpeg':
            return 'jpeg';
        case 'webp':
            return 'webp';
        default:
            throw new Error(`Unsupported file extension: .${ext}. Supported: .svg, .png, .jpg, .jpeg, .webp`);
    }
}
