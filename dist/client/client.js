/**
 * ============================================================
 * CAPA CLIENTE FRONTEND REUTILIZABLE (TYPESCRIPT ESTRICTO)
 * Soporte para Modo Thinking + Ejecución de Comandos DOM + Acciones
 * Archivo: src/client.ts
 * ============================================================
 */
import { createEmptyCommand, isChatResponsePayload } from './types.js';
export class PortfolioChatbotClient {
    apiBaseUrl;
    portfolioId;
    storageKey;
    deviceId;
    domBridge;
    containerEl;
    messagesEl;
    formEl;
    inputEl;
    submitBtnEl;
    welcomeMessage;
    initialActions;
    isPendingRequest = false;
    constructor(options) {
        this.apiBaseUrl = options.apiBaseUrl.replace(/\/+$/, '');
        this.portfolioId = options.portfolioId;
        this.storageKey = options.storageKey ?? 'chatbot_device_id';
        this.deviceId = this.getOrCreateDeviceId();
        this.domBridge = options.domBridge;
        const container = document.querySelector(options.containerSelector);
        const messages = document.querySelector(options.messagesSelector);
        const form = document.querySelector(options.formSelector);
        const input = document.querySelector(options.inputSelector);
        const submitBtn = document.querySelector(options.submitButtonSelector);
        if (!container || !messages || !form || !input || !submitBtn) {
            throw new Error('No se encontraron todos los elementos del DOM requeridos para inicializar PortfolioChatbotClient.');
        }
        this.containerEl = container;
        this.messagesEl = messages;
        this.formEl = form;
        this.inputEl = input;
        this.submitBtnEl = submitBtn;
        this.welcomeMessage =
            options.welcomeMessage ??
                'Bienvenido al asistente técnico del portafolio. Selecciona una acción o escribe tu consulta.';
        this.initialActions = options.initialActions ?? [];
        this.bindEvents();
    }
    getOrCreateDeviceId() {
        try {
            const existing = window.localStorage.getItem(this.storageKey);
            if (existing && /^[a-zA-Z0-9_-]{8,128}$/.test(existing.trim())) {
                return existing.trim();
            }
            const generated = typeof window.crypto !== 'undefined' && typeof window.crypto.randomUUID === 'function'
                ? window.crypto.randomUUID()
                : this.generateFallbackUuid();
            window.localStorage.setItem(this.storageKey, generated);
            return generated;
        }
        catch {
            return this.generateFallbackUuid();
        }
    }
    generateFallbackUuid() {
        const bytes = new Uint8Array(16);
        if (typeof window.crypto !== 'undefined' && typeof window.crypto.getRandomValues === 'function') {
            window.crypto.getRandomValues(bytes);
        }
        else {
            for (let i = 0; i < 16; i++) {
                bytes[i] = Math.floor(Math.random() * 256);
            }
        }
        bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
        bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
        const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
    }
    bindEvents() {
        this.formEl.addEventListener('submit', (event) => {
            event.preventDefault();
            const text = this.inputEl.value.trim();
            if (!text || this.isPendingRequest) {
                return;
            }
            void this.sendMessage(text);
        });
    }
    async initialize() {
        this.setLoadingState(true);
        try {
            const url = new URL(`${this.apiBaseUrl}/api/chat/history`);
            url.searchParams.set('portfolioId', this.portfolioId);
            url.searchParams.set('deviceId', this.deviceId);
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: { Accept: 'application/json' }
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status} al hidratar historial.`);
            }
            const data = await response.json();
            const historyPayload = data;
            this.messagesEl.innerHTML = '';
            if (Array.isArray(historyPayload.turns) && historyPayload.turns.length > 0) {
                for (const turn of historyPayload.turns) {
                    this.renderStoredTurn(turn);
                }
            }
            else {
                this.renderMessageBubble('model', this.welcomeMessage, [], createEmptyCommand(), this.initialActions);
            }
        }
        catch {
            if (this.messagesEl.children.length === 0) {
                this.renderMessageBubble('model', this.welcomeMessage, [], createEmptyCommand(), this.initialActions);
            }
        }
        finally {
            this.setLoadingState(false);
        }
    }
    async sendMessage(userText) {
        const cleanText = userText.trim();
        if (!cleanText || this.isPendingRequest) {
            return;
        }
        this.inputEl.value = '';
        this.renderMessageBubble('user', cleanText, [], createEmptyCommand(), []);
        const loaderEl = this.renderTypingIndicator();
        this.setLoadingState(true);
        const requestBody = {
            portfolioId: this.portfolioId,
            deviceId: this.deviceId,
            message: cleanText
        };
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            loaderEl.remove();
            if (!response.ok) {
                throw new Error(`Error del servidor (HTTP ${response.status}).`);
            }
            const rawData = await response.json();
            if (!isChatResponsePayload(rawData)) {
                throw new Error('Formato de respuesta inválido.');
            }
            const payload = rawData;
            this.renderMessageBubble('model', payload.message, payload.thinking, payload.command, payload.suggested_actions);
            if (payload.command.autoExecute && payload.command.action !== 'NONE') {
                this.executeClientCommand(payload.command);
            }
        }
        catch {
            loaderEl.remove();
            this.renderErrorBubble('No fue posible conectar con el servidor de IA en este momento. Verifica tu conexión e inténtalo nuevamente.');
        }
        finally {
            this.setLoadingState(false);
            this.inputEl.focus();
        }
    }
    renderStoredTurn(turn) {
        this.renderMessageBubble(turn.role, turn.message, turn.thinking ?? [], turn.command ?? createEmptyCommand(), turn.suggested_actions);
    }
    renderMessageBubble(role, messageText, thinkingSteps, command, suggestedActions) {
        const wrapper = document.createElement('div');
        wrapper.className = `chat-turn chat-turn--${role}`;
        if (role === 'model' && thinkingSteps.length > 0) {
            const details = document.createElement('details');
            details.className = 'chat-turn__thinking';
            const summary = document.createElement('summary');
            summary.textContent = `Razonamiento (${thinkingSteps.length} pasos)`;
            details.appendChild(summary);
            const list = document.createElement('ol');
            list.className = 'chat-turn__thinking-list';
            for (const step of thinkingSteps) {
                const li = document.createElement('li');
                li.innerHTML = `<strong>[${this.escapeHtml(step.phase)}]</strong> ${this.escapeHtml(step.detail)}`;
                list.appendChild(li);
            }
            details.appendChild(list);
            wrapper.appendChild(details);
        }
        const body = document.createElement('div');
        body.className = 'chat-turn__body';
        body.innerHTML = this.formatMarkdownSafe(messageText);
        wrapper.appendChild(body);
        if (role === 'model' && (command.action !== 'NONE' || suggestedActions.length > 0)) {
            const actionsContainer = document.createElement('div');
            actionsContainer.className = 'chat-turn__actions';
            if (command.action !== 'NONE') {
                const cmdBtn = document.createElement('button');
                cmdBtn.type = 'button';
                cmdBtn.className = 'chat-action-btn chat-action-btn--command';
                cmdBtn.textContent = command.description;
                cmdBtn.addEventListener('click', () => {
                    this.executeClientCommand(command);
                });
                actionsContainer.appendChild(cmdBtn);
            }
            for (const action of suggestedActions) {
                const actionBtn = document.createElement('button');
                actionBtn.type = 'button';
                actionBtn.className = `chat-action-btn chat-action-btn--${action.type}`;
                actionBtn.textContent = action.label;
                actionBtn.addEventListener('click', () => {
                    this.handleSuggestedAction(action);
                });
                actionsContainer.appendChild(actionBtn);
            }
            wrapper.appendChild(actionsContainer);
        }
        this.messagesEl.appendChild(wrapper);
        this.scrollToBottom();
    }
    executeClientCommand(command) {
        switch (command.action) {
            case 'CLEAR_TERMINAL': {
                if (this.domBridge?.clearTerminal) {
                    this.domBridge.clearTerminal();
                }
                else {
                    this.messagesEl.innerHTML = '';
                }
                break;
            }
            case 'OPEN_VISUAL_VIEWER': {
                if (this.domBridge?.openVisualViewer) {
                    this.domBridge.openVisualViewer(command.params);
                }
                else if (command.params.imageUrl) {
                    window.open(command.params.imageUrl, '_blank', 'noopener,noreferrer');
                }
                break;
            }
            case 'NAVIGATE_WEEK': {
                if (this.domBridge?.navigateToTarget) {
                    this.domBridge.navigateToTarget(command.params);
                }
                else if (command.params.page) {
                    window.location.href = command.params.page;
                }
                break;
            }
            case 'DOWNLOAD_RESOURCE': {
                if (command.params.resourceUrl) {
                    const anchor = document.createElement('a');
                    anchor.href = command.params.resourceUrl;
                    anchor.download = '';
                    document.body.appendChild(anchor);
                    anchor.click();
                    anchor.remove();
                }
                break;
            }
            case 'OPEN_EXTERNAL_URL': {
                if (command.params.resourceUrl) {
                    window.open(command.params.resourceUrl, '_blank', 'noopener,noreferrer');
                }
                break;
            }
            case 'NONE':
            default:
                break;
        }
    }
    handleSuggestedAction(action) {
        if (action.type === 'link') {
            const isExternal = /^https?:\/\//i.test(action.target);
            if (isExternal) {
                window.open(action.target, '_blank', 'noopener,noreferrer');
            }
            else {
                window.location.href = action.target;
            }
            return;
        }
        if (action.type === 'prompt' && !this.isPendingRequest) {
            void this.sendMessage(action.target);
        }
    }
    renderTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'chat-turn chat-turn--model chat-turn--loading';
        indicator.textContent = 'Analizando módulos y ejecutando razonamiento...';
        this.messagesEl.appendChild(indicator);
        this.scrollToBottom();
        return indicator;
    }
    renderErrorBubble(errorText) {
        const errorEl = document.createElement('div');
        errorEl.className = 'chat-turn chat-turn--error';
        errorEl.textContent = errorText;
        this.messagesEl.appendChild(errorEl);
        this.scrollToBottom();
    }
    setLoadingState(isLoading) {
        this.isPendingRequest = isLoading;
        this.inputEl.disabled = isLoading;
        this.submitBtnEl.disabled = isLoading;
        this.containerEl.setAttribute('aria-busy', isLoading ? 'true' : 'false');
    }
    scrollToBottom() {
        this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    }
    escapeHtml(raw) {
        return raw
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    formatMarkdownSafe(text) {
        const safe = this.escapeHtml(text);
        return safe
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }
}
