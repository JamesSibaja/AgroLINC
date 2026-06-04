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
(page-1)
*
ITEMS;

const subset =
noticias.slice(
start,
start+ITEMS
);

subset.forEach(
n=>{

const div =
document.createElement(
"article"
);

div.className =
"idea-modal-box";

div.style.marginBottom =
"3rem";

div.innerHTML =
`

<p
style="
color:#6b7280;
margin-bottom:1rem;
"
>

${n.fecha}

</p>

<h2>

${n.titulo}

</h2>

<div
class="blog-carousel"
>

${
n.imagenes
.map(
img=>`

<img
src="${img}"
style="
width:100%;
border-radius:20px;
margin-top:1rem;
"
>

`
)
.join("")
}

</div>

<p
style="
margin-top:2rem;
line-height:2;
"
>

${n.texto}

</p>

`;

container.appendChild(
div
);

}

);

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