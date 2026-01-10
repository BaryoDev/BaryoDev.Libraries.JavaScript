import { describe, it, expect, afterAll } from 'vitest';
import {
    exportDiagram,
    exportToSvg,
    exportToPng,
    exportToJpeg,
    exportToWebp,
    exportToFile,
    closeBrowser
} from './index.js';
import { existsSync, unlinkSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// Sample diagrams for testing
const FLOWCHART = `
graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
`;

const SEQUENCE = `
sequenceDiagram
    Alice->>Bob: Hello Bob!
    Bob-->>Alice: Hi Alice!
    Alice->>Bob: How are you?
    Bob-->>Alice: I'm good, thanks!
`;

const PIE_CHART = `
pie title Favorite Languages
    "TypeScript" : 45
    "JavaScript" : 30
    "Python" : 25
`;

// Test output directory
const TEST_OUTPUT_DIR = join(tmpdir(), 'mermaid-export-tests');

describe('mermaid-export', () => {
    // Ensure test output directory exists
    beforeAll(() => {
        if (!existsSync(TEST_OUTPUT_DIR)) {
            mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
        }
    });

    // Clean up browser after all tests
    afterAll(async () => {
        await closeBrowser();
    });

    describe('exportToSvg', () => {
        it('should export flowchart to SVG', async () => {
            const svg = await exportToSvg(FLOWCHART);

            expect(svg).toBeTypeOf('string');
            expect(svg).toContain('<svg');
            expect(svg).toContain('</svg>');
        }, 60000);

        it('should export sequence diagram to SVG', async () => {
            const svg = await exportToSvg(SEQUENCE);

            expect(svg).toBeTypeOf('string');
            expect(svg).toContain('<svg');
        }, 60000);

        it('should apply theme option', async () => {
            const svg = await exportToSvg(FLOWCHART, { theme: 'dark' });

            expect(svg).toBeTypeOf('string');
            expect(svg).toContain('<svg');
        }, 60000);
    });

    describe('exportToPng', () => {
        it('should export to PNG buffer', async () => {
            const png = await exportToPng(FLOWCHART);

            expect(png).toBeInstanceOf(Buffer);
            expect(png.length).toBeGreaterThan(0);
            // PNG magic bytes
            expect(png[0]).toBe(0x89);
            expect(png[1]).toBe(0x50); // P
            expect(png[2]).toBe(0x4e); // N
            expect(png[3]).toBe(0x47); // G
        }, 60000);

        it('should respect scale option', async () => {
            const png1x = await exportToPng(FLOWCHART, { scale: 1 });
            const png2x = await exportToPng(FLOWCHART, { scale: 2 });

            // 2x scale should produce larger file
            expect(png2x.length).toBeGreaterThan(png1x.length);
        }, 60000);
    });

    describe('exportToJpeg', () => {
        it('should export to JPEG buffer', async () => {
            const jpeg = await exportToJpeg(PIE_CHART);

            expect(jpeg).toBeInstanceOf(Buffer);
            expect(jpeg.length).toBeGreaterThan(0);
            // JPEG magic bytes
            expect(jpeg[0]).toBe(0xff);
            expect(jpeg[1]).toBe(0xd8);
        }, 60000);
    });

    describe('exportToWebp', () => {
        it('should export to WebP buffer', async () => {
            const webp = await exportToWebp(FLOWCHART);

            expect(webp).toBeInstanceOf(Buffer);
            expect(webp.length).toBeGreaterThan(0);
            // WebP magic bytes: RIFF....WEBP
            expect(webp.slice(0, 4).toString()).toBe('RIFF');
            expect(webp.slice(8, 12).toString()).toBe('WEBP');
        }, 60000);
    });

    describe('exportDiagram', () => {
        it('should default to SVG format', async () => {
            const result = await exportDiagram(FLOWCHART);

            expect(result).toBeTypeOf('string');
            expect(result).toContain('<svg');
        }, 60000);

        it('should export to specified format', async () => {
            const png = await exportDiagram(FLOWCHART, { format: 'png' });

            expect(png).toBeInstanceOf(Buffer);
        }, 60000);
    });

    describe('exportToFile', () => {
        it('should export SVG to file', async () => {
            const filePath = join(TEST_OUTPUT_DIR, 'test-diagram.svg');

            await exportToFile(FLOWCHART, filePath);

            expect(existsSync(filePath)).toBe(true);

            // Cleanup
            unlinkSync(filePath);
        }, 60000);

        it('should export PNG to file', async () => {
            const filePath = join(TEST_OUTPUT_DIR, 'test-diagram.png');

            await exportToFile(SEQUENCE, filePath, { scale: 2 });

            expect(existsSync(filePath)).toBe(true);

            // Cleanup
            unlinkSync(filePath);
        }, 60000);

        it('should throw for unsupported extension', async () => {
            await expect(
                exportToFile(FLOWCHART, 'test.gif')
            ).rejects.toThrow('Unsupported file extension');
        }, 60000);
    });

    describe('error handling', () => {
        it('should throw for invalid diagram syntax', async () => {
            const invalidDiagram = 'this is not valid mermaid syntax at all xyz123';

            await expect(exportToSvg(invalidDiagram)).rejects.toThrow();
        }, 60000);
    });
});

// Import beforeAll
import { beforeAll } from 'vitest';
