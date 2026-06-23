async function renderKPIs() {
  try {
    const kpis = await fetchKPI();
    const container = document.getElementById("kpiContainer");
    if (!container) return;

    const iconKeywords = [
      { key: "personas", icon: "fa-solid fa-users" },
      { key: "recurso", icon: "fa-solid fa-lightbulb" },
      { key: "agroidea", icon: "fa-solid fa-lightbulb" },
      { key: "curso", icon: "fa-solid fa-book" },
      { key: "certificaciones", icon: "fa-solid fa-graduation-cap" },
      { key: "capacitacion", icon: "fa-solid fa-graduation-cap" },
      { key: "modelo", icon: "fa-solid fa-cube" },
      { key: "prototipo", icon: "fa-solid fa-microchip" },
      { key: "mapa", icon: "fa-solid fa-map-location-dot" }
    ];

    container.innerHTML = "";

    kpis.forEach(kpi => {
      const card = document.createElement("div");
      card.className = "metric-card";

      const nombreParaBuscarIcono = String(kpi.nombre || "").toLowerCase();
      const match = iconKeywords.find(item => nombreParaBuscarIcono.includes(item.key));
      const icon = match ? match.icon : "fa-solid fa-chart-column";

      card.innerHTML = `
        <div class="metric-icon">
          <i class="${icon}"></i>
        </div>
        <div>
          <strong class="kpi-counter" data-target="${kpi.valor}">0</strong>
          <span>${kpi.nombre}</span>
        </div>
      `;

      container.appendChild(card);
    });

    animateKPICounters();

  } catch (error) {
    console.error("Error cargando KPI", error);
  }
}

function animateKPICounters() {
  const counters = document.querySelectorAll(".kpi-counter");
  const duration = 1500;

  counters.forEach(counter => {
    const targetText = String(counter.dataset.target || "").trim();
    const targetValue = parseInt(targetText.replace(/\D/g, ""), 10);
    
    if (isNaN(targetValue) || targetValue === 0) {
      counter.textContent = targetText;
      return;
    }

    const suffix = targetText.replace(/[0-9]/g, "");
    let startTime = null;

    const updateNumber = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;

      if (progress < duration) {
        const percentage = progress / duration;
        const easeOutPercentage = 1 - Math.pow(1 - percentage, 3);
        const currentValue = Math.floor(easeOutPercentage * targetValue);
        
        counter.textContent = currentValue + suffix;
        requestAnimationFrame(updateNumber);
      } else {
        counter.textContent = targetText;
      }
    };

    requestAnimationFrame(updateNumber);
  });
}

document.addEventListener("DOMContentLoaded", renderKPIs);

const copyBtn = document.getElementById("copyBtn");
if (copyBtn) {
  copyBtn.addEventListener("click", async () => {
    await navigator.clipboard.writeText("fablab@iica.int");
    copyBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
    setTimeout(() => {
      copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';
    }, 1800);
  });
}

/* =========================================
   RENDER
========================================= */

async function renderRuta() {
  const cursos = await fetchCursos();
  const grid = document.getElementById("pathGrid");
  if (!grid) return;

  grid.innerHTML = "";

  const etapas = {};

  cursos.forEach(curso => {
    if (curso.ruta != "territorial"){
      if (!etapas[curso.etapa]) {
        etapas[curso.etapa] = [];
      }
      etapas[curso.etapa].push(curso);
    }
  });

  Object.keys(etapas)
  .sort((a, b) => Number(a) - Number(b))
  .forEach(etapa => {

    const wrapper = document.createElement("div");
    wrapper.className = "path-stage";

    const title = document.createElement("h3");
    title.className = "stage-title";
    title.textContent = `Etapa ${etapa}`;
    wrapper.appendChild(title);

    const row = document.createElement("div");
    row.className = "path-row";

    etapas[etapa].forEach(curso => {
      const btn = document.createElement("button");
      btn.className = "course-node";

      if (Number(etapa) % 2 === 1) {
        btn.style.background = "#2c77a0";
      }

      btn.innerHTML = `
        <strong>${curso.nombre}</strong>
        <p>Ver cupos e inscribirme</p>
      `;

      btn.addEventListener("click", () => openModal(curso, cursos));
      row.appendChild(btn);
    });

    wrapper.appendChild(row);
    grid.appendChild(wrapper);
  });
}

/* =========================================
   MODAL ORIGINAL CURSOS
========================================= */

async function openModal(curso, cursos) {
  // Nos aseguramos que NO tenga la clase de tamaño gigante puesta
  document.getElementById("courseModal").classList.remove("modal-xl");

  const calendario = await fetchCalendario();

  document.getElementById("modalTitle").textContent = curso.nombre;
  document.getElementById("modalStage").textContent = `Etapa ${curso.etapa}`;

  let requisitos = [];
  if (curso.requisito1) {
    const r1 = cursos.find(c => c.id === curso.requisito1);
    if (r1) requisitos.push(r1.nombre);
  }
  if (curso.requisito2) {
    const r2 = cursos.find(c => c.id === curso.requisito2);
    if (r2) requisitos.push(r2.nombre);
  }

  const textoRequisitos = requisitos.length > 0 ? requisitos.join("<br>") : "Ninguno";

  const eventosCurso = calendario.filter(e => e.id === curso.id);
  let eventosHTML = "";

  if (eventosCurso.length === 0) {
    eventosHTML = `
      <div class="course-event event-closed">
        <div class="event-status status-closed">Próximamente</div>
        <p>No hay convocatorias publicadas para este curso.</p>
      </div>
    `;
  } else {
    eventosCurso.forEach(evento => {
      const cuposDisponibles = evento.max - evento.inscritos - evento.espera + evento.cancelados;
      const cumpleMinimo = evento.inscritos + evento.espera - evento.cancelados >= evento.min;

      let clase = "";
      let estado = "";
      let estadoClase = "";
      let detalle = "";
      let boton = "";

      if (!evento.enlace) {
        clase = "event-closed";
        estadoClase = "status-closed";
        estado = "Grupo cerrado";
        detalle = "Esta convocatoria se gestiona mediante un grupo específico.";
      }
      else if (cuposDisponibles <= 0) {
        clase = "event-waiting";
        estadoClase = "status-waiting";
        estado = "Lista de espera";
        detalle = `<br><span class="event-note">No hay cupos disponibles. Puede registrarse en la lista de espera...</span>`;
        boton = `<a class="event-btn" href="${evento.enlace}" target="_blank">Unirse a lista de espera</a>`;
      }
      else if (cumpleMinimo) {
        clase = "event-confirmed";
        estadoClase = "status-confirmed";
        estado = "Convocatoria confirmada";
        detalle = `<div class="event-slots status-confirmed">${cuposDisponibles} cupos disponibles</div>`;
        boton = `<a class="event-btn" href="${evento.enlace}" target="_blank">Solicitar inscripción</a>`;
      }
      else {
        clase = "event-pending";
        estadoClase = "status-pending";
        estado = "Convocatoria abierta";
        detalle = `
          <div class="event-note status-pending">Pendiente de alcanzar el cupo mínimo.</div>
          <div class="event-slots status-pending">${cuposDisponibles} cupos disponibles</div>
        `;
        boton = `<a class="event-btn" href="${evento.enlace}" target="_blank">Solicitar inscripción</a>`;
      }

      eventosHTML += `
        <div class="course-event ${clase}">
          <div class="event-date">${evento.fecha}</div>
          <div class="event-status ${estadoClase}">${estado}</div>
          ${detalle}
          ${boton}
        </div>
      `;
    });
  }

  document.getElementById("modalDescription").innerHTML = `
    <p>${curso.descripcion || "Próximamente disponible."}</p>
    <div class="modal-reqs">
      <h4>Requisitos</h4>
      ${textoRequisitos}
    </div>
    <div class="modal-events">
      <h4>Próximas convocatorias</h4>
      ${eventosHTML}
    </div>
  `;

  document.getElementById("courseModal").classList.add("active");
}

/* =========================================
   MODAL AMPLIADO PARA IMÁGENES GIGANTES
========================================= */

/* =========================================
   MODAL AMPLIADO PARA IMÁGENES GIGANTES
========================================= */

function openImageModal(titulo, rutaImagen) {
  // Agregamos la clase que expande el contenedor al ancho máximo
  document.getElementById("courseModal").classList.add("modal-xl");
  
  document.getElementById("modalTitle").textContent = titulo;
  document.getElementById("modalStage").textContent = "";

  // Inyectamos la estructura de la imagen junto con un botón de descarga discreto y profesional
  document.getElementById("modalDescription").innerHTML = `
    <div class="modal-image-container" style="text-align: center; margin-top: 0.5rem; position: relative;">
      
      <div class="modal-image-actions" style="display: flex; justify-content: flex-end; margin-bottom: 1rem;">
        <a 
          href="${rutaImagen}" 
          download="${titulo.toLowerCase().replace(/\s+/g, '_')}.png" 
          class="image-download-btn"
          style="
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            background-color: #ffffff;
            color: #475569;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            font-size: 0.875rem;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.2s ease;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            cursor: pointer;
          "
          onmouseover="this.style.backgroundColor='#f8fafc'; this.style.color='#6d28d9'; this.style.borderColor='#cbd5e1';"
          onmouseout="this.style.backgroundColor='#ffffff'; this.style.color='#475569'; this.style.borderColor='#e2e8f0';"
        >
          <i class="fa-solid fa-download"></i>
          Descargar imagen
        </a>
      </div>

      <img 
        src="${rutaImagen}" 
        alt="${titulo}" 
        style="width: 100%; max-width: 100%; height: auto; border-radius: 8px; display: block; border: 1px solid #e2e8f0;"
      />
    </div>
  `;

  document.getElementById("courseModal").classList.add("active");
}

function closeModal() {
  document.getElementById("courseModal").classList.remove("active");
  // Quitamos la clase extendida al cerrar para restaurar el flujo normal
  document.getElementById("courseModal").classList.remove("modal-xl");
}

/* =========================================
   EVENTS & HAMBURGER INTERACTION
========================================= */

document.addEventListener("DOMContentLoaded", () => {
    renderRuta();

    // Lógica del Menú Hamburguesa
    const menuToggle = document.getElementById("menuToggle");
    const mainNav = document.getElementById("mainNav");

    if (menuToggle && mainNav) {
      menuToggle.addEventListener("click", () => {
        menuToggle.classList.toggle("open");
        mainNav.classList.toggle("open");
      });

      // Cerrar el menú si hacen click en un enlace interno
      mainNav.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
          menuToggle.classList.remove("open");
          mainNav.classList.remove("open");
        });
      });
    }

    // Eventos de Cierre del Modal
    document.getElementById("closeModal").addEventListener("click", closeModal);
    document.querySelector(".modal-overlay").addEventListener("click", closeModal);

    // Comportamiento de botones de acción externos
    const btnCalendario = document.getElementById("btnCalendario");
    if (btnCalendario) {
      btnCalendario.addEventListener("click", (e) => {
        e.preventDefault();
        const imgSrc = btnCalendario.getAttribute("data-img");
        openImageModal("Calendario de Capacitaciones", imgSrc);
      });
    }

    const btnRuta = document.getElementById("btnRuta");
    if (btnRuta) {
      btnRuta.addEventListener("click", (e) => {
        e.preventDefault();
        const imgSrc = btnRuta.getAttribute("data-img");
        openImageModal("Explorar Ruta Formativa", imgSrc);
      });
    }
  }
);