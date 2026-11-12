import { describe, it, expect } from 'vitest';
import { generateHtml, validateTheme, escapeCss, escapeJsString } from './html.js';

describe('validateTheme', () => {
    it('accepts the supported themes', () => {
        for (const t of ['default', 'forest', 'dark', 'neutral', 'base']) {
            expect(() => validateTheme(t)).not.toThrow();
        }
    });

    it('rejects an unknown theme', () => {
        expect(() => validateTheme("x'});window.pwned=1;//")).toThrow(/Unknown theme/);
        expect(() => validateTheme(undefined)).toThrow(/Unknown theme/);
    });
});

describe('escapeJsString', () => {
    it('keeps a quote breakout inside the string', () => {
        const out = escapeJsString("x'});window.pwned=1;//");
        expect(out).toBe(JSON.stringify("x'});window.pwned=1;//"));
        expect(() => new Function(`return ${out}`)()).not.toThrow();
        expect(new Function(`return ${out}`)()).toBe("x'});window.pwned=1;//");
    });

    it('does not let a value close the script tag', () => {
        expect(escapeJsString('</script><script>alert(1)')).not.toContain('</script');
    });
});

describe('escapeCss', () => {
    it('leaves normal colors alone', () => {
        expect(escapeCss('transparent')).toBe('transparent');
        expect(escapeCss('#ff00aa')).toBe('#ff00aa');
        expect(escapeCss('rgb(1, 2, 3)')).toBe('rgb(1, 2, 3)');
    });

    it('escapes characters that end a declaration or the style tag', () => {
        const out = escapeCss('red;} </style><script>alert(1)</script>');
        expect(out).not.toMatch(/[;{}<>]/);
    });
});

describe('generateHtml', () => {
    it('does not put raw option text into the page', () => {
        const html = generateHtml(
            'graph TD; A-->B',
            "x'});window.pwned=1;//",
            'red;} </style><script>window.pwned=1</script>'
        );
        expect(html).not.toContain("theme: 'x'");
        expect(html).toContain('theme: "x\'});window.pwned=1;//"');
        expect(html).not.toContain('</style><script>window.pwned');
        expect(html.match(/<\/script>/g)).toHaveLength(1);
    });
});

describe('renderToSvg theme check', () => {
    it('rejects an unknown theme before launching a browser', async () => {
        const { renderToSvg } = await import('./renderer.js');
        await expect(
            renderToSvg('graph TD; A-->B', { theme: "x'});window.pwned=1;//" as never })
        ).rejects.toThrow(/Unknown theme/);
    });
});
