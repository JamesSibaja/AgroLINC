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

    const estudiante = estudiantes.find(
      e => String(e.cedula).trim() === cedula
    );

    if (!estudiante) {

      alert("No se encontró el participante");

      return;

    }

    /* PERFIL */

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

    /* EVENTOS */

    const eventosCompletados = eventos.filter(ev => {

      const mismaCedula =
        String(ev.cedula).trim() === cedula;

      const aprobado =
        String(ev.estado)
          .includes("complet");

      return mismaCedula && aprobado;

    });

    const cursosCompletadosIds =
      eventosCompletados.map(ev =>
        String(ev.idCurso).trim()
      );

    /* CURSOS RUTA */

    const cursosRuta = cursos
      .filter(c =>
        String(c.ruta).trim().toLowerCase() ===
        String(estudiante.ruta).trim().toLowerCase()
      )
      .sort((a, b) => Number(a.etapa) - Number(b.etapa));

    /* PROGRESO */

    const completados = cursosRuta.filter(c =>
      cursosCompletadosIds.includes(
        String(c.id).trim()
      )
    ).length;

    const porcentaje =
      cursosRuta.length > 0
        ? (completados / cursosRuta.length) * 100
        : 0;

    document.getElementById("progressText").textContent =
      `${completados}/${cursosRuta.length}`;

    document.getElementById("progressFill").style.width =
      `${porcentaje}%`;

    /* GRID */

    const grid =
      document.getElementById("coursesGrid");

    grid.innerHTML = "";

    let disponibles = 0;

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

          disponibles++;

        }

      }

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