import React, { useState } from 'react';
import { X, Save, Plus, Search, Trash2, GraduationCap, RefreshCw, Building2, Pencil, Ban } from 'lucide-react';

const CarrerasManager = ({ isOpen, onClose, carreras = [], setCarreras, materias = [] }) => {
    const [filtro, setFiltro] = useState('');
    const [tempCarrera, setTempCarrera] = useState({ nombre: '', tipo: 'FII' });
    const [editingId, setEditingId] = useState(null); // 🟢 Nuevo estado para saber qué estamos editando

    if (!isOpen) return null;

    const carrerasFiltradas = carreras.filter(c => 
        c.nombre.toLowerCase().includes(filtro.toLowerCase())
    );

    const handleSave = () => {
        if (!tempCarrera.nombre.trim()) return alert("Escribe el nombre de la carrera");
        
        // Validación de duplicados (excluyendo el que estamos editando si es el mismo nombre)
        const duplicado = carreras.some(c => 
            c.nombre.toLowerCase() === tempCarrera.nombre.trim().toLowerCase() && c.id !== editingId
        );

        if (duplicado) {
            return alert("Esa carrera ya existe");
        }

        if (editingId) {
            // 🟢 MODO EDICIÓN: Actualizar existente
            setCarreras(prev => prev.map(c => 
                c.id === editingId 
                ? { ...c, nombre: tempCarrera.nombre.trim(), tipo: tempCarrera.tipo } 
                : c
            ));
            setEditingId(null); // Salir de modo edición
        } else {
            // 🟢 MODO CREACIÓN: Agregar nueva
            setCarreras(prev => [...prev, { 
                id: Date.now(), 
                nombre: tempCarrera.nombre.trim(),
                tipo: tempCarrera.tipo 
            }]);
        }

        setTempCarrera({ nombre: '', tipo: 'FII' }); // Resetear formulario
    };

    const handleDelete = (id) => {
        if (window.confirm("¿Eliminar esta carrera?")) {
            setCarreras(prev => prev.filter(c => c.id !== id));
            // Si estábamos editando la que borramos, limpiar
            if (editingId === id) handleCancelEdit();
        }
    };

    const handleStartEdit = (carrera) => {
        setTempCarrera({ nombre: carrera.nombre, tipo: carrera.tipo || 'FII' });
        setEditingId(carrera.id);
    };

    const handleCancelEdit = () => {
        setTempCarrera({ nombre: '', tipo: 'FII' });
        setEditingId(null);
    };

    const handleSyncFromMaterias = () => {
        if (!materias || materias.length === 0) return alert("No hay materias cargadas para analizar.");
        
        const carrerasExistentes = new Set(carreras.map(c => c.nombre.toLowerCase().trim()));
        const carrerasEnMaterias = [...new Set(materias.map(m => m.carrera).filter(Boolean))];
        
        let agregadasCount = 0;
        const nuevas = [];

        carrerasEnMaterias.forEach(nombreCarrera => {
            if (!carrerasExistentes.has(nombreCarrera.toLowerCase().trim())) {
                nuevas.push({ 
                    id: Date.now() + Math.random(), 
                    nombre: nombreCarrera.trim(),
                    tipo: 'FII' 
                });
                agregadasCount++;
            }
        });

        if (agregadasCount > 0) {
            setCarreras(prev => [...prev, ...nuevas]);
            alert(`✅ Se importaron ${agregadasCount} carreras de la Facultad (FII).`);
        } else {
            alert("Todas las carreras ya están registradas.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-2xl h-[75vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                    <h2 className="font-bold text-xl flex items-center gap-2 text-blue-900">
                        <GraduationCap size={24}/> Gestor de Carreras
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-red-100 hover:text-red-600 rounded-full"><X/></button>
                </div>

                <div className={`p-4 border-b flex flex-col gap-3 transition-colors ${editingId ? 'bg-orange-50' : 'bg-blue-50'}`}>
                    {editingId && (
                        <div className="text-xs font-bold text-orange-600 flex justify-between items-center">
                            <span>✏️ Editando Carrera...</span>
                            <button onClick={handleCancelEdit} className="text-gray-500 hover:text-gray-700 underline">Cancelar Edición</button>
                        </div>
                    )}
                    
                    <div className="flex gap-2">
                        <input 
                            className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                            placeholder="Nombre de la Carrera..." 
                            value={tempCarrera.nombre}
                            onChange={e => setTempCarrera({ ...tempCarrera, nombre: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                        />
                        
                        <select 
                            className="p-2 border rounded font-bold text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={tempCarrera.tipo}
                            onChange={e => setTempCarrera({ ...tempCarrera, tipo: e.target.value })}
                        >
                            <option value="FII">Industrial (FII)</option>
                            <option value="EXTERNA">Externa / Otra</option>
                        </select>

                        <button 
                            onClick={handleSave} 
                            className={`px-4 py-2 rounded font-bold text-white flex items-center gap-2 transition-colors ${editingId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            {editingId ? <Save size={18}/> : <Plus size={18}/>}
                        </button>
                    </div>
                    
                    {!editingId && (
                        <button onClick={handleSyncFromMaterias} className="w-full bg-white border border-blue-200 text-blue-700 text-xs font-bold py-2 rounded hover:bg-blue-50 flex items-center justify-center gap-2">
                            <RefreshCw size={14}/> Importar Carreras FII desde Materias
                        </button>
                    )}
                </div>

                <div className="p-2 border-b">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={16}/>
                        <input 
                            className="w-full pl-10 p-2 border rounded text-sm bg-gray-50" 
                            placeholder="Filtrar carreras..." 
                            value={filtro}
                            onChange={e => setFiltro(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {carrerasFiltradas.length === 0 && <p className="text-center text-gray-400 mt-10">No hay carreras registradas.</p>}
                    
                    {carrerasFiltradas.map(c => (
                        <div 
                            key={c.id} 
                            className={`flex justify-between items-center p-3 border rounded hover:shadow-sm transition-colors ${editingId === c.id ? 'border-orange-400 bg-orange-50' : 'bg-white'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${c.tipo === 'EXTERNA' ? 'bg-purple-100 text-purple-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                    {c.tipo === 'EXTERNA' ? <Building2 size={16}/> : <GraduationCap size={16}/>}
                                </div>
                                <div>
                                    <span className="font-bold text-gray-700 block">{c.nombre}</span>
                                    <span className="text-[10px] uppercase font-bold text-gray-400">{c.tipo === 'EXTERNA' ? 'Externa' : 'Facultad Industrial'}</span>
                                </div>
                            </div>
                            
                            <div className="flex gap-1">
                                <button 
                                    onClick={() => handleStartEdit(c)} 
                                    className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                    title="Editar"
                                >
                                    <Pencil size={16}/>
                                </button>
                                <button 
                                    onClick={() => handleDelete(c.id)} 
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                                    title="Eliminar"
                                >
                                    <Trash2 size={16}/>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CarrerasManager;