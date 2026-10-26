/**
 * ============================================================
 * CAPA DE TIPADO ESTRICTO — AGENTE MODULAR CON MODO THINKING,
 * MICRO-RAG Y EJECUCIÓN DE COMANDOS EN DOM
 * Archivo: src/types.ts
 * ============================================================
 */
/**
 * Discriminador estricto de portafolio:
 * - 'portfolio_a': Portafolio de Maricielo Sarai Cerrón Villar (sacijim)
 * - 'portfolio_b': Portafolio de Alessandro Villogas Gaspar (Alexito-Hub)
 */
export type PortfolioId = 'portfolio_a' | 'portfolio_b';
/**
 * Fases del proceso de razonamiento estructurado (Modo Thinking).
 */
export type ThinkingPhase = 'INTENT' | 'RETRIEVAL' | 'SYNTHESIS' | 'COMMAND';
/**
 * Paso individual de razonamiento generado por el motor o el LLM.
 */
export interface ThinkingStep {
    readonly step: number;
    readonly phase: ThinkingPhase;
    readonly detail: string;
}
/**
 * Acciones ejecutables por el cliente frontend sobre el DOM del portafolio.
 */
export type CommandActionType = 'NONE' | 'NAVIGATE_WEEK' | 'OPEN_VISUAL_VIEWER' | 'DOWNLOAD_RESOURCE' | 'OPEN_EXTERNAL_URL' | 'CLEAR_TERMINAL';
/**
 * Parámetros tipados para la ejecución de comandos en el navegador.
 */
export interface ClientCommandParams {
    readonly page: string;
    readonly unitId: string;
    readonly weekId: string;
    readonly exerciseId: string;
    readonly imageUrl: string;
    readonly imageTitle: string;
    readonly galleryId: string;
    readonly galleryIndex: number;
    readonly resourceUrl: string;
}
/**
 * Comando determinista devuelto junto con la respuesta del asistente.
 */
export interface ClientCommand {
    readonly action: CommandActionType;
    readonly description: string;
    readonly autoExecute: boolean;
    readonly params: ClientCommandParams;
}
/**
 * Tipos de acción interactiva para botones de seguimiento.
 */
export type SuggestedActionType = 'link' | 'prompt';
/**
 * Botón interactivo de seguimiento sugerido al usuario.
 */
export interface SuggestedAction {
    readonly label: string;
    readonly type: SuggestedActionType;
    readonly target: string;
}
/**
 * Contrato formal de salida JSON estructurada (Structured Output)
 * con soporte para Modo Thinking, Ejecución de Comandos y Acciones Sugeridas.
 */
export interface ChatResponsePayload {
    readonly thinking: readonly ThinkingStep[];
    readonly message: string;
    readonly command: ClientCommand;
    readonly suggested_actions: readonly SuggestedAction[];
}
/**
 * Cuerpo de la petición entrante en POST /api/chat.
 */
export interface ChatRequestBody {
    readonly portfolioId: PortfolioId;
    readonly deviceId: string;
    readonly message: string;
}
/**
 * Parámetros de consulta esperados en GET /api/chat/history.
 */
export interface HistoryQueryParams {
    readonly portfolioId?: string;
    readonly deviceId?: string;
}
/**
 * Roles admitidos en el historial conversacional compatible con @google/genai.
 */
export type ChatRole = 'user' | 'model';
/**
 * Unidad atómica de un turno de conversación almacenado en disco.
 */
export interface StoredChatTurn {
    readonly id: string;
    readonly role: ChatRole;
    readonly message: string;
    readonly thinking: readonly ThinkingStep[];
    readonly command?: ClientCommand;
    readonly suggested_actions: readonly SuggestedAction[];
    readonly timestamp: string;
}
/**
 * Clave compuesta de indexación en el store persistente: `${portfolioId}:${deviceId}`
 */
export type SessionCompositeKey = `${PortfolioId}:${string}`;
/**
 * Registro de sesión persistente por dispositivo y portafolio.
 */
export interface SessionRecord {
    readonly key: SessionCompositeKey;
    readonly portfolioId: PortfolioId;
    readonly deviceId: string;
    readonly createdAt: string;
    updatedAt: string;
    turns: StoredChatTurn[];
}
/**
 * Estructura raíz del archivo JSON persistido atómicamente en Azure App Service (/home).
 */
export interface PersistentStoreSchema {
    readonly version: 1;
    readonly sessions: Record<string, SessionRecord>;
}
/**
 * Respuesta entregada por el endpoint de hidratación GET /api/chat/history.
 */
export interface HistoryResponsePayload {
    readonly portfolioId: PortfolioId;
    readonly deviceId: string;
    readonly turns: readonly StoredChatTurn[];
}
/**
 * Metadatos de telemetría de recuperación Micro-RAG por turno.
 */
export interface RetrievalTelemetry {
    readonly matchedChunks: readonly string[];
    readonly estimatedPromptTokens: number;
    readonly cacheHit: boolean;
    readonly sourceHash: string;
}
/**
 * Respuesta entregada por POST /api/chat al cliente frontend.
 */
export interface ChatSuccessResponse extends ChatResponsePayload {
    readonly turnId: string;
    readonly timestamp: string;
    readonly telemetry: RetrievalTelemetry;
}
/**
 * Categoría de fragmento de conocimiento (Chunk) indexado desde portafolio.json,
 * archivos de código fuente Java o catálogo multimodal de infografías.
 */
export type KnowledgeChunkCategory = 'profile' | 'index' | 'technical' | 'week' | 'code' | 'vision';
/**
 * Coincidencia de código fuente Java recuperada quirúrgicamente.
 */
export interface CodeSnippetMatch {
    readonly className: string;
    readonly filePath: string;
    readonly code: string;
    readonly summary: string;
}
/**
 * Coincidencia visual de infografía analizada por Gemini Vision.
 */
export interface VisionImageMatch {
    readonly filename: string;
    readonly title: string;
    readonly visualExplanation: string;
    readonly base64?: string | undefined;
    readonly mimeType: string;
    readonly galleryIndex: number;
    readonly resourceUrl: string;
}
/**
 * Fragmento modular de conocimiento extraído automáticamente desde portafolio.json.
 */
export interface KnowledgeChunk {
    readonly id: string;
    readonly portfolioId: PortfolioId;
    readonly category: KnowledgeChunkCategory;
    readonly courseKey: 'algoritmos' | 'taller' | 'general';
    readonly weekNumber: number | null;
    readonly title: string;
    readonly keywords: readonly string[];
    readonly content: string;
    readonly defaultCommand: ClientCommand;
    readonly exerciseCommands: Readonly<Record<number, ClientCommand>>;
}
/**
 * Resultado del motor Micro-RAG para una consulta puntual.
 */
export interface RetrievalResult {
    readonly portfolioId: PortfolioId;
    readonly sourceHash: string;
    readonly selectedChunks: readonly KnowledgeChunk[];
    readonly detectedWeek: number | null;
    readonly detectedExercise: number | null;
    readonly wantsExecutionCommand: boolean;
    readonly preferredActionType: CommandActionType;
    readonly resolvedCommand: ClientCommand;
    readonly preThinkingSteps: readonly ThinkingStep[];
    readonly estimatedTokens: number;
    readonly matchedCode?: CodeSnippetMatch | null | undefined;
    readonly matchedVision?: VisionImageMatch | null | undefined;
}
/**
 * Contrato estándar de error HTTP de la API.
 */
export interface ApiErrorResponse {
    readonly error: string;
    readonly code: 'INVALID_PORTFOLIO_ID' | 'INVALID_DEVICE_ID' | 'INVALID_MESSAGE' | 'CORS_ORIGIN_FORBIDDEN' | 'LLM_INVOCATION_ERROR' | 'STORAGE_IO_ERROR' | 'INTERNAL_SERVER_ERROR';
}
/**
 * Configuración de entorno validada al inicio del servidor.
 */
export interface ServerEnvironmentConfig {
    readonly port: number;
    readonly geminiApiKeyA: string;
    readonly geminiApiKeyB: string;
    readonly storagePath: string;
    readonly portfolioAJsonPath: string;
    readonly portfolioBJsonPath: string;
    readonly allowedOrigins: readonly string[];
    readonly maxContextTurns: number;
    readonly geminiModel: string;
}
export declare function createEmptyCommand(): ClientCommand;
export declare function isPortfolioId(value: unknown): value is PortfolioId;
export declare function isValidDeviceId(value: unknown): value is string;
export declare function isThinkingPhase(value: unknown): value is ThinkingPhase;
export declare function isThinkingStep(value: unknown): value is ThinkingStep;
export declare function isCommandActionType(value: unknown): value is CommandActionType;
export declare function isClientCommandParams(value: unknown): value is ClientCommandParams;
export declare function isClientCommand(value: unknown): value is ClientCommand;
export declare function isSuggestedAction(value: unknown): value is SuggestedAction;
export declare function isChatResponsePayload(value: unknown): value is ChatResponsePayload;
export declare function isChatRequestBody(value: unknown): value is ChatRequestBody;
