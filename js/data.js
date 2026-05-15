function convertirLinkDriveAImagen(url) {
  if (!url) return "";

  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);

  if (!match) return "";

  const fileId = match[1];

  return `https://lh3.googleusercontent.com/d/${fileId}`;
}

/* =========================================
   CSV PARSER
========================================= */

function parseCSVLine(line) {
  return (
    line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)?.map(v =>
      v.replace(/^"|"$/g, "").trim()
    ) || []
  );
}

/* =========================================
   BIOFABRICAS
========================================= */

const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSugZplAvcSBZjGPZikP3jhTaKA6DtMwZpOZc0_ophORRVGjemhu3Z5JEY3EnsZMUayuhviSia3Gf58/pub?gid=0&single=true&output=csv";

async function fetchBiofabricas() {
  const response = await fetch(SHEET_CSV_URL);

  const csvText = await response.text();

  const rows = csvText.trim().split("\n");

  return rows.slice(1).map(row => {
    const values = parseCSVLine(row);

    return {
      id: values[0]?.trim(),
      name: values[1]?.trim(),
      lat: parseFloat(values[2]),
      lng: parseFloat(values[3]),
      region: values[4]?.trim(),
      estado: values[5]?.trim(),
      descripcion: values[6]?.trim(),
      imagen: convertirLinkDriveAImagen(values[7]),
      tags: values[8]
        ? values[8].split(";").map(t => t.trim())
        : []
    };
  });
}

/* =========================================
   KPIs
========================================= */

const SHEET_CSV_KPI_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSugZplAvcSBZjGPZikP3jhTaKA6DtMwZpOZc0_ophORRVGjemhu3Z5JEY3EnsZMUayuhviSia3Gf58/pub?gid=1232917699&single=true&output=csv";

async function fetchKPIs() {
  const response = await fetch(SHEET_CSV_KPI_URL);

  const csvText = await response.text();

  const rows = csvText.trim().split("\n");

  return rows.slice(1).map(row => {
    const values = parseCSVLine(row);

    return {
      nombre: values[0]?.trim(),
      valor: values[1]?.trim()
    };
  });
}

/* =========================================
   RECURSOS
========================================= */

const SHEET_CSV_RECURSOS_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSugZplAvcSBZjGPZikP3jhTaKA6DtMwZpOZc0_ophORRVGjemhu3Z5JEY3EnsZMUayuhviSia3Gf58/pub?gid=1587744224&single=true&output=csv";

async function fetchRecursos() {
  const response = await fetch(SHEET_CSV_RECURSOS_URL);

  const csvText = await response.text();

  const rows = csvText.trim().split("\n");

  return rows.slice(1).map(row => {
    const values = parseCSVLine(row);

    return {
      nombre: values[0]?.trim(),
      tipo: values[1]?.trim(),
      categoria: values[2]?.trim(),
      enlace: values[3]?.trim()
    };
  });
}

/* =========================================
   CURSOS
========================================= */

const SHEET_CURSOS_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSnS7gYqNZk-2vrvEU1DSYrZa7535VglT7kXCXWWpjDLwDu32K4od3CZqFJyeANgHP_OGhVvVwMhPZC/pub?gid=0&single=true&output=csv";

async function fetchCursos() {
  const response = await fetch(SHEET_CURSOS_URL);

  const csvText = await response.text();

  const rows = csvText.trim().split("\n");

  return rows.slice(1).map(row => {
    const values = parseCSVLine(row);

    return {
      id: values[0]?.trim(),
      nombre: values[1]?.trim(),
      ruta: values[2]?.trim(),
      requisito1: values[3]?.trim(),
      requisito2: values[4]?.trim(),
      cursoFinal: values[5]?.trim(),
      etapa: values[6]?.trim()
    };
  });
}

/* =========================================
   ESTUDIANTES
========================================= */

const SHEET_ESTUDIANTES_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSnS7gYqNZk-2vrvEU1DSYrZa7535VglT7kXCXWWpjDLwDu32K4od3CZqFJyeANgHP_OGhVvVwMhPZC/pub?gid=1568040734&single=true&output=csv";

async function fetchEstudiantes() {
  const response = await fetch(SHEET_ESTUDIANTES_URL);

  const csvText = await response.text();

  const rows = csvText.trim().split("\n");

  return rows.slice(1).map(row => {
    const values = parseCSVLine(row);

    return {
      cedula: values[0]?.trim(),
      nombre: values[1]?.trim(),
      correo: values[2]?.trim(),
      ruta: values[3]?.trim()
    };
  });
}

/* =========================================
   EVENTOS
========================================= */

const SHEET_EVENTOS_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSnS7gYqNZk-2vrvEU1DSYrZa7535VglT7kXCXWWpjDLwDu32K4od3CZqFJyeANgHP_OGhVvVwMhPZC/pub?gid=1589233834&single=true&output=csv";

async function fetchEventos() {
  const response = await fetch(SHEET_EVENTOS_URL);

  const csvText = await response.text();

  const rows = csvText.trim().split("\n");

  return rows.slice(1).map(row => {
    const values = parseCSVLine(row);

    return {
      cedula: values[0]?.trim(),
      idCurso: values[1]?.trim(),
      fecha: values[2]?.trim(),
      estado: values[3]?.trim().toLowerCase()
    };
  });
}

/* =========================================
   CONSULTAR RUTA
========================================= */

async function consultarRuta() {

  const cedula = document
    .getElementById("cedulaInput")
    .value
    .trim();

  if (!cedula) return;

  const estudiantes = await fetchEstudiantes();
  const cursos = await fetchCursos();
  const eventos = await fetchEventos();

  console.log("EVENTOS:", eventos);

  const estudiante = estudiantes.find(
    e => e.cedula === cedula
  );

  if (!estudiante) {

    alert("No se encontró el estudiante");

    return;
  }

  const eventosCompletados = eventos.filter(
    e =>
      e.cedula === cedula &&
      (
        e.estado.includes("complet") ||
        e.estado.includes("apro")
      )
  );

  console.log("COMPLETADOS:", eventosCompletados);

  const cursosCompletadosIds =
    eventosCompletados.map(e => e.idCurso);

  /* =========================================
     PERFIL
  ========================================= */

  document.getElementById("studentName").innerText =
    estudiante.nombre;

  document.getElementById("studentRoute").innerText =
    estudiante.ruta;

  const iniciales = estudiante.nombre
    .split(" ")
    .map(p => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  document.getElementById("profileAvatar").innerText =
    iniciales;

  /* =========================================
     CURSOS
  ========================================= */

  const coursesGrid =
    document.getElementById("coursesGrid");

  coursesGrid.innerHTML = "";

  let completados = 0;

  cursos.forEach(curso => {

    let estado = "locked";

    const completado =
      cursosCompletadosIds.includes(curso.id);

    if (completado) {

      estado = "completed";

      completados++;

    } else {

      const req1Cumplido =
        !curso.requisito1 ||
        cursosCompletadosIds.includes(curso.requisito1);

      const req2Cumplido =
        !curso.requisito2 ||
        cursosCompletadosIds.includes(curso.requisito2);

      /* Curso final */
      if (curso.cursoFinal?.toLowerCase() === "sí") {

        if (cursosCompletadosIds.length >= 6) {
          estado = "available";
        }

      } else if (req1Cumplido && req2Cumplido) {

        estado = "available";
      }
    }

    const card = document.createElement("div");

    card.className = `course-card ${estado}`;

    let estadoTexto = "Bloqueado";

    if (estado === "completed")
      estadoTexto = "Completado";

    if (estado === "available")
      estadoTexto = "Disponible";

    card.innerHTML = `
      <h4>${curso.nombre}</h4>
      <span>${estadoTexto}</span>
    `;

    coursesGrid.appendChild(card);

  });

  /* =========================================
     PROGRESO
  ========================================= */

  document.getElementById("progressText").innerText =
    `${completados}/${cursos.length}`;

  const porcentaje =
    (completados / cursos.length) * 100;

  document.getElementById("progressFill").style.width =
    `${porcentaje}%`;
}

/* =========================================
   INIT
========================================= */

document.addEventListener("DOMContentLoaded", () => {

  const consultarBtn =
    document.getElementById("consultarBtn");

  if (consultarBtn) {

    consultarBtn.addEventListener(
      "click",
      consultarRuta
    );
  }
});