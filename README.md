# Pipeline HubSpot + WooCommerce (Simulado)

Microservicio en Node.js + Express que sincroniza las ventas de **WooCommerce** hacia **HubSpot CRM** (ambas APIs simuladas con datos mock). Incluye un panel web con dashboard tipo kanban, contexto 100% chileno y precios en CLP.

## Caracteristicas

- Webhook receptor que procesa nuevas ordenes de WooCommerce.
- Busqueda/creacion automatica de contactos en HubSpot (mock).
- Creacion de deals en el pipeline de ventas con monto en CLP, productos y etapa inicial **Nuevo**.
- Transicion automatica de etapas segun el estado de la orden:
  - `completed` -> **Cerrado Ganado**
  - `cancelled` / `failed` / `refunded` -> **Cerrado Perdido**
- Dashboard web con:
  - Kanban visual de deals por etapa.
  - Total de ventas del mes (CLP).
  - Conteo de contactos nuevos.
- Base de datos local SQLite (`data/pipeline.db`).
- 50 ordenes de prueba con clientes chilenos realistas.

## Requisitos

- Node.js 18 o superior.
- npm 9 o superior.

## Instalacion

```bash
cd 01_hubspot_woocommerce_pipeline
npm install
```

> El modulo `better-sqlite3` se compila al instalar. En Windows necesitas tener `windows-build-tools` o Visual Studio Build Tools disponibles.

## Primeros pasos

1. Poblar la base de datos con 50 ordenes mock y clientes chilenos:

   ```bash
   npm run seed
   ```

2. Iniciar el servidor:

   ```bash
   npm start
   ```

3. Abrir el panel web:

   http://localhost:3000

## Endpoints disponibles

| Metodo | Ruta                                | Descripcion                                            |
|--------|-------------------------------------|--------------------------------------------------------|
| POST   | `/webhooks/woocommerce/order`       | Recibe una orden nueva/actualizada de WooCommerce.     |
| GET    | `/api/dashboard`                    | Datos agregados para el dashboard (kanban + metricas). |
| GET    | `/api/deals`                        | Lista todos los deals.                                 |
| GET    | `/api/contacts`                     | Lista todos los contactos.                             |
| GET    | `/api/orders`                       | Lista todas las ordenes registradas.                   |
| POST   | `/api/mock/hubspot/contacts/search` | Endpoint mock de HubSpot (busqueda de contactos).      |
| POST   | `/api/mock/hubspot/contacts`        | Endpoint mock de HubSpot (crea contacto).              |
| POST   | `/api/mock/hubspot/deals`           | Endpoint mock de HubSpot (crea deal).                  |
| PATCH  | `/api/mock/hubspot/deals/:id`       | Endpoint mock de HubSpot (actualiza etapa).            |

## Simular eventos en vivo

Puedes enviar eventos manualmente para ver como se mueve el pipeline:

```bash
npm run simulate
```

Este script genera una nueva orden, la marca como completada y tambien crea otra que se cancela, mostrando el flujo completo.

## Estructura del proyecto

```
01_hubspot_woocommerce_pipeline/
  src/
    db.js                # Conexion y setup de SQLite
    server.js            # Servidor Express + rutas
    seed.js              # Pobla la base con 50 ordenes mock
    simulate.js          # Envia eventos al webhook local
    mockHubSpot.js       # Implementacion del mock de HubSpot
    mockWooCommerce.js   # Generador de datos mock de WooCommerce
    pipelineService.js   # Logica de sincronizacion de pipeline
    data/chileanNames.js # Nombres, comunas y productos chilenos
  public/
    index.html           # Dashboard kanban
    style.css            # Estilos del panel
    app.js               # Logica cliente del dashboard
  data/
    pipeline.db          # (Se crea al ejecutar seed/start)
  package.json
  README.md
```

## Notas

- Las APIs de HubSpot y WooCommerce son **simuladas** dentro del mismo servicio. No se realizan llamadas reales a ningun proveedor externo.
- Todos los precios estan expresados en pesos chilenos (CLP) sin decimales.
- Los nombres, RUT, comunas y productos provienen de listados representativos del mercado chileno.
