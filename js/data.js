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
      e => e.cedula.trim() === cedula
    );

    if (!estudiante) {
      alert("No se encontró el estudiante");
      return;
    }

    /* =====================================
       PERFIL
    ===================================== */

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

    /* =====================================
       EVENTOS COMPLETADOS
    ===================================== */

    const completados = eventos.filter(ev =>
      ev.cedula.trim() === cedula &&
      (
        ev.estado === "completado" ||
        ev.estado === "aprobado" ||
        ev.estado === "finalizado"
      )
    );

    const cursosCompletados =
      completados.map(c => c.idCurso.trim());

    /* =====================================
       CURSOS DE LA RUTA
    ===================================== */

    const cursosRuta = cursos.filter(c =>
      c.ruta.trim() === estudiante.ruta.trim()
    );

    /* =====================================
       PROGRESO
    ===================================== */

    const cantidadCompletados = cursosRuta.filter(c =>
      cursosCompletados.includes(c.id.trim())
    ).length;

    document.getElementById("progressText").textContent =
      `${cantidadCompletados}/${cursosRuta.length}`;

    const porcentaje =
      (cantidadCompletados / cursosRuta.length) * 100;

    document.getElementById("progressFill").style.width =
      `${porcentaje}%`;

    /* =====================================
       CURSOS
    ===================================== */

    const grid =
      document.getElementById("coursesGrid");

    grid.innerHTML = "";

    cursosRuta.forEach(curso => {

      let estado = "locked";
      let texto = "Bloqueado";

      const yaCompleto =
        cursosCompletados.includes(curso.id.trim());

      if (yaCompleto) {

        estado = "completed";
        texto = "Completado";

      } else {

        let disponible = false;

        /* SIN REQUISITOS */

        if (
          !curso.requisito1 &&
          !curso.requisito2
        ) {
          disponible = true;
        }

        /* REQUISITO 1 */

        if (
          curso.requisito1 &&
          cursosCompletados.includes(
            curso.requisito1.trim()
          )
        ) {
          disponible = true;
        }

        /* REQUISITO 1 + 2 */

        if (
          curso.requisito1 &&
          curso.requisito2 &&
          cursosCompletados.includes(
            curso.requisito1.trim()
          ) &&
          cursosCompletados.includes(
            curso.requisito2.trim()
          )
        ) {
          disponible = true;
        }

        /* CURSO FINAL */

        if (
          curso.cursoFinal.toLowerCase() === "sí" ||
          curso.cursoFinal.toLowerCase() === "si"
        ) {

          if (cantidadCompletados >= 6) {
            disponible = true;
          }
        }

        if (disponible) {
          estado = "available";
          texto = "Disponible";
        }
      }

      const card = document.createElement("div");

      card.className =
        `course-card ${estado}`;

      card.innerHTML = `
        <h4>${curso.nombre}</h4>
        <span>${texto}</span>
      `;

      grid.appendChild(card);

    });

  } catch (err) {

    console.error(err);

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