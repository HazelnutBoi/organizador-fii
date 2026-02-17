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
    { id: "19", inicio: "10:00 PM", fin: "10:45 PM" }, // <--- NUEVO BLOQUE AGREGADO TAMBIÉN AQUÍ
];

// Función auxiliar para asegurar que TODO sea texto y evitar errores de null
const safeStr = (val) => {
    if (val === null || val === undefined) return '';
    return String(val);
};

export const downloadGroupSchedule = (tab, format = 'pdf') => {
    if (!tab) return;
    const nombreGrupo = safeStr(tab.nombre || 'Sin Nombre');
    const title = `Horario Grupo ${nombreGrupo}`;
    const headers = [['Hora', ...dias]];
    
    // Preparamos los datos convirtiendo todo a String explícitamente
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
        try {
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
        } catch (error) {
            console.error("Error PDF:", error);
            // Ahora la alerta te dirá QUÉ falló
            alert(`Error al crear PDF: ${error.message}`);
        }
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
            let info = "";
            safeTabs.forEach(tab => {
                const asignacion = tab?.horario?.[cellId];
                if (asignacion?.docente?.id === docente.id) {
                    const mat = safeStr(asignacion.materia?.nombre || 'Clase');
                    const gp = safeStr(tab.nombre);
                    const sal = safeStr(asignacion.salon || 'S/A');
                    info = `${mat}\nGrupo: ${gp}\nSalón: ${sal}`;
                }
            });
            row.push(info);
        });
        return row;
    });

    if (format === 'pdf') {
        try {
            const doc = new jsPDF('l', 'mm', 'a4');
            doc.setFontSize(16);
            doc.text(title, 14, 15);
            doc.autoTable({
                head: headers,
                body: rows,
                startY: 25,
                theme: 'grid',
                styles: { fontSize: 7, cellPadding: 1 },
                headStyles: { fillColor: [44, 62, 80] }
            });
            doc.save(`Horario_${nombreDocente.replace(/\s+/g, '_')}.pdf`);
        } catch (e) {
            console.error(e);
            alert(`Error al crear PDF Docente: ${e.message}`);
        }
    } else {
        const ws = XLSX.utils.aoa_to_sheet([ [title], ...headers, ...rows ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Horario");
        XLSX.writeFile(wb, `Horario_${nombreDocente.replace(/\s+/g, '_')}.xlsx`);
    }
};
