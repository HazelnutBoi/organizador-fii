import { useState, useEffect } from 'react';
import { ref, onValue, set } from 'firebase/database';
import { db } from '../firebaseConfig';

export function usePersistentState(key, initialValue) {
  const [state, setState] = useState(initialValue);
  const [loading, setLoading] = useState(true); // Variable de carga

  useEffect(() => {
    // Referencia a la base de datos
    const dataRef = ref(db, key);

    // Escuchar cambios en tiempo real
    const unsubscribe = onValue(dataRef, (snapshot) => {
      const data = snapshot.val();
      if (data !== null) {
        setState(data);
      } else {
        // Si no hay datos en la nube, mantenemos el valor inicial local
        setState(initialValue);
      }
      setLoading(false); // Terminó de cargar
    }, (error) => {
      console.error("Error leyendo Firebase:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [key]);

  // Función para guardar cambios
  const setValue = (newValue) => {
    try {
      const valueToStore = newValue instanceof Function ? newValue(state) : newValue;
      setState(valueToStore); // Actualiza visualmente rápido
      set(ref(db, key), valueToStore); // Manda a la nube
    } catch (error) {
      console.error("Error guardando en Firebase:", error);
    }
  };

  // IMPORTANTE: Devuelve 3 cosas: el dato, la función para cambiarlo, y si está cargando
  return [state, setValue, loading];
}