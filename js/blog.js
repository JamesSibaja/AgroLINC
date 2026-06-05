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

function moveSlide(post,step,total){

  if(
  sliderState[post]
  ===undefined
  ){
  
  sliderState[post]=0;
  
  }
  
  const slides =
  document.querySelectorAll(
  `#track-${post} .blog-slide`
  );
  
  slides[
  sliderState[post]
  ]
  .classList.remove(
  "active"
  );
  
  sliderState[post]+=step;
  
  if(
  sliderState[post]>=total
  )
  sliderState[post]=0;
  
  if(
  sliderState[post]<0
  )
  sliderState[post]=
  total-1;
  
  slides[
  sliderState[post]
  ]
  .classList.add(
  "active"
  );
  
  document
  .querySelectorAll(
  `[data-post="${post}"]`
  )
  .forEach(
  (dot,i)=>
  dot.classList.toggle(
  "active",
  i===
  sliderState[post]
  )
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