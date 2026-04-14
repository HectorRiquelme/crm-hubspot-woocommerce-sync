// Pobla la base local con 50 ordenes mock de clientes chilenos y las procesa
// a traves del pipeline, tal como lo haria el webhook real.

const { reset } = require('./db');
const { generarLote } = require('./mockWooCommerce');
const pipelineService = require('./pipelineService');
const hubspot = require('./mockHubSpot');

function run() {
  console.log('Reiniciando base de datos local...');
  reset();
  hubspot.reset();

  console.log('Generando 50 ordenes mock con clientes chilenos...');
  const ordenes = generarLote(50);

  let contador = 0;
  for (const orden of ordenes) {
    try {
      pipelineService.procesarOrden(orden);
      contador++;
    } catch (error) {
      console.error(`Error en orden #${orden.id}:`, error.message);
    }
  }

  console.log(`\nListo. ${contador} ordenes procesadas.`);
  console.log('Ejecuta "npm start" y abre http://localhost:3000 para ver el dashboard.');
}

run();
