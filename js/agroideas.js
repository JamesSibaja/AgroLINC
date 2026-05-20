/* =========================================
   AGROIDEAS.JS
========================================= */

/* =========================================
   URL
========================================= */

const AGROIDEAS_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSnS7gYqNZk-2vrvEU1DSYrZa7535VglT7kXCXWWpjDLwDu32K4od3CZqFJyeANgHP_OGhVvVwMhPZC/pub?gid=1406834327&single=true&output=csv";

/* =========================================
   DEBUG
========================================= */

function debugLog(title, data) {

  console.group(title);

  console.table(data);

  console.groupEnd();

}

/* =========================================
   HELPERS
========================================= */

function clean(value) {

  return String(value || "")
    .replace(/\r/g, "")
    .replace(/\n/g, "")
    .trim();

}

/* =========================================
   CSV PARSER
========================================= */

function parseCSV(text) {

  return text
    .trim()
    .split("\n")
    .map(row =>
      row
        .split(",")
        .map(cell => clean(cell))
    );

}

/* =========================================
   FETCH CSV
========================================= */

async function fetchCSV(url, label = "CSV") {

  const response = await fetch(url);

  const text = await response.text();

  console.log(`${label} RAW`);
  console.log(text);

  const rows = parseCSV(text);

  debugLog(`${label} PARSED`, rows);

  return rows;

}

/* =========================================
   FETCH AGROIDEAS
========================================= */

async function fetchAgroIdeas() {

  const rows =
    await fetchCSV(AGROIDEAS_URL, "AGROIDEAS");

  /*
    COLUMNAS ESPERADAS:

    0 -> titulo
    1 -> descripcion
    2 -> categoria
    3 -> nivel
    4 -> tecnologia
    5 -> recurso
    6 -> imagen
    7 -> enlace
  */

  const data = rows
    .slice(1)
    .filter(r => r[0])
    .map(r => ({

      titulo:
        clean(r[0]),

      descripcion:
        clean(r[1]),

      categoria:
        clean(r[2]),

      nivel:
        clean(r[3]),

      tecnologia:
        clean(r[4]),

      recurso:
        clean(r[5]),

      imagen:
        clean(r[6]),

      enlace:
        clean(r[7])

    }));

  debugLog("AGROIDEAS LIMPIAS", data);

  return data;

}

/* =========================================
   ICONOS
========================================= */

function getIcon(tecnologia) {

  const tech =
    tecnologia.toLowerCase();

  if (tech.includes("iot")) {
    return "fa-solid fa-wifi";
  }

  if (tech.includes("3d")) {
    return "fa-solid fa-cube";
  }

  if (tech.includes("laser")) {
    return "fa-solid fa-vector-square";
  }

  if (tech.includes("arduino")) {
    return "fa-solid fa-microchip";
  }

  if (tech.includes("drone")) {
    return "fa-solid fa-drone";
  }

  return "fa-solid fa-lightbulb";

}

/* =========================================
   GRADIENTES
========================================= */

function getGradient(index) {

  const gradients = [
    "gradient-1",
    "gradient-2",
    "gradient-3",
    "gradient-4",
    "gradient-5",
    "gradient-6"
  ];

  return gradients[
    index % gradients.length
  ];

}

/* =========================================
   RENDER
========================================= */

function renderIdeas(ideas) {

  const container =
    document.querySelector(".ideas-grid");

  if (!container) return;

  container.innerHTML = "";

  ideas.forEach((idea, index) => {

    const card =
      document.createElement("div");

    card.className =
      "idea-card";

    card.innerHTML = `

      <div class="idea-image ${getGradient(index)}">

        <div class="idea-badge">
          ${idea.tecnologia || "AgroTech"}
        </div>

      </div>

      <div class="idea-content">

        <div class="idea-top">

          <span class="idea-category">
            ${idea.categoria || "General"}
          </span>

          <span class="idea-level">
            ${idea.nivel || "Base"}
          </span>

        </div>

        <h3>
          ${idea.titulo}
        </h3>

        <p>
          ${idea.descripcion}
        </p>

        <div class="idea-meta">

          <span>
            <i class="${getIcon(idea.tecnologia)}"></i>
            ${idea.tecnologia || "Tecnología"}
          </span>

          <span>
            <i class="fa-solid fa-folder-open"></i>
            ${idea.recurso || "Recurso"}
          </span>

        </div>

        <div class="idea-actions">

          <a
            href="${idea.enlace || "#"}"
            target="_blank"
            class="primary-btn small-btn"
          >
            Ver proyecto
          </a>

        </div>

      </div>

    `;

    container.appendChild(card);

  });

  /* KPI */

  const ideasCount =
    document.getElementById("ideasCount");

  if (ideasCount) {

    ideasCount.textContent =
      ideas.length;

  }

}

/* =========================================
   INIT
========================================= */

async function initAgroIdeas() {

  try {

    const ideas =
      await fetchAgroIdeas();

    renderIdeas(ideas);

  } catch (error) {

    console.error(error);

    alert(
      "Error cargando AgroIdeas"
    );

  }

}

/* =========================================
   LOAD
========================================= */

document.addEventListener(
  "DOMContentLoaded",
  initAgroIdeas
);