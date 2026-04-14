// Logica principal: procesa ordenes de WooCommerce y las refleja en el CRM (mock).

const { nanoid } = require('nanoid');
const { db } = require('./db');
const hubspot = require('./mockHubSpot');

const ETAPA_NUEVO = 'Nuevo';
const ETAPA_GANADO = 'Cerrado Ganado';
const ETAPA_PERDIDO = 'Cerrado Perdido';

function registrarEvento(tipo, detalle) {
  db.prepare(
    'INSERT INTO events (tipo, detalle, created_at) VALUES (?, ?, ?)'
  ).run(tipo, detalle, new Date().toISOString());
}

function upsertContacto(billing) {
  const email = billing.email.toLowerCase();

  // 1) Buscar en HubSpot (mock)
  let hsContact = hubspot.searchContactByEmail(email);

  // 2) Si no existe, crearlo
  if (!hsContact) {
    hsContact = hubspot.createContact({
      firstname: billing.first_name,
      lastname: billing.last_name,
      email,
      phone: billing.phone,
      rut: billing.rut,
      comuna: billing.city,
      region: billing.state
    });
    registrarEvento(
      'contacto_creado',
      `Nuevo contacto en HubSpot: ${billing.first_name} ${billing.last_name} (${email})`
    );
  }

  // 3) Persistir en la base local si aun no existe.
  const existente = db
    .prepare('SELECT * FROM contacts WHERE email = ?')
    .get(email);
  if (existente) return existente;

  const record = {
    id: `ct_${nanoid(10)}`,
    hubspot_id: hsContact.id,
    nombre: billing.first_name,
    apellido: billing.last_name,
    email,
    telefono: billing.phone || null,
    rut: billing.rut || null,
    comuna: billing.city || null,
    region: billing.state || null,
    created_at: new Date().toISOString()
  };
  db.prepare(`
    INSERT INTO contacts (id, hubspot_id, nombre, apellido, email, telefono, rut, comuna, region, created_at)
    VALUES (@id, @hubspot_id, @nombre, @apellido, @email, @telefono, @rut, @comuna, @region, @created_at)
  `).run(record);
  return record;
}

function procesarOrden(payload) {
  if (!payload || !payload.id) {
    throw new Error('Payload de orden invalido');
  }

  const contacto = upsertContacto(payload.billing);

  // Insertar/actualizar orden en DB local.
  const ahora = new Date().toISOString();
  const fechaCreacion = payload.date_created || ahora;
  const ordenExistente = db
    .prepare('SELECT * FROM orders WHERE woo_id = ?')
    .get(payload.id);

  let orderRecord;
  if (ordenExistente) {
    db.prepare(`
      UPDATE orders
      SET status = ?, total_clp = ?, items_json = ?, updated_at = ?
      WHERE id = ?
    `).run(
      payload.status,
      payload.total,
      JSON.stringify(payload.line_items),
      ahora,
      ordenExistente.id
    );
    orderRecord = { ...ordenExistente, status: payload.status, total_clp: payload.total };
  } else {
    orderRecord = {
      id: `ord_${nanoid(10)}`,
      woo_id: payload.id,
      contact_id: contacto.id,
      status: payload.status,
      total_clp: payload.total,
      items_json: JSON.stringify(payload.line_items),
      created_at: fechaCreacion,
      updated_at: ahora
    };
    db.prepare(`
      INSERT INTO orders (id, woo_id, contact_id, status, total_clp, items_json, created_at, updated_at)
      VALUES (@id, @woo_id, @contact_id, @status, @total_clp, @items_json, @created_at, @updated_at)
    `).run(orderRecord);
    registrarEvento(
      'orden_recibida',
      `Orden WooCommerce #${payload.id} recibida por ${payload.total.toLocaleString('es-CL')} CLP`
    );
  }

  // Crear deal si no existe.
  let deal = db
    .prepare('SELECT * FROM deals WHERE order_id = ?')
    .get(orderRecord.id);

  if (!deal) {
    const etapaInicial = mapStatusAEtapa(payload.status);
    const nombreDeal = `Venta WooCommerce #${payload.id}`;
    const hsDeal = hubspot.createDeal({
      dealname: nombreDeal,
      amount: payload.total,
      etapa: etapaInicial,
      productos: payload.line_items,
      contactId: contacto.hubspot_id,
      orderId: orderRecord.id
    });

    deal = {
      id: `dl_${nanoid(10)}`,
      hubspot_deal_id: hsDeal.id,
      order_id: orderRecord.id,
      contact_id: contacto.id,
      nombre: nombreDeal,
      monto_clp: payload.total,
      etapa: etapaInicial,
      productos_json: JSON.stringify(payload.line_items),
      created_at: ahora,
      updated_at: ahora
    };
    db.prepare(`
      INSERT INTO deals (id, hubspot_deal_id, order_id, contact_id, nombre, monto_clp, etapa, productos_json, created_at, updated_at)
      VALUES (@id, @hubspot_deal_id, @order_id, @contact_id, @nombre, @monto_clp, @etapa, @productos_json, @created_at, @updated_at)
    `).run(deal);
    registrarEvento(
      'deal_creado',
      `Deal "${nombreDeal}" creado en etapa ${etapaInicial} por ${payload.total.toLocaleString('es-CL')} CLP`
    );
  } else {
    // Si el deal existe, actualizar etapa segun estado.
    const nuevaEtapa = mapStatusAEtapa(payload.status);
    if (nuevaEtapa !== deal.etapa) {
      hubspot.updateDealStage(deal.hubspot_deal_id, nuevaEtapa);
      db.prepare('UPDATE deals SET etapa = ?, updated_at = ? WHERE id = ?')
        .run(nuevaEtapa, ahora, deal.id);
      registrarEvento(
        'deal_movido',
        `Deal "${deal.nombre}" movido a etapa ${nuevaEtapa}`
      );
      deal.etapa = nuevaEtapa;
    }
  }

  return {
    contacto,
    orden: orderRecord,
    deal
  };
}

function mapStatusAEtapa(status) {
  const s = (status || '').toLowerCase();
  if (s === 'completed') return ETAPA_GANADO;
  if (s === 'cancelled' || s === 'failed' || s === 'refunded') return ETAPA_PERDIDO;
  return ETAPA_NUEVO;
}

function obtenerDashboard() {
  const etapas = [ETAPA_NUEVO, 'En Negociacion', ETAPA_GANADO, ETAPA_PERDIDO];
  const kanban = {};
  for (const etapa of etapas) {
    const rows = db
      .prepare('SELECT * FROM deals WHERE etapa = ? ORDER BY updated_at DESC')
      .all(etapa);
    kanban[etapa] = rows.map(formatearDeal);
  }

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);
  const inicioMesIso = inicioMes.toISOString();

  const ventasMes = db
    .prepare(`
      SELECT COALESCE(SUM(monto_clp), 0) AS total, COUNT(*) AS cantidad
      FROM deals
      WHERE etapa = ? AND updated_at >= ?
    `)
    .get(ETAPA_GANADO, inicioMesIso);

  const pipelineMes = db
    .prepare(`
      SELECT COALESCE(SUM(monto_clp), 0) AS total, COUNT(*) AS cantidad
      FROM deals
      WHERE created_at >= ?
    `)
    .get(inicioMesIso);

  const contactosNuevos = db
    .prepare('SELECT COUNT(*) AS total FROM contacts WHERE created_at >= ?')
    .get(inicioMesIso);

  const totalesPorEtapa = etapas.map((etapa) => {
    const row = db
      .prepare('SELECT COUNT(*) AS cantidad, COALESCE(SUM(monto_clp),0) AS monto FROM deals WHERE etapa = ?')
      .get(etapa);
    return { etapa, cantidad: row.cantidad, monto: row.monto };
  });

  const ultimosEventos = db
    .prepare('SELECT tipo, detalle, created_at FROM events ORDER BY id DESC LIMIT 10')
    .all();

  return {
    kanban,
    metricas: {
      ventasMes: ventasMes.total,
      ventasMesCantidad: ventasMes.cantidad,
      pipelineMes: pipelineMes.total,
      pipelineMesCantidad: pipelineMes.cantidad,
      contactosNuevos: contactosNuevos.total
    },
    totalesPorEtapa,
    ultimosEventos
  };
}

function formatearDeal(row) {
  return {
    id: row.id,
    hubspotDealId: row.hubspot_deal_id,
    nombre: row.nombre,
    monto: row.monto_clp,
    etapa: row.etapa,
    productos: JSON.parse(row.productos_json || '[]'),
    contactId: row.contact_id,
    orderId: row.order_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function listarDeals() {
  return db
    .prepare('SELECT * FROM deals ORDER BY updated_at DESC')
    .all()
    .map(formatearDeal);
}

function listarContactos() {
  return db
    .prepare('SELECT * FROM contacts ORDER BY created_at DESC')
    .all();
}

function listarOrdenes() {
  return db
    .prepare('SELECT * FROM orders ORDER BY created_at DESC')
    .all()
    .map((o) => ({ ...o, items: JSON.parse(o.items_json || '[]') }));
}

module.exports = {
  procesarOrden,
  obtenerDashboard,
  listarDeals,
  listarContactos,
  listarOrdenes,
  mapStatusAEtapa,
  ETAPA_NUEVO,
  ETAPA_GANADO,
  ETAPA_PERDIDO
};
