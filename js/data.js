/* =========================================
   DEBUG MODE
========================================= */

const DEBUG = true;

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
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSnS7gYqNZk-2vrvEU1DSYrZa7535VglT7kXCXWWpjDLwDu32K4od3CZqFJyeANgHP_OGhVvVwMhPZC/pub?gid=0&single=true&output=csv";

const ESTUDIANTES_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSnS7gYqNZk-2vrvEU1DSYrZa7535VglT7kXCXWWpjDLwDu32K4od3CZqFJyeANgHP_OGhVvVwMhPZC/pub?gid=1568040734&single=true&output=csv";

const EVENTOS_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSnS7gYqNZk-2vrvEU1DSYrZa7535VglT7kXCXWWpjDLwDu32K4od3CZqFJyeANgHP_OGhVvVwMhPZC/pub?gid=1589233834&single=true&output=csv";

const KPI_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSnS7gYqNZk-2vrvEU1DSYrZa7535VglT7kXCXWWpjDLwDu32K4od3CZqFJyeANgHP_OGhVvVwMhPZC/pub?gid=203474066&single=true&output=csv";

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

  return rows.slice(1).map(r => ({

    nombre: clean(r[0]),
    valor: clean(r[1])

  }));

}

async function fetchCursos() {

  const rows =
    await fetchCSV(CURSOS_URL, "CURSOS");

  const data = rows.slice(1).map(r => ({
    id: clean(r[0]),
    nombre: r[1],
    ruta: clean(r[2]),
    requisito1: clean(r[3]),
    requisito2: clean(r[4]),
    cursoFinal: clean(r[5]),
    etapa: r[6]
  }));

  debugLog("CURSOS LIMPIOS", data);

  return data;

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

    const cursosCompletadosIds =
      eventosCompletados.map(ev =>
        ev.idCurso
      );

    debugLog(
      "CURSOS COMPLETADOS IDS",
      cursosCompletadosIds
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

    const completados =
      cursosRuta.filter(c =>
        cursosCompletadosIds.includes(c.id)
      ).length;

    const porcentaje =
      cursosRuta.length > 0
        ? (completados / cursosRuta.length) * 100
        : 0;

    console.log("COMPLETADOS:", completados);
    console.log("TOTAL:", cursosRuta.length);
    console.log("PORCENTAJE:", porcentaje);

    document.getElementById("progressText").textContent =
      `${completados}/${cursosRuta.length}`;

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

      const completado =
        cursosCompletadosIds.includes(curso.id);

      if (completado) {

        estadoClase = "completed";
        estadoTexto = "Completado";

      } else {

        let disponible = false;

        const r1 = curso.requisito1;
        const r2 = curso.requisito2;
        const esFinal = curso.cursoFinal;

        if (!r1 && !r2 && !esFinal) {
          disponible = true;
        }

        if (
          r1 &&
          !r2 &&
          cursosCompletadosIds.includes(r1)
        ) {
          disponible = true;
        }

        if (
          r1 &&
          r2 &&
          cursosCompletadosIds.includes(r1) &&
          cursosCompletadosIds.includes(r2)
        ) {
          disponible = true;
        }

        

        if (
          esFinal === "sí" ||
          esFinal === "si"||
          esFinal === "Si"||
          esFinal === "Si"
        ) {

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

      const card =
        document.createElement("div");

      card.className =
        `course-card ${estadoClase}`;

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

        <p class="course-id">
          ${curso.id}
        </p>

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

  document
    .getElementById("consultarBtn")
    .addEventListener("click", consultarRuta);

  document
    .getElementById("cedulaInput")
    .addEventListener("keydown", e => {

      if (e.key === "Enter") {

        consultarRuta();

      }

    });

});

