/**
 * ============================================================
 * MOTOR MULTIMODAL DE INFOGRAFÍAS Y VISIÓN (GEMINI VISION ENGINE)
 * Archivo: src/vision-engine.ts
 * ============================================================
 */
import type { PortfolioId, VisionImageMatch } from './types.js';
export declare class MultimodalVisionEngine {
    private baseWorkspacePath;
    private readonly infographicCatalogA;
    private readonly infographicCatalogB;
    constructor();
    private resolveWorkspaceRoot;
    private initializeCatalogs;
    findRelevantInfographic(portfolioId: PortfolioId, query: string, detectedWeek: number | null, detectedExercise: number | null): Promise<VisionImageMatch | null>;
}
