const path = require('path');
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');

const pipelineService = require('./pipelineService');
const hubspot = require('./mockHubSpot');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(morgan('dev'));
app.use(bodyParser.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// -----------------------------
// Webhook WooCommerce
// -----------------------------
app.post('/webhooks/woocommerce/order', (req, res) => {
  try {
    const payload = req.body;
    const resultado = pipelineService.procesarOrden(payload);
    res.json({ ok: true, resultado });
  } catch (error) {
    console.error('Error procesando orden:', error);
    res.status(400).json({ ok: false, error: error.message });
  }
});

// -----------------------------
// API dashboard
// -----------------------------
app.get('/api/dashboard', (req, res) => {
  res.json(pipelineService.obtenerDashboard());
});

app.get('/api/deals', (req, res) => {
  res.json(pipelineService.listarDeals());
});

app.get('/api/contacts', (req, res) => {
  res.json(pipelineService.listarContactos());
});

app.get('/api/orders', (req, res) => {
  res.json(pipelineService.listarOrdenes());
});

// -----------------------------
// Endpoints mock de HubSpot
// (accesibles para inspeccion/diagnostico)
// -----------------------------
app.post('/api/mock/hubspot/contacts/search', (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'email requerido' });
  const contact = hubspot.searchContactByEmail(email);
  res.json({ found: Boolean(contact), contact });
});

app.post('/api/mock/hubspot/contacts', (req, res) => {
  try {
    const contact = hubspot.createContact(req.body || {});
    res.status(201).json(contact);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/mock/hubspot/deals', (req, res) => {
  try {
    const deal = hubspot.createDeal(req.body || {});
    res.status(201).json(deal);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.patch('/api/mock/hubspot/deals/:id', (req, res) => {
  const { etapa } = req.body || {};
  try {
    const deal = hubspot.updateDealStage(req.params.id, etapa);
    if (!deal) return res.status(404).json({ error: 'deal no encontrado' });
    res.json(deal);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// -----------------------------
// Raiz: servir dashboard
// -----------------------------
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n  Pipeline HubSpot + WooCommerce escuchando en http://localhost:${PORT}`);
  console.log('  - Dashboard: http://localhost:' + PORT);
  console.log('  - Webhook:   POST /webhooks/woocommerce/order\n');
});
