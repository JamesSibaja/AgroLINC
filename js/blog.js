const ITEMS = 2;
let noticias = [];
let page = 1;
let sliderState = {};

/* ======================================
   INIT
====================================== */
async function initBlog() {
  // Asegurar la existencia de fetchBlog si viene de data.js externo
  if (typeof fetchBlog === "function") {
    noticias = await fetchBlog();
  } else {
    // Mock temporal por seguridad si falla la carga del script de datos externo
    console.warn("fetchBlog no definido en data.js, usando estructura vacía.");
    noticias = [];
  }

  noticias.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  renderBlog();
}

/* ======================================
   RENDER
====================================== */
function renderBlog() {
  const container = document.getElementById("blogContainer");
  if (!container) return;

  container.innerHTML = "";
  sliderState = {};

  const start = (page - 1) * ITEMS;
  const subset = noticias.slice(start, start + ITEMS);

  if (subset.length === 0) {
    container.innerHTML = `<p style="text-align:center; color:#61707c; font-size:1.2rem;">No hay publicaciones disponibles en este momento.</p>`;
    renderPagination();
    return;
  }

  subset.forEach((n, index) => {
    const imagenes = n.imagenes && n.imagenes.length ? n.imagenes : ["assets/images/hero.png"];
    sliderState[index] = 0;

    const article = document.createElement("article");
    article.className = "blog-post";

    article.innerHTML = `
      <div class="blog-slider">
        <div class="blog-track" id="track-${index}">
          ${imagenes
            .map(
              img => `
              <div class="blog-slide">
                <img src="${img}" loading="lazy" alt="${n.titulo}">
              </div>
            `
            )
            .join("")}
        </div>

        ${
          imagenes.length > 1
            ? `
            <button class="blog-arrow left" onclick="moveSlide(${index}, -1, ${imagenes.length})">❮</button>
            <button class="blog-arrow right" onclick="moveSlide(${index}, 1, ${imagenes.length})">❯</button>
            <div class="blog-dots">
              ${imagenes
                .map(
                  (_, i) => `
                <span class="blog-dot ${i === 0 ? "active" : ""}" onclick="goToSlide(${index}, ${i})"></span>
              `
                )
                .join("")}
            </div>
          `
            : ""
        }
      </div>

      <div class="blog-body">
        <div class="blog-date">${n.fecha}</div>
        <h2 class="blog-title">${n.titulo}</h2>
        <div class="blog-text">${n.texto}</div>
      </div>
    `;

    container.appendChild(article);
  });

  renderPagination();
}

/* ======================================
   CARRUSEL (SLIDER INTERNO)
====================================== */
function updateSlider(index) {
  const track = document.getElementById(`track-${index}`);
  if (!track) return;

  // Desplazamiento horizontal fluido usando la lógica flexbox corregida en CSS
  track.style.transform = `translateX(-${sliderState[index] * 100}%)`;

  const dots = track.parentElement.querySelectorAll(".blog-dot");
  dots.forEach((dot, i) => {
    dot.classList.toggle("active", i === sliderState[index]);
  });
}

function moveSlide(index, direction, total) {
  sliderState[index] += direction;

  if (sliderState[index] < 0) {
    sliderState[index] = total - 1;
  }
  if (sliderState[index] >= total) {
    sliderState[index] = 0;
  }

  updateSlider(index);
}

function goToSlide(index, slide) {
  sliderState[index] = slide;
  updateSlider(index);
}

/* ======================================
   PAGINATION
====================================== */
function renderPagination() {
  const nav = document.getElementById("blogPagination");
  if (!nav) return;

  nav.innerHTML = "";
  const total = Math.ceil(noticias.length / ITEMS);
  if (total <= 1) return; // Ocultar si solo hay una página

  for (let i = 1; i <= total; i++) {
    const btn = document.createElement("button");
    btn.className = `page-btn ${i === page ? "active" : ""}`;
    btn.textContent = i;
    btn.onclick = () => {
      page = i;
      renderBlog();
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    nav.appendChild(btn);
  }
}

/* ======================================
   LOAD
====================================== */
document.addEventListener("DOMContentLoaded", initBlog);