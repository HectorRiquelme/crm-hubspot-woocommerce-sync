// Generador de datos mock que simula payloads que emitiria WooCommerce.

const {
  nombres,
  apellidos,
  comunas,
  regiones,
  productos,
  randomRut
} = require('./data/chileanNames');

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function crearCliente(indice) {
  const nombre = pick(nombres);
  const apellido = pick(apellidos);
  const apellido2 = pick(apellidos);
  const comuna = pick(comunas);
  const region = regiones[comuna] || 'Region Metropolitana';
  const email = `${normalizar(nombre)}.${normalizar(apellido)}${indice}@correo.cl`;
  const telefono = `+569${randomBetween(10000000, 99999999)}`;
  return {
    firstname: nombre,
    lastname: `${apellido} ${apellido2}`,
    email,
    phone: telefono,
    rut: randomRut(),
    comuna,
    region
  };
}

function crearLineaProducto() {
  const producto = pick(productos);
  const cantidad = randomBetween(1, 4);
  return {
    sku: producto.sku,
    nombre: producto.nombre,
    cantidad,
    precio_unitario: producto.precio,
    subtotal: producto.precio * cantidad
  };
}

function crearOrdenMock({ wooId, cliente, fecha, status = 'processing' } = {}) {
  const lineCount = randomBetween(1, 4);
  const lineas = Array.from({ length: lineCount }, crearLineaProducto);
  const total = lineas.reduce((acc, l) => acc + l.subtotal, 0);
  return {
    id: wooId,
    status,
    currency: 'CLP',
    date_created: (fecha || new Date()).toISOString(),
    total,
    billing: {
      first_name: cliente.firstname,
      last_name: cliente.lastname,
      email: cliente.email,
      phone: cliente.phone,
      rut: cliente.rut,
      city: cliente.comuna,
      state: cliente.region,
      country: 'CL'
    },
    line_items: lineas
  };
}

function generarLote(cantidad = 50) {
  const ordenes = [];
  const hoy = new Date();
  for (let i = 0; i < cantidad; i++) {
    const cliente = crearCliente(i + 1);
    // Repartir fechas en los ultimos 45 dias para tener datos de "ventas del mes".
    const diasAtras = randomBetween(0, 45);
    const fecha = new Date(hoy.getTime() - diasAtras * 24 * 60 * 60 * 1000);

    // 60% procesando (deal Nuevo), 25% completado, 15% cancelado.
    let status = 'processing';
    const r = Math.random();
    if (r < 0.25) status = 'completed';
    else if (r < 0.40) status = 'cancelled';

    const orden = crearOrdenMock({
      wooId: 10000 + i + 1,
      cliente,
      fecha,
      status
    });
    ordenes.push(orden);
  }
  return ordenes;
}

module.exports = {
  crearCliente,
  crearOrdenMock,
  generarLote
};
