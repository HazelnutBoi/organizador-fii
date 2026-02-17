// Paleta extendida de 50 colores pastel vibrantes pero legibles
const PASTEL_PALETTE = [
    // Rojos y Rosas
    "#FFEBEE", "#FFCDD2", "#EF9A9A", "#F8BBD0", "#F48FB1", 
    "#FCE4EC", "#F06292", "#FF80AB", "#FF4081", "#F50057", // (Usar con cuidado los oscuros, mejor claros)
    
    // Mejorados para lectura (Texto oscuro):
    "#FFCDD2", // Rojo suave
    "#F8BBD0", // Rosa suave
    "#E1BEE7", // Púrpura suave
    "#D1C4E9", // Violeta profundo suave
    "#C5CAE9", // Indigo suave
    "#BBDEFB", // Azul suave
    "#B3E5FC", // Azul claro
    "#B2EBF2", // Cyan suave
    "#B2DFDB", // Teal suave
    "#C8E6C9", // Verde suave
    "#DCEDC8", // Verde lima suave
    "#F0F4C3", // Lima
    "#FFF9C4", // Amarillo suave
    "#FFECB3", // Ambar suave
    "#FFE0B2", // Naranja suave
    "#FFCCBC", // Naranja profundo suave
    "#D7CCC8", // Marrón suave
    "#F5F5F5", // Gris muy claro
    "#CFD8DC", // Gris azulado
    
    // Variaciones extra vibrantes pastel
    "#FF9E80", "#FF8A80", "#EA80FC", "#B388FF", "#8C9EFF", 
    "#82B1FF", "#80D8FF", "#84FFFF", "#A7FFEB", "#B9F6CA", 
    "#CCFF90", "#F4FF81", "#FFFF8D", "#FFE57F", "#FFD180",

    // Tonos fríos extra
    "#E0F7FA", "#E0F2F1", "#E8F5E9", "#F3E5F5", "#E8EAF6",
    "#E3F2FD", "#F1F8E9", "#FFF8E1", "#ECEFF1", "#FAFAFA",
    "#D1C4E9", "#C5CAE9", "#BBDEFB", "#B2DFDB", "#FFCCBC"
];

// Función optimizada para distribuir mejor los colores
export const getMateriaColor = (codigo) => {
    if (!codigo) return "#FFFFFF";
    
    let hash = 0;
    // Algoritmo de hash un poco más complejo para evitar repeticiones en códigos parecidos
    for (let i = 0; i < codigo.length; i++) {
        hash = codigo.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Asegurar número positivo
    const index = Math.abs(hash) % PASTEL_PALETTE.length;
    
    return PASTEL_PALETTE[index];
};