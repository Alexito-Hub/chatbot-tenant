/**
 * ============================================================
 * CAPA DE TIPADO ESTRICTO — AGENTE MODULAR CON MODO THINKING,
 * MICRO-RAG Y EJECUCIÓN DE COMANDOS EN DOM
 * Archivo: src/types.ts
 * ============================================================
 */
// ============================================================
// TYPE GUARDS Y UTILIDADES DE VALIDACIÓN ESTRICTA
// ============================================================
export function createEmptyCommand() {
    return {
        action: 'NONE',
        description: 'Sin comando de interfaz requerido',
        autoExecute: false,
        params: {
            page: '',
            unitId: '',
            weekId: '',
            exerciseId: '',
            imageUrl: '',
            imageTitle: '',
            galleryId: '',
            galleryIndex: 0,
            resourceUrl: ''
        }
    };
}
export function isPortfolioId(value) {
    return value === 'portfolio_a' || value === 'portfolio_b';
}
export function isValidDeviceId(value) {
    if (typeof value !== 'string')
        return false;
    const trimmed = value.trim();
    return /^[a-zA-Z0-9_-]{8,128}$/.test(trimmed);
}
export function isThinkingPhase(value) {
    return (value === 'INTENT' ||
        value === 'RETRIEVAL' ||
        value === 'SYNTHESIS' ||
        value === 'COMMAND');
}
export function isThinkingStep(value) {
    if (typeof value !== 'object' || value === null)
        return false;
    const rec = value;
    return (typeof rec['step'] === 'number' &&
        isThinkingPhase(rec['phase']) &&
        typeof rec['detail'] === 'string' &&
        rec['detail'].trim().length > 0);
}
export function isCommandActionType(value) {
    return (value === 'NONE' ||
        value === 'NAVIGATE_WEEK' ||
        value === 'OPEN_VISUAL_VIEWER' ||
        value === 'DOWNLOAD_RESOURCE' ||
        value === 'OPEN_EXTERNAL_URL' ||
        value === 'CLEAR_TERMINAL');
}
export function isClientCommandParams(value) {
    if (typeof value !== 'object' || value === null)
        return false;
    const rec = value;
    return (typeof rec['page'] === 'string' &&
        typeof rec['unitId'] === 'string' &&
        typeof rec['weekId'] === 'string' &&
        typeof rec['exerciseId'] === 'string' &&
        typeof rec['imageUrl'] === 'string' &&
        typeof rec['imageTitle'] === 'string' &&
        typeof rec['galleryId'] === 'string' &&
        typeof rec['galleryIndex'] === 'number' &&
        typeof rec['resourceUrl'] === 'string');
}
export function isClientCommand(value) {
    if (typeof value !== 'object' || value === null)
        return false;
    const rec = value;
    return (isCommandActionType(rec['action']) &&
        typeof rec['description'] === 'string' &&
        typeof rec['autoExecute'] === 'boolean' &&
        isClientCommandParams(rec['params']));
}
export function isSuggestedAction(value) {
    if (typeof value !== 'object' || value === null)
        return false;
    const record = value;
    return (typeof record['label'] === 'string' &&
        record['label'].trim().length > 0 &&
        (record['type'] === 'link' || record['type'] === 'prompt') &&
        typeof record['target'] === 'string' &&
        record['target'].trim().length > 0);
}
export function isChatResponsePayload(value) {
    if (typeof value !== 'object' || value === null)
        return false;
    const record = value;
    if (typeof record['message'] !== 'string' || record['message'].trim().length === 0) {
        return false;
    }
    if (!Array.isArray(record['thinking']) || !record['thinking'].every(isThinkingStep)) {
        return false;
    }
    if (!isClientCommand(record['command'])) {
        return false;
    }
    if (!Array.isArray(record['suggested_actions']) || !record['suggested_actions'].every(isSuggestedAction)) {
        return false;
    }
    return true;
}
export function isChatRequestBody(value) {
    if (typeof value !== 'object' || value === null)
        return false;
    const record = value;
    return (isPortfolioId(record['portfolioId']) &&
        isValidDeviceId(record['deviceId']) &&
        typeof record['message'] === 'string' &&
        record['message'].trim().length > 0 &&
        record['message'].trim().length <= 2000);
}
