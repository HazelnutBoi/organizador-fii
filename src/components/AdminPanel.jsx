import React, { useState, useMemo } from 'react';
import { X, Save, Plus, Search, BookOpen, User, Check, Trash2 } from 'lucide-react';

const AdminPanel = ({ isOpen, onClose, docentes, setDocentes, materias, setPlanEstudios }) => {
  const [activeTab, setActiveTab] = useState('docentes'); // 'docentes' o 'materias'
  const [filtro, setFiltro] = useState('');
  
  // Estados para edición
  const [editingItem, setEditingItem] = useState(null);
  const [isNew, setIsNew] = useState(false);

  // Helper para convertir cualquier cosa a string minúscula de forma segura
  const safeStr = (val) => val ? String(val).toLowerCase() : "";

  // --- FILTRADO OPTIMIZADO (Evita congelamientos) ---
  const filteredList = useMemo(() => {
    const term = safeStr(filtro);
    let sourceList = activeTab === 'docentes' ? docentes : materias;

    // 1. Filtrar
    const results = sourceList.filter(item => {
        const nombre = safeStr(item.nombre);
        const codigo = safeStr(item.codigo); // Solo existe en materias
        const id = safeStr(item.id);
        return nombre.includes(term) || codigo.includes(term) || id.includes(term);
    });

    // 2. IMPORTANTE: Limitar a 50 resultados para no congelar el navegador
    // Si el usuario escribe algo específico, saldrá en esos 50.
    return results.slice(0, 50);
  }, [activeTab, docentes, materias, filtro]);


  // --- LOGICA DOCENTES ---
  const handleSaveDocente = (e) => {
    e.preventDefault();
    if (!editingItem.nombre) return alert("El nombre es obligatorio");

    if (isNew) {
      setDocentes(prev => [...prev, { 
          ...editingItem, 
          id: editingItem.nombre, 
          materias: editingItem.materias || [] 
      }]);
    } else {
      setDocentes(prev => prev.map(d => d.id === editingItem.id ? editingItem : d));
    }
    setEditingItem(null);
  };

  const toggleMateriaDocente = (materia) => {
    setEditingItem(prev => {
        const currentMaterias = prev.materias || [];
        const tieneMateria = currentMaterias.some(m => m.codigo === materia.codigo);
        let nuevasMaterias;
        if (tieneMateria) {
            nuevasMaterias = currentMaterias.filter(m => m.codigo !== materia.codigo);
        } else {
            nuevasMaterias = [...currentMaterias, materia];
        }
        return { ...prev, materias: nuevasMaterias };
    });
  };

  const handleDeleteDocente = () => {
    if(window.confirm("¿Eliminar este docente?")) {
        setDocentes(prev => prev.filter(d => d.id !== editingItem.id));
        setEditingItem(null);
    }
  };

  // --- LOGICA MATERIAS ---
  const handleSaveMateria = (e) => {
    e.preventDefault();
    if (!editingItem.codigo || !editingItem.nombre) return alert("Código y Nombre son obligatorios");

    const materiaToSave = {
        ...editingItem,
        horasT: parseInt(editingItem.horasT) || 0,
        horasL: parseInt(editingItem.horasL) || 0
    };

    if (isNew) {
      setPlanEstudios(prev => [...prev, materiaToSave]);
    } else {
      setPlanEstudios(prev => prev.map(m => m.codigo === editingItem.codigo ? materiaToSave : m));
    }
    setEditingItem(null);
  };

  const handleDeleteMateria = () => {
      if(window.confirm("¿Eliminar esta materia?")) {
          setPlanEstudios(prev => prev.filter(m => m.codigo !== editingItem.codigo));
          setEditingItem(null);
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-6xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in duration-200">
        
        {/* HEADER */}
        <div className="bg-gray-900 text-white p-4 flex justify-between items-center shrink-0">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <SettingsIcon /> Administración del Sistema
            </h2>
            <button onClick={onClose} className="hover:bg-gray-700 p-2 rounded-full transition"><X /></button>
        </div>

        {/* CONTROLES SUPERIORES */}
        <div className="bg-gray-100 p-4 border-b flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
            {/* Tabs */}
            <div className="flex bg-white rounded-lg p-1 shadow-sm border">
                <button 
                    onClick={() => { setActiveTab('docentes'); setEditingItem(null); setFiltro(''); }}
                    className={`px-6 py-2 rounded-md font-bold flex items-center gap-2 transition-all ${activeTab === 'docentes' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                    <User size={18}/> Docentes
                </button>
                <button 
                    onClick={() => { setActiveTab('materias'); setEditingItem(null); setFiltro(''); }}
                    className={`px-6 py-2 rounded-md font-bold flex items-center gap-2 transition-all ${activeTab === 'materias' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                    <BookOpen size={18}/> Materias
                </button>
            </div>
            
            {/* Buscador */}
            <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input 
                    type="text" 
                    placeholder={`Buscar en ${activeTab}...`} 
                    className="w-full pl-10 pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                    value={filtro}
                    onChange={e => setFiltro(e.target.value)}
                />
            </div>

            {/* Botón Nuevo */}
            <button 
                onClick={() => {
                    setIsNew(true);
                    setEditingItem(activeTab === 'docentes' 
                        ? { id: '', nombre: '', clasificacion: '', materias: [] }
                        : { codigo: '', nombre: '', carrera: '', anio: '', semestre: '', horasT: 0, horasL: 0 }
                    );
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm transition-transform hover:scale-105 active:scale-95"
            >
                <Plus size={18} /> Crear Nuevo
            </button>
        </div>

        {/* AREA DE TRABAJO */}
        <div className="flex-1 overflow-hidden flex bg-gray-50">
            
            {/* LISTA (IZQUIERDA) */}
            <div className={`flex-1 overflow-y-auto p-4 space-y-2 ${editingItem ? 'hidden md:block md:w-1/3 border-r border-gray-200' : 'w-full'}`}>
                
                {filteredList.map((item, idx) => (
                    <div 
                        key={item.id || item.codigo || idx} 
                        onClick={() => { setIsNew(false); setEditingItem(item); }} 
                        className={`p-3 bg-white border rounded-lg cursor-pointer transition-all 
                        ${(editingItem?.id === item.id || editingItem?.codigo === item.codigo) ? 'border-blue-500 ring-1 ring-blue-500 shadow-md' : 'hover:border-blue-300 hover:shadow-sm'}`}
                    >
                        {activeTab === 'docentes' ? (
                            <>
                                <div className="font-bold text-gray-800">{item.nombre}</div>
                                <div className="text-xs text-gray-500">{item.clasificacion || "Sin clasificación"}</div>
                                <div className="text-xs text-blue-600 mt-1 font-semibold flex items-center gap-1">
                                    <Check size={12}/> {item.materias?.length || 0} materias aut.
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex justify-between items-start">
                                    <span className="font-bold text-gray-800 text-sm">{item.nombre}</span>
                                    <span className="font-mono text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border">{item.codigo}</span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1 truncate">{item.carrera}</div>
                            </>
                        )}
                    </div>
                ))}
                
                {filteredList.length === 0 && (
                    <div className="text-center text-gray-400 mt-10 p-4">
                        <p>No se encontraron resultados.</p>
                    </div>
                )}
            </div>

            {/* FORMULARIO DE EDICIÓN (DERECHA) */}
            {editingItem ? (
                <div className="flex-[2] bg-white p-6 overflow-y-auto animate-in slide-in-from-right duration-200 shadow-inner">
                    <div className="flex justify-between items-center mb-6 border-b pb-4">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-800">
                                {isNew ? 'Crear Nuevo' : 'Editar'} {activeTab === 'docentes' ? 'Docente' : 'Materia'}
                            </h3>
                        </div>
                        
                        <div className="flex gap-2">
                            {!isNew && (
                                <button onClick={activeTab === 'docentes' ? handleDeleteDocente : handleDeleteMateria} className="p-2 text-red-500 hover:bg-red-50 rounded" title="Eliminar">
                                    <Trash2 size={20} />
                                </button>
                            )}
                            <button onClick={() => setEditingItem(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded font-medium">Cancelar</button>
                            <button onClick={activeTab === 'docentes' ? handleSaveDocente : handleSaveMateria} className="px-6 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg">
                                <Save size={18} /> Guardar
                            </button>
                        </div>
                    </div>

                    {activeTab === 'docentes' ? (
                        <FormularioDocente 
                            editingItem={editingItem} 
                            setEditingItem={setEditingItem} 
                            allMaterias={materias} 
                            toggleMateria={toggleMateriaDocente}
                        />
                    ) : (
                        <FormularioMateria 
                            editingItem={editingItem} 
                            setEditingItem={setEditingItem} 
                            isNew={isNew}
                        />
                    )}
                </div>
            ) : (
                <div className="flex-[2] flex flex-col items-center justify-center text-gray-300 bg-gray-50 hidden md:flex">
                    <SettingsIcon size={64} className="mb-4 opacity-20"/>
                    <p className="text-lg font-medium">Selecciona un elemento para editar</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

// --- SUBCOMPONENTES PARA LIMPIAR CODIGO ---

const FormularioDocente = ({ editingItem, setEditingItem, allMaterias, toggleMateria }) => {
    const [searchMat, setSearchMat] = useState("");
    
    // Filtrado local para el selector de materias del docente
    // TAMBIÉN LIMITADO A 50 para evitar freeze en el selector
    const materiasFiltradas = useMemo(() => {
        const term = searchMat.toLowerCase();
        return allMaterias.filter(m => 
            (m.nombre||"").toLowerCase().includes(term) || 
            (m.codigo||"").toLowerCase().includes(term)
        ).slice(0, 50); 
    }, [allMaterias, searchMat]);

    return (
        <form className="space-y-6 max-w-3xl">
            <div className="grid grid-cols-1 gap-4">
                <div>
                    <label className="block font-bold text-gray-700 mb-1">Nombre Completo</label>
                    <input className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                           value={editingItem.nombre} 
                           onChange={e => setEditingItem({...editingItem, nombre: e.target.value})} 
                    />
                </div>
                <div>
                    <label className="block font-bold text-gray-700 mb-1">Clasificación / Título</label>
                    <input className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                           value={editingItem.clasificacion} 
                           onChange={e => setEditingItem({...editingItem, clasificacion: e.target.value})} 
                    />
                </div>
            </div>

            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                <h4 className="font-bold mb-2 flex items-center gap-2 text-blue-800"><Check size={18}/> Materias Autorizadas</h4>
                
                <div className="relative mb-2">
                    <Search className="absolute left-3 top-3 text-gray-400" size={16}/>
                    <input 
                        type="text" 
                        placeholder="Buscar materia para autorizar..." 
                        className="w-full pl-9 p-2 border rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                        value={searchMat}
                        onChange={(e) => setSearchMat(e.target.value)}
                    />
                </div>
                <div className="h-80 overflow-y-auto border rounded-lg bg-white p-2 space-y-1 shadow-inner">
                    {materiasFiltradas.map(mat => {
                        const isSelected = editingItem.materias?.some(m => m.codigo === mat.codigo);
                        return (
                            <div key={mat.codigo} 
                                 onClick={() => toggleMateria(mat)}
                                 className={`flex items-center justify-between p-2 rounded cursor-pointer border transition-colors ${isSelected ? 'bg-green-50 border-green-500' : 'hover:bg-gray-50 border-transparent'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-green-500 border-green-500' : 'border-gray-300 bg-white'}`}>
                                        {isSelected && <Check size={14} className="text-white"/>}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-gray-800">{mat.nombre}</div>
                                        <div className="text-[10px] text-gray-400">{mat.carrera}</div>
                                    </div>
                                </div>
                                <span className="text-xs font-mono text-gray-500 bg-gray-100 px-1 rounded">{mat.codigo}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </form>
    );
};

const FormularioMateria = ({ editingItem, setEditingItem, isNew }) => (
    <form className="space-y-4 max-w-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block font-bold text-gray-700 mb-1">Código Asignatura</label>
                <input className="w-full p-3 border rounded-lg" value={editingItem.codigo} onChange={e => setEditingItem({...editingItem, codigo: e.target.value})} disabled={!isNew}/>
            </div>
            <div>
                <label className="block font-bold text-gray-700 mb-1">Nombre Asignatura</label>
                <input className="w-full p-3 border rounded-lg" value={editingItem.nombre} onChange={e => setEditingItem({...editingItem, nombre: e.target.value})} />
            </div>
        </div>

        <div>
            <label className="block font-bold text-gray-700 mb-1">Carrera</label>
            <input className="w-full p-3 border rounded-lg" value={editingItem.carrera} onChange={e => setEditingItem({...editingItem, carrera: e.target.value})} />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block font-bold text-gray-700 mb-1">Año</label>
                <select className="w-full p-3 border rounded-lg bg-white" value={editingItem.anio} onChange={e => setEditingItem({...editingItem, anio: e.target.value})}>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                </select>
            </div>
            <div>
                <label className="block font-bold text-gray-700 mb-1">Semestre</label>
                <select className="w-full p-3 border rounded-lg bg-white" value={editingItem.semestre} onChange={e => setEditingItem({...editingItem, semestre: e.target.value})}>
                    <option value="">Anual / Todos</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="VERANO">Verano</option>
                </select>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4 bg-blue-50 p-6 rounded-xl border border-blue-100">
            <div>
                <label className="block font-bold mb-1 text-blue-900">Horas Teoría</label>
                <input type="number" min="0" className="w-full p-3 border rounded-lg font-bold text-blue-800" value={editingItem.horasT} onChange={e => setEditingItem({...editingItem, horasT: e.target.value})} />
            </div>
            <div>
                <label className="block font-bold mb-1 text-blue-900">Horas Laboratorio</label>
                <input type="number" min="0" className="w-full p-3 border rounded-lg font-bold text-blue-800" value={editingItem.horasL} onChange={e => setEditingItem({...editingItem, horasL: e.target.value})} />
            </div>
        </div>
    </form>
);

const SettingsIcon = ({size=24, className=""}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);

export default AdminPanel;