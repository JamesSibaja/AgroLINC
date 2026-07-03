/* =========================================
   DEBUG MODE
========================================= */
const DEBUG = true;
const diplomaTotal = 7;

function debugLog(title, data) {
  if (!DEBUG) return;
  console.group(title);
  console.log(data);
  if (Array.isArray(data)) {
    console.table(data);
  }
  console.groupEnd();
}

/* =========================================
   CSV PARSER
========================================= */
function parseCSV(text) {
  return text
    .trim()
    .split("\n")
    .map(row => {
      return row
        .split(",")
        .map(value =>
          value
            .replace(/^"|"$/g, "")
            .trim()
        );
    });
}

/* =========================================
   NORMALIZER
========================================= */
function clean(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

// FUNCIÓN AUXILIAR AUTOMATIZADA: Asigna iconos minimalistas por palabra clave
function getCourseIcon(courseName) {
  const name = String(courseName || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const iconRules = [
    { keywords: ['drone', 'vant', 'vuelo', 'vehiculo aereo'], icon: 'fa-helicopter-symbol' }, 
    { keywords: ['basico'], icon: 'fa-cube' }, 
    { keywords: ['intermedio'], icon: 'fa-cubes' }, 
    { keywords: ['laser', 'corte', 'cnc'], icon: 'fa-scissors' }, 
    { keywords: ['geoespacial', 'mapa', 'gps', 'kobo', 'territorio'], icon: 'fa-map-location-dot' },
    { keywords: ['microcontrolador', 'sensor', 'actuador'], icon: 'fa-microchip' },
    { keywords: [ 'electronico', 'electricidad'], icon: 'fa-bolt' },
    { keywords: ['iot', 'internet de las cosas'], icon: 'fa-wifi' },
    { keywords: ['automatizacion', 'robot', 'programacion'], icon: 'fa-robot' },
    { keywords: ['fabricacion digital'], icon: 'fa-industry' },
    { keywords: ['innovacion', 'canvas', 'modelo', 'soluciones'], icon: 'fa-lightbulb' }
  ];

  for (const rule of iconRules) {
    if (rule.keywords.some(keyword => name.includes(keyword))) {
      return rule.icon;
    }
  }
  return 'fa-graduation-cap'; 
}

/* =========================================
   URLS (Google Sheets CSV)
========================================= */
const CURSOS_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQen9jQ8hTfq8nTuYdXS3JXnha10XGyrK42n57v2UT8kEvN3UlrfGiXcKaLY2ZhX8YN2IjWyiUqj-_q/pub?gid=1008621981&single=true&output=csv";
const ESTUDIANTES_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQen9jQ8hTfq8nTuYdXS3JXnha10XGyrK42n57v2UT8kEvN3UlrfGiXcKaLY2ZhX8YN2IjWyiUqj-_q/pub?gid=1841377808&single=true&output=csv";
const EVENTOS_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQen9jQ8hTfq8nTuYdXS3JXnha10XGyrK42n57v2UT8kEvN3UlrfGiXcKaLY2ZhX8YN2IjWyiUqj-_q/pub?gid=1458346686&single=true&output=csv";
const KPI_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQen9jQ8hTfq8nTuYdXS3JXnha10XGyrK42n57v2UT8kEvN3UlrfGiXcKaLY2ZhX8YN2IjWyiUqj-_q/pub?gid=1244953961&single=true&output=csv";
const CALENDARIO_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQen9jQ8hTfq8nTuYdXS3JXnha10XGyrK42n57v2UT8kEvN3UlrfGiXcKaLY2ZhX8YN2IjWyiUqj-_q/pub?gid=933585437&single=true&output=csv";
const BLOG_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQen9jQ8hTfq8nTuYdXS3JXnha10XGyrK42n57v2UT8kEvN3UlrfGiXcKaLY2ZhX8YN2IjWyiUqj-_q/pub?gid=670892286&single=true&output=csv";
const BLOG_IMAGENES_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQen9jQ8hTfq8nTuYdXS3JXnha10XGyrK42n57v2UT8kEvN3UlrfGiXcKaLY2ZhX8YN2IjWyiUqj-_q/pub?gid=2108075240&single=true&output=csv";

// Memoria Caché en sesión para optimizar ancho de banda y velocidad de consulta
const dataCache = { estudiantes: null, cursos: null, eventos: null };

async function fetchCSV(url, name) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
    const text = await res.text();
    debugLog(`CSV RAW → ${name}`, text);
    const rows = parseCSV(text);
    debugLog(`CSV PARSED → ${name}`, rows);
    return rows;
  } catch (error) {
    console.error(`ERROR FETCH ${name}`, error);
    return [];
  }
}

async function fetchEstudiantes() {
  if (dataCache.estudiantes) return dataCache.estudiantes;
  const rows = await fetchCSV(ESTUDIANTES_URL, "ESTUDIANTES");
  dataCache.estudiantes = rows.slice(1).map(r => ({ cedula: clean(r[0]), nombre: r[1], correo: r[2], ruta: clean(r[3]) }));
  return dataCache.estudiantes;
}

async function fetchCursos() {
  if (dataCache.cursos) return dataCache.cursos;
  const rows = await fetchCSV(CURSOS_URL, "CURSOS");
  dataCache.cursos = rows.slice(1).map(r => ({ id: clean(r[0]), nombre: r[1], descripcion: r[2], ruta: clean(r[3]), requisito1: clean(r[4]), requisito2: clean(r[5]), cursoFinal: clean(r[6]), etapa: r[7] }));
  return dataCache.cursos;
}

async function fetchEventos() {
  if (dataCache.eventos) return dataCache.eventos;
  const rows = await fetchCSV(EVENTOS_URL, "EVENTOS");
  dataCache.eventos = rows.slice(1).map(r => ({ cedula: clean(r[0]), idCurso: clean(r[1]), fecha: r[2], estado: clean(r[3]) }));
  return dataCache.eventos;
}

// Variables Globales Persistentes
let estudianteGlobal = null;
let cursosRutaGlobal = [];
let tuplasGlobales = [];

/* =========================================
   SISTEMA DE CONSULTA DE RUTAS
========================================= */
async function consultarRuta() {
  const cedula = clean(document.getElementById("cedulaInput").value);
  if (!cedula) {
    alert("Ingrese una identificación");
    return;
  }

  const loader = document.getElementById('searchLoader');
  if (loader) loader.style.display = 'block';

  try {
    const estudiantes = await fetchEstudiantes();
    const cursos = await fetchCursos();
    const eventos = await fetchEventos();

    const estudiante = estudiantes.find(e => e.cedula === cedula);
    if (!estudiante) {
      alert("No se encontró el participante institucional");
      if (loader) loader.style.display = 'none';
      return;
    }

    estudianteGlobal = estudiante;

    document.getElementById("studentName").textContent = estudiante.nombre;
    document.getElementById("studentRoute").textContent = `Ruta ${estudiante.ruta}`;

    const iniciales = estudiante.nombre.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
    document.getElementById("profileAvatar").textContent = iniciales;

    const eventosCompletados = eventos.filter(ev => ev.cedula === cedula && ev.estado.includes("complet"));
    const cursosCompletadosTuplas = eventosCompletados.map(ev => [ev.idCurso, ev.fecha]);
    tuplasGlobales = cursosCompletadosTuplas;

    const cursosRuta = cursos
      .filter(c => c.ruta === estudiante.ruta)
      .sort((a, b) => Number(a.etapa) - Number(b.etapa));
    cursosRutaGlobal = cursosRuta;

    const completados = cursosRuta.filter(c => cursosCompletadosTuplas.some(t => t[0] === c.id)).length;
    const porcentaje = (completados / diplomaTotal) * 100;

    document.getElementById("progressText").textContent = `${completados}/${diplomaTotal}`;
    document.getElementById("progressFill").style.width = `${porcentaje}%`;

    const grid = document.getElementById("coursesGrid");
    grid.innerHTML = "";
    let disponibles = 0;

    cursosRuta.forEach(curso => {
      let estadoClase = "locked";
      let estadoTexto = "Bloqueado";
      let fechaTextoHTML = ""; 
    
      const tuplaCurso = cursosCompletadosTuplas.find(tupla => tupla[0] === curso.id);
      const completado = !!tuplaCurso; 
    
      if (completado) {
        estadoClase = "completed";
        estadoTexto = "Completado";
        fechaTextoHTML = `<div class="course-date">Completado el: ${tuplaCurso[1]}</div>`;
      } else {
        let disponible = false;
        const r1 = curso.requisito1;
        const r2 = curso.requisito2;
        const esFinal = curso.cursoFinal ? curso.cursoFinal.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
    
        if (!r1 && !r2 && esFinal !== "si") disponible = true;
        if (r1 && !r2 && cursosCompletadosTuplas.some(t => t[0] === r1)) disponible = true;
        if (r1 && r2 && cursosCompletadosTuplas.some(t => t[0] === r1) && cursosCompletadosTuplas.some(t => t[0] === r2)) disponible = true;
        if (esFinal === "si" && completados >= 6) disponible = true;
        
        if (disponible) {
          estadoClase = "available";
          estadoTexto = "Disponible";
          disponibles++;
        }
      }
    
      const card = document.createElement("div");
      card.className = `course-card ${estadoClase}`;
      card.innerHTML = `
        <div class="course-top">
          <i class="fa-solid ${getCourseIcon(curso.nombre)} course-card-icon"></i>
          <span class="course-status ${estadoClase}">${estadoTexto}</span>
        </div>
        <h4>${curso.nombre}</h4>
        <span class="course-stage" style="display:block; margin-top:5px; font-size:0.8rem; opacity:0.7;">Etapa ${curso.etapa}</span>
        ${fechaTextoHTML}
      `;
    
      card.addEventListener("click", () => abrirModalDetallado(curso, estadoClase));
      grid.appendChild(card);
    });

    document.getElementById("completedCount").textContent = completados;
    document.getElementById("availableCount").textContent = disponibles;

    if (typeof inyectarBotonCompartir === "function") inyectarBotonCompartir();

  } catch (error) {
    console.error("ERROR GENERAL EN CONSULTA", error);
    alert("Error procesando la información de la base de datos");
  } finally {
    if (loader) loader.style.display = 'none';
  }
}

/* =========================================================
   MOTOR DINÁMICO DE MODALES (CORREGIDO)
========================================================= */
function abrirModalDetallado(curso, estado) {
  const modal = document.getElementById('courseModal');
  if (!modal) return;

  document.getElementById('modalStage').innerText = `Etapa ${curso.etapa || 'General'}`;
  document.getElementById('modalTitle').innerText = curso.nombre;
  
  const container = document.getElementById('modalDescription');
  container.innerHTML = ''; 

  if (estado === 'available') {
    container.innerHTML = `
      <p>${curso.descripcion || 'Sin descripción disponible por el momento.'}</p>
      <div class="modal-requirement-box" style="border-left: 5px solid var(--primary); margin-top: 1.5rem;">
        <h4><i class="fa-solid fa-calendar-check"></i> Convocatoria Disponible</h4>
        <p>¡Cumples con los prerrequisitos necesarios! Puedes matricularte de forma directa en este módulo usando el enlace oficial:</p>
        <a href="https://forms.gle/3hsVm6HF35N531JG7" target="_blank" class="req-item-link" style="justify-content: center; background: var(--primary); color: white; font-weight: bold; border-radius:12px; display: flex; text-decoration: none;">
          <div class="req-text-container" style="color: white; padding: 10px 0;">
            <i class="fa-solid fa-file-signature"></i>
            <span>Formulario de Matrícula AgroLINC</span>
          </div>
        </a>
      </div>
    `;
  } 
  else if (estado === 'completed') {
    container.innerHTML = `
      <p><strong>¡Felicitaciones! Has completado y aprobado con éxito este módulo formativo.</strong></p>
      <p>${curso.descripcion || ''}</p>
      <div class="modal-requirement-box" style="border-left: 5px solid var(--success); margin-top: 1.5rem;">
        <span class="req-status-badge completed">Aprobado</span>
        <p style="margin-top: 8px; font-size: 0.9rem; color: var(--muted);">Este conocimiento ya forma parte de tu perfil tecnológico.</p>
      </div>
    `;
  } 
  else if (estado === 'locked') {
    container.innerHTML = `
      <p>${curso.descripcion || 'Sin descripción disponible.'}</p>
      <div class="modal-requirement-box" style="border-left: 5px solid var(--muted); margin-top: 1.5rem; background: #f8fafc;">
        <h4><i class="fa-solid fa-lock"></i> Requisitos de Acceso Requeridos</h4>
        <p>Para desbloquear este bloque formativo, es necesario que apruebes primero las asignaciones previas de la ruta:</p>
        ${curso.requisito1 ? `<div class="req-item-link"><div class="req-text-container"><i class="fa-solid fa-code-branch"></i> <span>Módulo: ${curso.requisito1.toUpperCase()}</span></div><span class="req-status-badge locked">Pendiente</span></div>` : ''}
        ${curso.requisito2 ? `<div class="req-item-link"><div class="req-text-container"><i class="fa-solid fa-code-branch"></i> <span>Módulo: ${curso.requisito2.toUpperCase()}</span></div><span class="req-status-badge locked">Pendiente</span></div>` : ''}
      </div>
    `;
  }

  modal.classList.add('active');
}

// Evento de cierre nativo para asegurar usabilidad del modal
document.addEventListener('DOMContentLoaded', () => {
  const closeBtn = document.querySelector('#courseModal .modal-close, #courseModal .modal-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      document.getElementById('courseModal').classList.remove('active');
    });
  }
});