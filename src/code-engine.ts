/**
 * ============================================================
 * MOTOR DE CÓDIGO FUENTE REAL (CODE-RAG / JAVA SOURCE INSPECTOR)
 * Archivo: src/code-engine.ts
 * ============================================================
 */

import { promises as fs } from 'node:fs';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CodeSnippetMatch, PortfolioId } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface JavaClassRecord {
  readonly portfolioId: PortfolioId;
  readonly weekNumber: number;
  readonly className: string;
  readonly fileName: string;
  readonly filePath: string;
  readonly role: 'DAO' | 'Modelo' | 'Vista';
  readonly languageVersion: 'Java 11' | 'Java 17';
  readonly summary: string;
}

export class CodeRepositoryEngine {
  private baseWorkspacePath: string;
  private readonly classCatalog: JavaClassRecord[] = [];
  private readonly fileCache = new Map<string, string>();

  constructor() {
    this.baseWorkspacePath = this.resolveWorkspaceRoot();
    this.registerCatalogEntries();
  }

  private resolveWorkspaceRoot(): string {
    const candidates = [
      path.resolve(process.cwd(), '..'),
      path.resolve(process.cwd()),
      path.resolve(__dirname, '..', '..', '..'),
      path.resolve(__dirname, '..', '..')
    ];

    for (const cand of candidates) {
      if (existsSync(path.join(cand, 'Semana8'))) {
        return cand;
      }
    }
    return candidates[0] ?? process.cwd();
  }

  private registerCatalogEntries(): void {
    // Portafolio A (sacijim - Java 11)
    const sacijimClasses: Omit<JavaClassRecord, 'portfolioId' | 'languageVersion'>[] = [
      {
        weekNumber: 8,
        className: 'AnalizadorCarpetas',
        fileName: 'AnalizadorCarpetas.java',
        filePath: 'Semana8/Version_sacijim/Proyecto01/DAO/AnalizadorCarpetas.java',
        role: 'DAO',
        summary: 'Motor recursivo común en Java 11 para escaneo de directorios con Predicate, conteo y suma de tamaños.'
      },
      {
        weekNumber: 8,
        className: 'ArchivoInfo',
        fileName: 'ArchivoInfo.java',
        filePath: 'Semana8/Version_sacijim/Proyecto01/Modelo/ArchivoInfo.java',
        role: 'Modelo',
        summary: 'Entidad de información de archivo con nombre, ruta, tamaño en bytes y extensión.'
      },
      {
        weekNumber: 8,
        className: 'Inventario',
        fileName: 'Inventario.java',
        filePath: 'Semana8/Version_sacijim/Proyecto02/DAO/Inventario.java',
        role: 'DAO',
        summary: 'Gestor de productos con búsqueda binaria recursiva y filtros valorDesde, unidadesDesde y sinExistencias.'
      },
      {
        weekNumber: 8,
        className: 'Producto',
        fileName: 'Producto.java',
        filePath: 'Semana8/Version_sacijim/Proyecto02/Modelo/Producto.java',
        role: 'Modelo',
        summary: 'Modelo de producto con código correlativo, nombre, precio y stock de existencias.'
      },
      {
        weekNumber: 8,
        className: 'ArbolExpedientes',
        fileName: 'ArbolExpedientes.java',
        filePath: 'Semana8/Version_sacijim/Proyecto03/DAO/ArbolExpedientes.java',
        role: 'DAO',
        summary: 'Árbol Binario de Búsqueda (ABB) con métodos recursivos insertarEn, buscarEn, inorden, alturaDe y contarEstado.'
      },
      {
        weekNumber: 8,
        className: 'Expediente',
        fileName: 'Expediente.java',
        filePath: 'Semana8/Version_sacijim/Proyecto03/Modelo/Expediente.java',
        role: 'Modelo',
        summary: 'Modelo de expediente académico con código, estudiante, trámite y estado del documento.'
      },
      {
        weekNumber: 8,
        className: 'Nodo',
        fileName: 'Nodo.java',
        filePath: 'Semana8/Version_sacijim/Proyecto03/Modelo/Nodo.java',
        role: 'Modelo',
        summary: 'Nodo autorreferenciado de árbol binario con punteros izquierdo y derecho.'
      }
    ];

    for (const entry of sacijimClasses) {
      this.classCatalog.push({
        ...entry,
        portfolioId: 'portfolio_a',
        languageVersion: 'Java 11'
      });
    }

    // Portafolio B (Alexito-Hub - Java 17)
    const alexitoClasses: Omit<JavaClassRecord, 'portfolioId' | 'languageVersion'>[] = [
      {
        weekNumber: 8,
        className: 'GestorArchivos',
        fileName: 'GestorArchivos.java',
        filePath: 'Semana8/Version_alexito/Proyecto01/DAO/GestorArchivos.java',
        role: 'DAO',
        summary: 'Gestor recursivo de sistema de archivos en Java 17 con recorrido de carpetas, conteo y árbol de directorios.'
      },
      {
        weekNumber: 8,
        className: 'ArchivoRegistro',
        fileName: 'ArchivoRegistro.java',
        filePath: 'Semana8/Version_alexito/Proyecto01/Modelo/ArchivoRegistro.java',
        role: 'Modelo',
        summary: 'Record inmutable de Java 17 para registros de archivo con nombre, tamaño formateado y extensión.'
      },
      {
        weekNumber: 8,
        className: 'GestorInventario',
        fileName: 'GestorInventario.java',
        filePath: 'Semana8/Version_alexito/Proyecto02/DAO/GestorInventario.java',
        role: 'DAO',
        summary: 'Búsqueda binaria recursiva sobre arreglo ordenado de productos y cálculos acumulativos de existencias.'
      },
      {
        weekNumber: 8,
        className: 'ProductoInventario',
        fileName: 'ProductoInventario.java',
        filePath: 'Semana8/Version_alexito/Proyecto02/Modelo/ProductoInventario.java',
        role: 'Modelo',
        summary: 'Record inmutable de Java 17 para productos de inventario comercial.'
      },
      {
        weekNumber: 8,
        className: 'ArbolAcademico',
        fileName: 'ArbolAcademico.java',
        filePath: 'Semana8/Version_alexito/Proyecto03/DAO/ArbolAcademico.java',
        role: 'DAO',
        summary: 'Árbol Binario de Búsqueda en Java 17 con registros Expediente, NodoExpediente, inserción, recorrido inorden y altura.'
      },
      {
        weekNumber: 8,
        className: 'Expediente',
        fileName: 'Expediente.java',
        filePath: 'Semana8/Version_alexito/Proyecto03/Modelo/Expediente.java',
        role: 'Modelo',
        summary: 'Record inmutable de Java 17 para expedientes universitarios con EstadoExpediente.'
      },
      {
        weekNumber: 8,
        className: 'NodoExpediente',
        fileName: 'NodoExpediente.java',
        filePath: 'Semana8/Version_alexito/Proyecto03/Modelo/NodoExpediente.java',
        role: 'Modelo',
        summary: 'Nodo para Árbol Binario de Búsqueda con enlaces izquierdo y derecho a otros nodos de expediente.'
      },
      {
        weekNumber: 7,
        className: 'GestorColaAlumnos',
        fileName: 'GestorColaAlumnos.java',
        filePath: 'Semana7/Version_alexito/Actividad01/DAO/GestorColaAlumnos.java',
        role: 'DAO',
        summary: 'Cola circular estática en Java 17 con aritmética modular posicion(k) = (inicio + k) % CAPACIDAD e inversión con Stack.'
      },
      {
        weekNumber: 7,
        className: 'GestorTurnos',
        fileName: 'GestorTurnos.java',
        filePath: 'Semana7/Version_alexito/Actividad02/DAO/GestorTurnos.java',
        role: 'DAO',
        summary: 'Cola enlazada dinámica para tickets de atención bancaria con códigos automáticos T-001.'
      },
      {
        weekNumber: 7,
        className: 'GestorPedidos',
        fileName: 'GestorPedidos.java',
        filePath: 'Semana7/Version_alexito/Actividad03/DAO/GestorPedidos.java',
        role: 'DAO',
        summary: 'Cola dinámica de órdenes gastronómicas con nodo centinela para simplificar cancelaciones y monto acumulado recursivo.'
      }
    ];

    for (const entry of alexitoClasses) {
      this.classCatalog.push({
        ...entry,
        portfolioId: 'portfolio_b',
        languageVersion: 'Java 17'
      });
    }
  }

  public async findRelevantCode(
    portfolioId: PortfolioId,
    query: string,
    detectedWeek: number | null
  ): Promise<CodeSnippetMatch | null> {
    const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const isCodeIntent =
      /\b(codigo|clase|implementacion|metodo|java|\.java|funcion|programacion|fuente|record|constructor|lineas)\b/.test(
        q
      );

    // 1. Prioridad: Coincidencia explícita por nombre de clase (ej: "ArbolAcademico", "GestorArchivos")
    let matchedRecord = this.classCatalog.find((item) => {
      if (item.portfolioId !== portfolioId) return false;
      const cName = item.className.toLowerCase();
      const cNameClean = cName.replace(/[^a-z0-9]/g, '');
      const qClean = q.replace(/[^a-z0-9]/g, '');
      return qClean.includes(cNameClean) || q.includes(cName);
    });

    // 2. Si no hubo coincidencia por clase pero hay intención clara de código en la semana detectada
    if (!matchedRecord && isCodeIntent && detectedWeek !== null) {
      matchedRecord = this.classCatalog.find((item) => {
        return item.portfolioId === portfolioId && item.weekNumber === detectedWeek && item.role === 'DAO';
      });
    }

    if (!matchedRecord) {
      return null;
    }

    const fullPath = path.resolve(this.baseWorkspacePath, matchedRecord.filePath);
    if (!existsSync(fullPath)) {
      return null;
    }

    let code = this.fileCache.get(fullPath);
    if (!code) {
      code = await fs.readFile(fullPath, 'utf8');
      this.fileCache.set(fullPath, code);
    }

    // Truncar si el archivo es excesivamente extenso (mantener hasta 180 líneas clave)
    const lines = code.split('\n');
    const truncatedCode =
      lines.length > 200 ? lines.slice(0, 180).join('\n') + '\n\n// ... [Código truncado para optimización de contexto]' : code;

    return {
      className: matchedRecord.className,
      filePath: matchedRecord.filePath,
      code: truncatedCode,
      summary: `${matchedRecord.className} (${matchedRecord.languageVersion}) · ${matchedRecord.summary}`
    };
  }
}
