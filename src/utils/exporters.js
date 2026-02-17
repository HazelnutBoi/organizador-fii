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
];

// --- FUNCIÓN 1: DESCARGAR HORARIO DE GRUPO ---
export const downloadGroupSchedule = (tab, format = 'pdf') => {
    if (!tab) return;
    const title = `Horario Grupo ${tab.nombre}`;
    const headers = [['Hora', ...dias]];
    
    const rows = bloquesHorarios.map(b => {
        const row = [`${b.inicio} - ${b.fin}`];
        dias.forEach(d => {
            const cellId = `${d}-${b.id}`;
            const asignacion = tab.horario?.[cellId];
            row.push(asignacion ? `${asignacion.materia.nombre}\n(${asignacion.docente?.nombre || 'Sin Docente'})\nSalón: ${asignacion.salon || 'S/A'}` : '');
        });
        return row;
    });

    if (format === 'pdf') {
        const doc = new jsPDF('l', 'mm', 'a4');
        doc.text(title, 14, 15);
        doc.autoTable({ head: headers, body: rows, startY: 20, theme: 'grid', styles: { fontSize: 7, cellPadding: 2 } });
        doc.save(`${title}.pdf`);
    } else {
        const ws = XLSX.utils.aoa_to_sheet([ [title], ...headers, ...rows ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Horario");
        XLSX.writeFile(wb, `${title}.xlsx`);
    }
};

// --- FUNCIÓN 2: DESCARGAR HORARIO POR PROFESOR (LA QUE FALTABA) ---
export const downloadTeacherSchedule = (docente, tabs, format = 'pdf') => {
    if (!docente) return;
    const title = `Horario Docente: ${docente.nombre}`;
    const headers = [['Hora', ...dias]];

    // Extraemos la ocupación del profesor de todos los grupos existentes
    const rows = bloquesHorarios.map(b => {
        const row = [`${b.inicio} - ${b.fin}`];
        dias.forEach(d => {
            const cellId = `${d}-${b.id}`;
            let info = "";
            tabs.forEach(tab => {
                const asignacion = tab.horario?.[cellId];
                if (asignacion?.docente?.id === docente.id) {
                    info = `${asignacion.materia.nombre}\nGrupo: ${tab.nombre}\nSalón: ${asignacion.salon || 'S/A'}`;
                }
            });
            row.push(info);
        });
        return row;
    });

    if (format === 'pdf') {
        const doc = new jsPDF('l', 'mm', 'a4');
        doc.setFontSize(16);
        doc.text(title, 14, 15);
        doc.setFontSize(10);
        doc.text(`Carga Horaria: ${docente.clasificacion || 'N/A'}`, 14, 22);
        
        doc.autoTable({ 
            head: headers, 
            body: rows, 
            startY: 28, 
            theme: 'grid', 
            styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak' },
            columnStyles: { 0: { cellWidth: 25 } }
        });
        doc.save(`Horario_${docente.nombre.replace(/\s+/g, '_')}.pdf`);
    } else {
        const ws = XLSX.utils.aoa_to_sheet([ [title], [`Carga: ${docente.clasificacion}`], ...headers, ...rows ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Horario Docente");
        XLSX.writeFile(wb, `Horario_${docente.nombre.replace(/\s+/g, '_')}.xlsx`);
    }
};