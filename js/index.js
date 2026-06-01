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

    if (!etapas[curso.etapa]) {

      etapas[curso.etapa] = [];

    }

    etapas[curso.etapa]
      .push(curso);

  });

  /* ==============================
     CREAR FILAS
  ============================== */

  Object.keys(etapas)
    .sort((a, b) => Number(a) - Number(b))
    .forEach(etapa => {

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

          btn.innerHTML = `

            <small>
              Etapa ${curso.etapa}
            </small>

            <strong>
              ${curso.nombre}
            </strong>

          `;

          btn.addEventListener(
            "click",
            () => openModal(curso)
          );

          row.appendChild(btn);

        });

      grid.appendChild(row);

    });

}

/* =========================================
   MODAL
========================================= */

function openModal(curso) {

  document
    .getElementById("modalTitle")
    .textContent =
      curso.nombre;

  document
    .getElementById("modalStage")
    .textContent =
      `Etapa ${curso.etapa}`;

  document
    .getElementById("modalDescription")
    .textContent =
      curso.descripcion ||
      "Próximamente disponible.";

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