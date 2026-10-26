/**
 * ============================================================
 * MOTOR MULTIMODAL DE INFOGRAFÍAS Y VISIÓN (GEMINI VISION ENGINE)
 * Archivo: src/vision-engine.ts
 * ============================================================
 */

import { promises as fs } from 'node:fs';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PortfolioId, VisionImageMatch } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface InfographicMetadata {
  readonly filename: string;
  readonly activityNum: number;
  readonly methodNum: number;
  readonly methodName: string;
  readonly title: string;
  readonly visualSummary: string;
  readonly galleryIndex: number;
  readonly keywords: readonly string[];
}

export class MultimodalVisionEngine {
  private baseWorkspacePath: string;
  private readonly infographicCatalogA: InfographicMetadata[] = [];
  private readonly infographicCatalogB: InfographicMetadata[] = [];

  constructor() {
    this.baseWorkspacePath = this.resolveWorkspaceRoot();
    this.initializeCatalogs();
  }

  private resolveWorkspaceRoot(): string {
    const candidates = [
      path.resolve(process.cwd(), '..'),
      path.resolve(process.cwd()),
      path.resolve(__dirname, '..', '..', '..'),
      path.resolve(__dirname, '..', '..')
    ];

    for (const cand of candidates) {
      if (existsSync(path.join(cand, 'Semana8', 'salida'))) {
        return cand;
      }
    }
    return candidates[0] ?? process.cwd();
  }

  private initializeCatalogs(): void {
    // Actividad 01 (9 infografías)
    const act1: Array<{ m: number; name: string; title: string; desc: string; kws: string[] }> = [
      {
        m: 1,
        name: 'seleccionarRaiz',
        title: 'Actividad 01 · Método 1: Seleccionar raíz',
        desc: 'Muestra la validación del directorio raíz en consola, confirmando que la ruta existe y es una carpeta válida antes de iniciar la recursión.',
        kws: ['raiz', 'seleccionar', 'directorio', '01-m1', 'm1']
      },
      {
        m: 2,
        name: 'listarArchivos / listarTodos',
        title: 'Actividad 01 · Método 2: Listar recursivo',
        desc: 'Captura con el listado jerárquico de archivos recorriendo todos los subdirectorios con sangría proporcional a la profundidad.',
        kws: ['listar', 'subdirectorios', '01-m2', 'm2']
      },
      {
        m: 3,
        name: 'contarArchivos',
        title: 'Actividad 01 · Método 3: Conteo recursivo',
        desc: 'Pantalla que ilustra el acumulador recursivo sumando 1 por cada archivo hoja encontrado y retornando la cantidad total.',
        kws: ['contar', 'total archivos', '01-m3', 'm3']
      },
      {
        m: 4,
        name: 'tamanioTotal',
        title: 'Actividad 01 · Método 4: Tamaño total',
        desc: 'Infografía que detalla la suma acumulativa de bytes de todos los archivos escaneados, formateada a KB y MB.',
        kws: ['tamano', 'tamanio', 'bytes', 'peso', '01-m4', 'm4']
      },
      {
        m: 5,
        name: 'buscarPorNombre / buscarPorExtension',
        title: 'Actividad 01 · Método 5: Búsqueda recursiva',
        desc: 'Muestra la ejecución de búsqueda aplicando un predicado condicional para localizar archivos por coincidencia de nombre o extensión.',
        kws: ['buscar', 'nombre', 'extension', '01-m5', 'm5']
      },
      {
        m: 6,
        name: 'contarPorTipo / conteoPorExtension',
        title: 'Actividad 01 · Método 6: Reporte por tipo',
        desc: 'Diagrama con tabla estadística agrupando y contando cuántos archivos existen por extensión (.java, .txt, .pdf, .docx).',
        kws: ['reporte', 'tipo', 'extensiones', '01-m6', 'm6']
      },
      {
        m: 7,
        name: 'mostrarEstructura / imprimirArbol',
        title: 'Actividad 01 · Método 7: Estructura jerárquica en árbol',
        desc: 'Infografía con la impresión en consola del árbol de carpetas con ramas gráficas ASCII conectando carpetas padres e hijas.',
        kws: ['arbol de carpetas', 'estructura jerarquica', 'ramas', '01-m7', 'm7']
      },
      {
        m: 8,
        name: 'crearEstructuraPrueba / generarPrueba',
        title: 'Actividad 01 · Método 8: Generación de prueba',
        desc: 'Muestra la creación automática de una estructura temporal de carpetas y archivos con datos simulados para evaluar los algoritmos.',
        kws: ['prueba', 'estructura prueba', 'generar', '01-m8', 'm8']
      },
      {
        m: 9,
        name: 'menu',
        title: 'Actividad 01 · Método 9: Menú de consola y salida',
        desc: 'Captura del menú principal con 9 opciones numeradas para la interacción con el usuario en terminal.',
        kws: ['menu', 'opciones', 'consola', '01-m9', 'm9']
      }
    ];

    // Actividad 02 (8 infografías)
    const act2: Array<{ m: number; name: string; title: string; desc: string; kws: string[] }> = [
      {
        m: 1,
        name: 'registrar',
        title: 'Actividad 02 · Método 1: Registrar producto',
        desc: 'Captura del formulario de registro de artículos comerciales verificando el orden ascendente por código.',
        kws: ['registrar producto', 'ingreso', '02-m1', 'm1']
      },
      {
        m: 2,
        name: 'mostrarTodos / listar',
        title: 'Actividad 02 · Método 2: Mostrar productos',
        desc: 'Tabla formateada con columnas para código, nombre, precio unitario y cantidad en inventario.',
        kws: ['mostrar productos', 'tabla', 'catalogo', '02-m2', 'm2']
      },
      {
        m: 3,
        name: 'buscarPorCodigo',
        title: 'Actividad 02 · Método 3: Búsqueda binaria recursiva',
        desc: 'Infografía destacada que ilustra la búsqueda binaria dividiendo el espacio en mitades logarítmicas O(log n) hasta hallar el código.',
        kws: ['busqueda binaria', 'binaria recursiva', 'punto medio', '02-m3', 'm3']
      },
      {
        m: 4,
        name: 'valorTotal',
        title: 'Actividad 02 · Método 4: Valor total del inventario',
        desc: 'Cálculo recursivo acumulando el producto de precio por stock desde el índice 0 hasta el final del vector.',
        kws: ['valor total', 'importe inventario', 'monto', '02-m4', 'm4']
      },
      {
        m: 5,
        name: 'unidadesTotales',
        title: 'Actividad 02 · Método 5: Unidades totales',
        desc: 'Suma acumulativa recursiva de las existencias físicas de todos los productos en stock.',
        kws: ['unidades totales', 'total stock', '02-m5', 'm5']
      },
      {
        m: 6,
        name: 'sinExistencias',
        title: 'Actividad 02 · Método 6: Productos sin existencias',
        desc: 'Filtro recursivo identificando y listando los productos cuyo stock se encuentra en 0 para reposición.',
        kws: ['sin existencias', 'stock cero', 'agotado', '02-m6', 'm6']
      },
      {
        m: 7,
        name: 'bajoInventario',
        title: 'Actividad 02 · Método 7: Bajo inventario',
        desc: 'Filtro condicional recursivo que señala artículos con cantidad menor o igual al umbral mínimo establecido.',
        kws: ['bajo inventario', 'bajo stock', 'alerta reposicion', '02-m7', 'm7']
      },
      {
        m: 8,
        name: 'menu',
        title: 'Actividad 02 · Método 8: Menú de inventario',
        desc: 'Menú en consola con opciones de búsqueda binaria y reportes analíticos de inventario.',
        kws: ['menu inventario', '02-m8', 'm8']
      }
    ];

    // Actividad 03 (8 infografías)
    const act3: Array<{ m: number; name: string; title: string; desc: string; kws: string[] }> = [
      {
        m: 1,
        name: 'registrarExpediente / registrar',
        title: 'Actividad 03 · Método 1: Registrar expediente',
        desc: 'Ingreso de expedientes académicos con código, estudiante, carrera y estado del trámite.',
        kws: ['registrar expediente', 'tramite', '03-m1', 'm1']
      },
      {
        m: 2,
        name: 'insertar',
        title: 'Actividad 03 · Método 2: Inserción en Árbol Binario de Búsqueda',
        desc: 'Diagrama visual del árbol mostrando cómo se compara el código con el nodo actual para descender por la rama izquierda o derecha.',
        kws: ['insertar arbol', 'abb', 'rama izquierda', 'rama derecha', '03-m2', 'm2']
      },
      {
        m: 3,
        name: 'buscar',
        title: 'Actividad 03 · Método 3: Búsqueda en Árbol Binario',
        desc: 'Infografía con la traza de búsqueda recursiva de un expediente por código en O(log n), mostrando caso exitoso y no encontrado.',
        kws: ['buscar expediente', 'busqueda arbol', '03-m3', 'm3']
      },
      {
        m: 4,
        name: 'listarAscendente',
        title: 'Actividad 03 · Método 4: Recorrido Inorden',
        desc: 'Visualización del recorrido inorden (subárbol izquierdo, raíz, subárbol derecho) produciendo la lista ordenada ascendente.',
        kws: ['inorden', 'listar ascendente', 'ordenado', '03-m4', 'm4']
      },
      {
        m: 5,
        name: 'contarTotal / total',
        title: 'Actividad 03 · Método 5: Conteo de nodos',
        desc: 'Fórmula recursiva 1 + contar(izq) + contar(der) calculando la cantidad total de expedientes alojados en el árbol.',
        kws: ['contar nodos', 'total expedientes', '03-m5', 'm5']
      },
      {
        m: 6,
        name: 'altura',
        title: 'Actividad 03 · Método 6: Altura del árbol',
        desc: 'Infografía que ilustra el cálculo de profundidad máxima sumando 1 al máximo entre la altura izquierda y derecha.',
        kws: ['altura', 'profundidad', 'nivel', '03-m6', 'm6']
      },
      {
        m: 7,
        name: 'contarPorEstado',
        title: 'Actividad 03 · Método 7: Conteo por estado',
        desc: 'Conteo condicional en el árbol filtrando expedientes según su estado actual (EN_TRAMITE, APROBADO u OBSERVADO).',
        kws: ['estado', 'criterio', 'aprobado', 'tramite', '03-m7', 'm7']
      },
      {
        m: 8,
        name: 'menu',
        title: 'Actividad 03 · Método 8: Menú de expedientes',
        desc: 'Menú principal en terminal para operar el Árbol Binario de Búsqueda de expedientes académicos.',
        kws: ['menu arbol', '03-m8', 'm8']
      }
    ];

    let gIndex = 0;
    const processList = (
      list: Array<{ m: number; name: string; title: string; desc: string; kws: string[] }>,
      actNum: number,
      targetArray: InfographicMetadata[]
    ) => {
      for (const item of list) {
        const fn = `0${actNum}-M${item.m}.png`;
        targetArray.push({
          filename: fn,
          activityNum: actNum,
          methodNum: item.m,
          methodName: item.name,
          title: item.title,
          visualSummary: item.desc,
          galleryIndex: gIndex++,
          keywords: item.kws
        });
      }
    };

    processList(act1, 1, this.infographicCatalogA);
    processList(act2, 2, this.infographicCatalogA);
    processList(act3, 3, this.infographicCatalogA);

    gIndex = 0;
    processList(act1, 1, this.infographicCatalogB);
    processList(act2, 2, this.infographicCatalogB);
    processList(act3, 3, this.infographicCatalogB);
  }

  public async findRelevantInfographic(
    portfolioId: PortfolioId,
    query: string,
    detectedWeek: number | null,
    detectedExercise: number | null
  ): Promise<VisionImageMatch | null> {
    const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const isVisionIntent =
      /\b(infografia|captura|imagen|foto|visor|diagrama|pantalla|mostrar imagen|ver imagen|01-m|02-m|03-m)\b/.test(
        q
      );

    const catalog = portfolioId === 'portfolio_a' ? this.infographicCatalogA : this.infographicCatalogB;

    let matched: InfographicMetadata | undefined;

    // 1. Coincidencia por código de infografía explícito (ej: "01-M7", "03-M4")
    const codeMatch = q.match(/\b0?([1-3])-m([1-9])\b/);
    if (codeMatch && codeMatch[1] && codeMatch[2]) {
      const act = Number.parseInt(codeMatch[1], 10);
      const met = Number.parseInt(codeMatch[2], 10);
      matched = catalog.find((item) => item.activityNum === act && item.methodNum === met);
    }

    // 2. Coincidencia por palabras clave visuales
    if (!matched) {
      matched = catalog.find((item) => {
        if (detectedExercise !== null && item.activityNum !== detectedExercise) return false;
        return item.keywords.some((kw) => q.includes(kw));
      });
    }

    // 3. Si hay intención visual pero no especificó método, tomar la primera de la actividad
    if (!matched && isVisionIntent && detectedExercise !== null) {
      matched = catalog.find((item) => item.activityNum === detectedExercise);
    }

    // 4. Si el usuario pregunta explícitamente por imágenes en semana 8
    if (!matched && isVisionIntent && (detectedWeek === 8 || detectedWeek === null)) {
      matched = catalog[0];
    }

    if (!matched) {
      return null;
    }

    const subfolder = portfolioId === 'portfolio_a' ? 'claro' : 'oscuro';
    const localImgPath = path.resolve(this.baseWorkspacePath, 'Semana8', 'salida', subfolder, matched.filename);

    let base64: string | undefined;
    if (existsSync(localImgPath)) {
      try {
        const fileBuffer = await fs.readFile(localImgPath);
        base64 = fileBuffer.toString('base64');
      } catch (err) {
        console.warn('No se pudo codificar imagen a base64:', err);
      }
    }

    const releaseBase =
      portfolioId === 'portfolio_a'
        ? 'https://github.com/sacijim/portafolio/releases/download/semana08-algoritmos/'
        : 'https://github.com/Alexito-Hub/Alexito-Hub/releases/download/semana08-algoritmos/';

    return {
      filename: matched.filename,
      title: matched.title,
      visualExplanation: matched.visualSummary,
      base64,
      mimeType: 'image/png',
      galleryIndex: matched.galleryIndex,
      resourceUrl: `${releaseBase}${matched.filename}`
    };
  }
}
