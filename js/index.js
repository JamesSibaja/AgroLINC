async function renderKPIs() {

    try {
  
      const kpis = await fetchKPI();
  
      const container =
        document.getElementById("kpiContainer");
  
      if (!container) return;
  
      const icons = {

        participantes:
          "fa-solid fa-users",
      
        "recursos agroideas":
          "fa-solid fa-lightbulb",
      
        "cursos diferentes":
          "fa-solid fa-graduation-cap"
      
      };
  
      container.innerHTML = "";
  
      kpis.forEach(kpi => {
  
        const card =
          document.createElement("div");
  
        card.className =
          "metric-card";
  
        const icon =
          icons[kpi.nombre] ||
          "fa-solid fa-chart-column";
  
        card.innerHTML = `
  
          <div class="metric-icon">
            <i class="${icon}"></i>
          </div>
  
          <div>
  
            <strong>
              ${kpi.valor}
            </strong>
  
            <span>
              ${kpi.nombre}
            </span>
  
          </div>
  
        `;
  
        container.appendChild(card);
  
      });
  
    } catch (error) {
  
      console.error(
        "Error cargando KPI",
        error
      );
  
    }
  
  }
  
  document.addEventListener(
    "DOMContentLoaded",
    renderKPIs
  );

  const copyBtn =
  document.getElementById("copyBtn");

copyBtn.addEventListener(
  "click",
  async () => {

    await navigator.clipboard.writeText(
      "fablab@iica.int"
    );

    copyBtn.innerHTML =
      '<i class="fa-solid fa-check"></i>';

    setTimeout(() => {

      copyBtn.innerHTML =
        '<i class="fa-regular fa-copy"></i>';

    }, 1800);

  }
);

/* =========================================
   RENDER
========================================= */

async function renderRuta() {

  const cursos =
    await fetchCursos();

  const grid =
    document.getElementById("pathGrid");

  grid.innerHTML = "";

  /* ==============================
     AGRUPAR POR ETAPA
  ============================== */

  const etapas = {};

  cursos.forEach(curso => {
    debugLog("CURSO RUTA", curso.ruta);
    if (curso.ruta != "territorial"){
      if (!etapas[curso.etapa]) {

        etapas[curso.etapa] = [];

      }

      etapas[curso.etapa]
        .push(curso);
    }
  });

  /* ==============================
     CREAR FILAS
  ============================== */

  Object.keys(etapas)
  .sort((a, b) => Number(a) - Number(b))
  .forEach(etapa => {

    const wrapper =
      document.createElement("div");

    wrapper.className =
      "path-stage";

    const title =
      document.createElement("h3");

    title.className =
      "stage-title";

    title.textContent =
      `Etapa ${etapa}`;

    wrapper.appendChild(title);

    const row =
      document.createElement("div");

    row.className =
      "path-row";

    etapas[etapa]
      .forEach(curso => {

        const btn =
          document.createElement("button");

        btn.className =
          "course-node";

        if (Number(etapa) % 2 === 1) {

          btn.style.background =
            "linear-gradient(135deg,#2c77a0,#39abd8)";

        }

        btn.innerHTML = `

          <strong>
            ${curso.nombre}
          </strong>

        `;

        btn.addEventListener(
          "click",
          () => openModal(curso, cursos)
        );
        

        row.appendChild(btn);

      });

    wrapper.appendChild(row);

    grid.appendChild(wrapper);

  });
}

/* =========================================
   MODAL
========================================= */

async function openModal(curso, cursos) {

  const calendario =
    await fetchCalendario();

  document
    .getElementById("modalTitle")
    .textContent =
      curso.nombre;

  document
    .getElementById("modalStage")
    .textContent =
      `Etapa ${curso.etapa}`;

  /* ==========================
     REQUISITOS
  ========================== */

  let requisitos = [];

  if (curso.requisito1) {

    const r1 =
      cursos.find(
        c => c.id === curso.requisito1
      );

    if (r1) {
      requisitos.push(r1.nombre);
    }

  }

  if (curso.requisito2) {

    const r2 =
      cursos.find(
        c => c.id === curso.requisito2
      );

    if (r2) {
      requisitos.push(r2.nombre);
    }

  }

  const textoRequisitos =
    requisitos.length > 0
      ? requisitos.join("<br>")
      : "Ninguno";

  /* ==========================
     CONVOCATORIAS
  ========================== */

  const eventosCurso =
    calendario.filter(
      e => e.id === curso.id
    );

  let eventosHTML = "";

  if (eventosCurso.length === 0) {

    eventosHTML = `

      <div class="course-event event-closed">

        <div class="event-status status-closed">
          Próximamente
        </div>

        <p>
          No hay convocatorias publicadas para este curso.
        </p>

      </div>

    `;

  } else {

    eventosCurso.forEach(evento => {

      const cuposDisponibles =
        evento.max - evento.inscritos;

      const cumpleMinimo =
        evento.inscritos >= evento.min;

      let clase = "";
      let estado = "";
      let estadoClase = "";
      let detalle = "";
      let boton = "";

      /* =====================
         GRUPO CERRADO
      ===================== */

      if (!evento.enlace) {

        clase =
          "event-closed";

        estadoClase =
          "status-closed";

        estado =
          "Grupo cerrado";

        detalle =
          "Esta convocatoria se gestiona mediante un grupo específico.";

      }

      /* =====================
         LISTA DE ESPERA
      ===================== */

      else if (
        cuposDisponibles <= 0
      ) {

        clase =
          "event-waiting";

        estadoClase =
          "status-waiting";

        estado =
          "Lista de espera";

        detalle = `

          <span class="event-note">
            No hay cupos disponibles.
            Puede registrarse en la lista de espera.
            Si se producen cancelaciones,
            las solicitudes se atenderán según
            el orden de registro.
          </span>

        `;

        boton = `

          <a
            class="event-btn"
            href="${evento.enlace}"
            target="_blank"
          >
            Unirse a lista de espera
          </a>

          <small class="event-small">
            Mantenga disponibilidad para la fecha y horario de la capacitación.
          </small>

        `;

      }

      /* =====================
         CONFIRMADO
      ===================== */

      else if (
        cumpleMinimo
      ) {

        clase =
          "event-confirmed";

        estadoClase =
          "status-confirmed";

        estado =
          "Convocatoria confirmada";

        detalle = `

          <div class="event-slots status-confirmed">
            ${cuposDisponibles}
            cupos disponibles
          </div>

        `;

        boton = `

          <a
            class="event-btn"
            href="${evento.enlace}"
            target="_blank"
          >
            Solicitar inscripción
          </a>

        `;

      }

      /* =====================
         PENDIENTE CUPO MÍNIMO
      ===================== */

      else {

        clase =
          "event-pending";

        estadoClase =
          "status-pending";

        estado =
          "Convocatoria abierta";

        detalle = `

          <div class="event-note status-pending">
            Pendiente de alcanzar el cupo mínimo.
          </div>

          <div class="event-slots status-pending">
            ${cuposDisponibles}
            cupos disponibles
          </div>

        `;

        boton = `

          <a
            class="event-btn"
            href="${evento.enlace}"
            target="_blank"
          >
            Solicitar inscripción
          </a>

        `;

      }

      eventosHTML += `

        <div class="course-event ${clase}">

          <div class="event-date">
            ${evento.fecha}
          </div>

          <div class="event-status ${estadoClase}">
            ${estado}
          </div>

          ${detalle}

          ${boton}

        </div>

      `;

    });

  }

  document
    .getElementById("modalDescription")
    .innerHTML = `

      <p>
        ${curso.descripcion || "Próximamente disponible."}
      </p>

      <div class="modal-reqs">

        <h4>
          Requisitos
        </h4>

        ${textoRequisitos}

      </div>

      <div class="modal-events">

        <h4>
          Próximas convocatorias
        </h4>

        ${eventosHTML}

      </div>

    `;

  document
    .getElementById("courseModal")
    .classList
    .add("active");

}

function closeModal() {

  document
    .getElementById("courseModal")
    .classList
    .remove("active");

}

/* =========================================
   EVENTS
========================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    renderRuta();

    document
      .getElementById("closeModal")
      .addEventListener(
        "click",
        closeModal
      );

    document
      .querySelector(".modal-overlay")
      .addEventListener(
        "click",
        closeModal
      );

  }
);