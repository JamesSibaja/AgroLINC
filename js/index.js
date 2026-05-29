async function renderKPIs() {

    try {
  
      const kpis = await fetchKPI();
  
      const container =
        document.getElementById("kpiContainer");
  
      if (!container) return;
  
      const icons = {
  
        "Participantes":
          "fa-solid fa-users",
  
        "Recursos Agroideas":
          "fa-solid fa-lightbulb",
  
        "Cursos Diferentes":
          "fa-solid fa-graduation-cap"
  
      };
  
      container.innerHTML = "";
  
      kpis.forEach(kpi => {
  
        const card =
          document.createElement("div");
  
        card.className =
          "metric-card";
  
        const icon =
          icons[kpi.nombre] ||
          "fa-solid fa-chart-column";
  
        card.innerHTML = `
  
          <div class="metric-icon">
            <i class="${icon}"></i>
          </div>
  
          <div>
  
            <strong>
              ${kpi.valor}
            </strong>
  
            <span>
              ${kpi.nombre}
            </span>
  
          </div>
  
        `;
  
        container.appendChild(card);
  
      });
  
    } catch (error) {
  
      console.error(
        "Error cargando KPI",
        error
      );
  
    }
  
  }
  
  document.addEventListener(
    "DOMContentLoaded",
    renderKPIs
  );

  const copyBtn =
  document.getElementById("copyBtn");

copyBtn.addEventListener(
  "click",
  async () => {

    await navigator.clipboard.writeText(
      "fablab@iica.int"
    );

    copyBtn.innerHTML =
      '<i class="fa-solid fa-check"></i>';

    setTimeout(() => {

      copyBtn.innerHTML =
        '<i class="fa-regular fa-copy"></i>';

    }, 1800);

  }
);