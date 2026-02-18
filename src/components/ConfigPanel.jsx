import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, Building2, GraduationCap, Users, Calendar, Settings as SettingsIcon } from 'lucide-react';

const ConfigPanel = ({ opciones, seleccion, onChange, onConfirm, onCancel, carreras = [] }) => {
  const [tipo, setTipo] = useState(seleccion.tipo || 'regular');

  useEffect(() => {
    onChange('tipo', tipo);
  }, [tipo]);

  // 🟢 FILTRADO INTELIGENTE DE CARRERAS
  const carrerasDisponibles = useMemo(() => {
      if (tipo === 'regular') {
          // Solo mostrar carreras marcadas como FII
          return carreras.filter(c => c.tipo === 'FII' || !c.tipo); // (!c.tipo es por compatibilidad con datos viejos)
      } else {
          // Solo mostrar carreras marcadas como EXTERNA
          return carreras.filter(c => c.tipo === 'EXTERNA');
      }
  }, [carreras, tipo]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className={`p-4 flex justify-between items-center text-white shadow-md transition-colors ${tipo === 'regular' ? 'bg-[#F2BD1D]' : 'bg-purple-900'}`}>
          <h2 className="font-bold text-lg flex items-center gap-2 text-white">
            <SettingsIcon size={20} /> Configurar Grupo
          </h2>
          <button onClick={onCancel} className="hover:bg-white/20 p-1 rounded-full transition-colors text-white"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-5">
          
          {/* SELECTOR DE TIPO */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button 
                onClick={() => setTipo('regular')}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${tipo === 'regular' ? 'bg-white text-[#F2BD1D] shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
            >
                Facultad (FII)
            </button>
            <button 
                onClick={() => setTipo('service')}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${tipo === 'service' ? 'bg-white text-purple-800 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
            >
                Servicio / Externa
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><Users size={14}/> Código de Grupo</label>
            <input 
              autoFocus
              className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#F2BD1D] outline-none font-mono font-bold text-lg uppercase"
              placeholder={tipo === 'regular' ? "EJ: 1II131" : "EJ: GRUPO-MEDICINA"}
              value={seleccion.nombreGrupo || ''}
              onChange={(e) => onChange('nombreGrupo', e.target.value)}
            />
          </div>

          {/* SELECTOR DE CARRERA FILTRADO */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                {tipo === 'regular' ? <GraduationCap size={14}/> : <Building2 size={14}/>} 
                {tipo === 'regular' ? ' Carrera FII' : ' Carrera Externa'}
            </label>
            
            {carrerasDisponibles.length > 0 ? (
                <select 
                    className={`w-full p-2 border rounded focus:ring-2 outline-none text-sm font-bold ${tipo === 'regular' ? 'focus:ring-[#F2BD1D] text-gray-700' : 'focus:ring-purple-500 text-purple-900 bg-purple-50 border-purple-200'}`}
                    value={seleccion.carrera || ''}
                    onChange={(e) => onChange('carrera', e.target.value)}
                >
                    <option value="">-- Seleccionar Carrera --</option>
                    {carrerasDisponibles.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                </select>
            ) : (
                <div className={`text-xs p-3 rounded border ${tipo === 'regular' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                    {tipo === 'regular' 
                        ? '⚠️ No hay carreras de Industrial cargadas.' 
                        : '⚠️ No hay carreras externas. Ve a "Carreras" y crea una nueva con tipo "Externa".'}
                </div>
            )}
          </div>

          {tipo === 'regular' ? (
            <div className="grid grid-cols-2 gap-4">
                <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><Calendar size={14}/> Año</label>
                <select 
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-[#F2BD1D] outline-none text-sm"
                    value={seleccion.anio || ''}
                    onChange={(e) => onChange('anio', e.target.value)}
                >
                    <option value="">-- Año --</option>
                    {opciones.anios.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                </div>
                <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><Calendar size={14}/> Semestre</label>
                <select 
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-[#F2BD1D] outline-none text-sm"
                    value={seleccion.semestre || ''}
                    onChange={(e) => onChange('semestre', e.target.value)}
                >
                    <option value="">-- Sem --</option>
                    {opciones.semestres.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                </div>
            </div>
          ) : (
             <div className="p-3 bg-purple-50 rounded-lg text-xs text-purple-700 border border-purple-100 flex items-start gap-2">
                <div className="mt-0.5"><Building2 size={14}/></div>
                <p>Estás creando un horario de servicio. Se mostrarán todas las materias vinculadas a la carrera externa seleccionada.</p>
             </div>
          )}

          <div className="pt-4 flex justify-end gap-2">
            <button onClick={onCancel} className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button>
            <button 
                onClick={onConfirm} 
                className={`px-6 py-2 text-white font-bold rounded-lg shadow-lg transition-all flex items-center gap-2 active:scale-95 ${tipo === 'regular' ? 'bg-[#F2BD1D] hover:bg-yellow-500' : 'bg-purple-600 hover:bg-purple-700'}`}
            >
                <Check size={18}/> {tipo === 'regular' ? 'Crear Grupo FII' : 'Crear Grupo Externo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel;
