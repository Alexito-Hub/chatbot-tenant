/**
 * ============================================================
 * MOTOR DE CÓDIGO FUENTE REAL (CODE-RAG / JAVA SOURCE INSPECTOR)
 * Archivo: src/code-engine.ts
 * ============================================================
 */
import type { CodeSnippetMatch, PortfolioId } from './types.js';
export declare class CodeRepositoryEngine {
    private baseWorkspacePath;
    private readonly classCatalog;
    private readonly fileCache;
    constructor();
    private resolveWorkspaceRoot;
    private registerCatalogEntries;
    findRelevantCode(portfolioId: PortfolioId, query: string, detectedWeek: number | null): Promise<CodeSnippetMatch | null>;
}
