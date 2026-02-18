import React, { useState, useMemo } from 'react';
import { X, Search, FileDown } from 'lucide-react';
import { downloadTeacherSchedule } from '../utils/exporters';

// ... (dias y bloquesHorarios se pueden importar o redefinir) ...
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

const TeacherMonitor = ({ docentes = [], tabs = [], onClose }) => {
    const [selectedDocenteId, setSelectedDocenteId] = useState('');
    const [filtro, setFiltro] = useState('');

    const filteredDocentes = useMemo(() => {
        return docentes.filter(d => d.nombre.toLowerCase().includes(filtro.toLowerCase())).slice(0, 50);
    }, [docentes, filtro]);

    const selectedDocente = docentes.find(d => d.id.toString() === selectedDocenteId);

    return (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-6 backdrop-blur-sm">
            <div className="bg-white w-full max-w-6xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="font-bold text-xl text-blue-900 flex items-center gap-2">Monitor de Profesores</h2>
                    <button onClick={onClose} className="p-2 hover:bg-red-100 hover:text-red-600 rounded-full"><X/></button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* LISTA LATERAL */}
                    <div className="w-80 border-r bg-gray-50 flex flex-col p-4">
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={16}/>
                            <input 
                                className="w-full pl-10 p-2 border rounded shadow-sm" 
                                placeholder="Buscar profesor..." 
                                value={filtro}
                                onChange={e=>setFiltro(e.target.value)}
                            />
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-1">
                            {filteredDocentes.map(d => (
                                <div 
                                    key={d.id} 
                                    onClick={() => setSelectedDocenteId(d.id.toString())}
                                    className={`p-3 rounded cursor-pointer text-sm font-medium ${selectedDocenteId === d.id.toString() ? 'bg-blue-600 text-white shadow' : 'bg-white hover:bg-blue-50 text-gray-700'}`}
                                >
                                    {d.nombre}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* VISTA HORARIO */}
                    <div className="flex-1 p-6 overflow-auto bg-gray-100">
                        {selectedDocente ? (
                            <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-800">{selectedDocente.nombre}</h3>
                                        <span className="text-sm text-gray-500">{selectedDocente.clasificacion}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => downloadTeacherSchedule(selectedDocente, tabs, 'excel')} className="px-3 py-1.5 bg-green-100 text-green-700 rounded text-xs font-bold border border-green-200 hover:bg-green-200 flex items-center gap-2"><FileDown size={14}/> Excel</button>
                                        <button onClick={() => downloadTeacherSchedule(selectedDocente, tabs, 'pdf')} className="px-3 py-1.5 bg-red-100 text-red-700 rounded text-xs font-bold border border-red-200 hover:bg-red-200 flex items-center gap-2"><FileDown size={14}/> PDF</button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-7 border-b border-gray-300">
                                    <div className="p-2 font-bold text-center bg-gray-50 text-[10px] uppercase text-gray-400">Hora</div>
                                    {dias.map(d => <div key={d} className="p-2 font-bold text-center bg-blue-50 text-blue-900 text-xs uppercase border-l border-gray-200">{d}</div>)}
                                </div>

                                {bloquesHorarios.map(b => (
                                    <div key={b.id} className="grid grid-cols-7 border-b border-gray-100 min-h-[60px]">
                                        <div className="p-2 text-[10px] font-bold text-gray-400 bg-gray-50 text-center flex flex-col justify-center">{b.inicio}<br/>{b.fin}</div>
                                        {dias.map(d => {
                                            const cellId = `${d}-${b.id}`;
                                            const grupos = [];
                                            
                                            // Buscar en todos los tabs
                                            tabs.forEach(t => {
                                                const asignacion = t.horario?.[cellId];
                                                if (asignacion?.docente?.id.toString() === selectedDocente.id.toString()) {
                                                    grupos.push({
                                                        grupo: t.nombre,
                                                        materia: asignacion.materia.nombre,
                                                        codigo: asignacion.materia.codigo,
                                                        salon: asignacion.salon
                                                    });
                                                }
                                            });

                                            // 🟢 RENDERIZADO DE FUSIÓN VISUAL
                                            if (grupos.length === 0) return <div key={d} className="border-l border-gray-100"></div>;

                                            // Si hay más de 1 grupo, es fusión (o conflicto)
                                            const esFusion = grupos.length > 1;
                                            const materia = grupos[0].materia;
                                            const listaGrupos = grupos.map(g => g.grupo).join(" + ");
                                            const listaSalones = [...new Set(grupos.map(g => g.salon).filter(Boolean))].join("/");

                                            return (
                                                <div key={d} className={`border-l border-gray-100 p-1 text-[10px] flex flex-col justify-center items-center text-center ${esFusion ? 'bg-purple-100' : 'bg-blue-50'}`}>
                                                    <span className="font-bold text-blue-900 leading-tight mb-1">{materia}</span>
                                                    {esFusion && <span className="bg-purple-600 text-white px-1.5 rounded-[4px] text-[8px] font-bold mb-1">FUSIÓN</span>}
                                                    <span className="font-mono text-gray-600 font-bold">{listaGrupos}</span>
                                                    {listaSalones && <span className="text-gray-400 mt-0.5">Aula: {listaSalones}</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400">Selecciona un profesor para ver su horario</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherMonitor;
