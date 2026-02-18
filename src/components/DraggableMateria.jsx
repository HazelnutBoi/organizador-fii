import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, CheckCircle2 } from 'lucide-react';

export function DraggableMateria({ materia, horasAsignadas }) {
    // 1. Calcular si ya se completaron las horas
    const horasTotales = (materia.horasT || 0) + (materia.horasL || 0);
    const completo = horasAsignadas >= horasTotales && horasTotales > 0;

    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `sidebar-${materia.codigo}`,
        data: { 
            origin: 'sidebar',
            materia: materia 
        },
        disabled: completo // 🟢 BLOQUEO: No permite arrastrar si está completa
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`
                relative p-3 rounded-lg border flex gap-3 items-center group transition-all select-none
                ${completo 
                    ? 'bg-green-50 border-green-300 cursor-not-allowed opacity-90' // Estilo VERDE y BLOQUEADO
                    : 'bg-white border-gray-200 hover:shadow-md hover:border-blue-300 cursor-grab active:cursor-grabbing' // Estilo NORMAL
                }
            `}
        >
            {/* Icono: Grip si se puede mover, Check si terminó */}
            <div className={completo ? "text-green-600" : "text-gray-300 group-hover:text-blue-400"}>
                {completo ? <CheckCircle2 size={18} /> : <GripVertical size={16} />}
            </div>

            <div className="flex-1 min-w-0">
                {/* Encabezado: Código e Indicador */}
                <div className="flex justify-between items-center mb-1">
                    <span className={`font-mono text-sm font-black tracking-tight ${completo ? 'text-green-800' : 'text-gray-800'}`}>
                        {materia.codigo}
                    </span>
                    
                    {/* Indicador de Horas */}
                    <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${completo ? 'bg-green-200 text-green-800 border-green-300' : 'bg-gray-100 text-gray-500'}`}>
                        {horasAsignadas} / {horasTotales}h
                    </div>
                </div>

                {/* Nombre de la materia */}
                <div className={`font-medium text-xs leading-tight line-clamp-2 ${completo ? 'text-green-700' : 'text-gray-600'}`} title={materia.nombre}>
                    {materia.nombre}
                </div>
                
                {/* Detalles extra (ocultos si está completo para limpiar ruido visual) */}
                {!completo && (
                    <div className="text-[9px] text-gray-400 mt-1 truncate flex gap-2">
                        <span>S{materia.semestre}</span>
                        <span>•</span>
                        <span className="truncate max-w-[120px]">{materia.carrera}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
