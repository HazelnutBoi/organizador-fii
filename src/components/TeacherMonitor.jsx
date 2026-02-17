import React, { useState, useMemo } from 'react';
import { Search, User, X } from 'lucide-react';

const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const bloquesHorarios = [
    { id: "1", inicio: "7:00", fin: "7:45" }, { id: "2", inicio: "7:50", fin: "8:35" },
    { id: "3", inicio: "8:40", fin: "9:25" }, { id: "4", inicio: "9:30", fin: "10:15" },
    { id: "5", inicio: "10:20", fin: "11:05" }, { id: "6", inicio: "11:10", fin: "11:55" },
    { id: "7", inicio: "12:00", fin: "12:45" }, { id: "8", inicio: "12:50", fin: "1:35" },
    { id: "9", inicio: "1:40", fin: "2:25" }, { id: "10", inicio: "2:30", fin: "3:15" },
    { id: "11", inicio: "3:20", fin: "4:05" }, { id: "12", inicio: "4:10", fin: "4:55" },
    { id: "13", inicio: "5:00", fin: "5:45" }, { id: "14", inicio: "5:50", fin: "6:35" },
    { id: "15", inicio: "6:40", fin: "7:25" }, { id: "16", inicio: "7:30", fin: "8:15" },
    { id: "17", inicio: "8:20", fin: "9:05" }, { id: "18", inicio: "9:10", fin: "9:55" },
];

const TeacherMonitor = ({ docentes, tabs, onClose }) => {
    const [selectedDocenteId, setSelectedDocenteId] = useState(null);
    const [search, setSearch] = useState("");

    const docentesList = useMemo(() => {
        return (docentes || []).filter(d => d.nombre.toLowerCase().includes(search.toLowerCase()));
    }, [docentes, search]);

    const selectedDocente = useMemo(() => 
        docentes.find(d => d.id === selectedDocenteId), 
    [docentes, selectedDocenteId]);

    const ocupacion = useMemo(() => {
        if (!selectedDocenteId) return {};
        const map = {};

        tabs.forEach(tab => {
            if (!tab.horario) return;
            Object.entries(tab.horario).forEach(([cellId, asignacion]) => {
                if (asignacion?.docente?.id === selectedDocenteId) {
                    map[cellId] = {
                        materia: asignacion.materia?.nombre,
                        grupo: tab.nombre,
                        salon: asignacion.salon || 'S/A',
                        carrera: tab.config?.carrera || (tab.tipo === 'service' ? 'Servicio' : 'Ingeniería')
                    };
                }
            });
        });
        return map;
    }, [tabs, selectedDocenteId]);

    const totalHoras = Object.keys(ocupacion).length;
    const tope = selectedDocente?.horasTope || 0;
    const isOver = tope > 0 && totalHoras > tope;

    return (
        <div className="fixed inset-0 bg-gray-100 z-[300] flex flex-col animate-in fade-in duration-200">
            {/* HEADER MONITOR */}
            <div className="bg-slate-800 text-white p-4 shadow-lg flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="bg-orange-500 p-2 rounded-lg"><User size={24}/></div>
                    <div>
                        <h1 className="text-xl font-bold">Monitor de Docentes</h1>
                        <p className="text-xs text-slate-300 flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> 
                            Sincronización en Tiempo Real Activa
                        </p>
                    </div>
                </div>
                <button onClick={onClose} className="bg-white/10 hover:bg-red-500 hover:text-white p-2 rounded-full transition-all">
                    <X size={20}/>
                </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* LISTA DOCENTES */}
                <div className="w-80 bg-white border-r flex flex-col shadow-md z-10">
                    <div className="p-4 border-b bg-slate-50">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={16}/>
                            <input 
                                className="w-full pl-9 p-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                placeholder="Buscar profesor..." 
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {docentesList.map(d => (
                            <div 
                                key={d.id} 
                                onClick={() => setSelectedDocenteId(d.id)}
                                className={`p-3 border-b cursor-pointer hover:bg-orange-50 transition-colors flex justify-between items-center ${selectedDocenteId === d.id ? 'bg-orange-100 border-l-4 border-l-orange-500' : ''}`}
                            >
                                <span className="text-sm font-medium text-slate-700">{d.nombre}</span>
                                {selectedDocenteId === d.id && <div className="w-2 h-2 bg-orange-500 rounded-full"/>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* HORARIO DOCENTE */}
                <div className="flex-1 flex flex-col bg-slate-100 overflow-hidden">
                    {selectedDocente ? (
                        <>
                            <div className="bg-white p-4 border-b flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">{selectedDocente.nombre}</h2>
                                    <span className="text-sm text-slate-500">{selectedDocente.clasificacion || "Sin clasificación"}</span>
                                </div>
                                <div className="flex gap-4 text-sm font-bold">
                                    <div className={`px-4 py-2 rounded-lg border ${isOver ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-600 border-green-200'}`}>
                                        Carga Actual: {totalHoras} hrs
                                    </div>
                                    {tope > 0 && (
                                        <div className="px-4 py-2 rounded-lg bg-slate-50 text-slate-600 border border-slate-200">
                                            Límite: {tope} hrs
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 overflow-auto p-6">
                                <div className="bg-white rounded-xl shadow border border-slate-300 min-w-[800px]">
                                    <div className="grid grid-cols-7 border-b border-slate-300 bg-slate-50 sticky top-0 z-10">
                                        <div className="p-3 font-bold text-center text-xs text-slate-500 border-r">HORA</div>
                                        {dias.map(d => <div key={d} className="p-3 font-bold text-center text-sm text-slate-700 uppercase border-r last:border-r-0">{d}</div>)}
                                    </div>
                                    {bloquesHorarios.map((b, i) => (
                                        <div key={b.id} className="grid grid-cols-7 border-b border-slate-200 min-h-[80px]">
                                            <div className="p-2 text-xs font-bold text-slate-500 flex flex-col justify-center items-center border-r bg-slate-50">
                                                <span>{b.inicio}</span>
                                                <span className="text-slate-300">|</span>
                                                <span>{b.fin}</span>
                                            </div>
                                            {dias.map(d => {
                                                const id = `${d}-${b.id}`;
                                                const data = ocupacion[id];
                                                
                                                return (
                                                    <div key={id} className={`border-r last:border-r-0 p-1 relative transition-all ${data ? 'bg-blue-50' : 'bg-white hover:bg-slate-50'}`}>
                                                        {data ? (
                                                            <div className="h-full w-full rounded border border-blue-200 bg-white p-2 shadow-sm text-xs flex flex-col justify-between group">
                                                                <div>
                                                                    <div className="font-bold text-blue-800 line-clamp-2">{data.materia}</div>
                                                                    <div className="text-slate-500 font-mono mt-1">{data.grupo}</div>
                                                                </div>
                                                                <div className="flex justify-between items-end mt-2 text-[10px] text-slate-400 font-bold uppercase">
                                                                    <span className="truncate max-w-[80px]">{data.carrera}</span>
                                                                    <span className="bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">{data.salon}</span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="h-full w-full flex items-center justify-center opacity-0 hover:opacity-100">
                                                                <span className="text-xs text-green-500 font-bold bg-green-50 px-2 py-1 rounded-full border border-green-100">LIBRE</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                            <User size={80} className="mb-4 opacity-20"/>
                            <p className="text-lg">Selecciona un profesor para auditar su horario</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeacherMonitor;