function convertirLinkDriveAImagen(url) {
    if (!url) return "";
  
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (!match) return "";
  
    const fileId = match[1];
  
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }
const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSugZplAvcSBZjGPZikP3jhTaKA6DtMwZpOZc0_ophORRVGjemhu3Z5JEY3EnsZMUayuhviSia3Gf58/pub?gid=0&single=true&output=csv"
async function fetchBiofabricas() {
  const response = await fetch(SHEET_CSV_URL);
  const csvText = await response.text();

  const rows = csvText.trim().split("\n");

  const headers = rows[0].split(",");

  return rows.slice(1).map(row => {
    const values = row.split(",");

    return {
      id: values[0],
      name: values[1],
      lat: parseFloat(values[2]),
      lng: parseFloat(values[3]),
      region: values[4],
      estado: values[5],
      descripcion: values[6],
      imagen: convertirLinkDriveAImagen(values[7]),
      tags: values[8]
        ? values[8].split(";")
        : []
    };
  });
}

const SHEET_CSV_KPI_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSugZplAvcSBZjGPZikP3jhTaKA6DtMwZpOZc0_ophORRVGjemhu3Z5JEY3EnsZMUayuhviSia3Gf58/pub?gid=1232917699&single=true&output=csv";

async function fetchKPIs() {
  const response = await fetch(SHEET_CSV_KPI_URL);
  const csvText = await response.text();

  const rows = csvText.trim().split("\n");

  return rows.slice(1).map(row => {
    const values = row.split(",");

    return {
      nombre: values[0]?.trim(),
      valor: values[1]?.trim()
    };
  });
}

const SHEET_CSV_RECURSOS_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSugZplAvcSBZjGPZikP3jhTaKA6DtMwZpOZc0_ophORRVGjemhu3Z5JEY3EnsZMUayuhviSia3Gf58/pub?gid=1587744224&single=true&output=csv";
  async function fetchRecursos() {
    const response = await fetch(SHEET_CSV_RECURSOS_URL);
    const csvText = await response.text();
  
    const rows = csvText.trim().split("\n");
  
    return rows.slice(1).map(row => {
      const values = row.split(",");
  
      return {
        nombre: values[0]?.trim(),
        tipo: values[1]?.trim(),
        categoria: values[2]?.trim(),
        enlace: values[3]?.trim()
      };
    });
  }