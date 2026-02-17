import React from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { X, User, MapPin, AlertCircle, Clock } from 'lucide-react';
import { getMateriaColor } from '../utils/colors'; // Asegúrate de importar esto

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
    // 1. Configuración del DROP (Recibir materias nuevas)
    const { setNodeRef: setDropRef, isOver } = useDroppable({
        id: id,
    });

    // 2. Configuración del DRAG (Mover materias existentes)
    // Solo activamos el drag si hay una materia asignada
    const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
        id: `grid-item-${id}`,
        data: { 
            origin: 'grid', // Identificador clave para App.jsx
            cellId: id,
            asignacion: asignacion 
        },
        disabled: !asignacion?.materia // No se puede arrastrar si está vacío
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.3 : 1, // Se hace transparente al arrastrar
        zIndex: isDragging ? 999 : 'auto',
        backgroundColor: isOver ? '#f0fdf4' : (asignacion?.materia ? getMateriaColor(asignacion.materia.codigo) : 'white'),
    };

    // Si hay conflictos, pintamos bordes
    let borderClass = "border-transparent";
    if (conflictos?.salon || conflictos?.docente) borderClass = "border-red-500 border-2";
    else if (isOverloaded) borderClass = "border-orange-400 border-2";
    else if (isOver) borderClass = "border-green-400 border-2";

    return (
        <div 
            ref={setDropRef} 
            className={`h-full min-h-[110px] w-full relative transition-colors ${statusValidacion === 'excedido' ? 'opacity-50' : ''}`}
        >
            {asignacion?.materia ? (
                // BLOQUE DE MATERIA (Arrastrable)
                <div
                    ref={setDragRef}
                    {...listeners}
                    {...attributes}
                    style={style}
                    className={`h-full w-full p-1.5 flex flex-col gap-1 text-xs relative group cursor-grab active:cursor-grabbing border ${borderClass}`}
                >
                    {/* Botón Eliminar (Evitamos que active el drag) */}
                    <button 
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => onRemove(id)} 
                        className="absolute top-0.5 right-0.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white/50 rounded-full p-0.5"
                    >
                        <X size={12}/>
                    </button>

                    {/* Encabezado: Código y Tipo */}
                    <div className="flex justify-between items-start">
                        <span className="font-bold text-blue-900 leading-tight line-clamp-2" title={asignacion.materia.nombre}>
                            {asignacion.materia.nombre}
                        </span>
                        <select 
                            onPointerDown={(e) => e.stopPropagation()} // Importante para poder clicar sin arrastrar
                            value={asignacion.tipo || 'T'} 
                            onChange={(e) => onTipoChange(id, e.target.value)}
                            className="text-[9px] font-bold bg-white/50 border rounded px-0.5 text-gray-700 cursor-pointer hover:bg-white"
                        >
                            <option value="T">T</option>
                            <option value="L">L</option>
                        </select>
                    </div>
                    
                    {/* Selección de Docente */}
                    <div className="flex items-center gap-1 mt-auto">
                        <User size={10} className={conflictos?.docente ? "text-red-500" : (isOverloaded ? "text-orange-500" : "text-gray-400")}/>
                        <select 
                            onPointerDown={(e) => e.stopPropagation()}
                            className={`w-full bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none text-[10px] truncate ${conflictos?.docente ? 'text-red-600 font-bold' : 'text-gray-700'}`}
                            value={asignacion.docente?.id || ""}
                            onChange={(e) => onDocenteChange(id, e.target.value)}
                        >
                            <option value="">Seleccionar...</option>
                            {posiblesDocentes.map((d) => (
                                <option key={d.id} value={d.id} disabled={d.disabled} className={d.disabled ? "bg-gray-100 font-bold text-center" : ""}>
                                    {d.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Input de Salón */}
                    <div className="flex items-center gap-1">
                        <MapPin size={10} className={conflictos?.salon ? "text-red-500" : "text-gray-400"}/>
                        <input 
                            onPointerDown={(e) => e.stopPropagation()}
                            className={`w-full bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none text-[10px] ${conflictos?.salon ? 'text-red-600 font-bold' : 'text-gray-600'}`}
                            placeholder="Salón"
                            value={asignacion.salon || ""}
                            onChange={(e) => onSalonChange(id, e.target.value)}
                        />
                    </div>

                    {/* Mensajes de Error */}
                    {conflictos?.mensajeDocente && (
                        <div className="absolute bottom-0 left-0 right-0 bg-red-100 text-red-700 text-[8px] p-0.5 text-center truncate border-t border-red-200" title={conflictos.mensajeDocente}>
                            {conflictos.mensajeDocente}
                        </div>
                    )}
                    {conflictos?.grupoConflictivo && (
                        <div className="absolute bottom-0 left-0 right-0 bg-red-100 text-red-700 text-[8px] p-0.5 text-center truncate border-t border-red-200">
                            Ocupado en {conflictos.grupoConflictivo}
                        </div>
                    )}
                </div>
            ) : (
                // CELDA VACÍA (Solo Drop)
                <div ref={setDragRef} className="w-full h-full flex items-center justify-center text-gray-200 hover:bg-gray-50">
                    <PlusIcon />
                </div>
            )}
        </div>
    );
}

// Icono simple para celda vacía
const PlusIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);
