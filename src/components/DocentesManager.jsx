import React, { useState, useMemo } from 'react';
import { X, Save, Plus, Search, Trash2, Check, User, Clock, AlertTriangle, FileSpreadsheet, FileText } from 'lucide-react';
// IMPORTAMOS LOS EXPORTADORES
import { downloadTeacherSchedule } from '../utils/exporters';

// AÑADIMOS LA PROP 'tabs' PARA PODER BUSCAR EN TODOS LOS GRUPOS
const DocentesManager = ({ 
  isOpen, 
  onClose, 
  docentes = [], 
  setDocentes, 
  materias = [], 
  statsDocentes = {},
  tabs = [] // <--- NUEVA PROP NECESARIA
}) => {
  // ... (Todo el código de estados y filtros se mantiene igual) ...
  const [filtro, setFiltro] = useState('');
  const [editingDocente, setEditingDocente] = useState(null);
  const [materiaSearch, setMateriaSearch] = useState('');

  const docentesFiltrados = useMemo(() => {
    const term = (filtro || "").toLowerCase();
    return (docentes || []).filter(d => 
        (d?.nombre || "").toLowerCase().includes(term)
    ).slice(0, 50);
  }, [docentes, filtro]);

  const materiasParaAsignar = useMemo(() => {
      const term = (materiaSearch || "").toLowerCase();
      return (materias || []).filter(m => 
        (m?.nombre || "").toLowerCase().includes(term) || 
        (m?.codigo || "").toString().toLowerCase().includes(term)
      ).slice(0, 50);
  }, [materias, materiaSearch]);

  if (!isOpen) return null;

  // ... (Funciones handleSave, handleDelete, toggleMateria se mantienen igual) ...
  const handleSave = () => {
    // ... tu lógica de guardado ...
    if (!editingDocente?.nombre) return alert("El nombre es obligatorio");
      
      setDocentes(prev => {
          const safePrev = prev || [];
          const existe = safePrev.some(d => d.id === editingDocente.id);
          if (existe) {
              return safePrev.map(d => d.id === editingDocente.id ? editingDocente : d);
          }
          return [...safePrev, { ...editingDocente, id: editingDocente.id || Date.now() }]; 
      });
      setEditingDocente(null);
  };
  
  const handleDelete = () => {
      if(window.confirm("¿Estás seguro de eliminar este docente?")) {
          setDocentes(prev => prev.filter(d => d.id !== editingDocente.id));
          setEditingDocente(null);
      }
  };

  const toggleMateria = (materia) => {
      setEditingDocente(prev => {
          const current = prev?.materias || [];
          const exists = current.some(m => m.codigo === materia.codigo);
          const newMaterias = exists 
            ? current.filter(m => m.codigo !== materia.codigo)
            : [...current, materia];
          return { ...prev, materias: newMaterias };
      });
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-5xl h-[85vh] rounded-xl shadow-2xl flex overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* LADO IZQUIERDO: LISTA (Sin cambios visuales mayores) */}
        <div className="w-1/3 border-r bg-gray-50 flex flex-col">
           {/* ... (Header y Buscador igual que antes) ... */}
           <div className="p-4 border-b bg-white">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="font-bold text-lg flex items-center gap-2 text-blue-900"><User size={20}/> Docentes</h2>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{docentes.length}</span>
                </div>
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 text-gray-400" size={16}/>
                    <input className="w-full pl-8 p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Buscar docente..." value={filtro} onChange={e=>setFiltro(e.target.value)}/>
                </div>
                <button 
                    onClick={() => setEditingDocente({ id: Date.now(), nombre: '', clasificacion: '', materias: [], horasTope: 0 })}
                    className="w-full mt-3 bg-blue-600 text-white p-2 rounded font-bold flex justify-center gap-2 hover:bg-blue-700 transition-colors"
                >
                    <Plus size={18}/> Nuevo Docente
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                {docentesFiltrados.map(d => {
                    const horasAsignadas = statsDocentes?.[d.id] || 0;
                    const horasTope = d.horasTope || 0;
                    const isOverLimit = horasTope > 0 && horasAsignadas > horasTope;
                    const progress = horasTope > 0 ? Math.min((horasAsignadas / horasTope) * 100, 100) : 0;

                    return (
                        <div key={d.id} onClick={() => setEditingDocente(d)} 
                             className={`p-3 border rounded mb-2 cursor-pointer hover:shadow-md bg-white transition-all ${editingDocente?.id === d.id ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50' : ''}`}>
                            <div className="flex justify-between items-start">
                                <div className="font-bold text-gray-800 text-sm">{d.nombre}</div>
                                {isOverLimit && <AlertTriangle size={14} className="text-red-500" />}
                            </div>
                            <div className="mt-2">
                                <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                                    <span>Carga: {horasAsignadas} hrs</span>
                                    <span>Meta: {horasTope > 0 ? horasTope : '?'} hrs</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                    <div className={`h-full rounded-full ${isOverLimit ? 'bg-red-500' : (progress >= 100 ? 'bg-green-500' : 'bg-blue-500')}`} style={{ width: `${progress}%` }}></div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* LADO DERECHO: EDICION */}
        <div className="flex-1 flex flex-col bg-white">
            <div className="p-4 bg-gray-100 border-b flex justify-between items-center shadow-sm">
                <h3 className="font-bold text-xl text-gray-800">
                    {editingDocente ? (editingDocente.nombre ? editingDocente.nombre : "Nuevo Docente") : "Detalles"}
                </h3>
                
                <div className="flex items-center gap-2">
                    {/* --- BOTONES DE EXPORTACIÓN POR PROFESOR --- */}
                    {editingDocente && editingDocente.nombre && (
                        <>
                            <button 
                                onClick={() => downloadTeacherSchedule(editingDocente, tabs, 'excel')} 
                                className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 text-xs font-bold rounded hover:bg-green-200 transition-colors"
                                title="Descargar Horario Individual Excel"
                            >
                                <FileSpreadsheet size={16}/> Excel
                            </button>
                            <button 
                                onClick={() => downloadTeacherSchedule(editingDocente, tabs, 'pdf')} 
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 text-xs font-bold rounded hover:bg-red-200 transition-colors"
                                title="Descargar Horario Individual PDF"
                            >
                                <FileText size={16}/> PDF
                            </button>
                            <div className="w-px h-6 bg-gray-300 mx-2"></div>
                        </>
                    )}
                    <button onClick={onClose} className="p-2 hover:bg-red-100 hover:text-red-600 rounded-full transition-colors"><X/></button>
                </div>
            </div>

            {editingDocente ? (
                <div className="p-6 flex-1 overflow-y-auto">
                    {/* ... (Todo el formulario de edición se mantiene igual) ... */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Completo</label>
                            <input className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" value={editingDocente.nombre || ''} onChange={e => setEditingDocente({...editingDocente, nombre: e.target.value})}/>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Clasificación</label>
                            <input className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" value={editingDocente.clasificacion || ''} onChange={e => setEditingDocente({...editingDocente, clasificacion: e.target.value})}/>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-blue-800 uppercase mb-1 flex items-center gap-1"><Clock size={14}/> Tope de Horas (Contrato)</label>
                            <input type="number" className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none font-bold" value={editingDocente.horasTope || 0} onChange={e => setEditingDocente({...editingDocente, horasTope: parseInt(e.target.value) || 0})}/>
                            <span className="text-[10px] text-gray-400">0 = Sin límite (Ignorar alerta)</span>
                        </div>
                    </div>

                    <div className="border rounded-lg p-4 bg-gray-50">
                        <h4 className="font-bold mb-2 text-sm text-gray-700">Materias Autorizadas</h4>
                        <div className="relative mb-2">
                            <Search className="absolute left-2 top-2.5 text-gray-400" size={14}/>
                            <input className="w-full pl-8 p-2 border rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Buscar materia para autorizar..." value={materiaSearch} onChange={e=>setMateriaSearch(e.target.value)}/>
                        </div>
                        
                        <div className="h-64 overflow-y-auto border rounded bg-white p-2 space-y-1 shadow-inner">
                            {materiasParaAsignar.map(m => {
                                const selected = editingDocente.materias?.some(em => em.codigo === m.codigo);
                                return (
                                    <div key={m.codigo} onClick={() => toggleMateria(m)}
                                         className={`flex justify-between items-center p-2 rounded cursor-pointer border transition-colors ${selected ? 'bg-green-50 border-green-500 shadow-sm' : 'bg-white border-transparent hover:bg-gray-100'}`}>
                                        <div>
                                            <span className="text-sm font-medium block">{m.nombre}</span>
                                            <span className="text-[10px] text-gray-400 font-mono">{m.codigo}</span>
                                        </div>
                                        {selected && <Check size={18} className="text-green-600"/>}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className="mt-6 flex gap-2 pt-4 border-t">
                        <button onClick={handleSave} className="flex-1 bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 flex justify-center gap-2 transition-all shadow-md active:scale-95"><Save/> Guardar Cambios</button>
                        <button onClick={handleDelete} className="bg-white border border-red-200 text-red-600 p-3 rounded-lg hover:bg-red-50 transition-colors"><Trash2/></button>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
                    <User size={64} className="opacity-20 mb-4"/>
                    <p>Selecciona un docente de la lista para editar</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default DocentesManager;