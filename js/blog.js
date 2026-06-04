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

function renderBlog(){

  const container =
  document.getElementById(
  "blogContainer"
  );
  
  container.innerHTML="";
  
  const start =
  (page-1)
  *
  ITEMS;
  
  const items =
  noticias.slice(
  start,
  start+ITEMS
  );
  
  items.forEach(
  n=>{
  
  container.innerHTML +=
  `
  
  <article
  class="blog-post"
  >
  
  <div
  class="blog-gallery"
  >
  
  ${
  
  n.imagenes
  .length
  
  ?
  
  n.imagenes
  .map(
  img=>
  
  `<img src="${img}">`
  
  )
  .join("")
  
  :
  
  `<img src="assets/images/hero.png">`
  
  }
  
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
  
  <div
  class="blog-text"
  >
  
  ${n.texto}
  
  </div>
  
  </div>
  
  </article>
  
  `;
  
  });
  
  renderPagination();
  
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