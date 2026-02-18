import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from 'xlsx';

const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const bloquesHorarios = [
    { id: "1", inicio: "7:00 AM", fin: "7:45 AM" }, { id: "2", inicio: "7:50 AM", fin: "8:35 AM" },
    { id: "3", inicio: "8:40 AM", fin: "9:25 AM" }, { id: "4", inicio: "9:30 AM", fin: "10:15 AM" },
    { id: "5", inicio: "10:20 AM", fin: "11:05 AM" }, { id: "6", inicio: "11:10 AM", fin: "11:55 AM" },
    { id: "7", inicio: "12:00 PM", fin: "12:45 PM" }, { id: "8", inicio: "12:50 PM", fin: "1:35 PM" },
    { id: "9", inicio: "1:40 PM", fin: "2:25 PM" }, { id: "10", inicio: "2:30 PM", fin: "3:15 PM" },
    { id: "11", inicio: "3:20 PM", fin: "4:05 PM" }, { id: "12", inicio: "4:10 PM", fin: "4:55 PM" },
    { id: "13", inicio: "5:00 PM", fin: "5:45 PM" }, { id: "14", inicio: "5:50 PM", fin: "6:35 PM" },
    { id: "15", inicio: "6:40 PM", fin: "7:25 PM" }, { id: "16", inicio: "7:30 PM", fin: "8:15 PM" },
    { id: "17", inicio: "8:20 PM", fin: "9:05 PM" }, { id: "18", inicio: "9:10 PM", fin: "9:55 PM" },
    { id: "19", inicio: "10:00 PM", fin: "10:45 PM" },
];

const safeStr = (val) => {
    if (val === null || val === undefined) return '';
    return String(val);
};

export const downloadGroupSchedule = (tab, format = 'pdf') => {
    if (!tab) return;
    const nombreGrupo = safeStr(tab.nombre || 'Sin Nombre');
    const title = `Horario Grupo ${nombreGrupo}`;
    const headers = [['Hora', ...dias]];
    
    const rows = bloquesHorarios.map(b => {
        const row = [`${b.inicio} - ${b.fin}`];
        dias.forEach(d => {
            const cellId = `${d}-${b.id}`;
            const asignacion = tab.horario ? tab.horario[cellId] : null;
            
            if (asignacion && asignacion.materia) {
                const matNom = safeStr(asignacion.materia.nombre || 'Materia');
                const docNom = safeStr(asignacion.docente?.nombre || 'S/D');
                const salon = safeStr(asignacion.salon || 'S/A');
                row.push(`${matNom}\n(${docNom})\nSalón: ${salon}`);
            } else {
                row.push('');
            }
        });
        return row;
    });

    if (format === 'pdf') {
        const doc = new jsPDF('l', 'mm', 'a4');
        doc.setFontSize(16);
        doc.text(title, 14, 15);
        doc.autoTable({
            head: headers,
            body: rows,
            startY: 20,
            theme: 'grid',
            styles: { fontSize: 7, cellPadding: 1, overflow: 'linebreak' },
            headStyles: { fillColor: [242, 189, 29], textColor: [255, 255, 255] },
            columnStyles: { 0: { cellWidth: 22, fontStyle: 'bold' } }
        });
        doc.save(`${nombreGrupo.replace(/\s+/g, '_')}.pdf`);
    } else {
        const ws = XLSX.utils.aoa_to_sheet([ [title], ...headers, ...rows ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Horario");
        XLSX.writeFile(wb, `${nombreGrupo.replace(/\s+/g, '_')}.xlsx`);
    }
};

export const downloadTeacherSchedule = (docente, tabs, format = 'pdf') => {
    if (!docente) return;
    const safeTabs = Array.isArray(tabs) ? tabs : [];
    const nombreDocente = safeStr(docente.nombre || 'Docente');
    const title = `Horario Docente: ${nombreDocente}`;
    const headers = [['Hora', ...dias]];

    const rows = bloquesHorarios.map(b => {
        const row = [`${b.inicio} - ${b.fin}`];
        dias.forEach(d => {
            const cellId = `${d}-${b.id}`;
            const coincidencias = [];

            // Buscar en todos los grupos
            safeTabs.forEach(tab => {
                const asignacion = tab?.horario?.[cellId];
                if (asignacion?.docente?.id === docente.id) {
                    coincidencias.push({
                        grupo: safeStr(tab.nombre),
                        materia: safeStr(asignacion.materia?.nombre || 'Clase'),
                        salon: safeStr(asignacion.salon || 'S/A')
                    });
                }
            });

            // 🟢 LÓGICA DE FUSIÓN EN REPORTE
            if (coincidencias.length === 0) {
                row.push("");
            } else if (coincidencias.length === 1) {
                // Normal
                const c = coincidencias[0];
                row.push(`${c.materia}\nGrupo: ${c.grupo}\nSalón: ${c.salon}`);
            } else {
                // Fusión detectada
                const gruposStr = coincidencias.map(c => c.grupo).join(" + ");
                const materia = coincidencias[0].materia; // Asumimos misma materia si es fusión válida
                const salones = [...new Set(coincidencias.map(c => c.salon))].join("/");
                row.push(`[FUSIÓN] ${gruposStr}\n${materia}\nSalón: ${salones}`);
            }
        });
        return row;
    });

    if (format === 'pdf') {
        const doc = new jsPDF('l', 'mm', 'a4');
        doc.setFontSize(16);
        doc.text(title, 14, 15);
        doc.autoTable({
            head: headers,
            body: rows,
            startY: 25,
            theme: 'grid',
            styles: { fontSize: 7, cellPadding: 1 },
            headStyles: { fillColor: [44, 62, 80] },
            // Resaltar fusiones en el PDF
            didParseCell: function(data) {
                if (data.section === 'body' && data.cell.raw.toString().includes("[FUSIÓN]")) {
                    data.cell.styles.fillColor = [240, 240, 255]; // Fondo morado muy claro
                    data.cell.styles.textColor = [100, 0, 150];
                }
            }
        });
        doc.save(`Horario_${nombreDocente.replace(/\s+/g, '_')}.pdf`);
    } else {
        const ws = XLSX.utils.aoa_to_sheet([ [title], ...headers, ...rows ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Horario");
        XLSX.writeFile(wb, `Horario_${nombreDocente.replace(/\s+/g, '_')}.xlsx`);
    }
};

// 🟢 ESTA ES LA FUNCIÓN NUEVA
export const downloadFIIReport = (tabs, planEstudios) => {
    if (!tabs || tabs.length === 0) return alert("No hay horarios creados.");

    const rows = [];
    
    tabs.forEach(tab => {
        Object.entries(tab.horario || {}).forEach(([cellId, asignacion]) => {
            if (!asignacion.materia) return;

            // Verificamos en el plan de estudios original si es FII
            const materiaMaestra = (planEstudios || []).find(m => m.codigo === asignacion.materia.codigo);
            // Si es undefined, asumimos true (facultad) por defecto. Si es false explícito, es externa.
            const esFII = materiaMaestra ? (materiaMaestra.esFII !== false) : (asignacion.materia.esFII !== false);

            if (esFII) {
                const [dia, bloqueId] = cellId.split('-');
                const bloque = bloquesHorarios.find(b => b.id === bloqueId);
                const horarioStr = bloque ? `${bloque.inicio} - ${bloque.fin}` : "??";
                const tieneDocente = asignacion.docente && asignacion.docente.id;
                
                rows.push({
                    grupo: tab.nombre,
                    materia: asignacion.materia.nombre,
                    codigo: asignacion.materia.codigo,
                    dia: dia,
                    hora: horarioStr,
                    docente: tieneDocente ? asignacion.docente.nombre : "⚠️ SIN ASIGNAR",
                    salon: asignacion.salon || "S/A",
                    diaOrder: dias.indexOf(dia)
                });
            }
        });
    });

    rows.sort((a, b) => 
        a.grupo.localeCompare(b.grupo) || 
        (a.diaOrder - b.diaOrder) || 
        a.hora.localeCompare(b.hora)
    );

    const headers = [["Grupo", "Código", "Materia", "Día", "Hora", "Docente", "Salón"]];
    const data = rows.map(r => [r.grupo, r.codigo, r.materia, r.dia, r.hora, r.docente, r.salon]);

    if (rows.length === 0) return alert("No se encontraron materias marcadas como 'Facultad de Industrial' asignadas en los horarios.");

    const doc = new jsPDF('p', 'mm', 'a4');
    doc.setFontSize(16);
    doc.text("Reporte de Materias Facultad (FII)", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleDateString()} | Total: ${rows.length}`, 14, 22);

    doc.autoTable({
        head: headers,
        body: data,
        startY: 25,
        theme: 'striped',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
        didParseCell: function(data) {
            if (data.section === 'body' && data.row.raw[5].includes("SIN ASIGNAR")) {
                data.cell.styles.textColor = [200, 0, 0];
                data.cell.styles.fontStyle = 'bold';
            }
        }
    });

    doc.save("Reporte_FII_General.pdf");
};
