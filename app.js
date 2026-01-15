const ESTADOS = ["no-aplica", "pendiente", "pagado", "no-pagado"];
let ANIO = 2026;
const STORAGE_PREFIX = "crm_vivienda_";

const CONCEPTOS = [
  { nombre: "Hipoteca", tipo: "mensual" },
  { nombre: "Seguro del hogar", tipo: "mensual" },
  { nombre: "Luz", tipo: "mensual" },
  { nombre: "Agua", tipo: "mensual" },
  { nombre: "Gas butano", tipo: "mensual" },
  { nombre: "Internet / Teléfono", tipo: "mensual" },
  { nombre: "Comunidad", tipo: "mensual" },
  { nombre: "Ascensor", tipo: "mensual" },
  { nombre: "Derramas", tipo: "extra" },
  { nombre: "IBI", tipo: "anual" },
  { nombre: "Basura", tipo: "trimestral" },
  { nombre: "Catastro", tipo: "anual" },
  { nombre: "Fondo de imprevistos", tipo: "mensual" }
];

// ---------- GENERAR TABLA ----------
function generarTabla() {
  const tbody = document.querySelector("tbody");
  tbody.innerHTML = "";

  CONCEPTOS.forEach(c => {
    const tr = document.createElement("tr");

    const tdConcepto = document.createElement("td");
    tdConcepto.classList.add("concepto");
    tdConcepto.textContent = c.nombre;
    tr.appendChild(tdConcepto);

    for (let i = 0; i < 12; i++) {
      const td = document.createElement("td");
      td.classList.add("estado", "no-aplica");
      td.style.position = "relative";

      const input = document.createElement("input");
      input.type = "number";
      input.min = 0;
      input.max = 999;
      input.step = 1;
      input.classList.add("importe");

      // periodicidad
      if(c.tipo === "trimestral" && ![2,5,8,11].includes(i)) td.classList.add("no-aplica");
      if(c.tipo === "anual" && i !== 7) td.classList.add("no-aplica");

      td.appendChild(input);
      tr.appendChild(td);
    }

    const tdTotal = document.createElement("td");
    tdTotal.classList.add("total");
    tdTotal.textContent = "0 €";
    tr.appendChild(tdTotal);

    tbody.appendChild(tr);
  });
}

// ---------- SEMÁFORO ----------
function activarCeldas() {
  document.querySelectorAll("td.estado").forEach(td => {
    td.addEventListener("click", () => {
      cambiarEstado(td);
      recalcularTodo();
      guardarDatos();
    });
  });
}

function cambiarEstado(td) {
  const actual = ESTADOS.find(e => td.classList.contains(e));
  td.classList.remove(actual);
  const siguiente = ESTADOS[(ESTADOS.indexOf(actual)+1)%ESTADOS.length];
  td.classList.add(siguiente);
}

// ---------- IMPORTES ----------
function activarImportes() {
  document.querySelectorAll(".importe").forEach(inp => {
    inp.addEventListener("click", e => e.stopPropagation());
    inp.addEventListener("input", () => {
      recalcularTodo();
      guardarDatos();
    });
  });
}

// ---------- TOTALES ----------
function recalcularTotalesFilas() {
  document.querySelectorAll("tbody tr").forEach(fila => {
    let total = 0;
    fila.querySelectorAll(".importe").forEach(inp => {
      const val = parseFloat(inp.value);
      if(!isNaN(val)) total += val;
    });
    fila.querySelector(".total").textContent = total + " €";
  });
}

function recalcularTotalesColumnas() {
  const filas = document.querySelectorAll("tbody tr");
  const footer = document.querySelectorAll("tfoot td");
  let granTotal = 0;

  for (let col=1; col<=12; col++) {
    let totalMes = 0;
    filas.forEach(fila => {
      const inp = fila.children[col].querySelector(".importe");
      if(inp && inp.value) totalMes += parseFloat(inp.value);
    });
    footer[col].textContent = totalMes + " €";
    granTotal += totalMes;
  }

  document.querySelector(".gran-total").textContent = granTotal + " €";
}

function recalcularTodo() {
  recalcularTotalesFilas();
  recalcularTotalesColumnas();
}

// ---------- STORAGE ----------
function guardarDatos() {
  const data = { anio: ANIO, filas: [] };
  document.querySelectorAll("tbody tr").forEach(fila => {
    const concepto = fila.querySelector(".concepto").textContent;
    const meses = [];
    fila.querySelectorAll("td.estado").forEach(td => {
      const estado = ESTADOS.find(e => td.classList.contains(e));
      const imp = td.querySelector(".importe");
      meses.push({ estado, importe: imp && imp.value ? imp.value : "" });
    });
    data.filas.push({ concepto, meses });
  });
  localStorage.setItem(STORAGE_PREFIX + ANIO, JSON.stringify(data));
}

function cargarDatos() {
  const raw = localStorage.getItem(STORAGE_PREFIX + ANIO);
  if(!raw) return;
  const data = JSON.parse(raw);
  document.querySelectorAll("tbody tr").forEach((fila,i) => {
    fila.querySelectorAll("td.estado").forEach((td,j) => {
      ESTADOS.forEach(e => td.classList.remove(e));
      td.classList.add(data.filas[i].meses[j].estado || "no-aplica");
      const inp = td.querySelector(".importe");
      if(inp) inp.value = data.filas[i].meses[j].importe || "";
    });
  });
}

// ---------- EXPORT / IMPORT JSON ----------
document.addEventListener("DOMContentLoaded", () => {
  generarTabla();
  activarCeldas();
  activarImportes();
  cargarDatos();
  recalcularTodo();

  // Exportar JSON
  document.getElementById("exportar").onclick = () => {
    const data = localStorage.getItem(STORAGE_PREFIX + ANIO);
    const blob = new Blob([data], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `crm_vivienda_${ANIO}.json`;
    a.click();
  };

  // Importar JSON
  document.getElementById("importar").onclick = () =>
    document.getElementById("fileJson").click();

  document.getElementById("fileJson").addEventListener("change", e => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = ev => {
      const data = JSON.parse(ev.target.result);
      ANIO = data.anio;
      localStorage.setItem(STORAGE_PREFIX + ANIO, JSON.stringify(data));
      location.reload();
    };
    reader.readAsText(file);
  });

  // Año anterior
  document.getElementById("anio-anterior").onclick = () => {
    ANIO--;
    localStorage.setItem("anioActual", ANIO);
    generarTabla();
    activarCeldas();
    activarImportes();
    cargarDatos();
    recalcularTodo();
    document.querySelector("header h1").textContent = `🏠 CRM Vivienda / Hipoteca (${ANIO})`;
  };

  // Año siguiente
  document.getElementById("anio-siguiente").onclick = () => {
    ANIO++;
    localStorage.setItem("anioActual", ANIO);
    generarTabla();
    activarCeldas();
    activarImportes();
    cargarDatos();
    recalcularTodo();
    document.querySelector("header h1").textContent = `🏠 CRM Vivienda / Hipoteca (${ANIO})`;
  };
});

