/* =========================================
   CSV PARSER
========================================= */

function parseCSV(text) {

  const rows = text
    .trim()
    .split("\n")
    .map(row =>
      row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)
        ?.map(v => v.replace(/^"|"$/g, "").trim())
    );

  return rows || [];
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

/* =========================================
   FETCHERS
========================================= */

async function fetchCursos() {

  const res = await fetch(CURSOS_URL);

  const text = await res.text();

  const rows = parseCSV(text);

  return rows.slice(1).map(r => ({
    id: r[0],
    nombre: r[1],
    ruta: r[2],
    requisito1: r[3],
    requisito2: r[4],
    cursoFinal: r[5],
    etapa: r[6]
  }));
}

async function fetchEstudiantes() {

  const res = await fetch(ESTUDIANTES_URL);

  const text = await res.text();

  const rows = parseCSV(text);

  return rows.slice(1).map(r => ({
    cedula: r[0],
    nombre: r[1],
    correo: r[2],
    ruta: r[3]
  }));
}

async function fetchEventos() {

  const res = await fetch(EVENTOS_URL);

  const text = await res.text();

  const rows = parseCSV(text);

  return rows.slice(1).map(r => ({
    cedula: r[0],
    idCurso: r[1],
    fecha: r[2],
    estado: (r[3] || "").toLowerCase().trim()
  }));
}

/* =========================================
   CONSULTA
========================================= */

async function consultarRuta() {

  const cedula = document
    .getElementById("cedulaInput")
    .value
    .trim();

  if (!cedula) {
    alert("Ingrese una identificación");
    return;
  }

  try {

    const estudiantes = await fetchEstudiantes();
    const cursos = await fetchCursos();
    const eventos = await fetchEventos();

    console.log("ESTUDIANTES", estudiantes);
    console.log("CURSOS", cursos);
    console.log("EVENTOS", eventos);

    const estudiante = estudiantes.find(
      e => String(e.cedula).trim() === cedula
    );

    if (!estudiante) {
      alert("No se encontró el estudiante");
      return;
    }

    /* PERFIL */

    document.getElementById("studentName").textContent =
      estudiante.nombre;

    document.getElementById("studentRoute").textContent =
      estudiante.ruta;

    const iniciales = estudiante.nombre
      .split(" ")
      .map(n => n[0])
      .join("")
      .substring(0, 2);

    document.getElementById("profileAvatar").textContent =
      iniciales;

    /* EVENTOS COMPLETADOS */

    const eventosCompletados = eventos.filter(ev => {

      const mismaCedula =
        String(ev.cedula).trim() === cedula;

      const aprobado =
        String(ev.estado)
          .trim()
          .toLowerCase()
          .includes("complet");

      return mismaCedula && aprobado;

    });

    console.log("COMPLETADOS", eventosCompletados);

    const cursosCompletadosIds =
      eventosCompletados.map(ev =>
        String(ev.idCurso).trim()
      );

    console.log("IDS", cursosCompletadosIds);

    /* CURSOS DE LA RUTA */

    const cursosRuta = cursos.filter(c =>
      String(c.ruta).trim().toLowerCase() ===
      String(estudiante.ruta).trim().toLowerCase()
    );

    console.log("RUTA", cursosRuta);

    /* PROGRESO */

    const completados = cursosRuta.filter(c =>
      cursosCompletadosIds.includes(
        String(c.id).trim()
      )
    ).length;

    document.getElementById("progressText").textContent =
      `${completados}/${cursosRuta.length}`;

    const porcentaje =
      cursosRuta.length > 0
        ? (completados / cursosRuta.length) * 100
        : 0;

    document.getElementById("progressFill").style.width =
      `${porcentaje}%`;

    /* CURSOS */

    const grid =
      document.getElementById("coursesGrid");

    grid.innerHTML = "";

    cursosRuta.forEach(curso => {

      let estadoClase = "locked";
      let estadoTexto = "Bloqueado";

      const completado =
        cursosCompletadosIds.includes(
          String(curso.id).trim()
        );

      if (completado) {

        estadoClase = "completed";
        estadoTexto = "Completado";

      } else {

        let disponible = false;

        const r1 =
          String(curso.requisito1 || "").trim();

        const r2 =
          String(curso.requisito2 || "").trim();

        if (!r1 && !r2) {
          disponible = true;
        }

        if (
          r1 &&
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

        const esFinal =
          String(curso.cursoFinal || "")
            .trim()
            .toLowerCase();

        if (
          esFinal === "sí" ||
          esFinal === "si"
        ) {

          if (completados >= 6) {
            disponible = true;
          }

        }

        if (disponible) {
          estadoClase = "available";
          estadoTexto = "Disponible";
        }

      }

      const card = document.createElement("div");

      card.className =
        `course-card ${estadoClase}`;

      card.innerHTML = `
        <h4>${curso.nombre}</h4>
        <span>${estadoTexto}</span>
      `;

      grid.appendChild(card);

    });

  } catch (error) {

    console.error(error);

    alert("Error cargando datos");

  }

}

/* =========================================
   EVENTOS
========================================= */

document.addEventListener("DOMContentLoaded", () => {

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