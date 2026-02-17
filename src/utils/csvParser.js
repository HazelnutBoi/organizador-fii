import Papa from 'papaparse';

// Helper para limpiar texto (quita tildes y espacios extra para comparar cabeceras)
const normalizeHeader = (h) => h ? h.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";

// Busca el valor de una columna permitiendo variaciones en el nombre
const getValue = (row, possibleHeaders) => {
    if (!row) return "";
    const headers = Object.keys(row);
    // Buscamos si alguna cabecera del Excel coincide con las que esperamos
    const match = headers.find(h => possibleHeaders.includes(normalizeHeader(h)));
    return match ? (row[match] || "").trim() : "";
};

const fetchCsvText = async (path) => {
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error("No se pudo cargar el archivo");
    const reader = response.body.getReader();
    
    // USAMOS ISO-8859-1 PARA QUE EXCEL LEA BIEN LAS Ñ Y TILDES
    const decoder = new TextDecoder('iso-8859-1'); 
    
    let result = await reader.read();
    let csv = decoder.decode(result.value);
    while (!result.done) {
      result = await reader.read();
      csv += decoder.decode(result.value, { stream: !result.done });
    }
    return csv;
  } catch (e) {
    console.error("Error leyendo archivo:", path, e);
    return "";
  }
};

// --- CARGA DEL PLAN DE ESTUDIOS (MATERIAS) ---
export const loadPlanEstudios = async () => {
  try {
    const csvText = await fetchCsvText('./data/materias.csv');
    
    // Buscar donde empieza la tabla real (saltar títulos vacíos)
    const lines = csvText.split('\n');
    let startRow = 0;
    for(let i=0; i<Math.min(lines.length, 20); i++){
        const line = lines[i].toLowerCase();
        if(line.includes('asignatura') || line.includes('materia') || line.includes('nombre')) {
            startRow = i;
            break;
        }
    }
    const cleanCsv = lines.slice(startRow).join('\n');

    return new Promise((resolve) => {
      Papa.parse(cleanCsv, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const materias = [];
          
          results.data.forEach(row => {
            const codigo = getValue(row, ['cod. asig.', 'cod asig', 'codigo', 'cod']);
            const nombre = getValue(row, ['asignatura', 'nombre', 'materia', 'nombre asignatura']);
            
            if (!codigo && !nombre) return; 

            // Normalización de Semestre
            let sem = getValue(row, ['semestre', 'sem']);
            
            // NOTA: Aquí hemos quitado la línea que convertía '0' a '1'.
            // Ahora '0' pasa tal cual para que App.jsx lo maneje como anual.
            
            if (sem && sem.toLowerCase().includes('verano')) sem = 'VERANO';

            // Normalización de Año
            const rawAnio = getValue(row, ['ano', 'anio', 'year', 'nivel', 'ao']);
            
            materias.push({
              codigo: codigo || "S/C-" + Math.random().toString(36).substr(2, 5),
              nombre: nombre || "SIN NOMBRE",
              carrera: getValue(row, ['carrera', 'licenciatura', 'programa']) || "General",
              anio: rawAnio || "1", 
              semestre: sem,
              horasT: parseInt(getValue(row, ['clases', 't', 'ht', 'teoria'])) || 0,
              horasL: parseInt(getValue(row, ['lab.', 'lab', 'l', 'hl', 'practica'])) || 0
            });
          });
          resolve(materias);
        },
        error: (err) => resolve([])
      });
    });
  } catch (error) {
    console.error("Error cargando materias:", error);
    return [];
  }
};

// --- CARGA DE DOCENTES ---
export const loadDocentes = async (listaMaterias) => {
  try {
    const materiasMap = {};
    const safeLista = Array.isArray(listaMaterias) ? listaMaterias : [];
    
    // Mapa auxiliar para normalizar códigos (771 -> 0771)
    const normalizeCode = (c) => {
        if(!c) return "";
        let s = c.toString().trim().toUpperCase();
        if(s.length === 3 && !isNaN(s)) return "0" + s;
        return s;
    };

    safeLista.forEach(m => {
        if(m && m.codigo) materiasMap[normalizeCode(m.codigo)] = m;
    });

    const csvText = await fetchCsvText('./data/docentes.csv');
    
    const lines = csvText.split('\n');
    let startRow = 0;
    for(let i=0; i<Math.min(lines.length, 20); i++){
        const line = lines[i].toLowerCase();
        if(line.includes('cedula') || line.includes('nombre')) {
            startRow = i;
            break;
        }
    }
    const cleanCsv = lines.slice(startRow).join('\n');

    return new Promise((resolve) => {
      Papa.parse(cleanCsv, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const docentesMap = {};
          
          results.data.forEach(row => {
            const nombreDocente = getValue(row, ['nombre', 'nombre docente', 'profesor', 'empleado']);
            
            const rawCodAsig = getValue(row, ['cod asig', 'cod. asig.', 'codigo', 'materia', 'cod']);
            const codAsig = normalizeCode(rawCodAsig);
            
            let nombreAsig = getValue(row, ['nombre asignatura', 'materia', 'asignatura', 'descripcion']);

            if (!nombreDocente) return;

            if (!nombreAsig && codAsig && materiasMap[codAsig]) {
                nombreAsig = materiasMap[codAsig].nombre;
            }

            if (!docentesMap[nombreDocente]) {
              docentesMap[nombreDocente] = {
                id: nombreDocente, 
                nombre: nombreDocente,
                clasificacion: getValue(row, ['clasificacion', 'tipo', 'categoria']),
                horasTope: 0, // Por defecto sin límite
                materias: []
              };
            }

            if (codAsig || nombreAsig) {
                const existe = docentesMap[nombreDocente].materias.some(m => 
                    (m.codigo === codAsig) || (m.nombre === nombreAsig)
                );

                if (!existe) {
                  docentesMap[nombreDocente].materias.push({
                    codigo: codAsig || "GEN-" + Math.random(), 
                    nombre: nombreAsig || "Materia Desconocida",
                    horasT: 0, 
                    horasL: 0
                  });
                }
            }
          });
          
          resolve(Object.values(docentesMap).sort((a,b) => a.nombre.localeCompare(b.nombre)));
        },
        error: (err) => resolve([])
      });
    });
  } catch (error) {
    return [];
  }
};