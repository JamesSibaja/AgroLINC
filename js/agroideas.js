let catalogoOriginal = [];

/* =========================================
   PAGINACIÓN
========================================= */

const ITEMS_PER_PAGE = 6;

let currentPage = 1;

let catalogoGlobal = [];

/* =========================================
   AGROIDEAS
========================================= */

const AGROIDEAS_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ0Qx4yyj93NZTptg6jXzfAH4PJukBl7pjLJ8rry7j5fOfEETlzC45utloqB6WYxw/pub?gid=1323057626&single=true&output=csv";

const AGROIDEAS_3D =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ0Qx4yyj93NZTptg6jXzfAH4PJukBl7pjLJ8rry7j5fOfEETlzC45utloqB6WYxw/pub?gid=434666419&single=true&output=csv";

const AGROIDEAS_MAPA_MAKER =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ0Qx4yyj93NZTptg6jXzfAH4PJukBl7pjLJ8rry7j5fOfEETlzC45utloqB6WYxw/pub?gid=1086175041&single=true&output=csv";

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

/* =========================================
   GOOGLE DRIVE IMAGE
========================================= */

function getGoogleDriveImage(url) {

  if (!url) return "";

  /*
    Convierte:

    https://drive.google.com/file/d/FILE_ID/view

    a:

    https://drive.google.com/thumbnail?id=FILE_ID&sz=w1000
  */

  const match =
    url.match(/\/d\/(.*?)\//);

  if (!match) return url;

  const fileId = match[1];

  return `
    https://drive.google.com/thumbnail?id=${fileId}&sz=w1200
  `;

}

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
    await fetchCSV(
      AGROIDEAS_URL,
      "AGROIDEAS"
    );

  /*
    COLUMNAS:

    0 ID
    1 Colección
    2 Nombre
    3 Imagen
    4 Recurso
    5 Descripción
    6 Tipo
    7 lat
    8 lng
  */

  const data = rows
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

  debugLog(
    "AGROIDEAS LIMPIAS",
    data
  );

  return data;

}

/* =========================================
   IMAGE
========================================= */

function getImage(url) {

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
      alt="Imagen AgroIdea"
      loading="lazy"
    />
  `;

}

function renderCatalogo(data) {

  catalogoOriginal =
    data.filter(item => {

      const tipo =
        item.tipo.toLowerCase();

      return (
        tipo.includes("3d") ||
        tipo.includes("modelo") ||
        tipo.includes("prototipo")
      );

    });

  catalogoGlobal =
    [...catalogoOriginal];

  currentPage = 1;

  renderPage(1);

}

/* =========================================
   RENDER PAGE
========================================= */

function renderPage(page) {

  const grid =
    document.getElementById(
      "ideasGrid"
    );

  const pagination =
    document.getElementById(
      "ideasPagination"
    );

  if (!grid) return;

  grid.innerHTML = "";

  const start =
    (page - 1) * ITEMS_PER_PAGE;

  const end =
    start + ITEMS_PER_PAGE;

  const items =
    catalogoGlobal.slice(start, end);

  items.forEach(item => {

    const card =
      document.createElement("div");

    card.className =
      "idea-card-v2";

    card.innerHTML = `

      <div class="idea-card-image">

        ${getImage(item.imagen)}

      </div>

      <div class="idea-card-body">

        <div class="idea-chip">
          ${item.coleccion || "AgroIdeas"}
        </div>

        <h3>
          ${item.nombre}
        </h3>

        <p class="idea-short-desc">
          ${
            truncate(
              item.descripcion,
              110
            )
          }
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
   TRUNCATE
========================================= */

function truncate(text, max = 120) {

  if (!text) return "";

  if (text.length <= max) {

    return text;

  }

  return text.substring(0, max) + "...";

}
/* =========================================
   PAGINATION
========================================= */

function renderPagination() {

  const container =
    document.getElementById(
      "ideasPagination"
    );

  if (!container) return;

  container.innerHTML = "";

  const totalPages =
    Math.ceil(
      catalogoGlobal.length /
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
   MAPA
========================================= */

function renderMapa(data) {

  const mapContainer =
    document.getElementById(
      "mapImpresoras"
    );

  if (!mapContainer) return;

  const puntos = data.filter(item => {

    return (
      item.tipo.toLowerCase() === "punto" &&
      !isNaN(item.lat) &&
      !isNaN(item.lng)
    );

  });

  const map = L.map(
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
            ${punto.descripcion || ""}
          </p>

          ${
            punto.recurso
              ? `
                <a
                  href="${punto.recurso}"
                  target="_blank"
                >
                  Ver más
                </a>
              `
              : ""
          }

        </div>

      `);

  });

  setTimeout(() => {

    map.invalidateSize();

  }, 500);

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
        tipo.includes("territorial") ||
        tipo.includes("mapeo")
      );

    });

  territoriales.forEach(item => {

    const card =
      document.createElement("div");

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
        ${item.descripcion}
      </p>

      ${
        item.recurso
          ? `
            <a
              href="${item.recurso}"
              target="_blank"
              class="territorial-link"
            >
              Abrir recurso
            </a>
          `
          : ""
      }

    `;

    container.appendChild(card);

  });

}
/* =========================================
   BUSCADOR
========================================= */

function initSearch() {

  const input =
  document.getElementById(
  "ideasSearch"
  );
  
  const btn =
  document.getElementById(
  "explorarBtn"
  );
  
  if (!input) return;
  
  function buscar() {
  
  const q =
  input.value
  .toLowerCase()
  .trim();
  
  if (!q) {
  
  catalogoGlobal =
  [
  ...catalogoOriginal
  ];
  
  }
  
  else {
  
  catalogoGlobal =
  catalogoOriginal.filter(
  item => {
  
  return (
  
  item.nombre
  .toLowerCase()
  .includes(q)
  
  ||
  
  item.descripcion
  .toLowerCase()
  .includes(q)
  
  ||
  
  item.coleccion
  .toLowerCase()
  .includes(q)
  
  );
  
  }
  );
  
  }
  
  currentPage = 1;
  
  renderPage(1);
  
  document
  .getElementById(
  "catalogoPrototipo"
  )
  .scrollIntoView({
  behavior:
  "smooth"
  });
  
  }
  
  input.addEventListener(
  "input",
  buscar
  );
  
  btn.addEventListener(
  "click",
  buscar
  );
  
  }
  
  
  /* =========================================
  SIDEBAR
  ========================================= */
  
  function initSidebar() {
  
  const links =
  document.querySelectorAll(
  ".explorer-link"
  );
  
  const sections =
  [
  ...links
  ]
  .map(
  l => {
  
  const id =
  l
  .getAttribute(
  "href"
  )
  .replace(
  "#",
  ""
  );
  
  return document.getElementById(
  id
  );
  
  }
  )
  .filter(Boolean);
  
  function activate() {
  
  let active =
  sections[0];
  
  sections.forEach(s => {
  
  if (
  
  window.scrollY
  
  >=
  
  s.offsetTop
  - 220
  
  ) {
  
  active =
  s;
  
  }
  
  });
  
  links.forEach(link => {
  
  link.classList.remove(
  "active"
  );
  
  if (
  
  link.getAttribute(
  "href"
  )
  
  ===
  
  `#${active.id}`
  
  ) {
  
  link.classList.add(
  "active"
  );
  
  }
  
  });
  
  }
  
  links.forEach(link => {
  
  link.addEventListener(
  "click",
  e => {
  
  e.preventDefault();
  
  const id =
  link
  .getAttribute(
  "href"
  );
  
  document
  .querySelector(
  id
  )
  .scrollIntoView({
  
  behavior:
  "smooth"
  
  });
  
  });
  
  });
  
  window.addEventListener(
  "scroll",
  activate
  );
  
  activate();
  
  }
  
  
  /* =========================================
  INIT
  ========================================= */
  
  async function initAgroIdeas() {
  
  try {
  
  const data =
  await fetchAgroIdeas();
  
  renderCatalogo(
  data
  );
  
  renderMapa(
  data
  );
  
  renderTerritorial(
  data
  );
  
  initSidebar();
  
  initSearch();
  
  }
  
  catch (e) {
  
  console.error(
  e
  );
  
  alert(
  "Error cargando AgroIdeas"
  );
  
  }
  
  }
  
  document.addEventListener(
  "DOMContentLoaded",
  initAgroIdeas
  );