import React, { useEffect, useState, useMemo } from 'react';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, closestCenter } from '@dnd-kit/core';
import { loadDocentes, loadPlanEstudios } from './utils/csvParser';
import { LayoutGrid, Search, Calendar, Settings, BookOpen, Plus, X, MapPin, User, Trash2, Building2, Briefcase, FileSpreadsheet, FileText, AlertTriangle, Monitor, Upload, GraduationCap, ClipboardList, FolderKanban } from 'lucide-react';

import { usePersistentState } from './hooks/usePersistentState';
import { DraggableMateria } from './components/DraggableMateria';
import { DroppableCell } from './components/DroppableCell';
import ConfigPanel from './components/ConfigPanel';
import DocentesManager from './components/DocentesManager';
import MateriasManager from './components/MateriasManager';
import CarrerasManager from './components/CarrerasManager';
import TeacherMonitor from './components/TeacherMonitor';
import { downloadGroupSchedule, downloadFIIReport } from './utils/exporters';
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
  
  // 🟢 CORRECCIÓN: Extraemos el estado de carga para el periodo y el tab activo
  const [activePeriod, setActivePeriod, loadingPeriod] = usePersistentState('fii_active_period', '1er Semestre');
  const [activeTabId, setActiveTabId, loadingActiveTab] = usePersistentState('fii_active_tab', null);
  
  const [isModalOpen, setModalOpen] = useState(false);
  const [showDocentesMgr, setShowDocentesMgr] = useState(false);
  const [showMateriasMgr, setShowMateriasMgr] = useState(false);
  const [showCarrerasMgr, setShowCarrerasMgr] = useState(false);
  const [showMonitor, setShowMonitor] = useState(false);
  
  const [tempConfig, setTempConfig] = useState({ nombreGrupo: '', carrera: '', anio: '', semestre: '', tipo: 'regular', facultad: '' });
  const [filtroMateria, setFiltroMateria] = useState("");
  const [isEditingTab, setIsEditingTab] = useState(false);
  const [dragItem, setDragItem] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const currentPeriodTabs = useMemo(() => {
      return (tabs || [])
          .filter(t => (t.periodo || '1er Semestre') === activePeriod)
          .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [tabs, activePeriod]);

  // 🟢 CORRECCIÓN: Esperar a que carguen las variables antes de pisar el activeTabId
  useEffect(() => {
      if (loadingTabs || loadingPeriod || loadingActiveTab) return; 

      if (currentPeriodTabs.length > 0) {
          const grupoExiste = currentPeriodTabs.find(t => t.id.toString() === activeTabId?.toString());
          
          if (!activeTabId || !grupoExiste) {
              setActiveTabId(currentPeriodTabs[0].id);
          }
      } else {
          if (activeTabId !== null) {
              setActiveTabId(null);
          }
      }
  }, [currentPeriodTabs, activeTabId, loadingTabs, loadingPeriod, loadingActiveTab, setActiveTabId]);

  const activeTab = useMemo(() => {
      if (!currentPeriodTabs || !activeTabId) return null;
      return currentPeriodTabs.find(t => t?.id?.toString() === activeTabId?.toString()) || currentPeriodTabs[0] || null;
  }, [currentPeriodTabs, activeTabId]);

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
      const uniqueSlots = new Set();
      currentPeriodTabs.forEach(t => {
          Object.entries(t?.horario || {}).forEach(([cellId, asignacion]) => {
              if (asignacion?.docente?.id) {
                  const key = `${asignacion.docente.id}-${cellId}`;
                  uniqueSlots.add(key);
              }
          });
      });

      const stats = {};
      uniqueSlots.forEach(key => {
          const docId = key.split('-')[0];
          stats[docId] = (stats[docId] || 0) + 1;
      });
      return stats;
  }, [currentPeriodTabs]);

  const ocupacionGlobal = useMemo(() => {
    const docentesMap = {};
    currentPeriodTabs.forEach(tab => {
        Object.entries(tab?.horario || {}).forEach(([cellId, asignacion]) => {
            if (asignacion?.docente?.id) {
                if (!docentesMap[cellId]) docentesMap[cellId] = [];
                const codigoMat = cleanCode(asignacion.materia?.codigo);
                docentesMap[cellId].push(`${tab.id}:${asignacion.docente.id}:${codigoMat}`);
            }
        });
    });
    return { docentes: docentesMap };
  }, [currentPeriodTabs]);

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
          const choque = currentPeriodTabs.some(t => 
              t?.id?.toString() !== activeTabId?.toString() && 
              cleanText(t?.horario?.[cellId]?.salon) === salonInput
          );
          if (choque) {
              const culpable = currentPeriodTabs.find(t => t?.id?.toString() !== activeTabId?.toString() && cleanText(t?.horario?.[cellId]?.salon) === salonInput);
              errores.salon = true; 
              errores.grupoConflictivo = culpable?.nombre || "Otro grupo";
          }
      }

      if (asignacion.docente?.id) {
          const ocupados = ocupacionGlobal.docentes[cellId] || [];
          const choqueStr = ocupados.find(e => e.split(':')[1] === asignacion.docente.id.toString() && e.split(':')[0]?.toString() !== activeTabId?.toString());
          
          if (choqueStr) {
              const tabIdConflictivo = choqueStr.split(':')[0];
              const culpableTab = currentPeriodTabs.find(t => t?.id?.toString() === tabIdConflictivo.toString());
              errores.docente = true; 
              errores.mensajeDocente = `Ocupado en: ${culpableTab?.nombre || 'Otro grupo'}`;
          }
      }
      return Object.keys(errores).length > 0 ? errores : null;
  };

  const updateActiveHorario = (callback) => {
    if (!activeTabId) return;
    setTabs(prev => prev.map(t => t.id.toString() === activeTabId.toString() ? { ...t, horario: callback(t.horario || {}) } : t));
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
      if(window.confirm("¿Limpiar TODO el sistema (Todos los semestres)?")) {
        setTabs([]);
        setDocentes([]);
        setPlanEstudios([]);
        setCarreras([]); 
      }
  };

  if (loadingDocentes || loadingPlan || loadingTabs || loadingCarreras || loadingPeriod || loadingActiveTab) {
      return (
        <div className="flex flex-col h-screen items-center justify-center bg-gray-50 gap-4">
            <div className="w-12 h-12 border-4 border-[#F2BD1D] border-t-transparent rounded-full animate-spin"></div>
            <p className="font-bold text-gray-600">Cargando...</p>
        </div>
      );
  }

  const regularTabs = currentPeriodTabs.filter(t => t.tipo !== 'service');
  const serviceTabs = currentPeriodTabs.filter(t => t.tipo === 'service');

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
                    setTabs(prev => prev.map(t => t.id.toString() === activeTabId.toString() ? { ...t, ...tabData } : t));
                } else {
                    const newId = Date.now();
                    setTabs(prev => [...(prev || []), { id: newId, ...tabData, horario: {}, customMaterias: [], periodo: activePeriod }]);
                    setActiveTabId(newId);
                }
                setModalOpen(false);
            }} 
            onCancel={() => setModalOpen(false)} 
        />}

      <DocentesManager isOpen={showDocentesMgr} onClose={()=>setShowDocentesMgr(false)} docentes={docentes} setDocentes={setDocentes} materias={planEstudios} statsDocentes={statsDocentes} tabs={currentPeriodTabs} />
      <MateriasManager isOpen={showMateriasMgr} onClose={()=>setShowMateriasMgr(false)} materias={planEstudios} setPlanEstudios={setPlanEstudios} carreras={carreras} />
      <CarrerasManager isOpen={showCarrerasMgr} onClose={()=>setShowCarrerasMgr(false)} carreras={carreras} setCarreras={setCarreras} materias={planEstudios} />
      {showMonitor && <TeacherMonitor docentes={docentes} tabs={currentPeriodTabs} statsDocentes={statsDocentes} onClose={() => setShowMonitor(false)} />}

      <div className="bg-white border-b border-gray-300 shadow-sm flex items-center justify-between px-4 py-2 relative z-50">
          <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-blue-50 text-blue-900 px-3 py-1.5 rounded-lg border border-blue-200">
                  <Calendar size={16} />
                  <select 
                      value={activePeriod} 
                      onChange={(e) => { setActivePeriod(e.target.value); setActiveTabId(null); }}
                      className="bg-transparent border-none text-sm font-bold outline-none cursor-pointer"
                  >
                      <option value="1er Semestre">1er Semestre</option>
                      <option value="2do Semestre">2do Semestre</option>
                      <option value="Verano">Verano</option>
                  </select>
              </div>

              <div className="h-6 w-px bg-gray-300 mx-2"></div>

              <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-500">Grupo:</span>
                  <select 
                      value={activeTabId || ''} 
                      onChange={e => setActiveTabId(e.target.value)}
                      className="p-1.5 border border-gray-300 rounded-lg font-bold text-gray-800 bg-gray-50 hover:bg-white focus:ring-2 focus:ring-[#F2BD1D] outline-none min-w-[200px] cursor-pointer"
                  >
                      {currentPeriodTabs.length === 0 && <option value="">-- Sin grupos --</option>}
                      {regularTabs.length > 0 && (
                          <optgroup label="Facultad Industrial">
                              {regularTabs.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                          </optgroup>
                      )}
                      {serviceTabs.length > 0 && (
                          <optgroup label="Servicio / Externos">
                              {serviceTabs.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                          </optgroup>
                      )}
                  </select>
              </div>

              <button onClick={() => { setTempConfig({ nombreGrupo: '', carrera: '', anio: '', semestre: '', tipo: 'regular' }); setIsEditingTab(false); setModalOpen(true); }} className="px-3 py-1.5 bg-[#F2BD1D] hover:bg-yellow-500 text-white rounded shadow-sm font-bold flex items-center gap-1 transition-colors">
                  <Plus size={16}/> Nuevo Grupo
              </button>

              {activeTab && (
                  <button onClick={() => { if(window.confirm("¿Eliminar este grupo?")) { setTabs(prev => prev.filter(t => t.id.toString() !== activeTabId.toString())); setActiveTabId(null); } }} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Eliminar Grupo">
                      <Trash2 size={16}/>
                  </button>
              )}
          </div>
          
          <div className="flex items-center gap-4">
              {activeTab && (
                  <div className="flex items-center gap-2 mr-4">
                      <button onClick={() => downloadGroupSchedule(activeTab, 'excel')} className="px-3 py-1.5 bg-green-50 text-green-700 rounded text-xs font-bold border border-green-200 hover:bg-green-100 flex items-center gap-2"><FileSpreadsheet size={14}/> EXCEL</button>
                      <button onClick={() => downloadGroupSchedule(activeTab, 'pdf')} className="px-3 py-1.5 bg-red-50 text-red-700 rounded text-xs font-bold border border-red-200 hover:bg-red-100 flex items-center gap-2"><FileText size={14}/> PDF</button>
                  </div>
              )}
              <button onClick={() => setShowCarrerasMgr(true)} className="flex items-center gap-1 text-gray-600 font-bold hover:text-blue-600 transition-colors text-sm"><GraduationCap size={16}/> Carreras</button>
              <button onClick={() => setShowMateriasMgr(true)} className="flex items-center gap-1 text-gray-600 font-bold hover:text-blue-600 transition-colors text-sm"><BookOpen size={16}/> Materias</button>
              <button onClick={() => setShowDocentesMgr(true)} className="flex items-center gap-1 text-gray-600 font-bold hover:text-blue-600 transition-colors text-sm"><User size={16}/> Docentes</button>
              <button onClick={() => setShowMonitor(true)} className="flex items-center gap-1 text-white bg-blue-800 px-3 py-1.5 rounded shadow-sm font-bold hover:bg-blue-900 transition-colors text-sm ml-2"><Monitor size={16}/> Monitor</button>
          </div>
      </div>

      <div className="flex h-[calc(100vh-53px)] bg-gray-100 overflow-hidden font-sans">
          
          <div className="w-80 bg-white shadow-xl flex flex-col z-20 border-r">
              <div className={`p-4 flex flex-col gap-3 shadow-md ${activeTab?.tipo === 'service' ? 'bg-purple-900' : 'bg-[#F2BD1D]'} text-white`}>
                  {activeTab ? (
                      <div className="bg-white/10 p-3 rounded-lg border border-white/20 cursor-pointer hover:bg-white/20 transition-all group" onClick={() => { setTempConfig({ ...activeTab.config, nombreGrupo: activeTab.nombre, tipo: activeTab.tipo || 'regular' }); setIsEditingTab(true); setModalOpen(true); }}>
                          <div className="flex justify-between font-bold text-sm mb-1 text-white"><span>{activeTab.nombre}</span><Settings size={14} className="text-white/70"/></div>
                          <span className={`font-mono text-xs block truncate font-bold text-white/90`}>{currentConfig.carrera || "MODO SERVICIO"}</span>
                      </div>
                  ) : (
                      <div className="text-center p-4">
                          <p className="font-bold">Ningún grupo seleccionado</p>
                      </div>
                  )}
              </div>

              <div className="p-2 border-b bg-gray-50 flex justify-center">
                  <button 
                      onClick={() => downloadFIIReport(currentPeriodTabs, planEstudios)} 
                      className="w-full bg-blue-100 text-blue-800 text-xs font-bold py-1.5 rounded border border-blue-200 hover:bg-blue-200 flex items-center justify-center gap-2 transition-colors"
                  >
                      <FileSpreadsheet size={14}/> Reporte FII (Excel)
                  </button>
              </div>

              <div className="p-2 border-b bg-gray-50 relative"><Search className="absolute left-3 top-4 text-gray-400" size={16}/><input type="text" placeholder="Buscar materia (Nombre o Código)..." className="w-full pl-9 py-2 text-sm border rounded focus:ring-1 focus:ring-[#F2BD1D] outline-none" value={filtroMateria} onChange={e=>setFiltroMateria(e.target.value)}/></div>
              <div className="flex-1 overflow-y-auto p-2 bg-gray-50 space-y-2">
                  {!activeTab ? (
                      <p className="text-center text-xs text-gray-400 mt-10 p-4">Crea o selecciona un grupo en la barra superior.</p>
                  ) : materiasDisponibles.length === 0 ? (
                      <p className="text-center text-xs text-gray-400 mt-10 p-4">No se encontraron materias.</p>
                  ) : (
                      materiasDisponibles.map(mat => {
                          const asignadas = Object.values(activeHorario).filter(h => h?.materia?.codigo === mat.codigo).length;
                          return <DraggableMateria key={mat.codigo} materia={mat} horasAsignadas={asignadas}/>;
                      })
                  )}
              </div>
          </div>

          <div className="flex-1 flex flex-col h-full overflow-hidden relative">
              {activeTab ? (
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

                                      const recomendados = safeDocentes.filter(d => d.materias?.some(m => {
                                          const mc = cleanCode(m.codigo);
                                          const mn = cleanText(m.nombre);
                                          return (mc && mc === cod) || (mn && nom && (mn.includes(nom) || nom.includes(mn)));
                                      })).sort((a,b) => a.nombre.localeCompare(b.nombre));
                                      
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
                                                          const currentMateriaCode = cleanCode(activeHorario[cid]?.materia?.codigo);
                                                          
                                                          const tieneOtraMateria = Object.values(activeHorario).some(asig =>
                                                              asig.docente?.id.toString() === doc.id.toString() &&
                                                              cleanCode(asig.materia?.codigo) !== currentMateriaCode
                                                          );

                                                          if (tieneOtraMateria) {
                                                              if (!window.confirm(`⚠️ ADVERTENCIA DE ASIGNACIÓN MÚLTIPLE\n\nEl docente ${doc.nombre} ya tiene asignada OTRA materia diferente en este mismo grupo (${activeTab.nombre}).\n\nNo es lo ideal, pero ¿deseas continuar y asignarle esta materia también?`)) {
                                                                  return;
                                                              }
                                                          }

                                                          const celdasAfectadas = Object.entries(activeHorario)
                                                              .filter(([_, asign]) => cleanCode(asign.materia?.codigo) === currentMateriaCode)
                                                              .map(([key]) => key);

                                                          let fusionDetectada = false;

                                                          for (const cellKey of celdasAfectadas) {
                                                              const ocupados = ocupacionGlobal.docentes[cellKey] || [];
                                                              const conflicto = ocupados.find(e => {
                                                                  const parts = e.split(':');
                                                                  return parts[1] === doc.id.toString() && parts[0] !== activeTabId?.toString();
                                                              });

                                                              if (conflicto) {
                                                                  const parts = conflicto.split(':');
                                                                  const tabIdConflictivo = parts[0];
                                                                  const materiaConflictiva = parts[2];
                                                                  const grupoConflictivo = currentPeriodTabs.find(t => t.id.toString() === tabIdConflictivo.toString())?.nombre || "Otro grupo";
                                                                  const [dia, bloqueId] = cellKey.split('-');
                                                                  const bloqueInfo = bloquesHorarios.find(b => b.id === bloqueId);
                                                                  const horarioTexto = `${dia} ${bloqueInfo?.inicio}`;

                                                                  if (materiaConflictiva !== currentMateriaCode) {
                                                                      alert(`⛔ CHOQUE IMPOSIBLE\n\nNo se puede asignar a ${doc.nombre}.\n\nEl ${horarioTexto} ya está en el grupo "${grupoConflictivo}" impartiendo OTRA materia (${materiaConflictiva}).`);
                                                                      return;
                                                                  }
                                                                  fusionDetectada = { grupo: grupoConflictivo, dia: horarioTexto };
                                                              }
                                                          }

                                                          if (fusionDetectada) {
                                                              if (!window.confirm(`⚠️ FUSIÓN DETECTADA\n\nEl docente ${doc.nombre} ya imparte esta materia en el grupo "${fusionDetectada.grupo}" (${fusionDetectada.dia}).\n\n¿Deseas fusionar ambos grupos en la misma clase?`)) {
                                                                  return;
                                                              }
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
              ) : (
                  <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
                      <Calendar size={64} className="opacity-20 mb-4"/>
                      <p className="text-xl font-bold">Bienvenido al {activePeriod}</p>
                      <p className="text-sm mt-2">Selecciona o crea un grupo en el menú superior para empezar.</p>
                  </div>
              )}
          </div>
      </div>
      
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
