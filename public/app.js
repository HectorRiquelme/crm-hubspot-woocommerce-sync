const ETAPAS = ['Nuevo', 'En Negociacion', 'Cerrado Ganado', 'Cerrado Perdido'];

const formatterCLP = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0
});

function formatearFecha(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

async function cargarDashboard() {
  try {
    const res = await fetch('/api/dashboard');
    if (!res.ok) throw new Error('No se pudo cargar el dashboard');
    const data = await res.json();
    renderMetricas(data.metricas, data.totalesPorEtapa);
    renderKanban(data.kanban);
    renderEventos(data.ultimosEventos);
  } catch (err) {
    console.error(err);
  }
}

function renderMetricas(metricas, totales) {
  document.getElementById('mVentasMes').textContent = formatterCLP.format(metricas.ventasMes || 0);
  document.getElementById('mVentasMesCantidad').textContent =
    `${metricas.ventasMesCantidad || 0} deals ganados`;

  document.getElementById('mPipelineMes').textContent = formatterCLP.format(metricas.pipelineMes || 0);
  document.getElementById('mPipelineMesCantidad').textContent =
    `${metricas.pipelineMesCantidad || 0} deals creados`;

  document.getElementById('mContactosNuevos').textContent = metricas.contactosNuevos || 0;

  const total = totales.reduce((acc, t) => acc + t.cantidad, 0);
  document.getElementById('mDealsTotales').textContent = total;
  document.getElementById('mDealsBreakdown').textContent = totales
    .map((t) => `${t.etapa}: ${t.cantidad}`)
    .join(' - ');
}

function renderKanban(kanban) {
  const container = document.getElementById('kanban');
  container.innerHTML = '';
  ETAPAS.forEach((etapa) => {
    const deals = kanban[etapa] || [];
    const col = document.createElement('div');
    col.className = 'column';
    col.dataset.etapa = etapa;
    col.innerHTML = `
      <div class="column-header">
        <h3><span class="dot"></span>${etapa}</h3>
        <span class="count">${deals.length}</span>
      </div>
    `;
    if (deals.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = 'Sin deals en esta etapa';
      col.appendChild(empty);
    } else {
      deals.forEach((deal) => {
        col.appendChild(renderDealCard(deal));
      });
    }
    container.appendChild(col);
  });
}

function renderDealCard(deal) {
  const card = document.createElement('div');
  card.className = 'deal-card';
  const productos = (deal.productos || [])
    .map((p) => `${p.cantidad}x ${p.nombre}`)
    .join(' / ');
  card.innerHTML = `
    <div class="title">${deal.nombre}</div>
    <div class="amount">${formatterCLP.format(deal.monto || 0)}</div>
    <div class="meta">Actualizado: ${formatearFecha(deal.updatedAt)}</div>
    <div class="products">${productos || 'Sin productos'}</div>
  `;
  return card;
}

function renderEventos(eventos) {
  const ul = document.getElementById('eventos');
  ul.innerHTML = '';
  if (!eventos || eventos.length === 0) {
    const li = document.createElement('li');
    li.innerHTML = '<span class="tipo">info</span><span>Sin eventos recientes</span><span class="fecha"></span>';
    ul.appendChild(li);
    return;
  }
  eventos.forEach((e) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="tipo">${e.tipo.replace('_', ' ')}</span>
      <span style="flex:1">${e.detalle}</span>
      <span class="fecha">${formatearFecha(e.created_at)}</span>
    `;
    ul.appendChild(li);
  });
}

document.getElementById('btnRefrescar').addEventListener('click', cargarDashboard);

cargarDashboard();
setInterval(cargarDashboard, 15000);
