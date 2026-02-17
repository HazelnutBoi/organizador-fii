import React, { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';

const EditModal = ({ isOpen, onClose, data, onSave }) => {
  const [formData, setFormData] = useState(data || {});

  useEffect(() => {
    setFormData(data || {});
  }, [data]);

  if (!isOpen || !data) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[9999]">
      <div className="bg-white rounded-lg p-6 w-[500px] max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-6 border-b pb-2">
          <h3 className="text-xl font-bold text-gray-800">Editar Docente</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Nombre Completo</label>
            <input
              type="text"
              value={formData.nombre || ''}
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Clasificación */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Clasificación</label>
            <input
              type="text"
              value={formData.clasificacion || ''}
              onChange={(e) => setFormData({...formData, clasificacion: e.target.value})}
              className="w-full border border-gray-300 p-2 rounded text-sm text-gray-600"
            />
          </div>

          {/* Lista de Materias (Aquí se ven completas) */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
                Materias Habilitadas ({formData.materias?.length || 0})
            </label>
            <div className="bg-gray-50 border border-gray-200 rounded p-2 h-40 overflow-y-auto text-sm">
                {formData.materias && formData.materias.length > 0 ? (
                    <ul className="space-y-1">
                        {formData.materias.map((m, idx) => (
                            <li key={idx} className="flex justify-between items-center bg-white p-1 rounded border border-gray-100">
                                <span className="truncate flex-1" title={m.nombre}>
                                    <span className="font-mono text-xs text-blue-600 mr-2">{m.codigo}</span>
                                    {m.nombre}
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-400 text-center italic mt-10">Sin materias asignadas</p>
                )}
            </div>
          </div>

          <div className="pt-4 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 border border-gray-300 text-gray-700 p-2 rounded hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-1/2 bg-blue-600 text-white p-2 rounded hover:bg-blue-700 flex justify-center items-center gap-2"
            >
              <Save size={18} /> Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditModal;