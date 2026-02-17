import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// USA LA MISMA CONFIGURACIÓN QUE YA TIENES EN TU OTRA APP
// (Cópiala de tu consola de Firebase -> Configuración del proyecto)
const firebaseConfig = {
  apiKey: "AIzaSyAMkuy8jW-uxMx9Xpq-MPmHkKsf8l7qKb8",
  authDomain: "menu-cafeteria-crpo.firebaseapp.com",
  databaseURL: "https://menu-cafeteria-crpo-default-rtdb.firebaseio.com", // <--- ESTO ES LO IMPORTANTE
  projectId: "menu-cafeteria-crpo",
  storageBucket: "menu-cafeteria-crpo.firebasestorage.app",
  messagingSenderId: "741029761582",
  appId: "1:741029761582:web:0256a9ea14385db5cd85bf"
};

// Inicializamos la app (si ya existe una instancia, esto no la duplica, la reutiliza)
const app = initializeApp(firebaseConfig);

// Obtenemos la referencia a la base de datos
export const db = getDatabase(app);