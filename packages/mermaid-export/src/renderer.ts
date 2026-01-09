import puppeteer, { type Browser } from 'puppeteer';
import type { RasterExportOptions, SvgExportOptions } from './types.js';

/** Mermaid CDN URL for rendering */
const MERMAID_CDN = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';

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
 * Generate HTML template for rendering Mermaid diagram
 */
function generateHtml(diagram: string, theme: string, backgroundColor: string): string {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            margin: 0;
            padding: 20px;
            background-color: ${backgroundColor};
            display: flex;
            justify-content: center;
            align-items: flex-start;
        }
        #container {
            display: inline-block;
        }
    </style>
</head>
<body>
    <div id="container">
        <pre class="mermaid">${escapeHtml(diagram)}</pre>
    </div>
    <script type="module">
        import mermaid from '${MERMAID_CDN}';
        mermaid.initialize({
            startOnLoad: true,
            theme: '${theme}',
            securityLevel: 'loose'
        });
        
        // Signal when rendering is complete
        mermaid.run().then(() => {
            window.mermaidRendered = true;
        }).catch(err => {
            window.mermaidError = err.message;
        });
    </script>
</body>
</html>`;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Render a Mermaid diagram and return SVG string
 */
export async function renderToSvg(
    diagram: string,
    options: SvgExportOptions = {}
): Promise<string> {
    const { backgroundColor = 'transparent', theme = 'default' } = options;

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
