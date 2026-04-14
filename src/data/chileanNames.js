// Listados representativos del mercado chileno usados por los generadores mock.

const nombres = [
  'Javiera', 'Camila', 'Francisca', 'Constanza', 'Valentina', 'Catalina',
  'Antonia', 'Isidora', 'Martina', 'Florencia', 'Paula', 'Daniela',
  'Sofia', 'Trinidad', 'Emilia', 'Maria Jose', 'Fernanda', 'Monserrat',
  'Matias', 'Benjamin', 'Vicente', 'Cristobal', 'Tomas', 'Joaquin',
  'Agustin', 'Maximiliano', 'Sebastian', 'Nicolas', 'Ignacio', 'Diego',
  'Felipe', 'Rodrigo', 'Andres', 'Gonzalo', 'Cristian', 'Francisco'
];

const apellidos = [
  'Gonzalez', 'Munoz', 'Rojas', 'Diaz', 'Perez', 'Soto',
  'Contreras', 'Silva', 'Martinez', 'Sepulveda', 'Morales', 'Rodriguez',
  'Lopez', 'Fuentes', 'Hernandez', 'Torres', 'Araya', 'Flores',
  'Espinoza', 'Valenzuela', 'Castillo', 'Tapia', 'Reyes', 'Gutierrez',
  'Castro', 'Alvarez', 'Vargas', 'Riquelme', 'Fernandez', 'Herrera',
  'Carrasco', 'Figueroa', 'Cortes', 'Vera', 'Jara', 'Pino'
];

const comunas = [
  'Providencia', 'Las Condes', 'Nunoa', 'La Florida', 'Maipu',
  'Vitacura', 'Lo Barnechea', 'Penalolen', 'La Reina', 'Santiago Centro',
  'San Miguel', 'Puente Alto', 'Vina del Mar', 'Valparaiso', 'Concepcion',
  'Temuco', 'La Serena', 'Antofagasta', 'Rancagua', 'Chillan',
  'Puerto Montt', 'Iquique', 'Arica', 'Osorno', 'Talca'
];

const regiones = {
  'Providencia': 'Region Metropolitana',
  'Las Condes': 'Region Metropolitana',
  'Nunoa': 'Region Metropolitana',
  'La Florida': 'Region Metropolitana',
  'Maipu': 'Region Metropolitana',
  'Vitacura': 'Region Metropolitana',
  'Lo Barnechea': 'Region Metropolitana',
  'Penalolen': 'Region Metropolitana',
  'La Reina': 'Region Metropolitana',
  'Santiago Centro': 'Region Metropolitana',
  'San Miguel': 'Region Metropolitana',
  'Puente Alto': 'Region Metropolitana',
  'Vina del Mar': 'Valparaiso',
  'Valparaiso': 'Valparaiso',
  'Concepcion': 'Biobio',
  'Temuco': 'La Araucania',
  'La Serena': 'Coquimbo',
  'Antofagasta': 'Antofagasta',
  'Rancagua': 'OHiggins',
  'Chillan': 'Nuble',
  'Puerto Montt': 'Los Lagos',
  'Iquique': 'Tarapaca',
  'Arica': 'Arica y Parinacota',
  'Osorno': 'Los Lagos',
  'Talca': 'Maule'
};

const productos = [
  { sku: 'VIN-001', nombre: 'Vino Cabernet Sauvignon Valle del Maipo 750ml', precio: 8990 },
  { sku: 'VIN-002', nombre: 'Vino Carmenere Reserva Colchagua 750ml', precio: 12990 },
  { sku: 'EMP-001', nombre: 'Empanadas de Pino congeladas (pack 12)', precio: 15990 },
  { sku: 'MOTE-01', nombre: 'Mote con huesillos artesanal 1L', precio: 3490 },
  { sku: 'PISCO-1', nombre: 'Pisco Reservado 40 grados 750ml', precio: 6990 },
  { sku: 'MERK-01', nombre: 'Merken ahumado 100g', precio: 4290 },
  { sku: 'AJI-001', nombre: 'Pasta de aji verde chileno 200g', precio: 2490 },
  { sku: 'PAL-001', nombre: 'Palta Hass kilo', precio: 3990 },
  { sku: 'MAN-001', nombre: 'Manjar tradicional 500g', precio: 4590 },
  { sku: 'CAFE-01', nombre: 'Cafe de grano tostado 500g', precio: 7990 },
  { sku: 'MIEL-01', nombre: 'Miel de ulmo 1kg', precio: 8490 },
  { sku: 'QUES-01', nombre: 'Queso de cabra curado 250g', precio: 6490 },
  { sku: 'POL-001', nombre: 'Polera algodon pima talla M', precio: 14990 },
  { sku: 'CHAQ-01', nombre: 'Chaqueta cortaviento impermeable', precio: 49990 },
  { sku: 'ZAP-001', nombre: 'Zapatillas running talla 42', precio: 59990 },
  { sku: 'MOCH-01', nombre: 'Mochila outdoor 30L', precio: 39990 },
  { sku: 'TERM-01', nombre: 'Termo acero inoxidable 1L', precio: 18990 },
  { sku: 'LIB-001', nombre: 'Libro: Cuentos de Chile', precio: 12990 },
  { sku: 'AUR-001', nombre: 'Audifonos inalambricos', precio: 34990 },
  { sku: 'CARG-01', nombre: 'Cargador rapido USB-C', precio: 9990 }
];

function randomRut() {
  const body = Math.floor(1_000_000 + Math.random() * 23_000_000);
  const dv = calcularDv(body);
  return `${body.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${dv}`;
}

function calcularDv(rut) {
  let suma = 0;
  let multiplo = 2;
  let rutTemp = rut;
  while (rutTemp > 0) {
    suma += (rutTemp % 10) * multiplo;
    rutTemp = Math.floor(rutTemp / 10);
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }
  const resto = 11 - (suma % 11);
  if (resto === 11) return '0';
  if (resto === 10) return 'K';
  return String(resto);
}

module.exports = {
  nombres,
  apellidos,
  comunas,
  regiones,
  productos,
  randomRut
};
