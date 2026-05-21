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

let currentFilter = "todos";

let catalogoGlobal = [];

let catalogoFiltrado = [];

/* =========================================
   HELPERS
========================================= */

function clean(value) {

  return String(value || "")
    .replace(/\r/g, "")
    .replace(/\n/g, "")
    .trim();

}

function truncate(text, max = 120) {

  if (!text) return "";

  return text.length > max
    ? text.substring(0, max) + "..."
    : text;

}

/* =========================================
   GOOGLE DRIVE
========================================= */

function getGoogleDriveImage(url) {

  if (!url) return "";

  const match =
    url.match(/\/d\/(.*?)\//);

  if (!match) return url;

  const fileId = match[1];

  /*
    Firefox falla con thumbnail.
    Usamos uc?export=view
  */

  return `
    https://drive.google.com/uc?export=view&id=${fileId}
  `.trim();

}

/* =========================================
   IMAGE HTML
========================================= */

function getImageHTML(url) {

  const imageUrl =
    getGoogleDriveImage(url);

  if (!imageUrl) {

    return `
      <div class="idea-placeholder">
        <i class="fa-solid fa-cube"></i>
      </div>
    `;

  }

  return `
    <img
      src="${imageUrl}"
      alt="AgroIdea"
      loading="lazy"
      referrerpolicy="no-referrer"
      crossorigin="anonymous"

      onerror="
        this.onerror=null;
        this.parentElement.innerHTML=
        '<div class=idea-placeholder><i class=fa-solid fa-image></i></div>';
      "
    />
  `;

}

/* =========================================
   CSV PARSER
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
   FETCH CSV
========================================= */

async function fetchCSV(url) {

  const response =
    await fetch(url);

  const text =
    await response.text();

  return parseCSV(text);

}

/* =========================================
   FETCH DATA
========================================= */

async function fetchAgroIdeas() {

  const rows =
    await fetchCSV(
      AGROIDEAS_URL
    );

  return rows
    .slice(1)
    .filter(r => r[2])
    .map(r => ({

      id:
        clean(r[0]),

      coleccion:
        clean(r[1]),

      nombre:
        clean(r[2]),

      imagen:
        clean(r[3]),

      recurso:
        clean(r[4]),

      descripcion:
        clean(r[5]),

      tipo:
        clean(r[6]),

      lat:
        parseFloat(clean(r[7])),

      lng:
        parseFloat(clean(r[8]))

    }));

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

  catalogoFiltrado =
    catalogoGlobal.filter(item => {

      const tipo =
        item.tipo.toLowerCase();

      const matchesSearch =

        item.nombre
          .toLowerCase()
          .includes(search)

        ||

        item.descripcion
          .toLowerCase()
          .includes(search);

      if (
        currentFilter ===
        "modelo"
      ) {

        return (
          (
            tipo.includes("3d") ||
            tipo.includes("modelo")
          )
          &&
          matchesSearch
        );

      }

      if (
        currentFilter ===
        "prototipo"
      ) {

        return (
          tipo.includes(
            "prototipo"
          )
          &&
          matchesSearch
        );

      }

      return matchesSearch;

    });

  currentPage = 1;

  renderPage(currentPage);

}

/* =========================================
   RENDER CATALOGO
========================================= */

function renderCatalogo(data) {

  catalogoGlobal =
    data.filter(item => {

      const tipo =
        item.tipo.toLowerCase();

      return (
        tipo.includes("3d")
        ||
        tipo.includes("modelo")
        ||
        tipo.includes("prototipo")
      );

    });

  catalogoFiltrado =
    [...catalogoGlobal];

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
    (page - 1) *
    ITEMS_PER_PAGE;

  const end =
    start +
    ITEMS_PER_PAGE;

  const items =
    catalogoFiltrado.slice(
      start,
      end
    );

  items.forEach(item => {

    const card =
      document.createElement(
        "div"
      );

    card.className =
      "idea-card-v2";

    card.innerHTML = `

      <div class="idea-card-image">

        ${getImageHTML(item.imagen)}

      </div>

      <div class="idea-card-body">

        <div class="idea-chip">
          ${item.tipo || "AgroIdeas"}
        </div>

        <h3>
          ${item.nombre}
        </h3>

        <p class="idea-short-desc">
          ${truncate(item.descripcion, 90)}
        </p>

        <div class="idea-actions">

          <button
            class="resource-btn"
            data-id="${item.id}"
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

    /* OPEN MODAL */

    card
      .querySelector(
        ".resource-btn"
      )
      .addEventListener(
        "click",
        () => openIdeaModal(item)
      );

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
      catalogoFiltrado.length
      /
      ITEMS_PER_PAGE
    );

  if (totalPages <= 1) return;

  for (
    let i = 1;
    i <= totalPages;
    i++
  ) {

    const btn =
      document.createElement(
        "button"
      );

    btn.className =
      `page-btn ${
        i === currentPage
          ? "active"
          : ""
      }`;

    btn.textContent = i;

    btn.addEventListener(
      "click",
      () => {

        currentPage = i;

        renderPage(i);

        window.scrollTo({

          top:
            document
              .getElementById(
                "catalogo"
              )
              .offsetTop - 100,

          behavior:
            "smooth"

        });

      }
    );

    container.appendChild(btn);

  }

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

      ${getImageHTML(item.imagen)}

    </div>

    <div class="modal-content">

      <div class="idea-chip">
        ${item.tipo}
      </div>

      <h2>
        ${item.nombre}
      </h2>

      <p>
        ${item.descripcion || ""}
      </p>

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

/* =========================================
   CLOSE MODAL
========================================= */

function closeIdeaModal() {

  document
    .getElementById(
      "ideaModal"
    )
    .classList.remove(
      "show"
    );

}

/* =========================================
   MAPA
========================================= */

function renderMapa(data) {

  const mapContainer =
    document.getElementById(
      "mapImpresoras"
    );

  if (!mapContainer) return;

  const puntos =
    data.filter(item => {

      return (
        item.tipo
          .toLowerCase()
          .includes("punto")
        &&
        !isNaN(item.lat)
        &&
        !isNaN(item.lng)
      );

    });

  const map =
    L.map(
      "mapImpresoras"
    ).setView(
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
              100
            )}
          </p>

        </div>

      `);

  });

}

/* =========================================
   TERRITORIAL
========================================= */

function renderTerritorial(data) {

  const container =
    document.getElementById(
      "territorialGrid"
    );

  if (!container) return;

  container.innerHTML = "";

  const territoriales =
    data.filter(item => {

      const tipo =
        item.tipo.toLowerCase();

      return (
        tipo.includes(
          "territorial"
        )
        ||
        tipo.includes(
          "mapeo"
        )
      );

    });

  territoriales.forEach(item => {

    const card =
      document.createElement(
        "div"
      );

    card.className =
      "territorial-card";

    card.innerHTML = `

      <div class="territorial-icon">

        <i class="fa-solid fa-map-location-dot"></i>

      </div>

      <h3>
        ${item.nombre}
      </h3>

      <p>
        ${truncate(
          item.descripcion,
          160
        )}
      </p>

    `;

    container.appendChild(card);

  });

}

/* =========================================
   EVENTS
========================================= */

function initEvents() {

  /* SEARCH */

  document
    .getElementById(
      "ideasSearch"
    )
    .addEventListener(
      "input",
      applyFilters
    );

  document
    .getElementById(
      "explorarBtn"
    )
    .addEventListener(
      "click",
      applyFilters
    );

  /* FILTERS */

  document
    .querySelectorAll(
      ".catalog-filter-btn"
    )
    .forEach(btn => {

      btn.addEventListener(
        "click",
        () => {

          document
            .querySelectorAll(
              ".catalog-filter-btn"
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

  /* MODAL */

  document
    .getElementById(
      "closeModalBtn"
    )
    .addEventListener(
      "click",
      closeIdeaModal
    );

  window.addEventListener(
    "click",
    e => {

      const modal =
        document.getElementById(
          "ideaModal"
        );

      if (
        e.target === modal
      ) {

        closeIdeaModal();

      }

    }
  );

}

/* =========================================
   INIT
========================================= */

async function initAgroIdeas() {

  try {

    const data =
      await fetchAgroIdeas();

    renderCatalogo(data);

    renderMapa(data);

    renderTerritorial(data);

    initEvents();

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