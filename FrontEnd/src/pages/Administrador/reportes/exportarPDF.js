// src/utils/reportes/exportarPDF.js
// Genera UN archivo PDF con una sección por reporte (RF-014).
// Cada página lleva el encabezado de ASIS; la primera muestra los filtros
// aplicados y la fecha de generación.
// Requiere:  npm install jspdf jspdf-autotable
import { describirFiltros } from './calculos.js';

const AZUL = [2, 48, 95];      // mismo azul del panel (#02305F)
const TURQUESA = [69, 179, 191]; // #45B3BF

export async function exportarPDF({ reportes, filtros, ambientes, tiposEquipo, generadoPor }) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const ancho = doc.internal.pageSize.getWidth();
  const alto = doc.internal.pageSize.getHeight();
  const margen = 36;
  const ahora = new Date();
  const fechaGen = ahora.toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' });

  // Encabezado que se repite en cada página
  const dibujarEncabezado = () => {
    doc.setFillColor(...AZUL);
    doc.rect(0, 0, ancho, 44, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('ASIS', margen, 28);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Sistema de Gestión de Activos — Reportes', margen + 48, 28);
    doc.setTextColor(0, 0, 0);
  };

  // ---------- Portada ligera: filtros + fecha + índice ----------
  dibujarEncabezado();
  let y = 80;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Reporte del sistema', margen, y);
  y += 22;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Generado el ${fechaGen}${generadoPor ? ` por ${generadoPor}` : ''}`, margen, y);
  y += 24;

  doc.setFont('helvetica', 'bold');
  doc.text('Filtros aplicados', margen, y);
  y += 6;
  autoTable(doc, {
    startY: y,
    head: [['Filtro', 'Valor']],
    body: describirFiltros(filtros, ambientes, tiposEquipo),
    theme: 'grid',
    headStyles: { fillColor: AZUL },
    styles: { fontSize: 9 },
    margin: { left: margen, right: margen },
    tableWidth: 320,
  });
  y = doc.lastAutoTable.finalY + 22;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Contenido', margen, y);
  doc.setFont('helvetica', 'normal');
  reportes.forEach((r, i) => {
    y += 14;
    doc.text(`${i + 1}. ${r.titulo}`, margen + 8, y);
  });

  // ---------- Una sección por reporte ----------
  reportes.forEach((rep) => {
    doc.addPage();
    dibujarEncabezado();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...AZUL);
    doc.text(rep.titulo, margen, 72);
    doc.setTextColor(90, 90, 90);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(rep.descripcion, margen, 86);
    doc.setTextColor(0, 0, 0);

    const muchasColumnas = rep.columnas.length > 8;
    autoTable(doc, {
      startY: 98,
      head: [rep.columnas],
      body: rep.filas.length ? rep.filas.map((f) => f.map((c) => String(c ?? ''))) : [['Sin datos para los filtros elegidos']],
      theme: 'striped',
      headStyles: { fillColor: AZUL, textColor: 255 },
      alternateRowStyles: { fillColor: [235, 245, 247] },
      styles: { fontSize: muchasColumnas ? 7 : 9, cellPadding: muchasColumnas ? 3 : 5, overflow: 'linebreak' },
      margin: { top: 60, left: margen, right: margen, bottom: 36 },
    });

    if (rep.nota) {
      let yNota = doc.lastAutoTable.finalY + 14;
      if (yNota > alto - 50) { doc.addPage(); yNota = 80; }
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(90, 90, 90);
      doc.text(`Nota: ${rep.nota}`, margen, yNota, { maxWidth: ancho - margen * 2 });
      doc.setTextColor(0, 0, 0);
    }
  });

  // ---------- Encabezado en páginas de continuación + numeración ----------
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p += 1) {
    doc.setPage(p);
    // Las tablas largas dejan 60 pt libres arriba (margin.top), así que la franja de ASIS
    // se puede pintar en todas las páginas sin tapar contenido.
    dibujarEncabezado();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`Página ${p} de ${total}`, ancho - margen, alto - 18, { align: 'right' });
    doc.text(`ASIS · ${fechaGen}`, margen, alto - 18);
  }
  doc.setTextColor(0, 0, 0);

  doc.save(`ASIS_reportes_${ahora.toISOString().slice(0, 10)}.pdf`);
}
