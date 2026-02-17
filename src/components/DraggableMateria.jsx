import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { GripVertical, BookOpen } from 'lucide-react';

export const DraggableMateria = ({ materia, horasAsignadas }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: materia.codigo, // Usamos el código de la materia como ID
    data: { materia }   // Pasamos el objeto materia completo
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  // Calculamos si ya se cubrieron las horas requeridas
  const horasTotales = materia.horasT + materia.horasL;
  const completada = horasAsignadas >= horasTotales;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`border rounded p-3 mb-2 shadow-sm flex justify-between items-start group relative touch-none cursor-grab active:cursor-grabbing
        ${completada ? 'bg-green-50 border-green-200 opacity-60' : 'bg-white border-gray-200 hover:shadow-md'}
      `}
    >
      <div className="flex-1">
        <div className="flex justify-between items-start">
            <p className="font-bold text-sm text-gray-800 leading-tight w-10/12">{materia.nombre}</p>
            <GripVertical className="text-gray-300" size={16} />
        </div>
        <p className="text-[10px] text-gray-500 font-mono mt-0.5">{materia.codigo}</p>
        
        <div className="mt-2 flex gap-2 items-center">
             {/* Indicadores de Horas */}
             <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100 font-bold" title="Teoría">
                T: {materia.horasT}
             </span>
             {materia.horasL > 0 && (
                 <span className="text-[10px] bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded border border-yellow-100 font-bold" title="Laboratorio">
                    L: {materia.horasL}
                 </span>
             )}
             
             {/* Estado de asignación */}
             <span className={`text-[10px] ml-auto font-bold ${completada ? 'text-green-600' : 'text-gray-400'}`}>
                {horasAsignadas} / {horasTotales} hrs
             </span>
        </div>
      </div>
    </div>
  );
};