const ITEMS = 2;

let noticias = [];

let page = 1;

/* ========================= */

async function initBlog() {

  noticias =
    await fetchBlog();

  noticias.sort(
    (a,b)=>
      new Date(b.fecha)
      -
      new Date(a.fecha)
  );

  renderBlog();

}

/* ========================= */

function renderBlog() {

  const container =
  document.getElementById(
  "blogContainer"
  );
  
  container.innerHTML =
  "";
  
  const start =
  (page - 1)
  *
  ITEMS;
  
  const subset =
  noticias.slice(
  start,
  start + ITEMS
  );
  
  subset.forEach(
  (n,index)=>{
  
  const images =
  n.imagenes.length
  ? n.imagenes
  : ["assets/images/hero.png"];
  
  container.innerHTML += `
  
  <article
  class="blog-post"
  >
  
  <div
  class="blog-slider"
  >
  
  <div
  class="blog-track"
  id="track-${index}"
  style="
  transform:
  translateX(0%);
  "
  >
  
  ${images.map(img=>`
  
  <div
  class="blog-slide"
  >
  
  <img
  src="${img}"
  >
  
  </div>
  
  `).join("")}
  
  </div>
  
  ${
  images.length>1
  ?
  
  `
  <button
  class="blog-arrow left"
  onclick="
  moveSlide(
  ${index},
  -1,
  ${images.length}
  )
  "
  >
  
  ❮
  
  </button>
  
  <button
  class="blog-arrow right"
  onclick="
  moveSlide(
  ${index},
  1,
  ${images.length}
  )
  "
  >
  
  ❯
  
  </button>
  
  `
  
  :
  
  ""
  
  }
  
  <div
  class="blog-dots"
  >
  
  ${images.map(
  (_,i)=>
  
  `
  
  <span
  class="
  blog-dot
  ${
  i===0
  ?"active"
  :""
  }
  "
  data-post="${index}"
  data-slide="${i}"
  ></span>
  
  `
  
  ).join("")}
  
  </div>
  
  </div>
  
  <div
  class="blog-body"
  >
  
  <div
  class="blog-date"
  >
  
  ${n.fecha}
  
  </div>
  
  <h2
  class="blog-title"
  >
  
  ${n.titulo}
  
  </h2>
  
  <p
  class="blog-text"
  >
  
  ${n.texto}
  
  </p>
  
  </div>
  
  </article>
  
  `;
  
  }
  
  );
  
  renderPagination();
  
  }
  
  const sliderState =
  {};
  
  function moveSlide(
  post,
  step,
  total
  ){
  
  if(
  sliderState[
  post
  ]
  ===undefined
  ){
  
  sliderState[
  post
  ]=0;
  
  }
  
  sliderState[
  post
  ]+=step;
  
  if(
  sliderState[
  post
  ]>=total
  ){
  
  sliderState[
  post
  ]=0;
  
  }
  
  if(
  sliderState[
  post
  ]<0
  ){
  
  sliderState[
  post
  ]=
  total-1;
  
  }
  
  document
  .getElementById(
  `track-${post}`
  )
  .style.transform=
  `
  translateX(
  -${
  sliderState[
  post
  ]*100
  }%
  )
  `;
  
  document
  .querySelectorAll(
  `
  [data-post="${post}"]
  `
  )
  .forEach(
  (
  dot,
  i
  )=>{
  
  dot.classList.toggle(
  "active",
  i===
  sliderState[
  post
  ]
  );
  
  }
  );
  
  }
/* ========================= */

function renderPagination(){

const total =
Math.ceil(
noticias.length
/
ITEMS
);

const nav =
document.getElementById(
"blogPagination"
);

nav.innerHTML="";

for(
let i=1;
i<=total;
i++
){

const btn =
document.createElement(
"button"
);

btn.className =
"header-btn";

if(
i===page
){

btn.style.opacity =
1;

}

else{

btn.style.opacity =
.45;

}

btn.textContent =
i;

btn.onclick =
()=>{

page=i;

renderBlog();

window.scrollTo({

top:0,

behavior:
"smooth"

});

};

nav.appendChild(
btn
);

}

}

/* ========================= */

document.addEventListener(
"DOMContentLoaded",
initBlog
);