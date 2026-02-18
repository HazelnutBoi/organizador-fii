import React, { useEffect, useState, useMemo } from 'react';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, closestCenter } from '@dnd-kit/core';
import { loadDocentes, loadPlanEstudios } from './utils/csvParser';
import { LayoutGrid, Search, Calendar, Settings, BookOpen, Plus, X, MapPin, User, Trash2, Building2, Briefcase, FileSpreadsheet, FileText, AlertTriangle, Monitor, Upload, GraduationCap } from 'lucide-react';

import { usePersistentState } from './hooks/usePersistentState';
import { DraggableMateria } from './components/DraggableMateria';
import { DroppableCell } from './components/DroppableCell';
import ConfigPanel from './components/ConfigPanel';
import DocentesManager from './components/DocentesManager';
import MateriasManager from './components/MateriasManager';
import CarrerasManager from './components/CarrerasManager';
import TeacherMonitor from './components/TeacherMonitor';
import { downloadGroupSchedule } from './utils/exporters';
import { getMateriaColor } from './utils/colors';

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

const cleanText = (txt) => txt ? txt.toString().trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
const cleanCode = (code) => code ? code.toString().trim().toUpperCase().replace(/\s/g, '') : "";

function App() {
  const [docentes, setDocentes, loadingDocentes] = usePersistentState('fii_docentes', []);
  const [planEstudios, setPlanEstudios, loadingPlan] = usePersistentState('fii_materias', []);
  const [tabs, setTabs, loadingTabs] = usePersistentState('fii_tabs', []);
  const [carreras, setCarreras, loadingCarreras] = usePersistentState('fii_carreras', []);
  
  const [activeTabId, setActiveTabId] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [showDocentesMgr, setShowDocentesMgr] = useState(false);
  const [showMateriasMgr, setShowMateriasMgr] = useState(false);
  const [showCarrerasMgr, setShowCarrerasMgr] = useState(false);
  const [showMonitor, setShowMonitor] = useState(false);
  
  const [tempConfig, setTempConfig] = useState({ nombreGrupo: '', carrera: '', anio: '', semestre: '', tipo: 'regular', facultad: '' });
  const [activeMateria, setActiveMateria] = useState(null); 
  const [filtroMateria, setFiltroMateria] = useState("");
  const [isEditingTab, setIsEditingTab] = useState(false);
  const [dragItem, setDragItem] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
      if (!loadingTabs && Array.isArray(tabs) && tabs.length > 0 && !activeTabId) {
          setActiveTabId(tabs[0].id);
      }
  }, [tabs, activeTabId, loadingTabs]);

  const activeTab = useMemo(() => {
      if (!Array.isArray(tabs) || !activeTabId) return null;
      return tabs.find(t => t?.id?.toString() === activeTabId?.toString()) || tabs[0] || null;
  }, [tabs, activeTabId]);

  const activeHorario = useMemo(() => activeTab?.horario || {}, [activeTab]);
  const currentConfig = useMemo(() => activeTab?.config || { carrera: '', anio: '', semestre: '' }, [activeTab]);

  const opcionesConfig = useMemo(() => {
    const safePlan = Array.isArray(planEstudios) ? planEstudios : [];
    return { 
        carreras: [], 
        anios: [...new Set(safePlan.map(m => m.anio))].sort(),
        semestres: [...new Set(safePlan.map(m => m.semestre).filter(s => s && s !== '0'))].sort()
    };
  }, [planEstudios]);

  const materiasDisponibles = useMemo(() => {
    if (!activeTab) return [];
    
    const carreraSel = cleanText(currentConfig.carrera);
    const filtroNombre = cleanText(filtroMateria);
    const filtroCodigo = cleanCode(filtroMateria);
    const safePlan = Array.isArray(planEstudios) ? planEstudios : [];

    const filtradasPorConfig = safePlan.filter(m => {
        const mCarrera = cleanText(m.carrera);
        const coincideCarrera = mCarrera === carreraSel || mCarrera.includes(carreraSel);

        if (activeTab.tipo === 'service') {
            return coincideCarrera;
        } else {
            const mAnio = cleanText(m.anio);
            const mSem = cleanText(m.semestre);
            const anioSel = cleanText(currentConfig.anio);
            const semSel = cleanText(currentConfig.semestre);
            
            const coincideAnio = mAnio === anioSel;
            let coincideSem = mSem === '0' ? (semSel === '1' || semSel === '2') : (mSem === semSel);
            if(!mSem) coincideSem = true;

            return coincideCarrera && coincideAnio && coincideSem;
        }
    });

    const unicas = new Map();
    filtradasPorConfig.forEach(m => {
        const mNombre = cleanText(m.nombre);
        const mCodigo = cleanCode(m.codigo);
        const coincideBusqueda = mNombre.includes(filtroNombre) || mCodigo.includes(filtroCodigo);

        if (coincideBusqueda) {
            if (!unicas.has(mCodigo)) {
                unicas.set(mCodigo, m);
            }
        }
    });

    return Array.from(unicas.values()).slice(0, 50);

  }, [planEstudios, activeTab, currentConfig, filtroMateria]);

  const statsDocentes = useMemo(() => {
      const stats = {};
      (Array.isArray(tabs) ? tabs : []).forEach(t => {
          Object.values(t?.horario || {}).forEach(h => { if (h?.docente?.id) stats[h.docente.id] = (stats[h.docente.id] || 0) + 1; });
      });
      return stats;
  }, [tabs]);

  const ocupacionGlobal = useMemo(() => {
    const docentesMap = {};
    (Array.isArray(tabs) ? tabs : []).forEach(tab => {
        Object.entries(tab?.horario || {}).forEach(([cellId, asignacion]) => {
            if (asignacion?.docente?.id) {
                if (!docentesMap[cellId]) docentesMap[cellId] = [];
                docentesMap[cellId].push(tab.id + ':' + asignacion.docente.id);
            }
        });
    });
    return { docentes: docentesMap };
  }, [tabs]);

  const conteoHorasMateria = useMemo(() => {
    const counts = {}; 
    Object.values(activeHorario).forEach(item => {
        if (item?.materia?.codigo) {
            const cod = item.materia.codigo;
            if (!counts[cod]) counts[cod] = { T: 0, L: 0 };
            counts[cod][item.tipo || 'T']++;
        }
    });
    return counts;
  }, [activeHorario]);

  const getConflictos = (cellId, asignacion) => {
      if (!asignacion || !asignacion.materia || !activeTabId) return null;
      const errores = {};
      const { materia, tipo } = asignacion;
      
      const usados = (conteoHorasMateria[materia.codigo] || {T:0, L:0})[tipo] || 0;
      if (usados > (tipo === 'T' ? materia.horasT : materia.horasL)) errores.validacion = 'excedido';

      if (asignacion.salon) {
          const salonInput = cleanText(asignacion.salon);
          const safeTabs = Array.isArray(tabs) ? tabs : [];
          const choque = safeTabs.some(t => 
              t?.id?.toString() !== activeTabId?.toString() && 
              cleanText(t?.horario?.[cellId]?.salon) === salonInput
          );
          if (choque) {
              const culpable = safeTabs.find(t => t?.id?.toString() !== activeTabId?.toString() && cleanText(t?.horario?.[cellId]?.salon) === salonInput);
              errores.salon = true; 
              errores.grupoConflictivo = culpable?.nombre || "Otro grupo";
          }
      }

      if (asignacion.docente?.id) {
          const ocupados = ocupacionGlobal.docentes[cellId] || [];
          const choque = ocupados.some(e => e.split(':')[1] === asignacion.docente.id.toString() && e.split(':')[0]?.toString() !== activeTabId?.toString());
          if (choque) {
              const culpableId = ocupados.find(e => e.split(':')[1] === asignacion.docente.id.toString()).split(':')[0];
              const culpableTab = (Array.isArray(tabs) ? tabs : []).find(t => t?.id?.toString() === culpableId?.toString());
              errores.docente = true; 
              errores.mensajeDocente = `Clase en: ${culpableTab?.nombre || 'Otro grupo'}`;
          }
      }
      return Object.keys(errores).length > 0 ? errores : null;
  };

  const updateActiveHorario = (callback) => {
    if (!activeTabId) return;
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, horario: callback(t.horario || {}) } : t));
  };

  const handleDragStart = (e) => {
      const data = e.active.data.current;
      if (data) setDragItem(data);
  };

  const handleDragEnd = (e) => {
    const { active, over } = e;
    setDragItem(null); 

    if (!over || !active.data.current || !activeTabId) return;

    const sourceData = active.data.current;
    const targetCellId = over.id;

    if (sourceData.origin === 'grid') {
        const sourceCellId = sourceData.cellId;
        if (sourceCellId === targetCellId) return;
        if (activeHorario[targetCellId]?.materia) return alert("La celda destino ya está ocupada.");

        updateActiveHorario(prev => {
            const newHorario = { ...prev };
            newHorario[targetCellId] = { ...sourceData.asignacion };
            delete newHorario[sourceCellId];
            return newHorario;
        });
    } else {
        const materia = sourceData.materia;
        if (activeHorario[targetCellId]?.materia) {
             if(!window.confirm("Esta celda ya tiene una materia. ¿Sobrescribir?")) return;
        }
        const uso = conteoHorasMateria[materia.codigo] || { T: 0, L: 0 };
        let tipo = uso.T < materia.horasT ? 'T' : (uso.L < materia.horasL ? 'L' : null);
        
        if (tipo) {
            updateActiveHorario(p => ({ ...p, [targetCellId]: { materia, docente: null, tipo, salon: '' } }));
        } else {
            alert(`Límite alcanzado para "${materia.nombre}"`);
        }
    }
  };

  const handleTipoChange = (cellId, nuevoTipo) => {
      const asignacion = activeHorario[cellId];
      if (!asignacion) return;
      const materia = asignacion.materia;
      const usoActual = conteoHorasMateria[materia.codigo] || { T: 0, L: 0 };
      const limite = nuevoTipo === 'T' ? materia.horasT : materia.horasL;
      if (usoActual[nuevoTipo] >= limite) return alert(`⚠️ Límite de horas alcanzado (${limite} hrs).`);
      updateActiveHorario(p => ({...p, [cellId]: {...p[cellId], tipo: nuevoTipo}}));
  };

  const handleUploadInitialData = async () => {
      if(!window.confirm("¿Cargar datos base CSV a la nube?")) return;
      const mats = await loadPlanEstudios();
      const docs = await loadDocentes(mats);
      setPlanEstudios(mats);
      setDocentes(docs);

      const uniqueCarreras = [...new Set(mats.map(m => m.carrera).filter(Boolean))].sort();
      const carrerasObjs = uniqueCarreras.map((c, i) => ({ id: Date.now() + i, nombre: c, tipo: 'FII' }));
      setCarreras(carrerasObjs);

      alert("¡Nube sincronizada! Carreras extraídas automáticamente.");
  };

  const handleResetData = () => {
      if(window.confirm("¿Limpiar todo?")) {
        setTabs([]);
        setDocentes([]);
        setPlanEstudios([]);
        setCarreras([]); 
      }
  };

  if (loadingDocentes || loadingPlan || loadingTabs || loadingCarreras) {
      return (
        <div className="flex flex-col h-screen items-center justify-center bg-gray-50 gap-4">
            <div className="w-12 h-12 border-4 border-[#F2BD1D] border-t-transparent rounded-full animate-spin"></div>
            <p className="font-bold text-gray-600">Conectando con la nube...</p>
        </div>
      );
  }

  // Separamos los tabs
  const regularTabs = (tabs || []).filter(t => t.tipo !== 'service');
  const serviceTabs = (tabs || []).filter(t => t.tipo === 'service');

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      
      {isModalOpen && <ConfigPanel 
            opciones={opcionesConfig} 
            seleccion={tempConfig} 
            carreras={carreras} 
            onChange={(field, val) => setTempConfig(prev => ({ ...prev, [field]: val }))} 
            onConfirm={() => {
                const nombre = tempConfig.nombreGrupo.trim().toUpperCase();
                if (!nombre) return alert("Escribe un nombre");
                const tabData = { nombre, tipo: tempConfig.tipo, config: { ...tempConfig } };
                
                if (isEditingTab && activeTabId) {
                    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, ...tabData } : t));
                } else {
                    const newId = Date.now();
                    setTabs(prev => [...(prev || []), { id: newId, ...tabData, horario: {}, customMaterias: [] }]);
                    setActiveTabId(newId);
                }
                setModalOpen(false);
            }} 
            onCancel={() => setModalOpen(false)} 
        />}

      <DocentesManager isOpen={showDocentesMgr} onClose={()=>setShowDocentesMgr(false)} docentes={docentes} setDocentes={setDocentes} materias={planEstudios} statsDocentes={statsDocentes} tabs={tabs} />
      
      <MateriasManager isOpen={showMateriasMgr} onClose={()=>setShowMateriasMgr(false)} materias={planEstudios} setPlanEstudios={setPlanEstudios} carreras={carreras} />
      
      <CarrerasManager isOpen={showCarrerasMgr} onClose={()=>setShowCarrerasMgr(false)} carreras={carreras} setCarreras={setCarreras} materias={planEstudios} />

      {showMonitor && <TeacherMonitor docentes={docentes} tabs={tabs} onClose={() => setShowMonitor(false)} />}

      {(!tabs || tabs.length === 0 || !activeTab) ? (
          <div className="flex flex-col h-screen bg-gray-50 items-center justify-center relative">
              <div className="absolute top-5 right-5 flex gap-2 items-center">
                  <button onClick={() => setShowCarrerasMgr(true)} className="flex items-center gap-2 text-slate-700 font-bold bg-white px-4 py-2 rounded shadow-sm border border-slate-200"><GraduationCap size={18}/> Carreras</button>
                  <button onClick={() => setShowMonitor(true)} className="flex items-center gap-2 text-slate-700 font-bold bg-white px-4 py-2 rounded shadow-sm border border-slate-200"><Monitor size={18}/> Monitor</button>
                  <button onClick={handleResetData} className="text-red-400 hover:text-red-600 text-xs px-3 py-1 font-bold"><Trash2 size={12}/> Reset</button>
              </div>
              <div className="text-center p-12 bg-white rounded-2xl shadow-xl border border-gray-100 max-w-lg w-full mx-4">
                  <div className="bg-[#F2BD1D] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-white"><Calendar size={40} /></div>
                  <h1 className="text-4xl font-bold text-gray-800 mb-3">Organizador FII</h1>
                  <p className="text-gray-500 mb-8">No hay horarios creados. Empieza creando uno nuevo.</p>
                  
                  <button onClick={() => { setTempConfig({ nombreGrupo: '', carrera: '', anio: '', semestre: '', tipo: 'regular' }); setIsEditingTab(false); setModalOpen(true); }} className="w-full bg-[#F2BD1D] hover:bg-yellow-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 shadow-lg transition-colors"><Plus size={24} /> Crear Nuevo Horario</button>
                  
                  {(docentes.length === 0 && planEstudios.length === 0) && (
                      <button onClick={handleUploadInitialData} className="mt-8 flex items-center gap-2 mx-auto text-gray-400 hover:text-[#F2BD1D] text-sm underline">
                          <Upload size={16}/> Inicializar Nube (CSV)
                      </button>
                  )}
              </div>
          </div>
      ) : (
        <div className="flex h-screen bg-gray-100 overflow-hidden font-sans">
            <div className="w-80 bg-white shadow-xl flex flex-col z-20 border-r">
                <div className={`p-4 flex flex-col gap-3 shadow-md ${activeTab.tipo === 'service' ? 'bg-purple-900' : 'bg-[#F2BD1D]'} text-white`}>
                    <div className="flex justify-between items-center">
                        <h1 className="font-bold flex items-center gap-2"><LayoutGrid size={18}/> Panel</h1>
                        <button onClick={() => setShowMonitor(true)} className="bg-white/20 p-1.5 rounded"><Monitor size={16}/></button>
                    </div>
                    <div className="flex gap-1 overflow-x-auto pb-1">
                        <button onClick={() => setShowDocentesMgr(true)} className="flex-1 bg-white/20 py-1.5 rounded text-xs font-bold border border-white/10 hover:bg-white/30 transition-all min-w-[70px]">DOCENTES</button>
                        <button onClick={() => setShowMateriasMgr(true)} className="flex-1 bg-white/20 py-1.5 rounded text-xs font-bold border border-white/10 hover:bg-white/30 transition-all min-w-[70px]">MATERIAS</button>
                        <button onClick={() => setShowCarrerasMgr(true)} className="flex-1 bg-white/20 py-1.5 rounded text-xs font-bold border border-white/10 hover:bg-white/30 transition-all min-w-[70px]">CARRERAS</button>
                    </div>
                </div>
                
                <div className={`${activeTab.tipo === 'service' ? 'bg-purple-50' : 'bg-yellow-50'} p-3 border-b`}>
                      <div className="bg-white p-3 rounded-lg border shadow-sm cursor-pointer hover:border-yellow-400 transition-all group" onClick={() => { setTempConfig({ ...activeTab.config, nombreGrupo: activeTab.nombre, tipo: activeTab.tipo || 'regular' }); setIsEditingTab(true); setModalOpen(true); }}>
                        <div className="flex justify-between font-bold text-sm mb-1 text-blue-900"><span>{activeTab.nombre}</span><Settings size={14} className="text-gray-300"/></div>
                        <span className={`font-mono text-xs block truncate font-bold ${activeTab.tipo === 'service' ? 'text-purple-600' : 'text-[#F2BD1D]'}`}>{currentConfig.carrera || "MODO SERVICIO"}</span>
                    </div>
                </div>

                <div className="p-2 border-b bg-gray-50 relative"><Search className="absolute left-3 top-2.5 text-gray-400" size={16}/><input type="text" placeholder="Buscar materia (Nombre o Código)..." className="w-full pl-9 py-2 text-sm border rounded focus:ring-1 focus:ring-[#F2BD1D] outline-none" value={filtroMateria} onChange={e=>setFiltroMateria(e.target.value)}/></div>
                <div className="flex-1 overflow-y-auto p-2 bg-gray-50 space-y-2">
                    {materiasDisponibles.length === 0 ? (
                        <p className="text-center text-xs text-gray-400 mt-10 p-4">
                            {activeTab.tipo === 'service' 
                                ? `No hay materias registradas para la carrera "${currentConfig.carrera}".`
                                : "No se encontraron materias con estos filtros."}
                        </p>
                    ) : (
                        materiasDisponibles.map(mat => {
                            const asignadas = Object.values(activeHorario).filter(h => h?.materia?.codigo === mat.codigo).length;
                            return <DraggableMateria key={mat.codigo} materia={mat} horasAsignadas={asignadas}/>;
                        })
                    )}
                </div>
            </div>

            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <div className="border-b border-gray-300">
                    
                    {/* FILA 1: FACULTAD (Regular) */}
                    <div className="bg-gray-100 px-2 pt-2 flex gap-1 overflow-x-auto items-center">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-2 select-none">Facultad</span>
                        {regularTabs.map(tab => (
                            <div key={tab.id} onClick={() => setActiveTabId(tab.id)} className={`px-4 py-2 rounded-t-lg text-sm font-bold flex items-center gap-3 cursor-pointer min-w-[140px] justify-between border-t border-x ${activeTabId?.toString() === tab.id?.toString() ? 'bg-white border-gray-300 z-10' : 'bg-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                <span className="truncate">{tab.nombre}</span>
                                <button onClick={(e) => { e.stopPropagation(); if(window.confirm("¿Cerrar?")) { const nt = tabs.filter(t=>t.id!==tab.id); setTabs(nt); setActiveTabId(nt[0]?.id || null); } }}><X size={12}/></button>
                            </div>
                        ))}
                        <button onClick={() => { setTempConfig({ nombreGrupo: '', carrera: '', anio: '', semestre: '', tipo: 'regular' }); setIsEditingTab(false); setModalOpen(true); }} className="px-2 py-1 rounded hover:bg-[#F2BD1D] text-gray-500 hover:text-white transition-colors ml-1"><Plus size={16}/></button>
                    </div>

                    {/* FILA 2: EXTERNOS (Servicio) */}
                    {serviceTabs.length > 0 && (
                        <div className="bg-purple-50 px-2 py-1 flex gap-1 overflow-x-auto items-center border-t border-gray-200 shadow-inner">
                            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mr-2 select-none">Externos</span>
                            {serviceTabs.map(tab => (
                                <div key={tab.id} onClick={() => setActiveTabId(tab.id)} className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-2 cursor-pointer border ${activeTabId?.toString() === tab.id?.toString() ? 'bg-white border-purple-300 text-purple-900 shadow-sm' : 'bg-purple-100 text-purple-600 border-transparent hover:bg-purple-200'}`}>
                                    <span className="truncate flex items-center gap-1"><Briefcase size={12}/> {tab.nombre}</span>
                                    <button onClick={(e) => { e.stopPropagation(); if(window.confirm("¿Cerrar?")) { const nt = tabs.filter(t=>t.id!==tab.id); setTabs(nt); setActiveTabId(nt[0]?.id || null); } }} className="hover:text-red-500"><X size={10}/></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-blue-900">{activeTab.nombre}</h2>
                    <div className="flex items-center gap-3">
                        <button onClick={() => downloadGroupSchedule(activeTab, 'excel')} className="px-3 py-1.5 bg-green-50 text-green-700 rounded text-xs font-bold border border-green-200 hover:bg-green-100 flex items-center gap-2"><FileSpreadsheet size={16}/> EXCEL</button>
                        <button onClick={() => downloadGroupSchedule(activeTab, 'pdf')} className="px-3 py-1.5 bg-red-50 text-red-700 rounded text-xs font-bold border border-red-200 hover:bg-red-100 flex items-center gap-2"><FileText size={16}/> PDF</button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-6 bg-gray-100">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-300 min-w-[1000px]">
                        <div className="grid grid-cols-7 border-b border-gray-300 sticky top-0 bg-white z-20 shadow-sm">
                            <div className="p-3 font-bold text-center bg-gray-50 text-gray-400 border-r text-[10px] uppercase">Hora</div>
                            {dias.map(d => <div key={d} className="p-3 font-bold text-center border-r border-gray-300 text-xs uppercase bg-blue-50 text-blue-900 last:border-r-0">{d}</div>)}
                        </div>
                        {bloquesHorarios.map((b) => (
                            <div key={b.id} className="grid grid-cols-7 border-b border-gray-200 min-h-[110px]">
                                <div className="p-1 text-[9px] font-bold text-gray-500 bg-gray-50 border-r flex flex-col items-center justify-center text-center"><span>{b.inicio}</span><span className="text-gray-300">|</span><span>{b.fin}</span></div>
                                {dias.map(d => {
                                    const id = `${d}-${b.id}`;
                                    const asignacion = activeHorario[id];
                                    const conflictos = getConflictos(id, asignacion);
                                    const safeDocentes = Array.isArray(docentes) ? docentes : [];
                                    const cod = asignacion ? cleanCode(asignacion.materia.codigo) : "";
                                    const nom = asignacion ? cleanText(asignacion.materia.nombre) : "";

                                    // 🟢 LÓGICA UNIFICADA Y MEJORADA DE DOCENTES
                                    const recomendados = safeDocentes.filter(d => d.materias?.some(m => {
                                        const mc = cleanCode(m.codigo);
                                        const mn = cleanText(m.nombre);
                                        // Buscar por Código (Exacto) O Nombre (Parcial)
                                        return (mc && mc === cod) || (mn && nom && (mn.includes(nom) || nom.includes(mn)));
                                    }));
                                    
                                    const otros = safeDocentes.filter(d => !recomendados.includes(d)).sort((a,b) => a.nombre.localeCompare(b.nombre));
                                    
                                    const docsFiltrados = [...recomendados, {id:'sep',nombre:'──── OTROS ────',disabled:true}, ...otros];

                                    let isDocenteOverloaded = false;
                                    if (asignacion?.docente?.id) {
                                        const docId = asignacion.docente.id;
                                        const currentDoc = safeDocentes.find(d => d.id.toString() === docId.toString());
                                        if (currentDoc) {
                                            const totalHoras = statsDocentes[docId] || 0;
                                            const tope = currentDoc.horasTope || 0;
                                            if (tope > 0 && totalHoras > tope) isDocenteOverloaded = true;
                                        }
                                    }

                                    return (
                                    <div key={id} className="border-r border-gray-200 last:border-r-0 p-0.5 bg-white hover:bg-gray-50">
                                            <DroppableCell 
                                                id={id} asignacion={asignacion} 
                                                onRemove={(cid) => updateActiveHorario(p => {const n={...p}; delete n[cid]; return n;})} 
                                                onDocenteChange={(cid, docId) => { 
                                                    const doc = safeDocentes.find(d => d.id.toString() === docId.toString()) || null;
                                                    
                                                    if (doc) {
                                                        const ocupados = ocupacionGlobal.docentes[cid] || [];
                                                        if (ocupados.some(e => e.split(':')[1] === doc.id.toString() && e.split(':')[0]?.toString() !== activeTabId?.toString())) {
                                                            alert(`⛔ CHOQUE: ${doc.nombre} ya tiene clase aquí.`);
                                                            return; 
                                                        }
                                                    }
                                                    const cell = activeHorario[cid];
                                                    updateActiveHorario(prev => {
                                                        const newH = {...prev};
                                                        Object.keys(newH).forEach(k => { if (cleanCode(newH[k]?.materia?.codigo) === cleanCode(cell?.materia?.codigo)) newH[k] = { ...newH[k], docente: doc }; });
                                                        return newH;
                                                    });
                                                }}
                                                onTipoChange={(cid, t) => handleTipoChange(cid, t)}
                                                onSalonChange={(cid, v) => updateActiveHorario(p => ({...p, [cid]: {...p[cid], salon: v}}))}
                                                posiblesDocentes={docsFiltrados}
                                                statusValidacion={conflictos?.validacion}
                                                conflictos={conflictos}
                                                isOverloaded={isDocenteOverloaded}
                                            />
                                    </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      )}
      
      <DragOverlay dropAnimation={null}>
        {dragItem ? (
            <div 
                className="bg-white p-2 rounded shadow-2xl border-2 border-blue-500 w-48 opacity-90 text-xs flex flex-col gap-1"
                style={{ backgroundColor: dragItem.materia ? getMateriaColor(dragItem.materia.codigo) : 'white' }}
            >
                <div className="font-bold text-blue-900 line-clamp-2">{dragItem.materia?.nombre || dragItem.nombre}</div>
                {dragItem.asignacion && (
                    <div className="text-[10px] text-gray-600">
                        {dragItem.asignacion.docente?.nombre && <div>Prof: {dragItem.asignacion.docente.nombre}</div>}
                        {dragItem.asignacion.salon && <div>Salón: {dragItem.asignacion.salon}</div>}
                    </div>
                )}
            </div>
        ) : null}
      </DragOverlay>

    </DndContext>
  );
}

export default App;
