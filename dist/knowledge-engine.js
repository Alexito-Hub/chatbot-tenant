/**
 * ============================================================
 * MOTOR MODULAR DE CONOCIMIENTO (AUTO-INDEXADOR + MICRO-RAG + CACHÉ)
 * Archivo: src/knowledge-engine.ts
 * ============================================================
 */
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { createEmptyCommand } from './types.js';
import { CodeRepositoryEngine } from './code-engine.js';
import { MultimodalVisionEngine } from './vision-engine.js';
/**
 * Normaliza cadenas eliminando tildes y signos para búsqueda léxica rápida.
 */
export function normalizeQueryText(input) {
    return input
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9_.+\-\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
function asString(val, fallback = '') {
    return typeof val === 'string' ? val : fallback;
}
function asNumber(val, fallback = 0) {
    return typeof val === 'number' && !Number.isNaN(val) ? val : fallback;
}
function asRecord(val) {
    return typeof val === 'object' && val !== null && !Array.isArray(val)
        ? val
        : null;
}
function asArray(val) {
    return Array.isArray(val) ? val : [];
}
/**
 * Construye automáticamente los KnowledgeChunks desde el archivo portafolio.json
 * tanto para el esquema de sacijim (portfolio_a) como el de Alexito-Hub (portfolio_b).
 */
function buildChunksFromRawJson(portfolioId, rawJson) {
    const chunks = [];
    const est = asRecord(rawJson['estudiante']) ?? {};
    const tech = asRecord(rawJson['conocimientoTecnico']) ?? {};
    const cursos = asRecord(rawJson['cursos']) ?? {};
    // 1. Chunk de Perfil Académico
    const profileContent = [
        `Estudiante: ${asString(est['nombre'])} (${asString(est['usuario'])})`,
        `Rol: ${asString(est['rol'])}`,
        `Universidad: ${asString(est['universidad'])} — ${asString(est['facultad'])}`,
        `Carrera y Ciclo: ${asString(est['carrera'])} (${asString(est['ciclo'])}, ${asString(est['plan'], 'Plan 2022')})`,
        `Ciudad: ${asString(est['ciudad'], 'Huancayo, Perú')}`,
        `GitHub: ${asString(est['github'])}`,
        `Biografía: ${asString(est['biografia'])}`
    ].join('\n');
    chunks.push({
        id: `${portfolioId}:profile`,
        portfolioId,
        category: 'profile',
        courseKey: 'general',
        weekNumber: null,
        title: `Perfil Académico de ${asString(est['nombre'])}`,
        keywords: [
            'quien',
            'autor',
            'autora',
            'estudiante',
            'perfil',
            'biografia',
            'contacto',
            'correo',
            'github',
            'linkedin',
            'universidad',
            'upla',
            'docente',
            'profesor',
            'fernandez',
            'bejarano',
            normalizeQueryText(asString(est['nombre'])),
            normalizeQueryText(asString(est['usuario']))
        ],
        content: profileContent,
        defaultCommand: {
            action: 'NAVIGATE_WEEK',
            description: 'Abrir página de Perfil Académico',
            autoExecute: false,
            params: {
                page: 'perfil.html',
                unitId: '',
                weekId: '',
                exerciseId: '',
                imageUrl: '',
                imageTitle: '',
                galleryId: '',
                galleryIndex: 0,
                resourceUrl: 'perfil.html'
            }
        },
        exerciseCommands: {}
    });
    // 2. Chunk de Conocimiento Técnico Transversal (Big-O, Maven/POM, Figma)
    const techLines = [];
    for (const [key, val] of Object.entries(tech)) {
        const rec = asRecord(val);
        if (!rec)
            continue;
        if (typeof rec['titulo'] === 'string' && typeof rec['explicacion'] === 'string') {
            techLines.push(`- ${rec['titulo']}: ${rec['explicacion']}`);
        }
        else {
            techLines.push(`Sección ${key}:`);
            for (const [subK, subV] of Object.entries(rec)) {
                if (typeof subV === 'string') {
                    techLines.push(`  * ${subK}: ${subV}`);
                }
            }
        }
    }
    chunks.push({
        id: `${portfolioId}:technical`,
        portfolioId,
        category: 'technical',
        courseKey: 'general',
        weekNumber: null,
        title: 'Conocimiento Técnico Transversal (Complejidades Big-O, Maven/POM, Figma)',
        keywords: [
            'complejidad',
            'big o',
            'notacion',
            'tiempo',
            'eficiencia',
            'o(1)',
            'o(n)',
            'o(n2)',
            'maven',
            'pom',
            'pom.xml',
            'dependencias',
            'figma',
            'prototipo',
            'wireframe',
            'ui',
            'ux'
        ],
        content: techLines.join('\n'),
        defaultCommand: createEmptyCommand(),
        exerciseCommands: {}
    });
    // 3. Procesar Unidades y Semanas/Entregas de cada Curso
    const indexSummaryLines = [];
    for (const [courseKeyRaw, courseVal] of Object.entries(cursos)) {
        const courseRec = asRecord(courseVal);
        if (!courseRec)
            continue;
        const courseKey = courseKeyRaw === 'algoritmos' || courseKeyRaw === 'taller' ? courseKeyRaw : 'general';
        const courseName = asString(courseRec['nombre'], courseKeyRaw);
        const coursePage = asString(courseRec['pagina'], 'algoritmos.html');
        const courseTeacher = asString(courseRec['docente']);
        indexSummaryLines.push(`Curso: ${courseName} (Página: ${coursePage}${courseTeacher ? `, Docente: ${courseTeacher}` : ''})`);
        const unidades = asArray(courseRec['unidades']);
        for (const uVal of unidades) {
            const unitRec = asRecord(uVal);
            if (!unitRec)
                continue;
            const unitId = asString(unitRec['id']);
            const unitTitle = asString(unitRec['titulo']);
            // Esquema A (sacijim): unidad.semanas[]
            const semanasArr = asArray(unitRec['semanas']);
            for (const sVal of semanasArr) {
                const sem = asRecord(sVal);
                if (!sem)
                    continue;
                const weekNum = asNumber(sem['numero'], 0);
                const weekId = asString(sem['id']);
                const weekTitle = asString(sem['titulo'], `Semana ${weekNum}`);
                const weekTema = asString(sem['tema']);
                const weekTag = asString(sem['tag']);
                const resumen = asString(sem['resumenChatbot'], asString(sem['descripcion']));
                const explicacion = asString(sem['explicacionTecnica'], resumen);
                indexSummaryLines.push(`  - [${courseKey.toUpperCase()}] ${weekTitle} (${weekTema}) — ID: ${weekId} (${weekTag})`);
                const exerciseLines = [];
                const exerciseCommands = {};
                const extraKeywords = [
                    normalizeQueryText(weekTitle),
                    normalizeQueryText(weekTema),
                    normalizeQueryText(resumen),
                    normalizeQueryText(explicacion)
                ];
                const baseUrl = asString(sem['baseUrl']);
                const ejercicios = asArray(sem['ejercicios']);
                ejercicios.forEach((ejVal, idx) => {
                    const ej = asRecord(ejVal);
                    if (!ej)
                        return;
                    const ejNum = idx + 1;
                    const ejCode = asString(ej['numero'], `0${ejNum}`);
                    const ejId = asString(ej['id'], `${weekId}-ej-${ejNum}`);
                    const ejTitulo = asString(ej['titulo'], `Ejercicio ${ejCode}`);
                    const ejSub = asString(ej['tema'], asString(ej['subtitulo']));
                    const ejExp = asString(ej['explicacion']);
                    const imagenes = asArray(ej['imagenes']);
                    const metodos = asArray(ej['metodos']).map((m) => asString(m)).filter(Boolean);
                    const firstImg = asRecord(imagenes[0]);
                    const firstImgSrc = firstImg
                        ? asString(firstImg['src'], `${baseUrl}${asString(firstImg['archivo'])}`)
                        : baseUrl && metodos.length > 0
                            ? `${baseUrl}${ejCode}-M1.png`
                            : '';
                    const methodsSummary = metodos.length > 0
                        ? metodos.join('; ')
                        : imagenes
                            .map((imgV) => {
                            const imgR = asRecord(imgV);
                            return imgR ? `${asString(imgR['titulo'])} (${asString(imgR['subtitulo'])})` : '';
                        })
                            .filter(Boolean)
                            .join(', ');
                    exerciseLines.push(`  * Ejercicio 0${ejNum} [${ejId}] — ${ejTitulo} (${ejSub}): ${ejExp}` +
                        (methodsSummary ? ` | Métodos/Capturas: ${methodsSummary}` : '') +
                        (firstImgSrc ? ` | Imagen principal: ${firstImgSrc}` : ''));
                    extraKeywords.push(normalizeQueryText(`${ejTitulo} ${ejSub} ${ejExp} ${methodsSummary}`));
                    exerciseCommands[ejNum] = {
                        action: firstImgSrc ? 'OPEN_VISUAL_VIEWER' : 'NAVIGATE_WEEK',
                        description: `Abrir ${weekTitle} · ${ejTitulo}`,
                        autoExecute: false,
                        params: {
                            page: coursePage,
                            unitId,
                            weekId,
                            exerciseId: ejId,
                            imageUrl: firstImgSrc,
                            imageTitle: `${weekTitle} · ${ejTitulo}`,
                            galleryId: weekId,
                            galleryIndex: idx,
                            resourceUrl: firstImgSrc
                        }
                    };
                });
                const semItems = asArray(sem['items']);
                semItems.forEach((itVal, idx) => {
                    const it = asRecord(itVal);
                    if (!it)
                        return;
                    const ejNum = idx + 1;
                    const archivo = asString(it['archivo']);
                    const imgSrc = asString(it['url'], `${baseUrl}${archivo}`);
                    const itTitulo = asString(it['titulo'], `Ejercicio 0${ejNum}`);
                    const itSub = asString(it['subtitulo']);
                    const itExp = asString(it['explicacion']);
                    exerciseLines.push(`  * ${itTitulo} (${itSub}): ${itExp} | Imagen: ${imgSrc}`);
                    extraKeywords.push(normalizeQueryText(`${itTitulo} ${itSub} ${itExp}`));
                    if (!exerciseCommands[ejNum]) {
                        exerciseCommands[ejNum] = {
                            action: imgSrc ? 'OPEN_VISUAL_VIEWER' : 'NAVIGATE_WEEK',
                            description: `Ver captura: ${weekTitle} · ${itTitulo}`,
                            autoExecute: false,
                            params: {
                                page: coursePage,
                                unitId,
                                weekId,
                                exerciseId: `${weekId}-item-${ejNum}`,
                                imageUrl: imgSrc,
                                imageTitle: `${weekTitle} · ${itTitulo}`,
                                galleryId: weekId,
                                galleryIndex: idx,
                                resourceUrl: imgSrc
                            }
                        };
                    }
                });
                const archivos = asArray(sem['archivos']);
                let firstWeekImg = '';
                let firstWeekDownload = '';
                let externalLink = '';
                archivos.forEach((archVal, idx) => {
                    const arch = asRecord(archVal);
                    if (!arch)
                        return;
                    const archTipo = asString(arch['tipo'], asString(arch['icono']));
                    const archTitulo = asString(arch['titulo']);
                    const archSub = asString(arch['subtitulo']);
                    const archSrc = asString(arch['src'], asString(arch['descargarUrl'], asString(arch['url'])));
                    const archExp = asString(arch['explicacion']);
                    const verUrl = asString(arch['verUrl']);
                    if (archTipo.toLowerCase().includes('img') || archTipo.toLowerCase().includes('png')) {
                        if (!firstWeekImg)
                            firstWeekImg = archSrc;
                    }
                    if (archSrc && (archTipo.toLowerCase().includes('rar') || archTipo.toLowerCase().includes('zip') || archTipo.toLowerCase().includes('cod'))) {
                        if (!firstWeekDownload)
                            firstWeekDownload = archSrc;
                    }
                    if (verUrl && !externalLink) {
                        externalLink = verUrl;
                    }
                    exerciseLines.push(`  * Recurso ${idx + 1} (${archTipo}): ${archTitulo} (${archSub}) — Ruta: ${archSrc}${archExp ? ` | ${archExp}` : ''}`);
                    extraKeywords.push(normalizeQueryText(`${archTitulo} ${archSub} ${archExp} ${archSrc}`));
                });
                const enlaces = asArray(sem['enlaces']);
                enlaces.forEach((enlVal) => {
                    const enl = asRecord(enlVal);
                    if (!enl)
                        return;
                    const texto = asString(enl['texto']);
                    const url = asString(enl['url']);
                    if (!externalLink && url.startsWith('http')) {
                        externalLink = url;
                    }
                    exerciseLines.push(`  * Enlace: ${texto} -> ${url}`);
                });
                const firstEjCmd = exerciseCommands[1];
                const defaultCmd = externalLink
                    ? {
                        action: 'OPEN_EXTERNAL_URL',
                        description: `Abrir enlace de ${weekTitle}`,
                        autoExecute: false,
                        params: {
                            page: coursePage,
                            unitId,
                            weekId,
                            exerciseId: '',
                            imageUrl: '',
                            imageTitle: weekTitle,
                            galleryId: '',
                            galleryIndex: 0,
                            resourceUrl: externalLink
                        }
                    }
                    : firstEjCmd
                        ? {
                            ...firstEjCmd,
                            action: 'NAVIGATE_WEEK',
                            description: `Ir a ${weekTitle} (${weekTema})`
                        }
                        : {
                            action: 'NAVIGATE_WEEK',
                            description: `Ir a ${weekTitle} (${weekTema})`,
                            autoExecute: false,
                            params: {
                                page: coursePage,
                                unitId,
                                weekId,
                                exerciseId: '',
                                imageUrl: firstWeekImg,
                                imageTitle: `${weekTitle} · ${weekTema}`,
                                galleryId: weekId,
                                galleryIndex: 0,
                                resourceUrl: firstWeekDownload || coursePage
                            }
                        };
                const chunkContent = [
                    `CURSO: ${courseName} (${coursePage}) | UNIDAD: ${unitTitle} [${unitId}]`,
                    `SEMANA ${weekNum} [${weekId}]: ${weekTitle} — ${weekTema}`,
                    `RESUMEN: ${resumen}`,
                    `EXPLICACIÓN TÉCNICA: ${explicacion}`,
                    exerciseLines.length > 0 ? `DETALLE DE EJERCICIOS Y RECURSOS:\n${exerciseLines.join('\n')}` : ''
                ]
                    .filter(Boolean)
                    .join('\n');
                chunks.push({
                    id: `${portfolioId}:${courseKey}:week_${weekNum}`,
                    portfolioId,
                    category: 'week',
                    courseKey,
                    weekNumber: weekNum,
                    title: `${weekTitle}: ${weekTema} (${courseName})`,
                    keywords: extraKeywords,
                    content: chunkContent,
                    defaultCommand: defaultCmd,
                    exerciseCommands
                });
            }
            // Esquema B (Alexito-Hub): unidad.entregas[]
            const entregasArr = asArray(unitRec['entregas']);
            for (const entVal of entregasArr) {
                const ent = asRecord(entVal);
                if (!ent)
                    continue;
                const weekNum = asNumber(ent['numero'], 0);
                const delivId = asString(ent['id']);
                const semanaLabel = asString(ent['semana'], `Semana 0${weekNum}`);
                const nombre = asString(ent['nombre']);
                const tema = asString(ent['tema'], nombre);
                const releaseUrl = asString(ent['releaseUrl']);
                const codigoUrl = asString(ent['codigoUrl']);
                const extUrl = asString(ent['url']);
                const resumen = asString(ent['resumenChatbot']);
                const explicacion = asString(ent['explicacionTecnica'], resumen);
                indexSummaryLines.push(`  - [${courseKey.toUpperCase()}] ${semanaLabel}: ${nombre} (${tema}) — ID: ${delivId}`);
                const exerciseLines = [];
                const exerciseCommands = {};
                const extraKeywords = [
                    normalizeQueryText(semanaLabel),
                    normalizeQueryText(nombre),
                    normalizeQueryText(tema),
                    normalizeQueryText(resumen),
                    normalizeQueryText(explicacion),
                    normalizeQueryText(codigoUrl)
                ];
                const ejercicios = asArray(ent['ejercicios']);
                let galleryCursor = 0;
                ejercicios.forEach((ejVal, idx) => {
                    const ej = asRecord(ejVal);
                    if (!ej)
                        return;
                    const ejNum = idx + 1;
                    const ejTitulo = asString(ej['titulo'], `Ejercicio 0${ejNum}`);
                    const ejTema = asString(ej['tema']);
                    const ejExp = asString(ej['explicacion']);
                    const metodos = asArray(ej['metodos']).map((m) => asString(m)).filter(Boolean);
                    const startGalleryIdx = galleryCursor;
                    galleryCursor += metodos.length;
                    exerciseLines.push(`  * ${ejTitulo} (${ejTema}): ${ejExp} | Métodos en galería (${metodos.length}, índice inicial ${startGalleryIdx}): ${metodos.join('; ')}`);
                    extraKeywords.push(normalizeQueryText(`${ejTitulo} ${ejTema} ${ejExp} ${metodos.join(' ')}`));
                    exerciseCommands[ejNum] = {
                        action: 'OPEN_VISUAL_VIEWER',
                        description: `Abrir Galería en ${semanaLabel} · ${ejTitulo}`,
                        autoExecute: false,
                        params: {
                            page: coursePage,
                            unitId,
                            weekId: delivId,
                            exerciseId: `ej-${ejNum}`,
                            imageUrl: '',
                            imageTitle: `${semanaLabel} · ${ejTitulo}`,
                            galleryId: delivId,
                            galleryIndex: startGalleryIdx,
                            resourceUrl: releaseUrl
                        }
                    };
                });
                const defaultCmd = extUrl
                    ? {
                        action: 'OPEN_EXTERNAL_URL',
                        description: `Abrir prototipo externo de ${semanaLabel}`,
                        autoExecute: false,
                        params: {
                            page: coursePage,
                            unitId,
                            weekId: delivId,
                            exerciseId: '',
                            imageUrl: '',
                            imageTitle: `${semanaLabel} · ${nombre}`,
                            galleryId: '',
                            galleryIndex: 0,
                            resourceUrl: extUrl
                        }
                    }
                    : {
                        action: 'OPEN_VISUAL_VIEWER',
                        description: `Abrir galería de ${semanaLabel} (${nombre})`,
                        autoExecute: false,
                        params: {
                            page: coursePage,
                            unitId,
                            weekId: delivId,
                            exerciseId: '',
                            imageUrl: '',
                            imageTitle: `${semanaLabel} · ${nombre}`,
                            galleryId: delivId,
                            galleryIndex: 0,
                            resourceUrl: releaseUrl || coursePage
                        }
                    };
                const chunkContent = [
                    `CURSO: ${courseName} (${coursePage}) | UNIDAD: ${unitTitle} [${unitId}]`,
                    `ENTREGA ${semanaLabel} [ID: ${delivId}]: ${nombre} — ${tema}`,
                    releaseUrl ? `RELEASE GITHUB: ${releaseUrl}` : '',
                    codigoUrl ? `PAQUETE CODIGO: ${codigoUrl}` : '',
                    extUrl ? `ENLACE EXTERNO: ${extUrl}` : '',
                    `RESUMEN: ${resumen}`,
                    `EXPLICACIÓN TÉCNICA: ${explicacion}`,
                    exerciseLines.length > 0 ? `EJERCICIOS Y MÉTODOS:\n${exerciseLines.join('\n')}` : ''
                ]
                    .filter(Boolean)
                    .join('\n');
                chunks.push({
                    id: `${portfolioId}:${courseKey}:week_${weekNum}`,
                    portfolioId,
                    category: 'week',
                    courseKey,
                    weekNumber: weekNum,
                    title: `${semanaLabel}: ${nombre} (${courseName})`,
                    keywords: extraKeywords,
                    content: chunkContent,
                    defaultCommand: defaultCmd,
                    exerciseCommands
                });
            }
        }
    }
    // 4. Chunk de Índice General (Tabla de Contenidos Ligera ~120 tokens)
    chunks.push({
        id: `${portfolioId}:index`,
        portfolioId,
        category: 'index',
        courseKey: 'general',
        weekNumber: null,
        title: 'Índice General de Semanas y Entregas Publicadas',
        keywords: ['resumen', 'indice', 'todas', 'semanas', 'unidades', 'cursos', 'silabo', 'ls', 'help', 'entregas'],
        content: indexSummaryLines.join('\n'),
        defaultCommand: {
            action: 'NAVIGATE_WEEK',
            description: 'Ir a la página principal de Algoritmos',
            autoExecute: false,
            params: {
                page: 'algoritmos.html',
                unitId: 'unidad-1',
                weekId: '',
                exerciseId: '',
                imageUrl: '',
                imageTitle: '',
                galleryId: '',
                galleryIndex: 0,
                resourceUrl: 'algoritmos.html'
            }
        },
        exerciseCommands: {}
    });
    return chunks;
}
/**
 * Motor Principal de Conocimiento:
 * - Sincroniza y recarga automáticamente portafolio.json cuando cambia su hash SHA-256.
 * - Ejecuta recuperación Micro-RAG seleccionando solo los Chunks necesarios.
 * - Administra un caché LRU de consultas canónicas (0 tokens en preguntas frecuentes).
 */
export class ModularKnowledgeEngine {
    jsonPaths;
    states = new Map();
    responseCache = new Map();
    maxCacheEntries = 250;
    checkIntervalMs = 10_000;
    codeEngine = new CodeRepositoryEngine();
    visionEngine = new MultimodalVisionEngine();
    constructor(portfolioAPath, portfolioBPath) {
        this.jsonPaths = {
            portfolio_a: portfolioAPath,
            portfolio_b: portfolioBPath
        };
    }
    /**
     * Garantiza que el índice del portafolio esté cargado y actualizado según el hash SHA-256 del archivo.
     */
    async ensureIndexLoaded(portfolioId, forceReload = false) {
        const existing = this.states.get(portfolioId);
        const now = Date.now();
        if (existing && !forceReload && now - existing.lastCheckedAt < this.checkIntervalMs) {
            return existing;
        }
        const targetPath = this.jsonPaths[portfolioId];
        const rawContent = await fs.readFile(targetPath, 'utf8');
        const sourceHash = createHash('sha256').update(rawContent).digest('hex').slice(0, 16);
        if (existing && existing.sourceHash === sourceHash) {
            const updatedState = {
                ...existing,
                lastCheckedAt: now
            };
            this.states.set(portfolioId, updatedState);
            return updatedState;
        }
        const parsedJson = JSON.parse(rawContent);
        const recordJson = asRecord(parsedJson);
        if (!recordJson) {
            throw new Error(`El archivo JSON en ${targetPath} no tiene un objeto raíz válido.`);
        }
        const chunks = buildChunksFromRawJson(portfolioId, recordJson);
        const newState = {
            portfolioId,
            sourceHash,
            lastCheckedAt: now,
            chunks
        };
        this.states.set(portfolioId, newState);
        this.invalidateCacheForPortfolio(portfolioId);
        return newState;
    }
    invalidateCacheForPortfolio(portfolioId) {
        const prefix = `${portfolioId}:`;
        for (const key of this.responseCache.keys()) {
            if (key.startsWith(prefix)) {
                this.responseCache.delete(key);
            }
        }
    }
    /**
     * Consulta el caché LRU para preguntas canónicas sin dependencia de pronombres del historial.
     */
    getCachedResponse(portfolioId, sourceHash, userMessage) {
        const normalized = normalizeQueryText(userMessage);
        const key = `${portfolioId}:${sourceHash}:${normalized}`;
        const entry = this.responseCache.get(key);
        if (!entry)
            return null;
        // Refresca orden LRU
        this.responseCache.delete(key);
        this.responseCache.set(key, entry);
        return entry.payload;
    }
    setCachedResponse(portfolioId, sourceHash, userMessage, payload) {
        const normalized = normalizeQueryText(userMessage);
        const key = `${portfolioId}:${sourceHash}:${normalized}`;
        if (this.responseCache.size >= this.maxCacheEntries) {
            const oldestKey = this.responseCache.keys().next().value;
            if (typeof oldestKey === 'string') {
                this.responseCache.delete(oldestKey);
            }
        }
        this.responseCache.set(key, {
            payload,
            createdAt: Date.now()
        });
    }
    /**
     * Selecciona únicamente los fragmentos relevantes (Micro-RAG) para reducir el consumo de tokens
     * hasta en un 85% y evitar alucinaciones por saturación de contexto.
     */
    async retrieveRelevantChunks(portfolioId, userMessage, recentHistory) {
        const state = await this.ensureIndexLoaded(portfolioId);
        const q = normalizeQueryText(userMessage);
        // Contexto heredado de los últimos 2 turnos si la consulta actual usa referencias implícitas ("su captura", "el ejercicio 2")
        const recentContextText = normalizeQueryText(recentHistory
            .slice(-2)
            .map((t) => t.message)
            .join(' '));
        // 1. Detectar si el usuario pide explícitamente ejecutar un comando en la interfaz
        const wantsVisualViewer = /\b(ver captura|abrir captura|abre la captura|abrir la captura|abre captura|muestrame la captura|mostrar captura|abrir galeria|abre la galeria|ver galeria|mostrar imagen|ver imagen|lightbox)\b/.test(q);
        const wantsNavigation = /\b(ir a|llevame a|ubicar|navegar a|abrir semana|mostrar semana)\b/.test(q);
        const wantsDownload = /\b(descargar|bajar|descarga|\.rar|\.java)\b/.test(q);
        const wantsClear = /^(clear|cls|limpiar consola|limpiar terminal)$/.test(q);
        const wantsExecutionCommand = wantsVisualViewer || wantsNavigation || wantsDownload || wantsClear;
        const preferredActionType = wantsClear
            ? 'CLEAR_TERMINAL'
            : wantsVisualViewer
                ? 'OPEN_VISUAL_VIEWER'
                : wantsDownload
                    ? 'DOWNLOAD_RESOURCE'
                    : wantsNavigation
                        ? 'NAVIGATE_WEEK'
                        : 'NONE';
        // 2. Detectar semana explícita en el mensaje actual (o heredarla del turno previo si no se menciona otra)
        const explicitWeekMatch = q.match(/\b(?:semana|sem|s)\s*0?([1-9]|1[0-6])\b/);
        const historyWeekMatch = !explicitWeekMatch
            ? recentContextText.match(/\b(?:semana|sem|s)\s*0?([1-9]|1[0-6])\b/)
            : null;
        let detectedWeek = explicitWeekMatch?.[1]
            ? Number.parseInt(explicitWeekMatch[1], 10)
            : historyWeekMatch?.[1]
                ? Number.parseInt(historyWeekMatch[1], 10)
                : null;
        // Inferencia directa de semana por nombre de clase o algoritmo único
        if (detectedWeek === null) {
            if (/\b(arbol|arboles|abb|nodoexpediente|arbolacademico|arbolexpedientes|gestorarchivos|analizadorcarpetas|gestorinventario|busquedabinaria|inorden)\b/.test(q)) {
                detectedWeek = 8;
            }
            else if (/\b(cola|colas|fifo|colaalumno|colaatencion|colapedidos|gestorcolaalumnos|gestorturnos|gestorpedidos|centinela|invertircola)\b/.test(q)) {
                detectedWeek = 7;
            }
            else if (/\b(pila|pilas|lifo|push|pop|peek|postfija|parentesis|palindromo)\b/.test(q)) {
                detectedWeek = 6;
            }
            else if (/\b(arraylist|colecciones dinamicas|listas dinamicas)\b/.test(q)) {
                detectedWeek = 5;
            }
            else if (/\b(arreglos de objetos|dao|matrizbidimensional)\b/.test(q)) {
                detectedWeek = 4;
            }
            else if (/\b(arreglos paralelos|vectores paralelos|enunciado01|arreglounidimensional)\b/.test(q)) {
                detectedWeek = 3;
            }
            else if (/\b(burbuja|seleccion|insercion|ordenamiento|patrones geometricos)\b/.test(q)) {
                detectedWeek = 2;
            }
            else if (/\b(recursividad|hanoi|euclides|mcd|potencia)\b/.test(q)) {
                detectedWeek = 1;
            }
        }
        // 3. Detectar ejercicio o actividad específica (ej. "ejercicio 3", "actividad 2", "ej 2")
        const ejMatch = q.match(/\b(?:ejercicio|ej|actividad|act|enunciado|problema)\s*(?:2\.)?0?([1-9]|10)\b/);
        let detectedExercise = ejMatch?.[1] ? Number.parseInt(ejMatch[1], 10) : null;
        if (detectedExercise === null && detectedWeek === 8) {
            if (/\b(gestorarchivos|analizadorcarpetas|archivoregistro|archivoinfo|directorios|carpetas)\b/.test(q))
                detectedExercise = 1;
            else if (/\b(gestorinventario|inventario|productoinventario|producto|busquedabinaria|sinexistencias)\b/.test(q))
                detectedExercise = 2;
            else if (/\b(arbolacademico|arbolexpedientes|nodoexpediente|nodo|expediente|inorden|abb|altura)\b/.test(q))
                detectedExercise = 3;
        }
        else if (detectedExercise === null && detectedWeek === 7) {
            if (/\b(colaalumno|gestorcolaalumnos|invertircola)\b/.test(q))
                detectedExercise = 1;
            else if (/\b(colaatencion|gestorturnos|nodoticket|ticket)\b/.test(q))
                detectedExercise = 2;
            else if (/\b(colapedidos|gestorpedidos|nodoorden|centinela|cancelarpedido|eliminarorden)\b/.test(q))
                detectedExercise = 3;
        }
        const isTallerQuery = /\b(taller|figma|prototipo|wireframe|maven|pom|pom\.xml|trabajo_taller)\b/.test(q);
        if (isTallerQuery && /\b(figma|prototipo)\b/.test(q) && portfolioId === 'portfolio_a' && detectedWeek === null) {
            detectedWeek = 2;
        }
        else if (isTallerQuery && detectedWeek === null) {
            detectedWeek = 1;
        }
        // 4. Selección quirúrgica de Chunks (Micro-RAG)
        const selected = [];
        const indexChunk = state.chunks.find((c) => c.category === 'index');
        const profileChunk = state.chunks.find((c) => c.category === 'profile');
        const techChunk = state.chunks.find((c) => c.category === 'technical');
        if (/\b(quien|autor|autora|estudiante|perfil|upla|universidad|docente|profesor|contacto|github|linkedin|maricielo|alessandro|sacijim|alexito)\b/.test(q)) {
            if (profileChunk)
                selected.push(profileChunk);
        }
        if (/\b(complejidad|big o|notacion|tiempo|eficiencia|maven|pom|figma|prototipo)\b/.test(q)) {
            if (techChunk)
                selected.push(techChunk);
        }
        if (detectedWeek !== null) {
            const preferredCourse = isTallerQuery ? 'taller' : 'algoritmos';
            const targetWeekChunk = state.chunks.find((c) => c.category === 'week' && c.courseKey === preferredCourse && c.weekNumber === detectedWeek) ?? state.chunks.find((c) => c.category === 'week' && c.weekNumber === detectedWeek);
            if (targetWeekChunk) {
                selected.push(targetWeekChunk);
            }
            else if (indexChunk) {
                selected.push(indexChunk);
            }
        }
        else {
            if (indexChunk) {
                selected.push(indexChunk);
            }
            // Búsqueda por puntuación léxica de tokens sobre los chunks de semanas (máximo 2 semanas)
            const queryTokens = q
                .split(' ')
                .filter((tk) => tk.length >= 3 && !['como', 'para', 'que', 'del', 'las', 'los', 'una', 'con', 'por', 'ver', 'explica'].includes(tk));
            if (queryTokens.length > 0) {
                const scoredWeeks = state.chunks
                    .filter((c) => c.category === 'week')
                    .map((chunk) => {
                    let score = 0;
                    const hay = chunk.keywords.join(' ');
                    for (const tk of queryTokens) {
                        if (hay.includes(tk))
                            score += 2;
                    }
                    return { chunk, score };
                })
                    .filter((item) => item.score > 0)
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 2);
                for (const sw of scoredWeeks) {
                    selected.push(sw.chunk);
                }
            }
        }
        // 4.1. Detección e inspección de Código Fuente Real (.java)
        const matchedCode = await this.codeEngine.findRelevantCode(portfolioId, userMessage, detectedWeek);
        if (matchedCode) {
            selected.push({
                id: `${portfolioId}:code:${matchedCode.className}`,
                portfolioId,
                category: 'code',
                courseKey: 'algoritmos',
                weekNumber: detectedWeek,
                title: `Código Java Real: ${matchedCode.className}`,
                keywords: [matchedCode.className.toLowerCase(), 'codigo', 'java'],
                content: `CÓDIGO FUENTE REAL VERIFICADO (${matchedCode.filePath}):\n\`\`\`java\n${matchedCode.code}\n\`\`\`\nRESUMEN: ${matchedCode.summary}`,
                defaultCommand: createEmptyCommand(),
                exerciseCommands: {}
            });
        }
        // 4.2. Detección e inspección de Infografías / Visión Multimodal
        const matchedVision = await this.visionEngine.findRelevantInfographic(portfolioId, userMessage, detectedWeek, detectedExercise);
        if (matchedVision) {
            selected.push({
                id: `${portfolioId}:vision:${matchedVision.filename}`,
                portfolioId,
                category: 'vision',
                courseKey: 'algoritmos',
                weekNumber: detectedWeek,
                title: `Infografía Visual: ${matchedVision.title}`,
                keywords: [matchedVision.filename.toLowerCase(), 'infografia', 'imagen', 'captura'],
                content: `DETALLE VISUAL DE LA INFOGRAFÍA (${matchedVision.filename}):\n${matchedVision.visualExplanation}\nURL RECURSO: ${matchedVision.resourceUrl}`,
                defaultCommand: {
                    action: 'OPEN_VISUAL_VIEWER',
                    description: `Visualizar ${matchedVision.filename} · ${matchedVision.title}`,
                    autoExecute: true,
                    params: {
                        page: 'algoritmos.html',
                        unitId: 'unidad-2',
                        weekId: portfolioId === 'portfolio_a' ? 'u2-semana-8' : 'alg-sem-8',
                        exerciseId: `ej-${detectedExercise ?? 1}`,
                        imageUrl: matchedVision.resourceUrl,
                        imageTitle: matchedVision.title,
                        galleryId: portfolioId === 'portfolio_a' ? 'u2-semana-8' : 'alg-sem-8',
                        galleryIndex: matchedVision.galleryIndex,
                        resourceUrl: matchedVision.resourceUrl
                    }
                },
                exerciseCommands: {}
            });
        }
        // Si no coincidió ningún módulo, enviar el índice ligero
        if (selected.length === 0 && indexChunk) {
            selected.push(indexChunk);
        }
        // 5. Resolver el comando anclado a datos reales (Grounding de Comandos)
        const primaryWeekChunk = selected.find((c) => c.category === 'week');
        let resolvedCommand = createEmptyCommand();
        if (wantsClear) {
            resolvedCommand = {
                action: 'CLEAR_TERMINAL',
                description: 'Limpiar el registro de la consola interactiva',
                autoExecute: true,
                params: createEmptyCommand().params
            };
        }
        else if (matchedVision) {
            resolvedCommand = {
                action: 'OPEN_VISUAL_VIEWER',
                description: `Visualizar ${matchedVision.filename} · ${matchedVision.title}`,
                autoExecute: true,
                params: {
                    page: 'algoritmos.html',
                    unitId: 'unidad-2',
                    weekId: portfolioId === 'portfolio_a' ? 'u2-semana-8' : 'alg-sem-8',
                    exerciseId: `ej-${detectedExercise ?? 1}`,
                    imageUrl: matchedVision.resourceUrl,
                    imageTitle: matchedVision.title,
                    galleryId: portfolioId === 'portfolio_a' ? 'u2-semana-8' : 'alg-sem-8',
                    galleryIndex: matchedVision.galleryIndex,
                    resourceUrl: matchedVision.resourceUrl
                }
            };
        }
        else if (primaryWeekChunk) {
            const ejCmd = detectedExercise !== null ? primaryWeekChunk.exerciseCommands[detectedExercise] : undefined;
            const baseCmd = ejCmd ?? primaryWeekChunk.defaultCommand;
            resolvedCommand = {
                ...baseCmd,
                action: preferredActionType !== 'NONE'
                    ? preferredActionType
                    : baseCmd.action,
                autoExecute: wantsExecutionCommand
            };
        }
        else if (selected.some((c) => c.category === 'profile') && profileChunk) {
            resolvedCommand = {
                ...profileChunk.defaultCommand,
                autoExecute: wantsExecutionCommand
            };
        }
        // 6. Construir la traza determinista de Modo Thinking
        const matchedIds = selected.map((c) => c.id);
        const totalChars = selected.reduce((acc, c) => acc + c.content.length, 0);
        const estimatedTokens = Math.ceil(totalChars / 4);
        const preThinkingSteps = [
            {
                step: 1,
                phase: 'INTENT',
                detail: matchedVision
                    ? `Identificada consulta visual sobre la infografía ${matchedVision.filename} (${matchedVision.title}).`
                    : matchedCode
                        ? `Identificada consulta sobre código fuente real de la clase ${matchedCode.className}.`
                        : detectedWeek !== null
                            ? `Consulta técnica identificada sobre Semana ${detectedWeek}${detectedExercise !== null ? `, Ejercicio ${detectedExercise}` : ''}${isTallerQuery ? ' (Taller)' : ' (Algoritmos)'}.`
                            : `Análisis de consulta general sobre el portafolio (${portfolioId}).`
            },
            {
                step: 2,
                phase: 'RETRIEVAL',
                detail: `Micro-RAG cargó ${selected.length} módulo(s) [${matchedIds.join(', ')}] (~${estimatedTokens} tokens en lugar del portafolio completo).`
            }
        ];
        if (matchedCode) {
            preThinkingSteps.push({
                step: preThinkingSteps.length + 1,
                phase: 'RETRIEVAL',
                detail: `Recuperado código fuente Java verificado desde ${matchedCode.filePath}.`
            });
        }
        if (matchedVision) {
            preThinkingSteps.push({
                step: preThinkingSteps.length + 1,
                phase: 'COMMAND',
                detail: `Modo Gemini Vision activado sobre la infografía ${matchedVision.filename} (índice en galería ${matchedVision.galleryIndex}).`
            });
        }
        preThinkingSteps.push({
            step: preThinkingSteps.length + 1,
            phase: 'COMMAND',
            detail: resolvedCommand.action !== 'NONE'
                ? `Comando vinculado: ${resolvedCommand.action} (${resolvedCommand.description}) | autoExecute=${String(resolvedCommand.autoExecute)}.`
                : 'Sin ejecución automática de DOM requerida para este turno.'
        });
        return {
            portfolioId,
            sourceHash: state.sourceHash,
            selectedChunks: selected,
            detectedWeek,
            detectedExercise,
            wantsExecutionCommand,
            preferredActionType,
            resolvedCommand,
            preThinkingSteps,
            estimatedTokens,
            matchedCode,
            matchedVision
        };
    }
}
//# sourceMappingURL=knowledge-engine.js.map