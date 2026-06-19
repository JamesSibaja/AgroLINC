/* =========================================
ESTADO GLOBAL
========================================= */

const ITEMS_PER_PAGE = 6;
let currentPage = 1;

let biblioteca = {
  prototipos: [],
  modelos3d: [],
  mapaMaker: []
};

let catalogoOriginal = [];
let catalogoGlobal = [];

/* =========================================
URLS DE GOOGLE SHEETS (CSV)
========================================= */

const AGROIDEAS_PROTOTIPO = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQen9jQ8hTfq8nTuYdXS3JXnha10XGyrK42n57v2UT8kEvN3UlrfGiXcKaLY2ZhX8YN2IjWyiUqj-_q/pub?gid=1323057626&single=true&output=csv";
const AGROIDEAS_3D = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQen9jQ8hTfq8nTuYdXS3JXnha10XGyrK42n57v2UT8kEvN3UlrfGiXcKaLY2ZhX8YN2IjWyiUqj-_q/pub?gid=434666419&single=true&output=csv";
const AGROIDEAS_MAPA_MAKER = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQen9jQ8hTfq8nTuYdXS3JXnha10XGyrK42n57v2UT8kEvN3UlrfGiXcKaLY2ZhX8YN2IjWyiUqj-_q/pub?gid=1086175041&single=true&output=csv";

/* =========================================
HELPERS / UTILIDADES
========================================= */

function clean(v) {
  return String(v || "")
    .replace(/\r/g, "")
    .replace(/\n/g, " ") // Cambiado a espacio para no romper textos en listados
    .trim();
}

function truncate(text, max = 120) {
  if (!text) return "";
  if (text.length <= max) return text;
  return text.slice(0, max) + "...";
}

function getGoogleDriveImage(url) {
  if (!url) return "";
  const match = url.match(/\/d\/(.*?)\//);
  if (!match) return url;
  return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1200`;
}

function getImage(url) {
  const img = getGoogleDriveImage(url);
  if (!img) {
    return `
      <div class="idea-placeholder">
        <i class="fa-solid fa-cube"></i>
      </div>
    `;
  }
  return `<img src="${img}" loading="lazy" alt="Imagen del recurso" />`;
}

/* =========================================
PROCESAMIENTO CSV ROBUSTO
========================================= */

function parseCSV(text) {
  const lines = [];
  let row = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (c === '"') {
      if (insideQuotes && next === '"') {
        current += '"'; // Escapar comillas dobles
        i++;
      } else {
        insideQuotes = !insideQuotes; // Switchear estado
      }
    } else if (c === ',' && !insideQuotes) {
      row.push(clean(current));
      current = "";
    } else if ((c === '\r' || c === '\n') && !insideQuotes) {
      if (c === '\r' && next === '\n') {
        i++;
      }
      row.push(clean(current));
      lines.push(row);
      row = [];
      current = "";
    } else {
      current += c;
    }
  }
  
  if (current || row.length > 0) {
    row.push(clean(current));
    lines.push(row);
  }
  
  return lines.filter(r => r.length > 0 && r.some(cell => cell !== ""));
}

async function fetchCSV(url, label) {
  const res = await fetch(url);
  const txt = await res.text();
  console.log(label, "datos cargados.");
  return parseCSV(txt);
}

/* =========================================
FETCH DE DATOS ASÍNCRONOS
========================================= */

async function fetchPrototipos() {
  const rows = await fetchCSV(AGROIDEAS_PROTOTIPO, "PROTOTIPOS");
  return rows
    .slice(1)
    .filter(r => r[2])
    .map(r => ({
      tipo: "prototipo",
      id: clean(r[0]),
      coleccion: clean(r[1]),
      nombre: clean(r[2]),
      imagen: clean(r[3]),
      github: clean(r[4]),
      descripcion: clean(r[5]),
      autor: clean(r[6])
    }));
}

async function fetch3D() {
  const rows = await fetchCSV(AGROIDEAS_3D, "3D");
  return rows
    .slice(1)
    .filter(r => r[2])
    .map(r => ({
      tipo: "3d",
      id: clean(r[0]),
      coleccion: clean(r[1]),
      nombre: clean(r[2]),
      imagen: clean(r[3]),
      descarga: clean(r[4]),
      descripcion: clean(r[5]),
      impresion: clean(r[6]),
      autor: clean(r[7])
    }));
}

async function fetchMapaMaker() {
  const rows = await fetchCSV(AGROIDEAS_MAPA_MAKER, "MAPA");
  return rows
    .slice(1)
    .filter(r => r[1])
    .map(r => ({
      tipo: "mapa",
      id: clean(r[0]),
      nombre: clean(r[1]),
      imagen: clean(r[2]),
      tipoPunto: clean(r[3]),
      descripcion: clean(r[4]),
      lat: Number(r[5]),
      lng: Number(r[6]),
      link: clean(r[7])
    }));
}

async function fetchAgroIdeas() {
  const [prototipos, modelos3d, mapaMaker] = await Promise.all([
    fetchPrototipos(),
    fetch3D(),
    fetchMapaMaker()
  ]);

  biblioteca = { prototipos, modelos3d, mapaMaker };
}

/* =========================================
RENDER TARJETAS / CATÁLOGO
========================================= */

function renderCatalogo() {
  catalogoOriginal = [...biblioteca.prototipos];
  catalogoGlobal = [...catalogoOriginal];
  currentPage = 1;
  
  renderPage(1);
  render3D();
}

function renderPage(page) {
  const grid = document.getElementById("ideasGrid");
  if (!grid) return;
  
  grid.innerHTML = "";
  const start = (page - 1) * ITEMS_PER_PAGE;
  const items = catalogoGlobal.slice(start, start + ITEMS_PER_PAGE);
  
  if (items.length === 0) {
    grid.innerHTML = `<p class="no-results">No se encontraron prototipos que coincidan con la búsqueda.</p>`;
    renderPagination();
    return;
  }

  items.forEach(item => {
    const card = document.createElement("div");
    card.className = "idea-card-v2";
    
    // Inyección segura de datos del item en el botón usando Base64 para evitar errores de sintaxis JSON
    const itemDataAttr = btoa(unescape(encodeURIComponent(JSON.stringify(item))));

    card.innerHTML = `
      <div class="idea-card-image">
        ${getImage(item.imagen)}
      </div>
      <div class="idea-card-body">
        <div class="idea-chip">${item.coleccion || "AgroIdeas"}</div>
        <h3>${item.nombre}</h3>
        <p class="idea-short-desc">${truncate(item.descripcion, 110)}</p>
        <div class="idea-actions">
          <button class="resource-btn" onclick="openIdeaModalFromAttr('${itemDataAttr}')">
            Ver detalle
          </button>
          ${item.github ? `<a href="${item.github}" target="_blank" class="resource-btn secondary">Github</a>` : ""}
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
  
  renderPagination();
}

/* =========================================
RENDER MODELOS 3D
========================================= */

function render3D() {
  const section = document.getElementById("catalogo");
  if (!section) return;
  
  const old = section.querySelector(".ideas-grid");
  if (old) old.remove();
  
  const grid = document.createElement("div");
  grid.className = "ideas-grid";
  
  biblioteca.modelos3d.forEach(item => {
    const card = document.createElement("div");
    card.className = "idea-card-v2";
    
    const itemDataAttr = btoa(unescape(encodeURIComponent(JSON.stringify(item))));

    card.innerHTML = `
      <div class="idea-card-image">${getImage(item.imagen)}</div>
      <div class="idea-card-body">
        <div class="idea-chip">${item.coleccion || "3D"}</div>
        <h3>${item.nombre}</h3>
        <p>${truncate(item.descripcion)}</p>
        <div class="idea-actions">
          <button class="resource-btn" onclick="openIdeaModalFromAttr('${itemDataAttr}')">
            Ver detalle
          </button>
          ${item.descarga ? `<a href="${item.descarga}" target="_blank" class="resource-btn secondary">Descargar</a>` : ""}
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
  
  section.appendChild(grid);
}

/* =========================================
PAGINACIÓN
========================================= */

function renderPagination() {
  const container = document.getElementById("ideasPagination");
  if (!container) return;
  
  container.innerHTML = "";
  const pages = Math.ceil(catalogoGlobal.length / ITEMS_PER_PAGE);
  if (pages <= 1) return;

  for (let i = 1; i <= pages; i++) {
    const btn = document.createElement("button");
    btn.className = `page-btn ${i === currentPage ? "active" : ""}`;
    btn.textContent = i;
    btn.onclick = () => {
      currentPage = i;
      renderPage(i);
    };
    container.appendChild(btn);
  }
}

/* =========================================
MODAL CONTROL
========================================= */

// Función puente para decodificar los atributos del botón y evitar bugs de comillas
window.openIdeaModalFromAttr = function(base64Str) {
  try {
    const jsonStr = decodeURIComponent(escape(atob(base64Str)));
    const item = JSON.parse(jsonStr);
    openIdeaModal(item);
  } catch (err) {
    console.error("Error decodificando la información del modal", err);
  }
};

function openIdeaModal(item) {
  const modal = document.getElementById("ideaModal");
  const body = document.getElementById("ideaModalBody");
  if (!modal || !body) return;

  let extra = "";

  if (item.tipo === "prototipo") {
    extra = `
      ${item.autor ? `<p><strong>Desarrollado por:</strong> ${item.autor}</p>` : ""}
      ${item.github ? `<a href="${item.github}" target="_blank" class="resource-btn">Ver Github</a>` : ""}
    `;
  }

  if (item.tipo === "3d") {
    extra = `
      ${item.impresion ? `<p><strong>Cómo imprimir:</strong><br>${item.impresion}</p>` : ""}
      ${item.descarga ? `<a href="${item.descarga}" target="_blank" class="resource-btn">Descargar STL</a>` : ""}
    `;
  }

  body.innerHTML = `
    <div class="idea-modal-content">
      <div>${getImage(item.imagen)}</div>
      <h2>${item.nombre}</h2>
      <p>${item.descripcion || ""}</p>
      <p><strong>Colección:</strong> ${item.coleccion || "AgroIdeas"}</p>
      ${extra}
    </div>
  `;
  
  modal.classList.add("open");
}

function closeIdeaModal() {
  const modal = document.getElementById("ideaModal");
  if (modal) modal.classList.remove("open");
}

/* =========================================
BÚSQUEDA EN TIEMPO REAL
========================================= */

function initSearch() {
  const input = document.getElementById("ideasSearch");
  const btn = document.getElementById("explorarBtn");
  
  if (!input) return;

  function buscar() {
    const q = input.value.toLowerCase().trim();
    
    if (!q) {
      catalogoGlobal = [...catalogoOriginal];
    } else {
      catalogoGlobal = catalogoOriginal.filter(item => 
        Object.values(item)
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }
    
    currentPage = 1;
    renderPage(1);
  }

  input.addEventListener("input", buscar);
  if (btn) {
    btn.addEventListener("click", buscar);
  }
}

/* =========================================
MAPA MAKER (LEAFLET)
========================================= */

function renderMapa() {
  const container = document.getElementById("mapImpresoras");
  if (!container) return;
  
  container.innerHTML = "";
  
  // Coordenadas base por defecto
  const map = L.map("mapImpresoras").setView([9.7489, -83.7534], 8);
  
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
  }).addTo(map);
  
  biblioteca.mapaMaker
    .filter(p => !isNaN(p.lat) && !isNaN(p.lng))
    .forEach(p => {
      const popup = `
        <div class="map-popup">
          ${p.imagen ? `<img src="${getGoogleDriveImage(p.imagen)}" style="width:100%; border-radius:12px; margin-bottom:12px;" alt="Punto de interés"/>` : ""}
          <h3>${p.nombre}</h3>
          ${p.tipoPunto ? `<p><strong>Tipo:</strong> ${p.tipoPunto}</p>` : ""}
          <p>${p.descripcion || ""}</p>
          ${p.link ? `<a href="${p.link}" target="_blank">Abrir recurso</a>` : ""}
        </div>
      `;
      
      L.marker([p.lat, p.lng])
        .addTo(map)
        .bindPopup(popup);
    });
  
  setTimeout(() => {
    map.invalidateSize();
  }, 400);
}

/* =========================================
SIDEBAR / NAVEGACIÓN SCROLL
========================================= */

function initSidebar() {
  const links = document.querySelectorAll(".explorer-link");
  if (links.length === 0) return;

  const sections = [...links]
    .map(l => {
      const href = l.getAttribute("href");
      return href ? document.getElementById(href.replace("#", "")) : null;
    })
    .filter(Boolean);
    
  function activate() {
    if (sections.length === 0) return;
    let active = sections[0];
    
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - 220) {
        active = s;
      }
    });
    
    links.forEach(link => {
      link.classList.remove("active");
      if (link.getAttribute("href") === `#${active.id}`) {
        link.classList.add("active");
      }
    });
  }
  
  links.forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute("href"));
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  });
  
  window.addEventListener("scroll", activate);
  activate();
}

/* =========================================
EVENT LISTENERS ACCESIBILIDAD MÓDULOS
========================================= */

document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeIdeaModal();
});

const modalContainer = document.getElementById("ideaModal");
if (modalContainer) {
  modalContainer.addEventListener("click", e => {
    if (e.target.id === "ideaModal") closeIdeaModal();
  });
}

/* =========================================
INICIALIZADOR APP
========================================= */

async function initAgroIdeas() {
  try {
    await fetchAgroIdeas();
    renderCatalogo();
    renderMapa();
    initSidebar();
    initSearch();
    console.log("AgroIdeas inicializado con éxito OK");
  } catch (e) {
    console.error("Fallo crítico en AgroIdeas:", e);
    alert("Error cargando los componentes de AgroIdeas");
  }
}

/* =========================================
EJECUCIÓN AL CARGAR DOM
========================================= */

document.addEventListener("DOMContentLoaded", initAgroIdeas);