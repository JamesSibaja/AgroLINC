// js/ruta.js

const STUDENTS_CSV =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSnS7gYqNZk-2vrvEU1DSYrZa7535VglT7kXCXWWpjDLwDu32K4od3CZqFJyeANgHP_OGhVvVwMhPZC/pub?gid=1568040734&single=true&output=csv";

const COURSES_CSV =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSnS7gYqNZk-2vrvEU1DSYrZa7535VglT7kXCXWWpjDLwDu32K4od3CZqFJyeANgHP_OGhVvVwMhPZC/pub?gid=0&single=true&output=csv";

const EVENTS_CSV =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSnS7gYqNZk-2vrvEU1DSYrZa7535VglT7kXCXWWpjDLwDu32K4od3CZqFJyeANgHP_OGhVvVwMhPZC/pub?gid=1589233834&single=true&output=csv";


function csvToArray(csv) {
  const rows = csv.trim().split("\n");
  return rows.map(row => row.split(","));
}


async function fetchStudents() {
  const res = await fetch(STUDENTS_CSV);
  const text = await res.text();

  const rows = csvToArray(text);

  return rows.slice(1).map(r => ({
    cedula: r[0]?.trim(),
    nombre: r[1]?.trim(),
    correo: r[2]?.trim(),
    ruta: r[3]?.trim()
  }));
}


async function fetchCourses() {
  const res = await fetch(COURSES_CSV);
  const text = await res.text();

  const rows = csvToArray(text);

  return rows.slice(1).map(r => ({
    id: r[0]?.trim(),
    nombre: r[1]?.trim(),
    ruta: r[2]?.trim(),
    requisito1: r[3]?.trim(),
    requisito2: r[4]?.trim(),
    cursoFinal: r[5]?.trim(),
    etapa: r[6]?.trim()
  }));
}


async function fetchEvents() {
  const res = await fetch(EVENTS_CSV);
  const text = await res.text();

  const rows = csvToArray(text);

  return rows.slice(1).map(r => ({
    cedula: r[0]?.trim(),
    curso: r[1]?.trim(),
    fecha: r[2]?.trim(),
    estado: r[3]?.trim()
  }));
}


function initials(name) {
  return name
    .split(" ")
    .map(n => n[0])
    .slice(0,2)
    .join("")
    .toUpperCase();
}


function renderStudent(student, courses, events) {

  document.getElementById("studentName").textContent =
    student.nombre;

  document.getElementById("studentRoute").textContent =
    student.ruta;

  document.getElementById("profileAvatar").textContent =
    initials(student.nombre);

  const approved = events
    .filter(e =>
      e.cedula === student.cedula &&
      e.estado.toLowerCase() === "completado"
    )
    .map(e => e.curso);

  const routeCourses = courses.filter(c =>
    c.ruta === student.ruta
  );

  const completedCount = routeCourses.filter(c =>
    approved.includes(c.id)
  ).length;

  document.getElementById("progressText").textContent =
    `${completedCount}/${routeCourses.length}`;

  const progress =
    (completedCount / routeCourses.length) * 100;

  document.getElementById("progressFill").style.width =
    `${progress}%`;

  const grid = document.getElementById("coursesGrid");

  grid.innerHTML = "";

  routeCourses.forEach(course => {

    let status = "locked";
    let label = "Bloqueado";

    const completed =
      approved.includes(course.id);

    const req1ok =
      !course.requisito1 ||
      approved.includes(course.requisito1);

    const req2ok =
      !course.requisito2 ||
      approved.includes(course.requisito2);

    if (completed) {
      status = "completed";
      label = "Completado";
    }
    else if (req1ok && req2ok) {
      status = "available";
      label = "Disponible";
    }

    grid.innerHTML += `
      <div class="course-card ${status}">
        <h4>${course.nombre}</h4>
        <span>${label}</span>
      </div>
    `;
  });

}


async function consultarRuta() {

  const cedula =
    document.getElementById("cedulaInput")
    .value
    .trim();

  if (!cedula) return;

  const [students, courses, events] =
    await Promise.all([
      fetchStudents(),
      fetchCourses(),
      fetchEvents()
    ]);

  const student =
    students.find(s => s.cedula === cedula);

  if (!student) {

    alert("No se encontró el estudiante.");

    return;
  }

  renderStudent(student, courses, events);

}


document
  .getElementById("consultarBtn")
  .addEventListener("click", consultarRuta);