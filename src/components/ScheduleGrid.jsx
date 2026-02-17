import React from 'react';

const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const horas = Array.from({ length: 16 }, (_, i) => 7 + i); // 7:00 a 22:00

const ScheduleGrid = () => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
      <div className="grid grid-cols-7 border-b border-gray-200">
        {/* Celda vacía esquina superior izquierda */}
        <div className="p-3 font-bold text-center bg-gray-100 border-r">Hora</div>
        
        {/* Encabezados de Días */}
        {dias.map(dia => (
          <div key={dia} className="p-3 font-bold text-center bg-blue-100 text-blue-900 border-r last:border-r-0">
            {dia}
          </div>
        ))}
      </div>

      <div className="overflow-y-auto max-h-[600px]">
        {horas.map(hora => (
          <div key={hora} className="grid grid-cols-7 border-b border-gray-100 min-h-[60px]">
            {/* Columna de Hora */}
            <div className="p-2 text-xs font-bold text-gray-500 bg-gray-50 border-r flex items-center justify-center">
              {hora}:00 - {hora + 1}:00
            </div>

            {/* Celdas del Horario (Espacios vacíos por ahora) */}
            {dias.map(dia => (
              <div 
                key={`${dia}-${hora}`} 
                className="border-r last:border-r-0 p-1 hover:bg-gray-50 transition-colors relative group"
              >
                {/* Aquí irán las tarjetas de materias (droppable) */}
                <div className="h-full w-full border-2 border-transparent border-dashed group-hover:border-gray-300 rounded">
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScheduleGrid;