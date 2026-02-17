import React, { useState, useEffect } from 'react';
import { X, Check, Building2, GraduationCap, Users, Calendar } from 'lucide-react';

const ConfigPanel = ({ opciones, seleccion, onChange, onConfirm, onCancel }) => {
  const [tipo, setTipo] = useState(seleccion.tipo || 'regular');

  useEffect(() => {
    onChange('tipo', tipo);
  }, [tipo]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* HEADER: Texto blanco sobre fondo de color */}
        <div className={`p-4 flex justify-between items-center text-white shadow-md transition-colors ${tipo === 'regular' ? 'bg-[#F2BD1D]' : 'bg-purple-900'}`}>
          <h2 className="font-bold text-lg flex items-center gap-2 text-white">
            <SettingsIcon /> Configurar Grupo
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
                Facultad {/* <-- CAMBIO AQUÍ: Antes decía "Ingeniería (Facultad)" */}
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

          {tipo === 'regular' ? (
            <>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><GraduationCap size={14}/> Carrera</label>
                    <select 
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-[#F2BD1D] outline-none text-sm"
                    value={seleccion.carrera || ''}
                    onChange={(e) => onChange('carrera', e.target.value)}
                    >
                    <option value="">-- Seleccionar Carrera --</option>
                    {opciones.carreras.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

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
            </>
          ) : (
            <>
                <div>
                    <label className="block text-xs font-bold text-purple-800 uppercase mb-1 flex items-center gap-1"><Building2 size={14}/> Facultad Destino</label>
                    <input 
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                        placeholder="Ej: Facultad de Medicina"
                        value={seleccion.facultad || ''}
                        onChange={(e) => onChange('facultad', e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-purple-800 uppercase mb-1 flex items-center gap-1"><GraduationCap size={14}/> Carrera Destino</label>
                    <input 
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                        placeholder="Ej: Lic. en Nutrición"
                        value={seleccion.carrera || ''}
                        onChange={(e) => onChange('carrera', e.target.value)}
                    />
                </div>
                <div className="p-3 bg-purple-50 rounded-lg text-xs text-purple-700 border border-purple-100">
                    ℹ️ En modo servicio, podrás crear y agregar las materias manualmente en la barra lateral.
                </div>
            </>
          )}

          <div className="pt-4 flex justify-end gap-2">
            <button onClick={onCancel} className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button>
            <button 
                onClick={onConfirm} 
                className={`px-6 py-2 text-white font-bold rounded-lg shadow-lg transition-all flex items-center gap-2 active:scale-95 ${tipo === 'regular' ? 'bg-[#F2BD1D] hover:bg-yellow-500' : 'bg-purple-600 hover:bg-purple-700'}`}
            >
                <Check size={18}/> {tipo === 'regular' ? 'Crear Grupo Facultad' : 'Crear Grupo Servicio'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
);

export default ConfigPanel;