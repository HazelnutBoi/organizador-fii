import React from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { X, User, MapPin, AlertTriangle } from 'lucide-react';
import { getMateriaColor } from '../utils/colors';

export function DroppableCell({ 
    id, 
    asignacion, 
    onRemove, 
    onDocenteChange, 
    onTipoChange, 
    onSalonChange, 
    posiblesDocentes, 
    statusValidacion, 
    conflictos,
    isOverloaded
}) {
    // 1. Configuración del DROP (Recibir materias)
    const { setNodeRef: setDropRef, isOver } = useDroppable({
        id: id,
    });

    // 2. Configuración del DRAG (Mover materias)
    const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
        id: `grid-item-${id}`,
        data: { 
            origin: 'grid',
            cellId: id,
            asignacion: asignacion,
            materia: asignacion?.materia 
        },
        disabled: !asignacion?.materia // Solo se arrastra si hay materia
    });

    // Estilo dinámico para el movimiento y el color de fondo
    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.3 : 1,
        zIndex: isDragging ? 999 : 'auto',
        backgroundColor: isOver ? '#f0fdf4' : (asignacion?.materia ? getMateriaColor(asignacion.materia.codigo) : 'white'),
    };

    // Lógica de bordes para conflictos
    let borderClass = "border-transparent";
    if (conflictos?.salon || conflictos?.docente) borderClass = "border-red-500 border-2 shadow-red-200 shadow-md";
    else if (isOverloaded) borderClass = "border-orange-400 border-2";
    else if (isOver) borderClass = "border-green-400 border-2";

    return (
        <div 
            ref={setDropRef} 
            className={`h-full min-h-[110px] w-full relative transition-all ${statusValidacion === 'excedido' ? 'opacity-60 grayscale' : ''}`}
        >
            {asignacion?.materia ? (
                // BLOQUE DE MATERIA (Arrastrable)
                <div
                    ref={setDragRef}
                    {...listeners}
                    {...attributes}
                    style={style}
                    className={`h-full w-full p-1.5 flex flex-col gap-1 text-xs relative group cursor-grab active:cursor-grabbing border ${borderClass} rounded-sm shadow-sm hover:shadow-md transition-shadow`}
                >
                    {/* Botón Eliminar */}
                    <button 
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => onRemove(id)} 
                        className="absolute -top-1 -right-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-20 bg-white rounded-full border border-gray-200 p-0.5 shadow-sm"
                    >
                        <X size={12}/>
                    </button>

                    {/* Encabezado: Nombre y Alerta */}
                    <div className="flex justify-between items-start">
                        <span className="font-bold text-blue-900 leading-tight line-clamp-2 text-[10px]" title={asignacion.materia.nombre}>
                            {asignacion.materia.nombre}
                        </span>
                        {isOverloaded && (
                            <div title="Docente sobrecargado" className="animate-pulse">
                                <AlertTriangle size={12} className="text-orange-500" />
                            </div>
                        )}
                    </div>

                    {/* Selector de Docente */}
                    <div className="flex items-center gap-1 mt-auto">
                        <User size={10} className={conflictos?.docente ? "text-red-600" : "text-gray-500"}/>
                        <select 
                            onPointerDown={(e) => e.stopPropagation()} // Permite clicar sin arrastrar
                            className={`w-full bg-transparent border-b border-black/10 focus:border-blue-500 outline-none text-[9px] truncate cursor-pointer py-0.5 ${conflictos?.docente ? 'text-red-700 font-bold' : 'text-gray-800'}`}
                            value={asignacion.docente?.id || ""}
                            onChange={(e) => onDocenteChange(id, e.target.value)}
                        >
                            <option value="">Seleccionar...</option>
                            {posiblesDocentes.map((d, idx) => (
                                <option key={`${d.id}-${idx}`} value={d.id} disabled={d.disabled} className={d.disabled ? "bg-gray-100 font-bold text-center text-gray-400" : ""}>
                                    {d.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Input de Salón */}
                    <div className="flex items-center gap-1">
                        <MapPin size={10} className={conflictos?.salon ? "text-red-600" : "text-gray-500"}/>
                        <input 
                            onPointerDown={(e) => e.stopPropagation()}
                            className={`w-full bg-transparent border-b border-black/10 focus:border-blue-500 outline-none text-[9px] placeholder-gray-400 ${conflictos?.salon ? 'text-red-700 font-bold' : 'text-gray-700'}`}
                            placeholder="Salón..."
                            value={asignacion.salon || ""}
                            onChange={(e) => onSalonChange(id, e.target.value)}
                        />
                    </div>

                    {/* MENSAJES DE ERROR FLOTANTES */}
                    {(conflictos?.mensajeDocente || conflictos?.grupoConflictivo) && (
                        <div className="text-[8px] bg-red-100 text-red-800 px-1 rounded border border-red-200 font-bold truncate">
                            {conflictos.mensajeDocente || `Aula ocupada: ${conflictos.grupoConflictivo}`}
                        </div>
                    )}

                    {/* --- TU SELECTOR ORIGINAL DE T / L --- */}
                    <div className="flex gap-1 mt-1">
                         <button 
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={() => onTipoChange(id, 'T')}
                            className={`flex-1 text-[8px] font-bold py-0.5 rounded border transition-colors ${
                                asignacion.tipo === 'T' 
                                ? 'bg-blue-600 text-white border-blue-700 shadow-sm' 
                                : 'bg-white/50 text-gray-500 border-gray-300 hover:bg-white'
                            }`}
                        >
                            T
                        </button>
                        
                        {/* Solo muestra L si la materia tiene horas de lab */}
                        {(asignacion.materia.horasL > 0) && (
                            <button 
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={() => onTipoChange(id, 'L')}
                                className={`flex-1 text-[8px] font-bold py-0.5 rounded border transition-colors ${
                                    asignacion.tipo === 'L' 
                                    ? 'bg-purple-600 text-white border-purple-700 shadow-sm' 
                                    : 'bg-white/50 text-gray-500 border-gray-300 hover:bg-white'
                                }`}
                            >
                                L
                            </button>
                        )}
                    </div>

                </div>
            ) : (
                // CELDA VACÍA (Solo Drop)
                <div ref={setDragRef} className="w-full h-full flex items-center justify-center text-gray-200 hover:bg-gray-50/50 transition-colors">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </div>
            )}
        </div>
    );
}
