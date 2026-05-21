/* =========================================
   CONFIG
========================================= */

const ITEMS_PER_PAGE = 6;

const AGROIDEAS_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSnS7gYqNZk-2vrvEU1DSYrZa7535VglT7kXCXWWpjDLwDu32K4od3CZqFJyeANgHP_OGhVvVwMhPZC/pub?gid=1406834327&single=true&output=csv";

/* =========================================
   STATE
========================================= */

let currentPage = 1;

let allIdeas = [];

let filteredIdeas = [];

let currentFilter = "all";

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
   GOOGLE DRIVE IMAGE FIX
========================================= */

function getGoogleDriveImage(url) {

  if (!url) return "";

  const match =
    url.match(/\/d\/(.*?)\//);

  if (!match) return url;

  const fileId = match[1];

  return `
https://drive.google.com/uc?export=view&id=${fileId}
  `.trim();

}

/* =========================================
   CSV
========================================= */

function parseCSV(text) {

  return text
    .trim()
    .split("\n")
    .map(row => {

      const result = [];

      let current = "";

      let insideQuotes = false;

      for (let i = 0; i < row.length; i++) {

        const char = row[i];

        if (char === '"') {

          insideQuotes = !insideQuotes;

        } else if (
          char === "," &&
          !insideQuotes
        ) {

          result.push(clean(current));

          current = "";

        } else {

          current += char;

        }

      }

      result.push(clean(current));

      return result;

    });

}

/* =========================================
   FETCH
========================================= */

async function fetchCSV(url) {

  const response = await fetch(url);

  const text = await response.text();

  return parseCSV(text);

}

async function fetchAgroIdeas() {

  const rows =
    await fetchCSV(AGROIDEAS_URL);

  return rows
    .slice(1)
    .filter(r => r[2])
    .map(r => ({

      id: clean(r[0]),

      coleccion: clean(r[1]),

      nombre: clean(r[2]),

      imagen: clean(r[3]),

      recurso: clean(r[4]),

      descripcion: clean(r[5]),

      tipo: clean(r[6]),

      lat:
        parseFloat(clean(r[7])),

      lng:
        parseFloat(clean(r[8]))

    }));

}

/* =========================================
   IMAGE
========================================= */

function renderImage(url) {

  const img =
    getGoogleDriveImage(url);

  if (!img) {

    return `
      <div class="idea-placeholder">
        <i class="fa-solid fa-cube"></i>
      </div>
    `;

  }

  return `
    <img
      src="${img}"
      alt="AgroIdea"
      referrerpolicy="no-referrer"
      loading="lazy"
      onerror="
        this.onerror=null;
        this.src='https://placehold.co/600x400/e2e8f0/64748b?text=AgroIdea';
      "
    />
  `;

}

/* =========================================
   FILTERS
========================================= */

function applyFilters() {

  const search =
    document
      .getElementById("ideasSearch")
      .value
      .toLowerCase();

  filteredIdeas =
    allIdeas.filter(item => {

      const text =
        `
          ${item.nombre}
          ${item.descripcion}
          ${item.tipo}
        `
        .toLowerCase();

      const matchSearch =
        text.includes(search);

      let matchType = true;

      const tipo =
        item.tipo.toLowerCase();

      if (
        currentFilter === "modelo"
      ) {

        matchType =
          tipo.includes("3d") ||
          tipo.includes("modelo");

      }

      if (
        currentFilter === "prototipo"
      ) {

        matchType =
          tipo.includes("prototipo");

      }

      return (
        matchSearch &&
        matchType
      );

    });

  currentPage = 1;

  renderPage(currentPage);

}

/* =========================================
   RENDER PAGE
========================================= */

function renderPage(page) {

  const grid =
    document.getElementById(
      "ideasGrid"
    );

  grid.innerHTML = "";

  const start =
    (page - 1) * ITEMS_PER_PAGE;

  const end =
    start + ITEMS_PER_PAGE;

  const items =
    filteredIdeas.slice(start, end);

  items.forEach(item => {

    const card =
      document.createElement("div");

    card.className =
      "idea-card-v2";

    card.innerHTML = `

      <div class="idea-card-image">

        ${renderImage(item.imagen)}

      </div>

      <div class="idea-card-body">

        <div class="idea-chip">

          ${item.coleccion || "AgroIdeas"}

        </div>

        <h3>

          ${item.nombre}

        </h3>

        <p class="idea-short-desc">

          ${truncate(item.descripcion, 110)}

        </p>

        <div class="idea-actions">

          <button
            class="resource-btn"
            onclick='openIdeaModal(${JSON.stringify(item)})'
          >
            Ver detalle
          </button>

          ${
            item.recurso
              ? `
                <a
                  href="${item.recurso}"
                  target="_blank"
                  class="resource-btn secondary"
                >
                  Recurso
                </a>
              `
              : ""
          }

        </div>

      </div>

    `;

    grid.appendChild(card);

  });

  renderPagination();

}

/* =========================================
   PAGINATION
========================================= */

function renderPagination() {

  const container =
    document.getElementById(
      "ideasPagination"
    );

  container.innerHTML = "";

  const totalPages =
    Math.ceil(
      filteredIdeas.length /
      ITEMS_PER_PAGE
    );

  for (
    let i = 1;
    i <= totalPages;
    i++
  ) {

    const btn =
      document.createElement("button");

    btn.className =
      `page-btn ${
        i === currentPage
          ? "active"
          : ""
      }`;

    btn.textContent = i;

    btn.onclick = () => {

      currentPage = i;

      renderPage(i);

      window.scrollTo({

        top:
          document
            .getElementById(
              "catalogo"
            )
            .offsetTop - 80,

        behavior: "smooth"

      });

    };

    container.appendChild(btn);

  }

}

/* =========================================
   TRUNCATE
========================================= */

function truncate(text, max = 120) {

  if (!text) return "";

  if (text.length <= max) {

    return text;

  }

  return (
    text.substring(0, max) + "..."
  );

}

/* =========================================
   MODAL
========================================= */

function openIdeaModal(item) {

  const modal =
    document.getElementById(
      "ideaModal"
    );

  const body =
    document.getElementById(
      "ideaModalBody"
    );

  body.innerHTML = `

    <div class="modal-image">

      ${renderImage(item.imagen)}

    </div>

    <div class="modal-content">

      <div class="idea-chip">
        ${item.coleccion}
      </div>

      <h2>
        ${item.nombre}
      </h2>

      <p>
        ${item.descripcion || ""}
      </p>

      <br>

      ${
        item.recurso
          ? `
            <a
              href="${item.recurso}"
              target="_blank"
              class="resource-btn"
            >
              Abrir recurso
            </a>
          `
          : ""
      }

    </div>

  `;

  modal.classList.add("show");

}

function closeIdeaModal() {

  document
    .getElementById("ideaModal")
    .classList
    .remove("show");

}

window.openIdeaModal =
  openIdeaModal;

window.closeIdeaModal =
  closeIdeaModal;

/* =========================================
   MAPA
========================================= */

function renderMapa(data) {

  const puntos =
    data.filter(item => {

      return (
        item.tipo.toLowerCase() ===
          "punto" &&
        !isNaN(item.lat) &&
        !isNaN(item.lng)
      );

    });

  if (!puntos.length) return;

  const map =
    L.map("mapImpresoras")
      .setView(
        [9.7489, -83.7534],
        8
      );

  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      attribution:
        "&copy; OpenStreetMap"
    }
  ).addTo(map);

  puntos.forEach(punto => {

    L.marker([
      punto.lat,
      punto.lng
    ])
      .addTo(map)
      .bindPopup(`

        <div class="map-popup">

          <h4>
            ${punto.nombre}
          </h4>

          <p>
            ${truncate(
              punto.descripcion,
              120
            )}
          </p>

        </div>

      `);

  });

}

/* =========================================
   EVENTS
========================================= */

function setupEvents() {

  document
    .getElementById("ideasSearch")
    .addEventListener(
      "input",
      applyFilters
    );

  document
    .getElementById("explorarBtn")
    .addEventListener(
      "click",
      applyFilters
    );

  document
    .querySelectorAll(".filter-btn")
    .forEach(btn => {

      btn.addEventListener(
        "click",
        () => {

          document
            .querySelectorAll(
              ".filter-btn"
            )
            .forEach(b => {

              b.classList.remove(
                "active"
              );

            });

          btn.classList.add(
            "active"
          );

          currentFilter =
            btn.dataset.filter;

          applyFilters();

        }
      );

    });

}

/* =========================================
   INIT
========================================= */

async function initAgroIdeas() {

  try {

    allIdeas =
      await fetchAgroIdeas();

    filteredIdeas =
      [...allIdeas];

    renderPage(1);

    renderMapa(allIdeas);

    setupEvents();

  } catch (error) {

    console.error(error);

    alert(
      "Error cargando AgroIdeas"
    );

  }

}

document.addEventListener(
  "DOMContentLoaded",
  initAgroIdeas
);