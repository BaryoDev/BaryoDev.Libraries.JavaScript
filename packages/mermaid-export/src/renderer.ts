import puppeteer, { type Browser } from 'puppeteer';
import type { RasterExportOptions, SvgExportOptions } from './types.js';
import { generateHtml, validateTheme } from './html.js';

/** Browser instance for reuse */
let browserInstance: Browser | null = null;

/**
 * Get or create a shared browser instance
 */
async function getBrowser(): Promise<Browser> {
    if (!browserInstance || !browserInstance.connected) {
        browserInstance = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        });
    }
    return browserInstance;
}

/**
 * Close the shared browser instance
 */
export async function closeBrowser(): Promise<void> {
    if (browserInstance && browserInstance.connected) {
        await browserInstance.close();
        browserInstance = null;
    }
}

/**
 * Render a Mermaid diagram and return SVG string
 */
export async function renderToSvg(
    diagram: string,
    options: SvgExportOptions = {}
): Promise<string> {
    const { backgroundColor = 'transparent', theme = 'default' } = options;
    validateTheme(theme);

    const browser = await getBrowser();
    const page = await browser.newPage();

    try {
        const html = generateHtml(diagram, theme, backgroundColor);
        await page.setContent(html, { waitUntil: 'networkidle0' });

        // Wait for Mermaid to render
        await page.waitForFunction(
            () => window.mermaidRendered === true || window.mermaidError !== undefined,
            { timeout: 30000 }
        );

        // Check for errors
        const error = await page.evaluate(() => window.mermaidError);
        if (error) {
            throw new Error(`Mermaid rendering failed: ${error}`);
        }

        // Extract SVG
        const svg = await page.evaluate(() => {
            const svgElement = document.querySelector('.mermaid svg');
            if (!svgElement) {
                throw new Error('SVG element not found');
            }
            return svgElement.outerHTML;
        });

        return svg;
    } finally {
        await page.close();
    }
}

/**
 * Render a Mermaid diagram and return image buffer
 */
export async function renderToBuffer(
    diagram: string,
    format: 'png' | 'jpeg' | 'webp',
    options: RasterExportOptions = {}
): Promise<Buffer> {
    const {
        width,
        height,
        backgroundColor = 'white',
        theme = 'default',
        scale = 1,
    } = options;
    validateTheme(theme);

    const browser = await getBrowser();
    const page = await browser.newPage();

    try {
        // Set viewport for consistent rendering
        await page.setViewport({
            width: width || 1920,
            height: height || 1080,
            deviceScaleFactor: scale,
        });

        const html = generateHtml(diagram, theme, backgroundColor);
        await page.setContent(html, { waitUntil: 'networkidle0' });

        // Wait for Mermaid to render
        await page.waitForFunction(
            () => window.mermaidRendered === true || window.mermaidError !== undefined,
            { timeout: 30000 }
        );

        // Check for errors
        const error = await page.evaluate(() => window.mermaidError);
        if (error) {
            throw new Error(`Mermaid rendering failed: ${error}`);
        }

        // Get the bounding box of the rendered diagram
        const boundingBox = await page.evaluate(() => {
            const container = document.querySelector('#container');
            if (!container) return null;
            const rect = container.getBoundingClientRect();
            return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
        });

        if (!boundingBox) {
            throw new Error('Failed to get diagram bounding box');
        }

        // Take screenshot of just the diagram
        const screenshot = await page.screenshot({
            type: format,
            clip: {
                x: boundingBox.x,
                y: boundingBox.y,
                width: width || boundingBox.width,
                height: height || boundingBox.height,
            },
            omitBackground: backgroundColor === 'transparent',
        });

        return Buffer.from(screenshot);
    } finally {
        await page.close();
    }
}

// Extend Window interface for TypeScript
declare global {
    interface Window {
        mermaidRendered?: boolean;
        mermaidError?: string;
    }
}
