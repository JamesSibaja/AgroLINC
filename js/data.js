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
   URLS
========================================= */

const CURSOS_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQen9jQ8hTfq8nTuYdXS3JXnha10XGyrK42n57v2UT8kEvN3UlrfGiXcKaLY2ZhX8YN2IjWyiUqj-_q/pub?gid=1008621981&single=true&output=csv";

const ESTUDIANTES_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQen9jQ8hTfq8nTuYdXS3JXnha10XGyrK42n57v2UT8kEvN3UlrfGiXcKaLY2ZhX8YN2IjWyiUqj-_q/pub?gid=1841377808&single=true&output=csv";

const EVENTOS_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQen9jQ8hTfq8nTuYdXS3JXnha10XGyrK42n57v2UT8kEvN3UlrfGiXcKaLY2ZhX8YN2IjWyiUqj-_q/pub?gid=1458346686&single=true&output=csv";

const KPI_URL = 
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQen9jQ8hTfq8nTuYdXS3JXnha10XGyrK42n57v2UT8kEvN3UlrfGiXcKaLY2ZhX8YN2IjWyiUqj-_q/pub?gid=1244953961&single=true&output=csv";

const CALENDARIO_URL = 
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQen9jQ8hTfq8nTuYdXS3JXnha10XGyrK42n57v2UT8kEvN3UlrfGiXcKaLY2ZhX8YN2IjWyiUqj-_q/pub?gid=933585437&single=true&output=csv";

/* =========================================
   BLOG
========================================= */

const BLOG_URL =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vQen9jQ8hTfq8nTuYdXS3JXnha10XGyrK42n57v2UT8kEvN3UlrfGiXcKaLY2ZhX8YN2IjWyiUqj-_q/pub?gid=670892286&single=true&output=csv";

const BLOG_IMAGENES_URL =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vQen9jQ8hTfq8nTuYdXS3JXnha10XGyrK42n57v2UT8kEvN3UlrfGiXcKaLY2ZhX8YN2IjWyiUqj-_q/pub?gid=2108075240&single=true&output=csv";

async function fetchBlog() {
  const noticiasRows = await fetchCSV(BLOG_URL, "BLOG");
  const imagenesRows = await fetchCSV(BLOG_IMAGENES_URL, "BLOG_IMAGENES");

  const imagenes = imagenesRows.slice(1).map(r => ({
    noticia: clean(r[1]),
    imagen: clean(r[0])
  }));

  return noticiasRows.slice(1).map(r => {
    const id = clean(r[0]);
    return {
      id,
      fecha: clean(r[1]),
      titulo: clean(r[2]),
      texto: clean(r[3]),
      imagenes: imagenes
        .filter(i => i.noticia === id)
        .map(i => `assets/images/blog/${i.imagen}`)
    };
  });
}

/* =========================================
   FETCH CSV
========================================= */

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

/* =========================================
   FETCHERS
========================================= */

async function fetchKPI() {
  const res = await fetch(KPI_URL);
  const text = await res.text();
  const rows = parseCSV(text);
  return rows.slice(1).map(r => {
    const nombreOriginal = String(r[0] || "").replace(/\r/g, "").replace(/\n/g, " ").trim();
    return { nombre: nombreOriginal, valor: clean(r[1]) };
  });
}

async function fetchCursos() {
  const rows = await fetchCSV(CURSOS_URL, "CURSOS");
  const data = rows.slice(1).map(r => ({
    id: clean(r[0]),
    nombre: r[1],
    descripcion: r[2],
    ruta: clean(r[3]),
    requisito1: clean(r[4]),
    requisito2: clean(r[5]),
    cursoFinal: clean(r[6]),
    etapa: r[7]
  }));
  debugLog("CURSOS LIMPIOS", data);
  return data;
}

async function fetchCalendario() {
  const rows = await fetchCSV(CALENDARIO_URL, "CALENDARIO");
  return rows.slice(1).map(r => ({
    fecha: r[0],
    id: clean(r[1]),
    min: Number(r[3]),
    max: Number(r[4]),
    inscritos: Number(r[5]),
    enlace: r[6],
    espera: Number(r[7]),
    cancelados: Number(r[8])
  }));
}

async function fetchEstudiantes() {
  const rows = await fetchCSV(ESTUDIANTES_URL, "ESTUDIANTES");
  const data = rows.slice(1).map(r => ({
    cedula: clean(r[0]),
    nombre: r[1],
    correo: r[2],
    ruta: clean(r[3])
  }));
  debugLog("ESTUDIANTES LIMPIOS", data);
  return data;
}

async function fetchEventos() {
  const rows = await fetchCSV(EVENTOS_URL, "EVENTOS");
  const data = rows.slice(1).map(r => ({
    cedula: clean(r[0]),
    idCurso: clean(r[1]),
    fecha: r[2],
    estado: clean(r[3])
  }));
  debugLog("EVENTOS LIMPIOS", data);
  return data;
}

// Variables Globales Persistentes
let estudianteGlobal = null;
let cursosRutaGlobal = [];
let tuplasGlobales = [];

/* =========================================
   CONSULTA
========================================= */

async function consultarRuta() {
  const cedula = clean(document.getElementById("cedulaInput").value);
  if (!cedula) {
    alert("Ingrese una identificación");
    return;
  }

  const loader = document.getElementById('searchLoader');
  if (loader) loader.style.display = 'block';

  console.clear();

  try {
    const estudiantes = await fetchEstudiantes();
    const cursos = await fetchCursos();
    const eventos = await fetchEventos();

    /* =====================================
       BUSCAR ESTUDIANTE
    ===================================== */
    const estudiante = estudiantes.find(e => e.cedula === cedula);
    debugLog("ESTUDIANTE ENCONTRADO", estudiante);

    if (!estudiante) {
      alert("No se encontró el participante");
      if (loader) loader.style.display = 'none';
      return;
    }

    estudianteGlobal = estudiante;

    /* =====================================
       PERFIL
    ===================================== */
    document.getElementById("studentName").textContent = estudiante.nombre;
    document.getElementById("studentRoute").textContent = `Ruta ${estudiante.ruta}`;

    const iniciales = estudiante.nombre
      .split(" ")
      .map(n => n[0])
      .join("")
      .substring(0, 2);

    document.getElementById("profileAvatar").textContent = iniciales;

    /* =====================================
       EVENTOS COMPLETADOS
    ===================================== */
    const eventosCompletados = eventos.filter(ev => {
      const mismaCedula = ev.cedula === cedula;
      const aprobado = ev.estado.includes("complet");
      return mismaCedula && aprobado;
    });

    const cursosCompletadosTuplas = eventosCompletados.map(ev => [
      ev.idCurso, 
      ev.fecha
    ]);
    
    tuplasGlobales = cursosCompletadosTuplas; 

    /* =====================================
       CURSOS DE LA RUTA
    ===================================== */
    const cursosRuta = cursos
      .filter(c => c.ruta === estudiante.ruta)
      .sort((a, b) => Number(a.etapa) - Number(b.etapa));

    cursosRutaGlobal = cursosRuta; 

    /* =====================================
       PROGRESO
    ===================================== */
    const cursosFiltradosConFecha = cursosRuta
      .map(c => {
        const tuplaAsociada = cursosCompletadosTuplas.find(tupla => tupla[0] === c.id);
        if (tuplaAsociada) {
          return { ...c, fechaCompletado: tuplaAsociada[1] };
        }
        return null;
      })
      .filter(c => c !== null);

    const completados = cursosFiltradosConFecha.length;
    const porcentaje = (completados / diplomaTotal) * 100;

    document.getElementById("progressText").textContent = `${completados}/${diplomaTotal}`;
    document.getElementById("progressFill").style.width = `${porcentaje}%`;

    /* =====================================
       GRID DE TARJETAS
    ===================================== */
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
    
        if (!r1 && !r2 && esFinal !== "si") {
          disponible = true;
        }
        if (r1 && !r2 && cursosCompletadosTuplas.some(tupla => tupla[0] === r1)) {
          disponible = true;
        }
        if (r1 && r2 && cursosCompletadosTuplas.some(tuple => tuple[0] === r1) && cursosCompletadosTuplas.some(tuple => tuple[0] === r2)) {
          disponible = true;
        }
        if (esFinal === "si" && completados >= 6) {
          disponible = true;
        }
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
          <span class="course-status ${estadoClase}">
            ${estadoTexto}
          </span>
        </div>
        <h4>${curso.nombre}</h4>
        <span class="course-stage" style="display:block; margin-top:5px; font-size:0.8rem; opacity:0.7;">
          Etapa ${curso.etapa}
        </span>
        ${fechaTextoHTML}
      `;
    
      card.addEventListener("click", () => {
        abrirModalDetallado(curso, estadoClase);
      });
    
      grid.appendChild(card);
    });

    document.getElementById("completedCount").textContent = completados;
    document.getElementById("availableCount").textContent = disponibles;

    // Inyectar el botón renovado de descarga en el perfil
    inyectarBotonCompartir();

  } catch (error) {
    console.error("ERROR GENERAL", error);
    alert("Error cargando datos");
  } finally {
    if (loader) loader.style.display = 'none';
  }
}

/* =========================================================
   MOTOR DINÁMICO DE SUB-MODALES
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
      <div class="modal-requirement-box" style="border-left: 5px solid var(--primary);">
        <h4><i class="fa-solid fa-calendar-check"></i> Convocatoria Disponible</h4>
        <p>¡Cumples con los prerrequisitos! Puedes matricularte de forma directa en este módulo usando el enlace oficial:</p>
        <a href="https://forms.gle/3hsVm6HF35N531JG7" target="_blank" class="req-item-link" style="justify-content: center; background: var(--primary); color: white; font-weight: bold; border-radius:12px;">
          <div class="req-text-container" style="color: white;">
            <i class="fa-solid fa-file-signature"></i>
            <span>Formulario de Matrícula AgroLINC</span>
          </div>
        </a>
      </div>
    `;
  } 
  else if (estado === 'completed') {
    container.innerHTML = `
      <p><strong>¡Felicitaciones! Has completado y aprobado con éxito este módulo.</strong></p>
      <p>${curso.descripcion || ''}</p>
      <h4 style="margin-top:1.2rem;"><i class="fa-solid fa-map"></i> Mapa de Contenidos Desarrollados:</h4>
      <img src="assets/images/rutas/default-contenido.jpg" alt="Contenidos AgroLINC" class="modal-image-content" onerror="this.src='https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=600&q=80'">
    `;
  } 
  else if (estado === 'locked') {
    let htmlRequisitos = '';
    
    [curso.requisito1, curso.requisito2].forEach(reqId => {
      if (reqId && reqId !== '-') {
        const reqCurso = cursosRutaGlobal.find(c => c.id === reqId);
        if (reqCurso) {
          const esAprobado = tuplasGlobales.some(t => t[0] === reqCurso.id);
          
          let reqEstadoTexto = 'Bloqueado';
          let reqEstadoClase = 'locked';
          let reqIcono = 'fa-lock';

          if (esAprobado) {
            reqEstadoTexto = 'Completo';
            reqEstadoClase = 'completed';
            reqIcono = 'fa-circle-check';
          } else {
            let reqDisponible = false;
            const r1 = reqCurso.requisito1;
            const r2 = reqCurso.requisito2;
            const esFinalReq = reqCurso.cursoFinal ? reqCurso.cursoFinal.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";

            if (!r1 && !r2 && esFinalReq !== "si") reqDisponible = true;
            if (r1 && !r2 && tuplasGlobales.some(t => t[0] === r1)) reqDisponible = true;
            if (r1 && r2 && tuplasGlobales.some(t => t[0] === r1) && tuplasGlobales.some(t => t[0] === r2)) reqDisponible = true;

            if (reqDisponible) {
              reqEstadoTexto = 'Disponible';
              reqEstadoClase = 'available';
              reqIcono = 'fa-unlock';
            }
          }
          
          htmlRequisitos += `
            <div class="req-item-link" onclick="cambiarFocoModal('${reqCurso.id}')" role="button" title="Haga clic para evaluar este curso">
              <div class="req-text-container">
                <i class="fa-solid ${getCourseIcon(reqCurso.nombre)}"></i>
                <span>${reqCurso.nombre}</span>
              </div>
              <span class="req-status-badge ${reqEstadoClase}">
                <i class="fa-solid ${reqIcono}" style="font-size:0.7rem; margin-right:2px;"></i> ${reqEstadoTexto}
              </span>
            </div>
          `;
        }
      }
    });

    let aclaracionFinal = '';
    const esFinal = curso.cursoFinal ? curso.cursoFinal.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
    if (esFinal === 'si') {
      const totalLleva = tuplasGlobales.length;
      const faltan = Math.max(0, 6 - totalLleva);
      aclaracionFinal = `
        <div class="modal-requirement-box" style="border-left: 5px solid #eab308; background: #fef08a; color: #713f12; margin-top:10px;">
          <strong>Módulo Final de Graduación</strong>
          <p>Este bloque requiere la aprobación de un mínimo de 6 módulos en la plataforma. Actualmente registras <strong>${totalLleva} aprobados</strong> (Faltan: ${faltan}).</p>
        </div>
      `;
    }

    container.innerHTML = `
      <p>${curso.descripcion || 'Módulo bloqueado estructuralmente en tu ruta formativa.'}</p>
      <div class="modal-requirement-box">
        <h4><i class="fa-solid fa-triangle-exclamation"></i> Requisitos Obligatorios:</h4>
        <p>Debes aprobar los módulos predecesores. Presiona cualquiera para evaluar sus especificaciones:</p>
        ${htmlRequisitos}
      </div>
      ${aclaracionFinal}
    `;
  }

  modal.classList.add('active');
}

function cambiarFocoModal(cursoId) {
  const curso = cursosRutaGlobal.find(c => c.id === cursoId);
  if (curso) {
    const esAprobado = tuplasGlobales.some(t => t[0] === curso.id);
    let estado = "locked";
    
    if (esAprobado) {
      estado = "completed";
    } else {
      const r1 = curso.requisito1;
      const r2 = curso.requisito2;
      const esFinal = curso.cursoFinal ? curso.cursoFinal.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
      
      let disponible = false;
      if (!r1 && !r2 && esFinal !== "si") disponible = true;
      if (r1 && !r2 && tuplasGlobales.some(t => t[0] === r1)) disponible = true;
      if (r1 && r2 && tuplasGlobales.some(t => t[0] === r1) && tuplasGlobales.some(t => t[0] === r2)) disponible = true;
      if (esFinal === "si" && tuplasGlobales.length >= 6) disponible = true;
      
      if (disponible) estado = "available";
    }
    
    abrirModalDetallado(curso, estado);
  }
}

/* =========================================================
   GENERADOR Y TARJETA COMPARTIBLE OPTIMIZADA
========================================================= */
function inyectarBotonCompartir() {
  const profileCard = document.querySelector('.profile-card');
  if (!profileCard || document.getElementById('btnDownloadShare')) return;

  const btnShare = document.createElement('button');
  btnShare.id = 'btnDownloadShare';
  btnShare.className = 'download-share-btn';
  btnShare.innerHTML = `<i class="fa-solid fa-cloud-download-alt"></i> Descargar Tarjeta de Progreso`;
  
  btnShare.addEventListener('click', generarImagenRedesSociales);
  profileCard.appendChild(btnShare);
}

/* =========================================================
   GENERADOR DE TARJETA COMPARTIBLE - DARK PREMIUM (1200x630)
========================================================= */
function generarImagenRedesSociales() {
  if (!estudianteGlobal) return;

  // 1. Validar u obtener el contenedor base
  let shareContainer = document.getElementById('linkedinShareCard');
  if (!shareContainer) {
    shareContainer = document.createElement('div');
    shareContainer.id = 'linkedinShareCard';
    document.body.appendChild(shareContainer);
  }

  // 2. Extraer los módulos aprobados reales
  const aprobadosReales = cursosRutaGlobal
    .map(c => {
      const tuplaAsociada = tuplasGlobales.find(t => t[0] === c.id);
      if (tuplaAsociada) {
        return { ...c, fechaCompletado: tuplaAsociada[1] };
      }
      return null;
    })
    .filter(c => c !== null);

  const totalCursosLogrados = aprobadosReales.length;
  const fechaEmision = new Date().toLocaleDateString('es-CR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  // 3. Mapeo de iconos comunes para el FabLab / AgroLINC
  const getCourseIcon = (nombre) => {
    const n = nombre.toLowerCase();
    if (n.includes('fabricación') || n.includes('cnc')) return 'fa-industry';
    if (n.includes('electricidad') || n.includes('microcon')) return 'fa-bolt';
    if (n.includes('3d')) return 'fa-cube';
    if (n.includes('corte láser')) return 'fa-scissors';
    if (n.includes('drone')) return 'fa-helicopter';
    if (n.includes('iot') || n.includes('sensores')) return 'fa-wifi';
    if (n.includes('automatización')) return 'fa-robot';
    return 'fa-graduation-cap';
  };

  // 4. Construcción de las cajas de cursos con prevención de desborde
  const cursosHTML = aprobadosReales.map(curso => {
    return `
      <div class="share-course-box-dark">
        <div class="share-box-top-dark">
          <i class="fa-solid ${getCourseIcon(curso.nombre)} share-box-icon-dark"></i>
          <span class="share-badge-success-dark"><i class="fa-solid fa-circle-check"></i> Aprobado</span>
        </div>
        <h4 title="${curso.nombre}">${curso.nombre}</h4>
        <span class="share-course-date-dark">Completado: ${curso.fechaCompletado || '---'}</span>
      </div>
    `;
  }).join('');

  // 5. Ajuste de rejilla inteligente (Evita deformaciones en bajas o altas cantidades)
  let claseDensidad = 'grid-alta';
  if (totalCursosLogrados <= 3) {
    claseDensidad = 'grid-baja';
  } else if (totalCursosLogrados <= 8) {
    claseDensidad = 'grid-media';
  }

  // 6. Endpoint de verificación QR (Color personalizado para combinar con el modo oscuro)
  const urlPlataforma = `https://plataforma.agrolinc.com/verificar?cedula=${estudianteGlobal.cedula}`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(urlPlataforma)}&color=0b1329&bgcolor=ffffff`;

  shareContainer.innerHTML = `
    <!-- Encabezado de marcas integrado al flujo oscuro -->
    <div class="share-header-dark">
      <div class="share-brand-left">
        <span class="share-logo-text">Agro<span>LINC</span></span>
        <p class="share-logo-subtext">Innovación y Tecnologías Aplicadas</p>
      </div>
      <div class="share-brand-right">
        <span class="brand-badge">LINC</span>
        <span class="brand-badge iica">IICA</span>
        <span class="brand-badge fablab">FABLAB</span>
      </div>
    </div>
    
    <!-- Contenido Principal -->
    <div class="share-body-dark">
      <div class="share-user-row-dark">
        <div class="share-user-info">
          <h2>${estudianteGlobal.nombre.toUpperCase()}</h2>
          <div class="share-user-meta-dark">
            <span><i class="fa-solid fa-id-card"></i> Identificación: <b>${estudianteGlobal.cedula}</b></span>
            <span class="dot-splitter">•</span>
            <span><i class="fa-solid fa-route"></i> Ruta: <b class="highlight-cyan">${estudianteGlobal.ruta.toUpperCase()}</b></span>
          </div>
        </div>
        <div class="share-badges-row">
          <span class="stat-badge-dark"><i class="fa-solid fa-award"></i> ${totalCursosLogrados} Módulos Logrados</span>
          <span class="date-badge-dark"><i class="fa-solid fa-calendar-alt"></i> Emitido: ${fechaEmision}</span>
        </div>
      </div>
      
      <!-- Rejilla con auto-ajuste de densidad -->
      <div class="share-grid-dark ${claseDensidad}">
        ${totalCursosLogrados === 0 
          ? `<div class="share-empty-dark"><i class="fa-solid fa-user-astronaut"></i><p>Ruta iniciada. Módulos en desarrollo.</p></div>`
          : cursosHTML
        }
      </div>
    </div>

    <!-- Pie de página con integración de QR e Identidad de Marca -->
    <div class="share-footer-dark">
      <div class="share-footer-left">
        <p class="footer-title"><i class="fa-solid fa-shield-halved"></i> Credencial Digital Verificable</p>
        <p class="footer-desc">Registro oficial de competencias del Programa AgroLINC coordinado a través del FabLab del IICA.</p>
      </div>
      <div class="share-footer-right">
        <div class="qr-container-dark">
          <img src="${qrApiUrl}" alt="QR de Verificación" class="qr-img-dark">
        </div>
      </div>
    </div>
  `;

  // 7. Renderizado fotográfico de alta fidelidad
  setTimeout(() => {
    html2canvas(shareContainer, {
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#060b19",
      scale: 2, // Garantiza nitidez en pantallas Retina y posts de LinkedIn
      width: 1200,
      height: 630
    }).then(canvas => {
      const safeName = estudianteGlobal.nombre.trim().replace(/\s+/g, '_');
      const link = document.createElement('a');
      link.download = `AgroLINC_Cert_Dark_${safeName}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }).catch(err => console.error("Error en renderizado de tarjeta:", err));
  }, 600);
}

/* =========================================
   EVENTOS PRINCIPALES
========================================= */

document.addEventListener("DOMContentLoaded", () => {
  console.log("AgroLINC iniciado con mejoras de UI");

  const consultarBtn = document.getElementById("consultarBtn");
  const cedulaInput = document.getElementById("cedulaInput");
  const closeModal = document.getElementById('closeModal');

  if (consultarBtn) {
    consultarBtn.addEventListener("click", consultarRuta);
  }

  if (cedulaInput) {
    cedulaInput.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        consultarRuta();
      }
    });
  }

  if (closeModal) {
    closeModal.addEventListener('click', () => {
      document.getElementById('courseModal').classList.remove('active');
    });
  }
});