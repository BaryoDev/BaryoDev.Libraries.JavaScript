/**
 * Options for exporting Mermaid diagrams
 */
export interface ExportOptions {
    /** Output format (default: 'svg') */
    format?: 'svg' | 'png' | 'jpeg' | 'webp';
    /** Width of the output image in pixels (only for raster formats) */
    width?: number;
    /** Height of the output image in pixels (only for raster formats) */
    height?: number;
    /** Background color (default: 'white') */
    backgroundColor?: string;
    /** Scale factor for raster output (default: 1) */
    scale?: number;
    /** Mermaid theme (default: 'default') */
    theme?: 'default' | 'forest' | 'dark' | 'neutral' | 'base';
}

/**
 * Options for raster image export (PNG, JPEG, WebP)
 */
export interface RasterExportOptions {
    /** Width of the output image in pixels */
    width?: number;
    /** Height of the output image in pixels */
    height?: number;
    /** Background color (default: 'white') */
    backgroundColor?: string;
    /** Scale factor (default: 1) */
    scale?: number;
    /** Mermaid theme (default: 'default') */
    theme?: 'default' | 'forest' | 'dark' | 'neutral' | 'base';
}

/**
 * Options for SVG export
 */
export interface SvgExportOptions {
    /** Background color (default: 'transparent') */
    backgroundColor?: string;
    /** Mermaid theme (default: 'default') */
    theme?: 'default' | 'forest' | 'dark' | 'neutral' | 'base';
}
