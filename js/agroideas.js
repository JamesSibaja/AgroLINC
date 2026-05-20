/* =========================================
   AGROIDEAS
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

  if (!url) {

    return `
      <div class="idea-placeholder">
        <i class="fa-solid fa-cube"></i>
      </div>
    `;

  }

  return `
    <img
      src="${url}"
      alt="Imagen"
    />
  `;

}

/* =========================================
   RENDER CATALOGO
========================================= */

function renderCatalogo(data) {

  const grid =
    document.getElementById(
      "ideasGrid"
    );

  if (!grid) return;

  grid.innerHTML = "";

  const catalogo = data.filter(item => {

    const tipo =
      item.tipo.toLowerCase();

    return (
      tipo.includes("3d") ||
      tipo.includes("prototipo") ||
      tipo.includes("modelo")
    );

  });

  catalogo.forEach(item => {

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

        <p>
          ${item.descripcion || ""}
        </p>

        <div class="idea-actions">

          ${
            item.recurso
              ? `
                <a
                  href="${item.recurso}"
                  target="_blank"
                  class="resource-btn"
                >
                  Ver recurso
                </a>
              `
              : ""
          }

        </div>

      </div>

    `;

    grid.appendChild(card);

  });

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
   INIT
========================================= */

async function initAgroIdeas() {

  try {

    const data =
      await fetchAgroIdeas();

    renderCatalogo(data);

    renderMapa(data);

    renderTerritorial(data);

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