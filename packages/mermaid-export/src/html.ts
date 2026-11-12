import type { ExportOptions } from './types.js';

/** Mermaid CDN URL for rendering */
const MERMAID_CDN = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';

type Theme = NonNullable<ExportOptions['theme']>;

const THEMES: readonly string[] = ['default', 'forest', 'dark', 'neutral', 'base'];

/** Throws if the theme is not one of the supported Mermaid themes. */
export function validateTheme(theme: unknown): asserts theme is Theme {
    if (typeof theme !== 'string' || !THEMES.includes(theme)) {
        throw new Error(
            `Unknown theme ${JSON.stringify(String(theme))}. Use one of: ${THEMES.join(', ')}`
        );
    }
}

/** A JS string literal that is safe inside an inline script block. */
export function escapeJsString(value: string): string {
    return JSON.stringify(String(value))
        .replace(/</g, '\\u003c')
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029');
}

/**
 * A value for a CSS declaration. Anything outside letters, digits and
 * the characters colors use (# ( ) , . % space - and / unless it opens a comment) is hex escaped, so it
 * cannot end the declaration, open a block or close the style tag.
 */
export function escapeCss(value: string): string {
    return String(value).replace(
        /[^A-Za-z0-9#(),.% -]/gu,
        (ch, offset, str) =>
            ch === '/' && str[offset + 1] !== '*'
                ? ch
                : `\\${ch.codePointAt(0)!.toString(16)} `
    );
}

/**
 * Generate HTML template for rendering Mermaid diagram
 */
export function generateHtml(diagram: string, theme: string, backgroundColor: string): string {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            margin: 0;
            padding: 20px;
            background-color: ${escapeCss(backgroundColor)};
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
        import mermaid from ${escapeJsString(MERMAID_CDN)};
        mermaid.initialize({
            startOnLoad: true,
            theme: ${escapeJsString(theme)},
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

