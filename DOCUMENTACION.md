# SPSystem — Documentación Completa

Sistema de facturación y gestión de pulpería (tienda de conveniencia).  
**Stack:** Next.js 15 (App Router) + Prisma ORM + PostgreSQL + React 19  
**Desarrollado para:** Nicaragua (Córdobas, DGI, facturación electrónica)

---

## Tabla de Contenidos

1. [Arquitectura](#1-arquitectura)
2. [Modelo de Datos](#2-modelo-de-datos)
3. [Autenticación y Seguridad](#3-autenticación-y-seguridad)
4. [Módulos del Sistema](#4-módulos-del-sistema)
5. [API Routes](#5-api-routes)
6. [Componentes Compartidos](#6-componentes-compartidos)
7. [Configuración y Despliegue](#7-configuración-y-despliegue)

---

## 1. Arquitectura

```
pulperia-system/
├── app/                    # Next.js App Router
│   ├── api/                # Backend API (serverless routes)
│   ├── components/         # Componentes React compartidos
│   ├── context/            # Contextos globales (AuthContext)
│   ├── hooks/              # Custom hooks (useToast)
│   ├── login/              # Página de inicio de sesión
│   ├── pos/                # Punto de venta
│   ├── facturas/           # Historial de facturas
│   ├── compras/            # Compras a proveedores
│   ├── productos/          # CRUD productos + categorías
│   ├── clientes/           # CRUD clientes
│   ├── proveedores/        # CRUD proveedores
│   ├── inventario/         # Kardex / movimientos de inventario
│   ├── caja/               # Apertura/cierre de caja + arqueo
│   ├── cuentas-cobrar/     # Cuentas por cobrar (CXC)
│   ├── deudas/             # Cuentas por pagar (CXP)
│   ├── proformas/          # Cotizaciones / proformas
│   ├── reportes/           # Reportes generales + gráficas
│   ├── configuracion/      # Configuración del negocio
│   ├── usuarios/           # CRUD usuarios
│   ├── auditoria/          # Log de auditoría
│   ├── licencia/           # Gestión de licencia
│   ├── respaldos/          # Backup y restore de BD
│   └── manual/             # Manual de usuario (estático)
├── lib/                    # Utilidades compartidas
│   ├── auth.js             # JWT firmar/verificar
│   ├── prisma.js           # Singleton Prisma Client
│   ├── auditar.js          # Servidor: registrar auditoría
│   ├── auditarClient.js    # Cliente: registrar auditoría
│   └── facturaDgi.js       # Generar XML DGI
├── prisma/
│   ├── schema.prisma       # Esquema de base de datos
│   ├── seed.js             # Seed inicial
│   └── migrations/         # Migraciones SQL
├── print-agent/            # Agente de impresión térmica (opcional)
├── middleware.js            # Middleware: JWT, CORS, CSRF
├── Dockerfile
├── docker-compose.yml
└── docker-entrypoint.sh
```

### Flujo de datos

```
Cliente (Browser)
    ↕ HTTP (JSON)
Next.js App Router
    ├── Server Components / API Routes
    │       ↕ Prisma ORM
    │   PostgreSQL
    └── Client Components (React)
            ↕ react-to-print (impresión térmica 80mm)
        Impresora térmica
```

---

## 2. Modelo de Datos

### Tablas principales

| Tabla | Descripción |
|-------|-------------|
| **Categoria** | Categorías de productos (Ropa, Bebidas, Granos básicos, Chivería...) |
| **Producto** | Productos con precio, costo, stock, unidad, segunda presentación |
| **Cliente** | Clientes con límite de crédito, saldo inicial |
| **Factura** | Ventas (contado/crédito), pagos mixtos, anulación |
| **DetalleFac** | Líneas de detalle de cada factura |
| **Abono** | Abonos a facturas de crédito (CXC) |
| **Proveedor** | Proveedores con saldo inicial CXP |
| **Compra** | Compras a proveedores (contado/crédito) |
| **DetalleCompra** | Líneas de detalle de cada compra |
| **AbonoCompra** | Abonos a compras de crédito (CXP) |
| **Proforma** | Cotizaciones a clientes |
| **DetalleProforma** | Líneas de detalle de cada proforma |
| **MovInventario** | Kardex: movimientos de entrada/salida/ajuste |
| **Usuario** | Usuarios del sistema con roles y permisos por módulo |
| **Auditoria** | Log de auditoría de todas las operaciones |
| **Caja** | Apertura/cierre de caja diaria |
| **ArqueoDetalle** | Conteo de efectivo por denominación en cierre |
| **MovimientoCaja** | Ingresos/egresos extra durante la caja |
| **CartSession** | Tickets en espera (persistencia del carrito POS) |
| **Config** | Configuración clave-valor del sistema |

### Relaciones clave

```
Categoria 1──N Producto
Producto 1──N DetalleFac N──1 Factura N──1 Cliente
Producto 1──N DetalleCompra N──1 Compra N──1 Proveedor
Producto 1──N MovInventario
Producto 1──N DetalleProforma N──1 Proforma N──1 Cliente
Factura 1──N Abono
Compra 1──N AbonoCompra
Caja 1──N ArqueoDetalle
Caja 1──N MovimientoCaja
```

---

## 3. Autenticación y Seguridad

### JWT (JSON Web Tokens)
- **Algoritmo:** HS256
- **Expiración:** 24 horas
- **Cookie:** `session` (HttpOnly, Secure)
- **Payload:** `{ id, username, nombre, rol, esAdmin, modulos[] }`

### Middleware (`middleware.js`)
- Protege todas las rutas `/api/*` excepto: login, me, logout, config, licencia, logo
- Valida JWT en cada request
- CSRF: verifica Origin/Referer en métodos POST/PUT/DELETE
- CORS: responde OPTIONS con headers permitidos

### Roles y Permisos
- **admin**: acceso total, ver auditoría, licencia, respaldos
- **supervisor**: puede anular facturas, editar productos
- **encargado**: permisos intermedios
- **cajero**: solo POS y módulos asignados
- Cada usuario tiene un array `modulos` que limita el acceso a páginas específicas

### Licencia
- Archivo `.lic` con firma HMAC-SHA256
- Contiene: `cliente, fechaInicio, fechaExpiracion, firmado`
- Se valida en cada request via LicenseGuard

---

## 4. Módulos del Sistema

### 4.1 Dashboard (`/`)
- **Tarjetas de resumen:** Ventas hoy, Facturas hoy, Clientes
- **Stock Alerta:** Tarjeta con contador de productos con stock bajo, modal con detalle
- **Gráficas:** Ventas por día o por mes (toggle), usando Recharts (BarChart)
- **Menos consumo / Menos ganancia:** Barras horizontales con top 3 productos de menor rotación/ganancia (30 días)
- **Accesos rápidos:** POS, Facturas, Caja

### 4.2 POS - Punto de Venta (`/pos`)
- **Dos columnas:** productos a la izquierda, carrito + pago a la derecha
- **Búsqueda:** por nombre con filtro por categoría (botones tipo pill)
- **Scanner de código de barras:** buffer de teclado + Enter (no intercepta inputs)
- **Atajos de teclado:** F1 (buscar), F2 (pago), F3 (cobrar), F4 (descuento), F5 (cliente), F8 (pausar ticket)
- **Carrito:** suma cantidades al tocar, botones +/- , eliminar item
- **Segunda presentación:** toggle entre unidad base y alternativa (ej: libra/quintal)
- **Pago mixto:** múltiples métodos simultáneos (efectivo C$, dólares, tarjeta, transferencia, crédito)
- **Cálculos:** subtotal, descuento (fijo o porcentaje), IVA configurable, cambio
- **Clientes:** selector modal con búsqueda y creación rápida
- **Validación de caja:** bloquea si no hay caja abierta
- **Validación de stock:** verifica stock suficiente antes de cobrar
- **Límite de crédito:** verifica saldo disponible del cliente
- **Tickets en espera:** guardar/reanudar carritos (persistencia en backend)
- **Impresión:** ticket térmico 80mm con `react-to-print`
- **Teclado virtual:** TecladoNumerico flotante para inputs táctiles (inputMode="none")

### 4.3 Facturas (`/facturas`)
- Listado paginado con búsqueda por número o cliente
- Resumen: ventas hoy, total vendido hoy, total facturas
- Vista previa del ticket (modal)
- **Reimprimir:** ticket térmico
- **Compartir por WhatsApp:** mensaje formateado con detalle de compra
- **Anulación:** requiere autenticación de supervisor/admin
- Filtro visual por método de pago (colores)

### 4.4 Compras (`/compras`)
- Registro de compras a proveedores (contado/crédito)
- **Proveedor:** selector con datos de contacto
- **Factura del proveedor:** número de referencia
- **Detalle de compra:** grid de productos con cantidad, costo, unidad
- **Creación rápida de productos** desde el modal
- **Unidades de compra vs unidades base:** factor de conversión (ej: 1 quintal = 100 libras)
- **Campos de lote/vencimiento:** por cada producto se ingresa código de lote y fecha de vencimiento; se crea un Lote automáticamente
- **Abonos:** modal con pago total o parcial, imprimir recibo de abono
- **Anulación:** autorizada, descuenta stock automáticamente; restaura lotes (FIFO inverso)
- **Filtros:** todas / pendientes / pagadas
- **Búsqueda por factura del proveedor**

### 4.5 Productos y Categorías (`/productos`)
- **CRUD completo:** crear, editar, eliminar productos
- **Campos:** nombre, código, precio, costo, stock, stock mínimo, unidad
- **4 presentaciones de precio:** base + venta2 + venta3 + venta4, cada una con unidad, precio, costo y factor de conversión
- **Control de lotes:** gestión de lotes por producto (código de lote, cantidad, fecha de vencimiento); stock total = suma de cantidades de todos los lotes
- **Producto genérico:** flag `esGenerico` para productos de precio variable (ej. verduras sueltas, artículos sin código); no afectan inventario, al seleccionarlos en POS se abre modal para ingresar precio y cantidad
- **Categorías:** CRUD en grid con cards de colores
- **Importación masiva:** desde Excel (.xlsx) con plantilla descargable (incluye las 4 presentaciones)
- **Tabla:** visualiza precio, costo, stock, estado (OK/Bajo/Agotado)
- **Botón Stock Alerta** para ver productos bajos
- **Control de lotes:** gestión de lotes por producto con código de lote, cantidad y fecha de vencimiento; stock total = suma de cantidades de todos los lotes

### 4.6 Clientes (`/clientes`)
- **CRUD completo:** crear, editar clientes
- **Campos:** nombre, teléfono, cédula, dirección, límite de crédito, saldo inicial
- **Historial de compras:** modal con facturas del cliente y total gastado
- **Importación:** desde CSV con componente ImportarCSV
- **Paginación:** 30 clientes por página

### 4.7 Proveedores (`/proveedores`)
- **CRUD completo:** crear, editar proveedores
- **Campos:** nombre, teléfono, contacto, dirección, email, saldo inicial CXP
- **Importación CSV**

### 4.8 Inventario / Kardex (`/inventario`)
- **Movimientos cronológicos:** tabla con entradas, salidas, saldo acumulado
- **Filtro:** por nombre de producto con búsqueda
- **Nuevo movimiento:** entrada/salida/ajuste con cantidad, motivo
- **Alertas:** productos con stock bajo el mínimo
- **Existencias:** reporte de todos los productos con stock actual, código, categoría, costo, precio, valor total

### 4.9 Caja (`/caja`)
- **Apertura:** monto inicial, registra usuario
- **Cierre:** arqueo de efectivo por denominación (C$ y US$)
- **Cálculos:** ventas efectivo, tarjeta, transferencia, crédito
- **Diferencia:** compara efectivo real vs esperado
- **Movimientos:** ingresos y egresos extra durante la caja
- **Historial:** cierres anteriores

### 4.10 Cuentas por Cobrar - CXC (`/cuentas-cobrar`)
- Facturas al crédito con saldo pendiente
- **Abonos:** modal + recibo imprimible
- **Saldo inicial:** adeudos anteriores del cliente
- **Totales:** pendiente general, por cliente
- **Filtros:** todas / pendientes / pagadas

### 4.11 Cuentas por Pagar - CXP (`/deudas`)
- Compras al crédito con saldo pendiente a proveedores
- **Abonos:** modal
- **Saldo inicial CXP**
- **Filtros**

### 4.12 Proformas / Cotizaciones (`/proformas`)
- Creación de cotizaciones con selección de productos y cliente
- **Dos formatos de impresión:** ticket 80mm y carta
- **Conversión a factura:** convierte la proforma en venta POS
- **PDF:** reporte imprimible

### 4.13 Reportes (`/reportes`)
- **Múltiples módulos:** resumen, facturas, ventas detalladas, ganancias, compras, productos, clientes, proveedores, inventario, proformas
- **Filtro por fechas** en módulos relevantes
- **Gráfica de ventas** (diarias/mensuales)
- **Tablas exportables/ imprimibles** con columnas configurables por módulo
- **Resumen:** top 10 productos más vendidos, ventas por método de pago, ventas por día

### 4.14 Configuración (`/configuracion`)
- **Datos del negocio:** nombre, slogan, dirección, teléfono, RUC, ciudad
- **Logo:** subida por archivo (base64)
- **IVA:** activar/desactivar, tasa porcentual
- **Tasa de cambio:** Córdobas por dólar
- **DGI:** configurar NRC, CAI, rangos de facturación
- **Mensaje:** pie de factura

### 4.15 Usuarios (`/usuarios`)
- **CRUD:** crear, editar, eliminar usuarios
- **Campos:** username, password, nombre, rol (admin/encargado/supervisor/cajero)
- **Permisos por módulo:** checkboxes para cada sección del sistema
- **Bloqueo:** tras intentos fallidos de login

### 4.16 Auditoría (`/auditoria`)
- Log de todas las acciones del sistema
- **Filtros:** por usuario, acción (crear/editar/anular/eliminar/login), entidad, rango de fechas
- **Paginación:** 50 registros por página

### 4.17 Licencia (`/licencia`)
- Instalación de archivo `.lic` por drag & drop o selector
- Visualiza estado: cliente, fechas, validez

### 4.18 Respaldos (`/respaldos`)
- **Descargar backup:** genera dump SQL de PostgreSQL
- **Restaurar:** subir archivo SQL para restaurar base de datos
- **Backup automático:** cron job (node-cron) cada domingo 2:00 AM, guarda últimos 4 backups

---

## 5. API Routes

### `GET /api/config`
Devuelve toda la configuración del negocio (clave-valor).

### `POST /api/config`
Guarda/actualiza la configuración.

### `GET /api/productos?buscar=&categoriaId=&limit=`
Lista productos. Opcional: filtro por nombre/código, categoría, límite.

### `POST /api/productos`
Crea un nuevo producto.

### `PUT /api/productos/[id]`
Edita un producto.

### `DELETE /api/productos/[id]`
Elimina un producto.

### `GET /api/categorias`
Lista categorías.

### `POST /api/categorias`
Crea categoría.

### `DELETE /api/categorias?id=`
Elimina categoría.

### `GET /api/clientes?page=&limit=&buscar=`
Lista clientes con paginación.

### `POST /api/clientes`
Crea cliente.

### `PUT /api/clientes/[id]`
Edita cliente.

### `POST /api/clientes/[id]/abonar-inicial`
Abona al saldo inicial del cliente.

### `POST /api/clientes/importar`
Importa clientes desde CSV.

### `GET /api/proveedores`
Lista proveedores.

### `POST /api/proveedores`
Crea proveedor.

### `PUT /api/proveedores/[id]`
Edita proveedor.

### `POST /api/proveedores/[id]/abonar-inicial`
Abona al saldo inicial del proveedor.

### `POST /api/proveedores/importar`
Importa proveedores desde CSV.

### `GET /api/facturas?page=&limit=&desde=&hasta=&buscar=&clienteId=&estado=`
Lista facturas con filtros y paginación.

### `POST /api/facturas`
Crea una factura (venta). Acepta: detalles, pago mixto, crédito, etc.

### `POST /api/facturas/[id]/anular`
Anula factura (requiere autorización de usuario con permisos).

### `GET /api/compras`
Lista compras.

### `POST /api/compras`
Registra una compra. Actualiza stock y costos de productos.

### `POST /api/compras/[id]/anular`
Anula compra (revierte stock).

### `GET /api/lotes?productoId=&vencer=`
Lista lotes. Filtros: `productoId` (lotes de un producto), `vencer=N` (lotes que vencen en N días).

### `POST /api/lotes`
Crea un lote (actualiza stock del producto automáticamente).

### `PUT /api/lotes/[id]`
Actualiza cantidad de un lote (recalcula stock del producto).

### `DELETE /api/lotes/[id]`
Elimina un lote (descuenta su cantidad del stock del producto).

### `GET /api/abonos?facturaId=`
Lista abonos de una factura.

### `POST /api/abonos`
Registra abono a factura (CXC).

### `GET /api/abonos-compra?compraId=`
Lista abonos de una compra.

### `POST /api/abonos-compra`
Registra abono a compra (CXP).

### `GET /api/inventario?productoId=`
Lista movimientos de inventario (kardex).

### `POST /api/inventario`
Crea movimiento de inventario (entrada/salida/ajuste).

### `GET /api/caja`
Devuelve caja actual (si abierta) e historial de cierres.

### `POST /api/caja`
Abre una caja (monto inicial).

### `POST /api/caja/cerrar`
Cierra la caja con arqueo de denominaciones.

### `GET /api/caja/movimientos`
Lista movimientos de la caja actual.

### `POST /api/caja/movimientos`
Crea ingreso/egreso extra en caja.

### `GET /api/proformas`
Lista proformas.

### `POST /api/proformas`
Crea proforma.

### `PUT /api/proformas/[id]`
Actualiza proforma (ej: convertir a factura).

### `GET /api/reportes?desde=&hasta=`
Devuelve resumen general: ventas por período, top productos, ventas por método, ventas por día/mes.

### `GET /api/auth/me`
Devuelve usuario actual desde cookie JWT.

### `POST /api/auth/login`
Inicia sesión, devuelve JWT.

### `POST /api/auth/logout`
Limpia cookie de sesión.

### `POST /api/auth/verify-password`
Verifica contraseña de usuario (usado para autorizar anulaciones).

### `GET /api/usuarios`
Lista usuarios.

### `POST /api/usuarios`
Crea usuario.

### `PUT /api/usuarios?id=`
Edita usuario.

### `GET /api/auditoria?pagina=&limite=&usuario=&accion=&entidad=&desde=&hasta=`
Log de auditoría paginado y filtrable.

### `GET /api/licencia`
Estado de la licencia.

### `POST /api/licencia`
Instala archivo de licencia.

### `GET /api/respaldos`
Descarga backup SQL de la base de datos.

### `POST /api/respaldos/restaurar`
Restaura base de datos desde archivo SQL.

### `GET /api/cart-sessions`
Lista tickets en espera.

### `POST /api/cart-sessions`
Guarda ticket en espera.

### `DELETE /api/cart-sessions?id=`
Elimina ticket en espera.

---

## 6. Componentes Compartidos

| Componente | Archivo | Descripción |
|------------|---------|-------------|
| **Sidebar** | `Sidebar.jsx` | Menú lateral colapsable con módulos según permisos, toggle tema oscuro/claro, botón logout |
| **MobileNav** | `MobileNav.jsx` | Barra de navegación inferior responsiva (oculta en desktop) |
| **AppShell** | `AppShell.jsx` | Layout principal: AuthGuard → Sidebar + contenido + MobileNav |
| **AuthGuard** | `AuthGuard.jsx` | Redirige a login si no hay sesión, verifica permisos de módulo |
| **LicenseGuard** | `LicenseGuard.jsx` | Muestra banner si la licencia no es válida |
| **Toast** | `Toast.jsx` | Notificación auto-descartable (éxito, error, alerta, info) |
| **TecladoNumerico** | `TecladoNumerico.jsx` | Teclado virtual flotante para inputs táctiles (no intercepta Enter del scanner) |
| **FacturaRecibo** | `FacturaRecibo.jsx` | Template de ticket térmico 80mm para facturas (logo, items, totales, código de barras) |
| **AbonoRecibo** | `AbonoRecibo.jsx` | Template de recibo de abono para CXC y CXP |
| **ProformaRecibo** | `ProformaRecibo.jsx` | Template ticket para proformas |
| **ProformaCarta** | `ProformaCarta.jsx` | Template tamaño carta para proformas |
| **ReportePDF** | `ReportePDF.jsx` | Template para exportar reportes a PDF |
| **StockAlerta** | `StockAlerta.jsx` | Botón (modo normal) o tarjeta (modo card) con contador de stock bajo + modal con detalle |
| **ImportarCSV** | `ImportarCSV.jsx` | Modal genérico para importar datos desde CSV |

---

## 7. Configuración y Despliegue

### Variables de Entorno (`.env`)

```
DATABASE_URL=postgresql://spsystem:spsystem123@localhost:5432/spsystem
JWT_SECRET=686bdbca4b9522bbf637ff0ae8bdaa784e24cf965ea55592e8a28f6e596c88f3
APP_LICENSE_SECRET=SpSystem2024!!SecretKey#NoCompartir
```

### Docker Compose

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: spsystem
      POSTGRES_USER: spsystem
      POSTGRES_PASSWORD: spsystem123
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://spsystem:spsystem123@db:5432/spsystem
      JWT_SECRET: ${JWT_SECRET}
      APP_LICENSE_SECRET: ${APP_LICENSE_SECRET}
    depends_on:
      db:
        condition: service_healthy
```

### Comandos

```bash
# Desarrollo
npm run dev                 # Iniciar servidor dev en :3000

# Producción
npm run build               # Build estático
npm run start               # Iniciar servidor producción

# Base de datos
npx prisma migrate dev      # Migraciones (desarrollo)
npx prisma migrate deploy   # Migraciones (producción)
npm run seed                # Seed inicial

# Docker
docker compose up -d        # Iniciar todo
docker compose down         # Detener

# Respaldo
npm run backup              # Backup manual (via lib/backup-cron.mjs)
```

### Impresión Térmica

- **Formato:** ticket 80mm con `@page { size: 80mm auto; margin: 0mm; }`
- **Librería:** `react-to-print` con ref al componente FacturaRecibo
- **Separador:** línea punteada + 30px spacer al final para evitar corte sobre texto

### Print Agent (opcional)

En `print-agent/` hay un agente Node.js independiente que imprime vía ESC/POS directo a puerto USB. No es obligatorio porque la impresión funciona vía `react-to-print` en el navegador.

---

## Notas Técnicas

- **Estilos:** CSS-in-JS (objetos style) + Tailwind 4 (vía `globals.css`)
- **Gráficas:** Recharts (BarChart, ResponsiveContainer)
- **Exportación:** Excel vía `xlsx` (lado cliente), PDF vía `react-to-print`
- **Iconos:** Lucide React
- **Backup automático:** node-cron schedule `0 2 * * 0` (domingos 2 AM)
- **Base de datos:** SQLite en desarrollo (`dev.db`), PostgreSQL en producción
