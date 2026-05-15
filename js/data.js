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

  const cedulaInput = document
    .getElementById("cedulaInput")
    .value
    .trim();

  if (!cedulaInput) {
    alert("Ingrese una identificación");
    return;
  }

  try {

    const estudiantes = await fetchEstudiantes();
    const cursos = await fetchCursos();
    const eventos = await fetchEventos();

    const estudiante = estudiantes.find(
      e => e.cedula === cedulaInput
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
       CURSOS COMPLETADOS
    ===================================== */

    const eventosCompletados = eventos.filter(ev =>
      ev.cedula === cedulaInput &&
      ev.estado === "completado"
    );

    const cursosCompletadosIds =
      eventosCompletados.map(ev => ev.idCurso);

    /* =====================================
       FILTRAR CURSOS DE LA RUTA
    ===================================== */

    const cursosRuta = cursos.filter(c =>
      c.ruta === estudiante.ruta
    );

    /* =====================================
       PROGRESO
    ===================================== */

    const completados = cursosRuta.filter(c =>
      cursosCompletadosIds.includes(c.id)
    ).length;

    document.getElementById("progressText").textContent =
      `${completados}/${cursosRuta.length}`;

    const porcentaje =
      (completados / cursosRuta.length) * 100;

    document.getElementById("progressFill").style.width =
      `${porcentaje}%`;

    /* =====================================
       GENERAR CURSOS
    ===================================== */

    const coursesGrid =
      document.getElementById("coursesGrid");

    coursesGrid.innerHTML = "";

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

        /* ==========================
           CURSO SIN REQUISITOS
        ========================== */

        if (
          !curso.requisito1 &&
          !curso.requisito2
        ) {
          disponible = true;
        }

        /* ==========================
           REQUISITO 1
        ========================== */

        if (
          curso.requisito1 &&
          cursosCompletadosIds.includes(curso.requisito1)
        ) {
          disponible = true;
        }

        /* ==========================
           REQUISITO 1 Y 2
        ========================== */

        if (
          curso.requisito1 &&
          curso.requisito2 &&
          cursosCompletadosIds.includes(curso.requisito1) &&
          cursosCompletadosIds.includes(curso.requisito2)
        ) {
          disponible = true;
        }

        /* ==========================
           CURSO FINAL
           (si tiene cualquier curso previo)
        ========================== */

        if (
          curso.cursoFinal?.toLowerCase() === "sí" ||
          curso.cursoFinal?.toLowerCase() === "si"
        ) {

          if (cursosCompletadosIds.length >= 6) {
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

      coursesGrid.appendChild(card);

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
    cedulaInput.addEventListener("keydown", e => {

      if (e.key === "Enter") {
        consultarRuta();
      }

    });
  }

});