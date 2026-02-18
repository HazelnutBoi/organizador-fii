import React, { useState, useMemo } from 'react';
import { X, Save, Plus, Search, Trash2, BookOpen, Copy, Building2, CheckCircle2 } from 'lucide-react';

const MateriasManager = ({ isOpen, onClose, materias = [], setPlanEstudios, carreras = [] }) => {
  const [filtro, setFiltro] = useState('');
  // 🟢 Agregamos 'esFII' al estado inicial (por defecto true)
  const [editingMateria, setEditingMateria] = useState(null);

  const materiasFiltradas = useMemo(() => {
    const term = (filtro || "").toLowerCase();
    return (materias || []).filter(m => 
        (m.nombre || "").toLowerCase().includes(term) || 
        (m.codigo || "").toString().toLowerCase().includes(term)
    ).slice(0, 50);
  }, [materias, filtro]);

  if (!isOpen) return null;

  const handleSave = () => {
      if (!editingMateria.codigo || !editingMateria.nombre) return alert("Código y Nombre requeridos");
      if (!editingMateria.carrera) return alert("Debes seleccionar una Carrera");

      setPlanEstudios(prev => {
          const safePrev = prev || [];
          if (editingMateria.isClone) {
              const { isClone, originalCarrera, ...data } = editingMateria;
              return [...safePrev, data];
          }
          const index = safePrev.findIndex(m => 
              m.codigo === editingMateria.codigo && 
              m.carrera === editingMateria.originalCarrera
          );
          if (index >= 0) {
              const newArr = [...safePrev];
              const { originalCarrera, isClone, ...data } = editingMateria;
              newArr[index] = data;
              return newArr;
          }
          const { originalCarrera, isClone, ...data } = editingMateria;
          return [...safePrev, data];
      });
      setEditingMateria(null);
  };

  const handleClone = () => {
      setEditingMateria(prev => ({
          ...prev,
          carrera: "", 
          isClone: true, 
          originalCarrera: null 
      }));
      alert("Materia duplicada. Selecciona la nueva carrera y guarda.");
  };

  const handleDelete = () => {
      if(window.confirm(`¿Eliminar ${editingMateria.nombre} de ${editingMateria.carrera}?`)) {
          setPlanEstudios(prev => prev.filter(m => !(m.codigo === editingMateria.codigo && m.carrera === editingMateria.carrera)));
          setEditingMateria(null);
      }
  };

  const startEditing = (m) => {
      // Aseguramos que esFII tenga un valor (true si es undefined para compatibilidad)
      setEditingMateria({ ...m, esFII: m.esFII !== undefined ? m.esFII : true, originalCarrera: m.carrera, isClone: false });
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-6xl h-[85vh] rounded-xl shadow-2xl flex overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* IZQUIERDA: LISTA */}
        <div className="w-1/3 border-r bg-gray-50 flex flex-col">
            <div className="p-4 border-b bg-white">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="font-bold text-lg flex items-center gap-2 text-blue-900"><BookOpen size={20}/> Materias</h2>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{materias.length}</span>
                </div>
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 text-gray-400" size={16}/>
                    <input className="w-full pl-8 p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Buscar materia..." value={filtro} onChange={e=>setFiltro(e.target.value)}/>
                </div>
                <button 
                    onClick={() => setEditingMateria({ codigo: '', nombre: '', carrera: '', anio: '', semestre: '', horasT: 0, horasL: 0, isClone: true, esFII: true })}
                    className="w-full mt-3 bg-blue-600 text-white p-2 rounded font-bold flex justify-center gap-2 hover:bg-blue-700 transition-colors"
                >
                    <Plus size={18}/> Nueva Materia
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
                {materiasFiltradas.map((m, idx) => (
                    <div key={idx} onClick={() => startEditing(m)} 
                         className={`p-3 border rounded mb-2 cursor-pointer hover:shadow-md bg-white transition-all ${editingMateria?.codigo === m.codigo && editingMateria?.carrera === m.carrera ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50' : ''}`}>
                        <div className="font-bold text-sm text-gray-800">{m.nombre}</div>
                        <div className="flex justify-between mt-1 items-center">
                            <span className="text-[10px] bg-gray-100 text-gray-600 px-1 rounded border font-mono">{m.codigo}</span>
                            <span className="text-[10px] text-blue-600 font-bold truncate max-w-[150px]" title={m.carrera}>{m.carrera}</span>
                        </div>
                        {/* Indicador visual en la lista si es FII */}
                        <div className="mt-1 flex justify-end">
                            {m.esFII !== false && <span className="text-[9px] bg-green-50 text-green-700 border border-green-200 px-1 rounded">FII</span>}
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* DERECHA: EDICION */}
        <div className="flex-1 flex flex-col bg-white">
            <div className="p-4 bg-gray-100 border-b flex justify-between items-center shadow-sm">
                <h3 className="font-bold text-xl text-gray-800">
                    {editingMateria ? (editingMateria.isClone ? "Nueva / Clonando..." : "Editar Materia") : "Detalles"}
                </h3>
                <button onClick={onClose} className="p-2 hover:bg-red-100 hover:text-red-600 rounded-full transition-colors"><X/></button>
            </div>

            {editingMateria ? (
                <div className="p-6 flex-1 overflow-y-auto space-y-4">
                    
                    {/* 🟢 NUEVO SELECTOR: ES FACULTAD INDUSTRIAL */}
                    <div className={`p-4 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${editingMateria.esFII ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'}`}
                         onClick={() => setEditingMateria(prev => ({ ...prev, esFII: !prev.esFII }))}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${editingMateria.esFII ? 'bg-green-200 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                                <Building2 size={20}/>
                            </div>
                            <div>
                                <span className="font-bold text-sm block">¿Impartida por Facultad Industrial?</span>
                                <span className="text-xs text-gray-500">{editingMateria.esFII ? 'SÍ - Esta materia aparecerá en el reporte de la Facultad.' : 'NO - Es una materia de servicio/otra facultad.'}</span>
                            </div>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${editingMateria.esFII ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300'}`}>
                            {editingMateria.esFII && <CheckCircle2 size={16}/>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Código</label>
                            <input className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" value={editingMateria.codigo} onChange={e => setEditingMateria({...editingMateria, codigo: e.target.value})}/>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre</label>
                            <input className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" value={editingMateria.nombre} onChange={e => setEditingMateria({...editingMateria, nombre: e.target.value})}/>
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Carrera (Facultad/Programa)</label>
                        {carreras.length > 0 ? (
                            <select 
                                className="w-full p-2 border rounded font-bold text-blue-900 bg-white"
                                value={editingMateria.carrera} 
                                onChange={e => setEditingMateria({...editingMateria, carrera: e.target.value})}
                            >
                                <option value="">-- Seleccionar Carrera --</option>
                                {carreras.map(c => (
                                    <option key={c.id} value={c.nombre}>{c.nombre}</option>
                                ))}
                            </select>
                        ) : (
                            <div className="text-red-500 text-xs p-2 bg-red-50 rounded border border-red-100">
                                ⚠️ No hay carreras registradas.
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Año</label>
                            <input className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" value={editingMateria.anio} onChange={e => setEditingMateria({...editingMateria, anio: e.target.value})}/>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Semestre</label>
                            <select className="w-full p-2 border rounded bg-white" value={editingMateria.semestre} onChange={e => setEditingMateria({...editingMateria, semestre: e.target.value})}>
                                <option value="">Todos</option>
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="VERANO">Verano</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <div>
                            <label className="block text-xs font-bold text-blue-900 uppercase mb-1">Horas Teoría</label>
                            <input type="number" className="w-full p-2 border rounded font-bold text-blue-800" value={editingMateria.horasT} onChange={e => setEditingMateria({...editingMateria, horasT: parseInt(e.target.value) || 0})}/>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-blue-900 uppercase mb-1">Horas Laboratorio</label>
                            <input type="number" className="w-full p-2 border rounded font-bold text-blue-800" value={editingMateria.horasL} onChange={e => setEditingMateria({...editingMateria, horasL: parseInt(e.target.value) || 0})}/>
                        </div>
                    </div>

                    <div className="mt-6 flex gap-2 pt-4 border-t">
                        {!editingMateria.isClone && (
                            <button onClick={handleClone} className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg font-bold hover:bg-purple-200 flex items-center gap-2" title="Crear copia para otra carrera">
                                <Copy size={18}/> Clonar
                            </button>
                        )}
                        <button onClick={handleSave} className="flex-1 bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 flex justify-center gap-2 transition-all shadow-md active:scale-95"><Save/> Guardar</button>
                        {!editingMateria.isClone && (
                            <button onClick={handleDelete} className="bg-white border border-red-200 text-red-600 p-3 rounded-lg hover:bg-red-50 transition-colors"><Trash2/></button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
                    <BookOpen size={64} className="opacity-20 mb-4"/>
                    <p>Selecciona una materia para editar</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default MateriasManager;
