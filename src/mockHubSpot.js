// Implementacion en memoria de las operaciones de HubSpot que necesitamos.
// No realiza llamadas reales: simula el comportamiento de la API oficial.

const { nanoid } = require('nanoid');

const contactsStore = new Map(); // email -> contacto
const dealsStore = new Map();    // id -> deal

const ETAPAS_VALIDAS = ['Nuevo', 'En Negociacion', 'Cerrado Ganado', 'Cerrado Perdido'];

function searchContactByEmail(email) {
  const found = contactsStore.get(email.toLowerCase());
  return found ? { ...found } : null;
}

function createContact(data) {
  const email = data.email.toLowerCase();
  if (contactsStore.has(email)) {
    return { ...contactsStore.get(email) };
  }
  const contact = {
    id: `hs_contact_${nanoid(10)}`,
    properties: {
      firstname: data.firstname,
      lastname: data.lastname,
      email,
      phone: data.phone || null,
      rut: data.rut || null,
      comuna: data.comuna || null,
      region: data.region || null
    },
    createdAt: new Date().toISOString()
  };
  contactsStore.set(email, contact);
  return { ...contact };
}

function createDeal(data) {
  if (!ETAPAS_VALIDAS.includes(data.etapa)) {
    throw new Error(`Etapa invalida: ${data.etapa}`);
  }
  const deal = {
    id: `hs_deal_${nanoid(10)}`,
    properties: {
      dealname: data.dealname,
      amount: data.amount,
      currency: 'CLP',
      dealstage: data.etapa,
      pipeline: 'ventas',
      productos: data.productos || [],
      contactId: data.contactId,
      orderId: data.orderId
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  dealsStore.set(deal.id, deal);
  return { ...deal };
}

function updateDealStage(dealId, etapa) {
  if (!ETAPAS_VALIDAS.includes(etapa)) {
    throw new Error(`Etapa invalida: ${etapa}`);
  }
  const deal = dealsStore.get(dealId);
  if (!deal) return null;
  deal.properties.dealstage = etapa;
  deal.updatedAt = new Date().toISOString();
  dealsStore.set(dealId, deal);
  return { ...deal };
}

function listDeals() {
  return Array.from(dealsStore.values());
}

function listContacts() {
  return Array.from(contactsStore.values());
}

function reset() {
  contactsStore.clear();
  dealsStore.clear();
}

module.exports = {
  ETAPAS_VALIDAS,
  searchContactByEmail,
  createContact,
  createDeal,
  updateDealStage,
  listDeals,
  listContacts,
  reset
};
