// Envia eventos simulados al webhook local para demostrar el flujo completo.
// Requiere que el servidor este corriendo (npm start).

const http = require('http');
const { crearCliente, crearOrdenMock } = require('./mockWooCommerce');

const HOST = 'localhost';
const PORT = process.env.PORT || 3000;

function postJson(pathname, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request(
      {
        host: HOST,
        port: PORT,
        path: pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, body });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log('Simulando eventos WooCommerce -> HubSpot\n');

  // Caso 1: nueva orden procesando -> deal en "Nuevo"
  const cliente1 = crearCliente(900);
  const orden1 = crearOrdenMock({
    wooId: 90001,
    cliente: cliente1,
    fecha: new Date(),
    status: 'processing'
  });
  console.log(`1) Enviando orden ${orden1.id} de ${cliente1.firstname} ${cliente1.lastname} (processing)`);
  let r = await postJson('/webhooks/woocommerce/order', orden1);
  console.log('   ->', r.status, 'etapa:', r.body?.resultado?.deal?.etapa);

  // Caso 2: la misma orden ahora completada -> deal a "Cerrado Ganado"
  const orden1Completa = { ...orden1, status: 'completed' };
  console.log(`2) Marcando orden ${orden1.id} como completed`);
  r = await postJson('/webhooks/woocommerce/order', orden1Completa);
  console.log('   ->', r.status, 'etapa:', r.body?.resultado?.deal?.etapa);

  // Caso 3: nueva orden que luego se cancela -> deal a "Cerrado Perdido"
  const cliente2 = crearCliente(901);
  const orden2 = crearOrdenMock({
    wooId: 90002,
    cliente: cliente2,
    fecha: new Date(),
    status: 'processing'
  });
  console.log(`3) Enviando orden ${orden2.id} de ${cliente2.firstname} ${cliente2.lastname} (processing)`);
  r = await postJson('/webhooks/woocommerce/order', orden2);
  console.log('   ->', r.status, 'etapa:', r.body?.resultado?.deal?.etapa);

  const orden2Cancel = { ...orden2, status: 'cancelled' };
  console.log(`4) Cancelando orden ${orden2.id}`);
  r = await postJson('/webhooks/woocommerce/order', orden2Cancel);
  console.log('   ->', r.status, 'etapa:', r.body?.resultado?.deal?.etapa);

  console.log('\nRevisa el dashboard en http://localhost:' + PORT);
}

run().catch((err) => {
  console.error('Error en simulacion:', err.message);
  console.error('Asegurate de tener el servidor corriendo con "npm start".');
  process.exit(1);
});
