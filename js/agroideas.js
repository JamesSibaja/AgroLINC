/* =========================================
ESTADO GLOBAL
========================================= */

const ITEMS_PER_PAGE = 6;
// Páginas independientes para cada sección
let currentPagePrototipos = 1;
let currentPage3D = 1;

let biblioteca = {
  prototipos: [],
  modelos3d: [],
  mapaMaker: []
};

// Listas globales que mutan con las búsquedas
let prototiposFiltrados = [];
let modelos3dFiltrados = [];
let mapaFiltrado = [];

// Instancia global del mapa para poder manipular los marcadores dinámicamente
let mapaLeaflet = null;
let marcadoresMapa = [];

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
    .replace(/\n/g, " ")
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
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
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
RENDERIZADO DE COMPONENTES
========================================= */

function renderCatalogo() {
  // Inicializar estados filtrados con los originales de la biblioteca
  prototiposFiltrados = [...biblioteca.prototipos];
  modelos3dFiltrados = [...biblioteca.modelos3d];
  mapaFiltrado = [...biblioteca.mapaMaker];
  
  currentPagePrototipos = 1;
  currentPage3D = 1;
  
  renderPage(1);
  render3D(1);
  renderMarcadoresMapa();
}

// 1. Renderizar Prototipos (Paginados)
function renderPage(page) {
  const grid = document.getElementById("ideasGrid");
  if (!grid) return;
  
  grid.innerHTML = "";
  const start = (page - 1) * ITEMS_PER_PAGE;
  const items = prototiposFiltrados.slice(start, start + ITEMS_PER_PAGE);
  
  if (items.length === 0) {
    grid.innerHTML = `<p class="no-results">No se encontraron prototipos que coincidan.</p>`;
    renderPaginationPrototipos();
    return;
  }

  items.forEach(item => {
    const card = document.createElement("div");
    card.className = "idea-card-v2";
    
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
  
  renderPaginationPrototipos();
}

// 2. Renderizar Modelos 3D (Paginados)
function render3D(page) {
  const section = document.getElementById("catalogo");
  if (!section) return;
  
  let grid = section.querySelector(".ideas-grid");
  if (!grid) {
    grid = document.createElement("div");
    grid.className = "ideas-grid";
    section.appendChild(grid);
  }
  
  grid.innerHTML = "";
  
  const start = (page - 1) * ITEMS_PER_PAGE;
  const items = modelos3dFiltrados.slice(start, start + ITEMS_PER_PAGE);
  
  if (items.length === 0) {
    grid.innerHTML = `<p class="no-results">No se encontraron modelos 3D que coincidan.</p>`;
    renderPagination3D();
    return;
  }

  items.forEach(item => {
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

  renderPagination3D();
}

/* =========================================
PAGINACIONES INDEPENDIENTES
========================================= */

// Paginación de Prototipos
function renderPaginationPrototipos() {
  const container = document.getElementById("ideasPagination");
  if (!container) return;
  
  container.innerHTML = "";
  const pages = Math.ceil(prototiposFiltrados.length / ITEMS_PER_PAGE);
  if (pages <= 1) return;

  for (let i = 1; i <= pages; i++) {
    const btn = document.createElement("button");
    btn.className = `page-btn ${i === currentPagePrototipos ? "active" : ""}`;
    btn.textContent = i;
    btn.onclick = () => {
      currentPagePrototipos = i;
      renderPage(i);
    };
    container.appendChild(btn);
  }
}

// Paginación de Modelos 3D
function renderPagination3D() {
  const section = document.getElementById("catalogo");
  if (!section) return;

  // Buscar o crear dinámicamente el contenedor de paginación para 3D
  let container = document.getElementById("3dPagination");
  if (!container) {
    container = document.createElement("div");
    container.id = "3dPagination";
    container.style.display = "flex";
    container.style.gap = "1rem";
    container.style.justify = "center";
    container.style.marginTop = "3rem";
    section.appendChild(container);
  }

  container.innerHTML = "";
  const pages = Math.ceil(modelos3dFiltrados.length / ITEMS_PER_PAGE);
  if (pages <= 1) return;

  for (let i = 1; i <= pages; i++) {
    const btn = document.createElement("button");
    btn.className = `page-btn ${i === currentPage3D ? "active" : ""}`;
    btn.textContent = i;
    btn.onclick = () => {
      currentPage3D = i;
      render3D(i);
    };
    container.appendChild(btn);
  }
}

/* =========================================
BÚSQUEDA GLOBAL (AFECTA A LAS 3 BIBLIOTECAS)
========================================= */

function initSearch() {
  const input = document.getElementById("ideasSearch");
  const btn = document.getElementById("explorarBtn");
  
  if (!input) return;

  function buscar() {
    const q = input.value.toLowerCase().trim();
    
    if (!q) {
      prototiposFiltrados = [...biblioteca.prototipos];
      modelos3dFiltrados = [...biblioteca.modelos3d];
      mapaFiltrado = [...biblioteca.mapaMaker];
    } else {
      const matchesQuery = (item) => Object.values(item).join(" ").toLowerCase().includes(q);

      prototiposFiltrados = biblioteca.prototipos.filter(matchesQuery);
      modelos3dFiltrados = biblioteca.modelos3d.filter(matchesQuery);
      mapaFiltrado = biblioteca.mapaMaker.filter(matchesQuery);
    }
    
    currentPagePrototipos = 1;
    currentPage3D = 1;

    renderPage(1);
    render3D(1);
    renderMarcadoresMapa();
  }

  input.addEventListener("input", buscar);
  if (btn) {
    btn.addEventListener("click", buscar);
  }
}

/* =========================================
MAPA MAKER (LEAFLET - INICIALIZACIÓN Y FILTRADO)
========================================= */

/* =========================================
MAPA MAKER (LEAFLET - INICIALIZACIÓN Y FILTRADO)
========================================= */

function initMapa() {
  const container = document.getElementById("mapImpresoras");
  if (!container) return;
  
  container.innerHTML = "";
  
  // Coordenadas y zoom de origen (Costa Rica central)
  const origenLatLng = [9.7489, -83.7534];
  const origenZoom = 8;
  
  mapaLeaflet = L.map("mapImpresoras").setView(origenLatLng, origenZoom);
  
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
  }).addTo(mapaLeaflet);
  
  // =========================================================
  // BOTÓN PERSONALIZADO PARA VOLVER AL ORIGEN
  // =========================================================
  const HomeButtonControl = L.Control.extend({
    options: {
      position: 'topleft' // Se ubica justo debajo de los botones de + y -
    },
    onAdd: function () {
      const btn = L.DomUtil.create('button', 'map-home-btn');
      
      // Contenido visual del botón (un icono de casa o texto discreto)
      btn.innerHTML = '<i class="fa-solid fa-house"></i>';
      btn.title = 'Restablecer vista inicial';
      btn.type = 'button';
      
      // Evita que al hacer doble clic en el botón se haga zoom al mapa de fondo
      L.DomEvent.disableClickPropagation(btn);
      
      // Acción al presionar el botón
      btn.onclick = function() {
        const isMobile = window.innerWidth <= 768;
        
        // En móviles podemos regresar a un zoom un poco menor (7.5 u 8) si es necesario
        const zoomFinal = isMobile ? 7.5 : origenZoom;
        
        mapaLeaflet.flyTo(origenLatLng, zoomFinal, {
          duration: 1.2 // Transición suave de vuelta a casa
        });
        
        // Opcional: Cierra cualquier popup que haya quedado abierto
        mapaLeaflet.closePopup();
      };
      
      return btn;
    }
  });
  
  // Añadimos el botón al mapa
  mapaLeaflet.addControl(new HomeButtonControl());
  
  setTimeout(() => {
    mapaLeaflet.invalidateSize();
  }, 400);
}

// CORREGIDO: POPUP COMPACTO Y CENTRADO INTELIGENTE CON CONTEXTO GLOBAL
// CONTROL DE MARCADORES CON TOOLTIP FLOTANTE Y PANEL LATERAL RESERVADO
function renderMarcadoresMapa() {
  if (!mapaLeaflet) return;

  // Limpiamos capas previas
  marcadoresMapa.forEach(marker => mapaLeaflet.removeLayer(marker));
  marcadoresMapa = [];

  // Capturamos los nodos del DOM de la barra lateral fija
  const placeholder = document.getElementById("mapSidebarPlaceholder");
  const contentContainer = document.getElementById("mapSidebarContent");

  mapaFiltrado
    .filter(p => !isNaN(p.lat) && !isNaN(p.lng))
    .forEach(p => {
      
      // Creación del marcador nativo limpio sin popup pesado
      const marker = L.marker([p.lat, p.lng]);

      // 1. COMPORTAMIENTO MOUSEOVER: Muestra etiqueta ligera flotante con el nombre
      marker.bindTooltip(`<strong>${p.nombre}</strong>`, {
        direction: 'top',
        opacity: 0.9,
        sticky: true // El nombre sigue la trayectoria exacta del puntero del mouse
      });

      // 2. COMPORTAMIENTO CLICK: Envía los detalles a la región lateral fija reservada
      marker.on("click", () => {
        // Centrar sutilmente el mapa sobre el punto
        const visualOffset = window.innerWidth <= 768 ? 0 : 0.012; 
        mapaLeaflet.flyTo([Number(p.lat) + visualOffset, p.lng], 11, { duration: 0.6 });

        // Ocultamos el placeholder inicial instructivo
        if (placeholder) placeholder.classList.add("d-none");
        if (contentContainer) {
          contentContainer.classList.remove("d-none");

          // Inyectamos la información estructurada con scroll interno en el Panel Lateral
          contentContainer.innerHTML = `
            ${p.imagen ? `<img src="${getGoogleDriveImage(p.imagen)}" class="map-sidebar-img" alt="${p.nombre}"/>` : `
              <div class="idea-placeholder" style="height:140px; margin-bottom:1rem; border-radius:16px;">
                <i class="fa-solid fa-cube"></i>
              </div>
            `}
            <h3 class="map-sidebar-title">${p.nombre}</h3>
            ${p.tipoPunto ? `<span class="map-sidebar-badge">📍 ${p.tipoPunto}</span>` : ""}
            <div class="map-sidebar-desc">
              <p>${p.descripcion || "Sin descripción detallada disponible actualmente."}</p>
            </div>
            ${p.link ? `<a href="${p.link}" target="_blank" class="resource-btn" style="width:100%; text-align:center; display:block; text-decoration:none;">Ver sitio o recurso</a>` : ""}
          `;
        }
      });

      marker.addTo(mapaLeaflet);
      marcadoresMapa.push(marker);
    });
}

/* =========================================
MODAL CONTROL
========================================= */

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
      ${item.autor ? `<p class="modal-meta-info">${item.autor}</p>` : ""}
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
      <p class="modal-desc-text">${item.descripcion || ""}</p>
      <p><strong>Categoría:</strong> ${item.coleccion || "AgroIdeas"}</p>
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
      if (window.scrollY >= s.offsetTop - 140) {
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
  
  // CORRECCIÓN DEL CLICK CON ANCHOR OFFSET PARA BARRAS FIJAS
 // Reemplaza ÚNICAMENTE el fragmento del click en tu función initSidebar() por este:
links.forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute("href"));
    if (target) {
      // Dejamos que el "scroll-padding-top" del CSS haga todo el trabajo sucio en móvil y PC
      target.scrollIntoView({
        behavior: "smooth"
      });
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

/* =========================================
INICIALIZADOR APP
========================================= */

async function initAgroIdeas() {
  try {
    initMenuMobile(); // <-- Nueva función añadida para el botón sandwich
    initMapa();
    await fetchAgroIdeas();
    
    renderCatalogo();
    initSidebar();
    initSearch();
    
    console.log("AgroIdeas inicializado con éxito con paginación independiente.");
  } catch (e) {
    console.error("Fallo crítico en AgroIdeas:", e);
    alert("Error cargando los componentes de AgroIdeas");
  }
}

// Lógica de activación de la barra de navegación responsive
function initMenuMobile() {
  const menuToggle = document.getElementById("menuToggle");
  const mainNav = document.getElementById("mainNav");

  if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", () => {
      menuToggle.classList.toggle("open");
      mainNav.classList.toggle("open");
    });

    // Cerrar el menú si se da clic a cualquier enlace interno
    mainNav.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        menuToggle.classList.remove("open");
        mainNav.classList.remove("open");
      });
    });
  }
}

/* =========================================
EJECUCIÓN AL CARGAR DOM
========================================= */

document.addEventListener("DOMContentLoaded", initAgroIdeas);