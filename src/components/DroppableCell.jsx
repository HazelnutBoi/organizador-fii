import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { X, AlertCircle, MapPin, AlertTriangle } from 'lucide-react';

export const DroppableCell = ({ 
  id, 
  asignacion, 
  onRemove, 
  onDocenteChange, 
  onTipoChange, 
  onSalonChange, 
  posiblesDocentes, 
  statusValidacion,
  conflictos,
  isOverloaded // <--- NUEVA PROPIEDAD
}) => {
  const { isOver, setNodeRef } = useDroppable({ id });

  let borderStyle = 'border-gray-200';
  let bgStyle = 'bg-blue-600';

  // Prioridad de estilos de alerta
  if (statusValidacion === 'excedido') {
      borderStyle = 'border-red-500 ring-1 ring-red-500';
      bgStyle = 'bg-red-600';
  } else if (conflictos?.salon) {
      borderStyle = 'border-orange-500 ring-1 ring-orange-500';
      bgStyle = 'bg-orange-600';
  } else if (isOverloaded) {
      // Estilo SUTIL para sobrecarga de docente (Borde naranja suave)
      borderStyle = 'border-orange-300 ring-1 ring-orange-300';
      // Mantenemos el azul de fondo para no confundir con error grave, 
      // pero agregamos el indicador visual abajo.
  } else if (isOver) {
      borderStyle = 'ring-2 ring-green-400 z-50';
  }

  return (
    <div
      ref={setNodeRef}
      className={`h-full min-h-[110px] w-full border transition-all p-1 relative flex flex-col justify-center ${isOver ? 'bg-green-100' : 'bg-white'} ${borderStyle}`}
    >
      {asignacion ? (
        <div className={`text-white text-[10px] p-1.5 rounded shadow h-full w-full overflow-hidden relative group flex flex-col gap-1 ${bgStyle}`}>
          
          {/* Header con Nombre Materia + Indicador de Sobrecarga */}
          <div className="flex justify-between items-start">
              <div className="font-bold leading-tight truncate pr-1 text-[9px]" title={asignacion.materia.nombre}>
                {asignacion.materia.nombre}
              </div>
              {/* ÍCONO SUTIL DE ADVERTENCIA */}
              {isOverloaded && (
                  <div title="Este docente superó su tope de horas" className="animate-pulse">
                      <AlertTriangle size={10} className="text-orange-200" fill="orange" />
                  </div>
              )}
          </div>

          <div className="relative">
             <select 
                className={`w-full border-none rounded px-1 py-0.5 text-[9px] cursor-pointer outline-none focus:ring-1 focus:ring-white ${isOverloaded ? 'bg-orange-800/40 text-orange-100 font-bold' : 'bg-black/20 text-white'}`}
                value={asignacion.docente?.id || ""}
                onChange={(e) => onDocenteChange(id, e.target.value)}
                onPointerDown={(e) => e.stopPropagation()}
             >
                <option value="" className="text-gray-500">-- Docente --</option>
                {posiblesDocentes?.map((d, index) => (
                    <option 
                        key={`${d.id}-${index}`} 
                        value={d.id} 
                        disabled={d.disabled}
                        className={d.disabled ? "bg-gray-200 text-gray-500 font-bold text-center" : "text-black"}
                    >
                        {d.nombre}
                    </option>
                ))}
             </select>
          </div>

          <div className="flex items-center gap-1 bg-black/10 rounded px-1">
             <MapPin size={8} className="text-white/70" />
             <input 
                type="text" 
                placeholder="Salón..."
                className="w-full bg-transparent border-none text-white placeholder-white/50 text-[9px] p-0 focus:ring-0"
                value={asignacion.salon || ''}
                onChange={(e) => onSalonChange(id, e.target.value)}
                onPointerDown={(e) => e.stopPropagation()}
             />
          </div>
          {conflictos?.salon && (
              <div className="text-[8px] bg-white/20 px-1 rounded text-white font-bold animate-pulse truncate" title={`Ocupado por: ${conflictos.grupoConflictivo}`}>
                  ! {conflictos.grupoConflictivo}
              </div>
          )}

          <div className="flex gap-1 mt-auto">
            <button 
                onClick={() => onTipoChange(id, 'T')}
                onPointerDown={(e) => e.stopPropagation()}
                className={`flex-1 flex justify-center py-0.5 rounded text-[8px] font-bold ${asignacion.tipo === 'T' ? 'bg-white text-blue-800' : 'bg-black/20 text-white/70'}`}
            >T</button>
            {asignacion.materia.horasL > 0 && (
                <button 
                    onClick={() => onTipoChange(id, 'L')}
                    onPointerDown={(e) => e.stopPropagation()}
                    className={`flex-1 flex justify-center py-0.5 rounded text-[8px] font-bold ${asignacion.tipo === 'L' ? 'bg-yellow-400 text-yellow-900' : 'bg-black/20 text-white/70'}`}
                >L</button>
            )}
          </div>
          
          <button onClick={() => onRemove(id)} className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 hover:text-red-200 transition-opacity">
            <X size={12} />
          </button>
        </div>
      ) : (
        <div className="h-full w-full flex items-center justify-center text-gray-200 text-xs select-none">+</div>
      )}
    </div>
  );
};