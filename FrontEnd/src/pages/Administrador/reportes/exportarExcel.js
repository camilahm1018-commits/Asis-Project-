// src/utils/reportes/exportarExcel.js
// Genera UN archivo .xlsx con una hoja por reporte (RF-014).
// Requiere:  npm install xlsx
import { describirFiltros } from './calculos.js';

// Excel limita el nombre de hoja a 31 caracteres y prohíbe : \ / ? * [ ]
function nombreHoja(titulo, usadas) {
  let base = titulo.replace(/[:\\/?*[\]]/g, '').slice(0, 31);
  let nombre = base;
  let n = 2;
  while (usadas.has(nombre.toLowerCase())) {
    const sufijo = ` ${n++}`;
    nombre = base.slice(0, 31 - sufijo.length) + sufijo;
  }
  usadas.add(nombre.toLowerCase());
  return nombre;
}

export async function exportarExcel({ reportes, filtros, ambientes, tiposEquipo, generadoPor }) {
  const XLSX = await import('xlsx'); // carga diferida: no pesa en el resto de la app
  const libro = XLSX.utils.book_new();
  const usadas = new Set();

  const ahora = new Date();
  const fechaGen = ahora.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
  const filtrosTxt = describirFiltros(filtros, ambientes, tiposEquipo)
    .map(([k, v]) => `${k}: ${v}`)
    .join('  |  ');

  reportes.forEach((rep) => {
    const encabezado = [
      ['ASIS — Sistema de Gestión de Activos'],
      [rep.titulo],
      [`Filtros aplicados → ${filtrosTxt}`],
      [`Generado: ${fechaGen}${generadoPor ? ` por ${generadoPor}` : ''}`],
      [],
    ];
    const cuerpo = [rep.columnas, ...(rep.filas.length ? rep.filas : [['Sin datos para los filtros elegidos']])];
    const pie = rep.nota ? [[], [`Nota: ${rep.nota}`]] : [];
    const hoja = XLSX.utils.aoa_to_sheet([...encabezado, ...cuerpo, ...pie]);

    // Ancho de columnas según el contenido de la tabla
    hoja['!cols'] = rep.columnas.map((col, i) => {
      const largoMax = Math.max(
        String(col).length,
        ...rep.filas.map((f) => String(f[i] ?? '').length),
      );
      return { wch: Math.min(Math.max(largoMax + 2, 10), 50) };
    });
    // Filtros desplegables en la fila de encabezados de la tabla
    hoja['!autofilter'] = {
      ref: XLSX.utils.encode_range({
        s: { r: encabezado.length, c: 0 },
        e: { r: encabezado.length + rep.filas.length, c: Math.max(rep.columnas.length - 1, 0) },
      }),
    };

    XLSX.utils.book_append_sheet(libro, hoja, nombreHoja(rep.titulo, usadas));
  });

  const sello = ahora.toISOString().slice(0, 10);
  XLSX.writeFile(libro, `ASIS_reportes_${sello}.xlsx`);
}
