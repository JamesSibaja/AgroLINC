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

function initMapa() {
  const container = document.getElementById("mapImpresoras");
  if (!container) return;
  
  container.innerHTML = "";
  
  // Coordenadas y zoom de origen (Costa Rica central)
  const origenLatLng = [9.7489, -83.9];
  const origenZoom = 7;
  
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

// CONTROL DE MARCADORES CON TOOLTIP FLOTANTE Y PANEL LATERAL PREMIUM RESEÑADO
function renderMarcadoresMapa() {
  if (!mapaLeaflet) return;

  // Limpiamos capas previas
  marcadoresMapa.forEach(marker => mapaLeaflet.removeLayer(marker));
  marcadoresMapa = [];

  // Capturamos el contenedor del DOM de la barra lateral fija
  const sidebar = document.getElementById("mapSidebar");

  mapaFiltrado
    .filter(p => !isNaN(p.lat) && !isNaN(p.lng))
    .forEach(p => {
      
      // Creación del marcador nativo limpio
      const marker = L.marker([p.lat, p.lng]);

      // 1. COMPORTAMIENTO MOUSEOVER: Muestra etiqueta ligera flotante con el nombre
      marker.bindTooltip(`<strong>${p.nombre}</strong>`, {
        direction: 'top',
        opacity: 0.9,
        sticky: true // El nombre sigue la trayectoria exacta del puntero
      });

      // 2. COMPORTAMIENTO CLICK: Actualiza el panel lateral con la nueva grilla estética de tarjetas
      marker.on("click", () => {
        // Centrar sutilmente el mapa sobre el punto
        const visualOffset = window.innerWidth <= 768 ? 0 : 0.012; 
        mapaLeaflet.flyTo([Number(p.lat) + visualOffset, p.lng], 11, { duration: 0.6 });

        if (sidebar) {
          const imagenUrl = p.imagen ? getGoogleDriveImage(p.imagen) : '';

          // Inyectamos la información estructurada con la grilla premium
          sidebar.innerHTML = `
            <h3><i class="fas fa-map-marker-alt"></i> Detalles dela Lugar</h3>
            
            <div class="sidebar-info-group">
              ${imagenUrl ? `<img src="${imagenUrl}" class="sidebar-feature-img" alt="${p.nombre}">` : `
                <div class="idea-placeholder" style="height: 150px; border-radius: 16px;">
                  <i class="fa-solid fa-cube"></i>
                </div>
              `}
              
              <div class="sidebar-location-title">${p.nombre}</div>
              
              ${p.tipoPunto ? `
              <div class="sidebar-data-row">
                <i class="fas fa-tags"></i>
                <div>
                  <span class="sidebar-data-label">Clasificación</span>
                  <span class="sidebar-data-value">${p.tipoPunto}</span>
                </div>
              </div>
              ` : ''}
              
              <div class="sidebar-data-row">
                <i class="fas fa-align-left"></i>
                <div>
                  <span class="sidebar-data-label">Descripción</span>
                  <span class="sidebar-data-value">${p.descripcion || "Sin descripción detallada disponible actualmente."}</span>
                </div>
              </div>
              
              ${p.link ? `
                <a href="${p.link}" target="_blank" class="resource-btn" style="width: 100%; text-align: center; display: block; text-decoration: none; margin-top: 0.5rem;">
                  <i class="fas fa-external-link-alt"></i> Ver sitio o recurso
                </a>
              ` : ""}
            </div>
          `;
        }

        // CONTROL EXCLUSIVO CELULARES: Al tocar un marcador, simular clic en pestaña de detalles
        if (window.innerWidth <= 768) {
          const btnDetallesCelular = document.querySelector('.map-tab-btn[data-tab="detalles"]');
          if (btnDetallesCelular) {
            btnDetallesCelular.click();
          }
        }
      });

      marker.addTo(mapaLeaflet);
      marcadoresMapa.push(marker);
    });
}

/* =========================================
CONTROLADORES DE PESTAÑAS (TABS) PARA MÓVIL
========================================= */
function initMapaTabsMobile() {
  const btnVerMapa = document.getElementById("btnVerMapa");
  const btnVerDetalles = document.getElementById("btnVerDetalles");
  const mapLayoutWrapper = document.getElementById("mapLayoutWrapper");

  if (btnVerMapa && btnVerDetalles && mapLayoutWrapper) {
    btnVerMapa.addEventListener("click", () => {
      btnVerMapa.classList.add("active");
      btnVerDetalles.classList.remove("active");
      mapLayoutWrapper.classList.remove("show-details-view");
      
      // Forzar recalculado de geometría espacial de Leaflet al volver al mapa activo
      if (mapaLeaflet) {
        setTimeout(() => {
          mapaLeaflet.invalidateSize();
        }, 150);
      }
    });

    btnVerDetalles.addEventListener("click", () => {
      btnVerDetalles.classList.add("active");
      btnVerMapa.classList.remove("active");
      mapLayoutWrapper.classList.add("show-details-view");
    });
  }
}

/* =========================================
   MODAL CONTROL (AGROIDEAS)
========================================= */

// Decodificación segura de atributos en Base64 para abrir el modal
window.openIdeaModalFromAttr = function(base64Str) {
  try {
    const jsonStr = decodeURIComponent(escape(atob(base64Str)));
    const item = JSON.parse(jsonStr);
    openIdeaModal(item);
  } catch (err) {
    console.error("Error decodificando la información del modal:", err);
  }
};

// Función principal para renderizar y abrir el modal premium
function openIdeaModal(item) {
  const modal = document.getElementById("ideaModal");
  const body = document.getElementById("ideaModalBody");
  if (!modal || !body) return;

  // 1. Preparar bloques condicionales según el tipo de recurso
  let autorHtml = item.autor ? `<p style="font-size: 0.85rem; color: #64748b; margin-bottom: 0.5rem;"><strong>Autor:</strong> ${item.autor}</p>` : "";
  let impresionHtml = item.impresion ? `<p style="font-size: 0.85rem; color: #64748b; background: #f8fafc; padding: 0.75rem; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 0.75rem;"><strong>Instrucciones de impresión:</strong><br>${item.impresion}</p>` : "";
  
  // 2. Construir los botones de acción del pie de página de forma unificada
  let botonesAccion = "";
  if (item.tipo === "prototipo" && item.github) {
    botonesAccion = `<a href="${item.github}" target="_blank" class="resource-btn"><i class="fa-brands fa-github"></i> Ver en GitHub</a>`;
  } else if (item.tipo === "3d" && item.descarga) {
    botonesAccion = `<a href="${item.descarga}" target="_blank" class="resource-btn"><i class="fa-solid fa-download"></i> Descargar STL</a>`;
  }

  // 3. Inyectar la estructura premium limpia en dos columnas
  body.innerHTML = `
    <div class="idea-modal-grid">
      
      <div class="idea-modal-cover">
        ${getImage(item.imagen)}
      </div>
      
      <div class="idea-modal-info">
        <div>
          <span class="modal-badge">
            <i class="fa-solid fa-layer-group"></i> ${item.coleccion || "AgroIdeas"}
          </span>
          
          <h2>${item.nombre}</h2>
          
          <p class="modal-desc-paragraph">${item.descripcion || "No se cargó una descripción detallada para este recurso."}</p>
          
          ${autorHtml}
          ${impresionHtml}
        </div>
        
        ${botonesAccion ? `<div class="modal-footer-actions">${botonesAccion}</div>` : ""}
      </div>
      
    </div>
  `;

  // 4. Activar visualmente el modal añadiendo la clase responsiva
  modal.classList.add("open");
}

// Cierre seguro del modal expuesto globalmente para el atributo onclick="closeIdeaModal()"
window.closeIdeaModal = function() {
  const modal = document.getElementById("ideaModal");
  if (modal) {
    modal.classList.remove("open");
    const body = document.getElementById("ideaModalBody");
    if (body) body.innerHTML = ""; // Limpieza de memoria e imagen para evitar parpadeos al reabrir
  }
};

/* =========================================
   SIDEBAR / NAVEGACIÓN SCROLL (SOPORTE MÓVIL)
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
    
    // Si la pantalla es móvil, calculamos una holgura mayor porque hay dos barras fijas arriba
    const offsetCalculado = window.innerWidth <= 1200 ? 250 : 140;
    
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - offsetCalculado) {
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
        const offsetCalculado = window.innerWidth <= 1200 ? 230 : 130;
        const elementoPosición = target.getBoundingClientRect().top;
        const posiciónGlobal = elementoPosición + window.pageYOffset - offsetCalculado;

        window.scrollTo({
          top: posiciónGlobal,
          behavior: "smooth"
        });
      }
    });
  });
  
  window.addEventListener("scroll", activate);
  window.addEventListener("resize", activate); // Recalcular si rota la pantalla
  activate();
}

/* =========================================
INICIALIZADOR APP
========================================= */

async function initAgroIdeas() {
  try {
    initMenuMobile(); // Lógica para el botón sandwich
    initMapaTabsMobile(); // Inicialización de las pestañas móviles
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

    mainNav.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        menuToggle.classList.remove("open");
        mainNav.classList.remove("open");
      });
    });
  }
}

/* =========================================
EJECUCIÓN AL CARGAR DOM (INTERACTIVIDAD TABS)
========================================= */

document.addEventListener("DOMContentLoaded", () => {
  const tabButtons = document.querySelectorAll(".map-tab-btn");
  const mapWrapper = document.getElementById("mapWrapper");

  if (tabButtons && mapWrapper) {
    tabButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        // 1. Quitar la clase active de todos los botones de la pestaña del mapa
        tabButtons.forEach(b => b.classList.remove("active"));
        
        // 2. Añadir la clase active al botón presionado
        btn.classList.add("active");

        // 3. Evaluar qué pestaña se presionó usando el atributo data-tab
        const targetTab = btn.getAttribute("data-tab");

        if (targetTab === "detalles") {
          // Muestra el panel lateral y oculta el mapa (en móvil)
          mapWrapper.classList.add("show-details");
        } else {
          // Regresa a la vista del mapa original
          mapWrapper.classList.remove("show-details");
          
          // Corrección Leaflet con la instancia global correcta (mapaLeaflet)
          if (typeof mapaLeaflet !== 'undefined' && mapaLeaflet !== null) {
            setTimeout(() => {
              mapaLeaflet.invalidateSize();
            }, 100);
          }
        }
      });
    });
  }
});

document.addEventListener("DOMContentLoaded", initAgroIdeas);