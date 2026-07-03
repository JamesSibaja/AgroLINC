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

/* =========================================
 FETCH BLOG
========================================= */

async function fetchBlog() {

const noticiasRows =
  await fetchCSV(
    BLOG_URL,
    "BLOG"
  );

const imagenesRows =
  await fetchCSV(
    BLOG_IMAGENES_URL,
    "BLOG_IMAGENES"
  );

const imagenes =
  imagenesRows
    .slice(1)
    .map(r => ({
      noticia:
        clean(r[1]),

      imagen:
        clean(r[0])
    }));

return noticiasRows
  .slice(1)
  .map(r => {

    const id =
      clean(r[0]);

    return {

      id,

      fecha:
        clean(r[1]),

      titulo:
        clean(r[2]),

      texto:
        clean(r[3]),

      imagenes:
        imagenes
          .filter(
            i =>
              i.noticia === id
          )
          .map(
            i =>
              `assets/images/blog/${i.imagen}`
          )

    };

  });

}
/* =========================================
   FETCH CSV
========================================= */

async function fetchCSV(url, name) {

  try {

    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Error HTTP ${res.status}`);
    }

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

  console.log("KPI RAW");
  console.log(text);
  console.log("KPI PARSED");
  console.table(rows);

  return rows.slice(1).map(r => {
    // Limpieza manual segura: remueve saltos de línea y espacios en los extremos, 
    // pero MANTIENE las mayúsculas y minúsculas originales de Google Sheets.
    const nombreOriginal = String(r[0] || "")
      .replace(/\r/g, "")
      .replace(/\n/g, " ")
      .trim();

    return {
      nombre: nombreOriginal, 
      valor: clean(r[1]) // El valor numérico sí puede seguir usando clean()
    };
  });
}

async function fetchCursos() {

  const rows =
    await fetchCSV(CURSOS_URL, "CURSOS");

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

  const rows =
    await fetchCSV(
      CALENDARIO_URL,
      "CALENDARIO"
    );

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

  const rows =
    await fetchCSV(ESTUDIANTES_URL, "ESTUDIANTES");

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

  const rows =
    await fetchCSV(EVENTOS_URL, "EVENTOS");

  const data = rows.slice(1).map(r => ({
    cedula: clean(r[0]),
    idCurso: clean(r[1]),
    fecha: r[2],
    estado: clean(r[3])
  }));

  debugLog("EVENTOS LIMPIOS", data);

  return data;

}

/* =========================================
   CONSULTA
========================================= */

async function consultarRuta() {

  const cedula = clean(
    document
      .getElementById("cedulaInput")
      .value
  );

  if (!cedula) {

    alert("Ingrese una identificación");

    return;

  }

  console.clear();

  console.log("=================================");
  console.log("CONSULTA DE RUTA");
  console.log("CÉDULA:", cedula);
  console.log("=================================");

  try {

    const estudiantes =
      await fetchEstudiantes();

    const cursos =
      await fetchCursos();

    const eventos =
      await fetchEventos();

    /* =====================================
       BUSCAR ESTUDIANTE
    ===================================== */

    const estudiante = estudiantes.find(
      e => e.cedula === cedula
    );

    debugLog("ESTUDIANTE ENCONTRADO", estudiante);

    if (!estudiante) {

      alert("No se encontró el participante");

      return;

    }

    /* =====================================
       PERFIL
    ===================================== */

    document.getElementById("studentName").textContent =
      estudiante.nombre;

    document.getElementById("studentRoute").textContent =
      `Ruta ${estudiante.ruta}`;

    const iniciales = estudiante.nombre
      .split(" ")
      .map(n => n[0])
      .join("")
      .substring(0, 2);

    document.getElementById("profileAvatar").textContent =
      iniciales;

    /* =====================================
       EVENTOS COMPLETADOS
    ===================================== */

    const eventosCompletados =
      eventos.filter(ev => {

        const mismaCedula =
          ev.cedula === cedula;

        const aprobado =
          ev.estado.includes("complet");

        return mismaCedula && aprobado;

      });

    debugLog(
      "EVENTOS COMPLETADOS",
      eventosCompletados
    );

    const cursosCompletadosTuplas = eventosCompletados.map(ev => [
      ev.idCurso, 
      ev.fecha
    ]);

    debugLog(
      "CURSOS COMPLETADOS IDS",
      cursosCompletadosTuplas
    );

    /* =====================================
       CURSOS DE LA RUTA
    ===================================== */

    const cursosRuta = cursos
      .filter(c =>
        c.ruta === estudiante.ruta
      )
      .sort(
        (a, b) =>
          Number(a.etapa) -
          Number(b.etapa)
      );

    debugLog("CURSOS DE RUTA", cursosRuta);

    /* =====================================
       PROGRESO
    ===================================== */

    const cursosFiltradosConFecha = cursosRuta
      .map(c => {
        // Buscamos si existe una tupla para este curso
        const tuplaAsociada = cursosCompletadosTuplas.find(tupla => tupla[0] === c.id);
        
        if (tuplaAsociada) {
          // Si se completó, le agregamos la propiedad 'fechaCompletado' al objeto del curso
          return { ...c, fechaCompletado: tuplaAsociada[1] };
        }
        return null;
      })
      .filter(c => c !== null); // Filtramos para dejar solo los que sí se completaron

    // Para obtener el total de completados:
    const completados = cursosFiltradosConFecha.length;

    const porcentaje = (completados / diplomaTotal) * 100;

    console.log("COMPLETADOS:", completados);
    console.log("TOTAL:", diplomaTotal);
    console.log("PORCENTAJE:", porcentaje);

    document.getElementById("progressText").textContent =
      `${completados}/${diplomaTotal}`;

    document.getElementById("progressFill").style.width =
      `${porcentaje}%`;

    /* =====================================
       GRID
    ===================================== */

    const grid =
      document.getElementById("coursesGrid");

    grid.innerHTML = "";

    let disponibles = 0;

    cursosRuta.forEach(curso => {

      let estadoClase = "locked";
      let estadoTexto = "Bloqueado";
      let fechaTextoHTML = ""; // Variable para renderizar la fecha si aplica
    
      // OPICÓN 2: Buscamos si el curso actual tiene una tupla asociada en los completados
      const tuplaCurso = cursosCompletadosTuplas.find(tupla => tupla[0] === curso.id);
      const completado = !!tuplaCurso; // true si encontró la tupla, false si no
    
      if (completado) {
    
        estadoClase = "completed";
        estadoTexto = "Completado";
        
        // Extraemos la fecha de la tupla (posición 1) y preparamos el HTML
        const fechaCompletado = tuplaCurso[1]; 
        fechaTextoHTML = `<div class="course-date">Completado el: ${fechaCompletado}</div>`;
    
      } else {
    
        let disponible = false;
        const r1 = curso.requisito1;
        const r2 = curso.requisito2;
        
        // Normalizamos el string a minúsculas y quitamos tildes para evaluar de forma segura
        const esFinal = curso.cursoFinal ? curso.cursoFinal.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
    
        if (!r1 && !r2 && esFinal !== "si") {
          disponible = true;
        }
    
        // Evaluación de Requisito 1 usando las tuplas (.some)
        if (
          r1 &&
          !r2 &&
          cursosCompletadosTuplas.some(tupla => tupla[0] === r1)
        ) {
          disponible = true;
        }
    
        // Evaluación de Requisito 1 y Requisito 2 usando las tuplas (.some)
        if (
          r1 &&
          r2 &&
          cursosCompletadosTuplas.some(tuple => tuple[0] === r1) &&
          cursosCompletadosTuplas.some(tuple => tuple[0] === r2)
        ) {
          disponible = true;
        }
    
        // Evaluación del curso final (completados viene del conteo previo de la Opción 2)
        if (esFinal === "si") {
          if (completados >= 6) {
            disponible = true;
          }
        }
    
        if (disponible) {
          estadoClase = "available";
          estadoTexto = "Disponible";
          disponibles++;
        }
    
      }
    
      console.log({
        curso: curso.nombre,
        id: curso.id,
        estado: estadoTexto,
        requisito1: curso.requisito1,
        requisito2: curso.requisito2
      });
    
      const card = document.createElement("div");
      card.className = `course-card ${estadoClase}`;
    
      card.innerHTML = `
        <div class="course-top">
          <span class="course-stage">
            Etapa ${curso.etapa}
          </span>
          <span class="course-status ${estadoClase}">
            ${estadoTexto}
          </span>
        </div>
        <h4>
          ${curso.nombre}
        </h4>
        ${fechaTextoHTML} <!-- Se inyectará la fecha dinámicamente solo si está completado -->
      `;
    
      grid.appendChild(card);
    
    });

    document.getElementById("completedCount").textContent =
      completados;

    document.getElementById("availableCount").textContent =
      disponibles;

    console.log("DISPONIBLES:", disponibles);

  } catch (error) {

    console.error("ERROR GENERAL", error);

    alert("Error cargando datos");

  }

}

/* =========================================
   EVENTOS
========================================= */

document.addEventListener("DOMContentLoaded", () => {

  console.log("AgroLINC iniciado");

  const consultarBtn =
    document.getElementById("consultarBtn");

  const cedulaInput =
    document.getElementById("cedulaInput");

  if (consultarBtn) {

    consultarBtn.addEventListener(
      "click",
      consultarRuta
    );

  }

  if (cedulaInput) {

    cedulaInput.addEventListener(
      "keydown",
      e => {

        if (e.key === "Enter") {

          consultarRuta();

        }

      }
    );

  }

});

