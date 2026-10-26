/**
 * ============================================================
 * MOTOR MODULAR DE CONOCIMIENTO (AUTO-INDEXADOR + MICRO-RAG + CACHÉ)
 * Archivo: src/knowledge-engine.ts
 * ============================================================
 */
import { type ChatResponsePayload, type KnowledgeChunk, type PortfolioId, type RetrievalResult, type StoredChatTurn } from './types.js';
interface PortfolioIndexState {
    readonly portfolioId: PortfolioId;
    readonly sourceHash: string;
    readonly lastCheckedAt: number;
    readonly chunks: readonly KnowledgeChunk[];
}
/**
 * Normaliza cadenas eliminando tildes y signos para búsqueda léxica rápida.
 */
export declare function normalizeQueryText(input: string): string;
/**
 * Motor Principal de Conocimiento:
 * - Sincroniza y recarga automáticamente portafolio.json cuando cambia su hash SHA-256.
 * - Ejecuta recuperación Micro-RAG seleccionando solo los Chunks necesarios.
 * - Administra un caché LRU de consultas canónicas (0 tokens en preguntas frecuentes).
 */
export declare class ModularKnowledgeEngine {
    private readonly jsonPaths;
    private readonly states;
    private readonly responseCache;
    private readonly maxCacheEntries;
    private readonly checkIntervalMs;
    private readonly codeEngine;
    private readonly visionEngine;
    constructor(portfolioAPath: string, portfolioBPath: string);
    /**
     * Garantiza que el índice del portafolio esté cargado y actualizado según el hash SHA-256 del archivo.
     */
    ensureIndexLoaded(portfolioId: PortfolioId, forceReload?: boolean): Promise<PortfolioIndexState>;
    private invalidateCacheForPortfolio;
    /**
     * Consulta el caché LRU para preguntas canónicas sin dependencia de pronombres del historial.
     */
    getCachedResponse(portfolioId: PortfolioId, sourceHash: string, userMessage: string): ChatResponsePayload | null;
    setCachedResponse(portfolioId: PortfolioId, sourceHash: string, userMessage: string, payload: ChatResponsePayload): void;
    /**
     * Selecciona únicamente los fragmentos relevantes (Micro-RAG) para reducir el consumo de tokens
     * hasta en un 85% y evitar alucinaciones por saturación de contexto.
     */
    retrieveRelevantChunks(portfolioId: PortfolioId, userMessage: string, recentHistory: readonly StoredChatTurn[]): Promise<RetrievalResult>;
}
export {};
