'use client'
import { useState } from 'react'
import { useAuth } from '@/app/context/AuthContext'

const styles = {
  container: {
    maxWidth: 900, margin: '0 auto', padding: '20px 24px 60px',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: '#1e293b', lineHeight: 1.7
  },
  header: {
    textAlign: 'center', padding: '40px 0 30px',
    borderBottom: '3px solid #2563eb', marginBottom: 30
  },
  h1: { fontSize: 28, fontWeight: 800, color: '#2563eb', margin: '0 0 8px' },
  h2: { fontSize: 22, fontWeight: 700, color: '#1e293b', margin: '40px 0 16px', paddingBottom: 8, borderBottom: '2px solid #e2e8f0' },
  h3: { fontSize: 17, fontWeight: 600, color: '#334155', margin: '24px 0 12px' },
  p: { fontSize: 14, color: '#475569', margin: '0 0 10px' },
  ul: { margin: '8px 0 16px', paddingLeft: 24, fontSize: 14, color: '#475569', lineHeight: 1.8 },
  li: { marginBottom: 4 },
  table: { width: '100%', borderCollapse: 'collapse', margin: '16px 0', fontSize: 13 },
  th: { background: '#f1f5f9', padding: '10px 12px', textAlign: 'left', fontWeight: 600, border: '1px solid #e2e8f0', color: '#475569' },
  td: { padding: '10px 12px', border: '1px solid #e2e8f0', color: '#475569' },
  note: {
    background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 8,
    padding: '12px 16px', margin: '16px 0', fontSize: 13, color: '#92400e'
  },
  shortcut: {
    display: 'inline-block', background: '#f1f5f9', border: '1px solid #cbd5e1',
    borderRadius: 4, padding: '2px 8px', fontFamily: 'monospace', fontSize: 12,
    fontWeight: 600, color: '#334155', margin: '0 2px'
  },
  roleBadge: {
    display: 'inline-block', borderRadius: 4, padding: '2px 10px',
    fontSize: 12, fontWeight: 600, color: '#fff', marginRight: 6
  }
}

const secciones = [
  { id: 'inicio-sesion', titulo: 'Inicio de sesión' },
  { id: 'roles', titulo: 'Roles y permisos' },
  { id: 'dashboard', titulo: 'Inicio (Dashboard)' },
  { id: 'pos', titulo: 'POS — Punto de venta' },
  { id: 'productos', titulo: 'Productos' },
  { id: 'compras', titulo: 'Compras' },
  { id: 'facturas', titulo: 'Facturas' },
  { id: 'cxc', titulo: 'Cuentas por cobrar' },
  { id: 'cxp', titulo: 'Cuentas por pagar' },
  { id: 'caja', titulo: 'Caja' },
  { id: 'proformas', titulo: 'Proformas' },
  { id: 'reportes', titulo: 'Reportes' },
  { id: 'configuracion', titulo: 'Configuración' },
  { id: 'accesos', titulo: 'Accesos directos' },
]

export default function ManualPage() {
  const { user } = useAuth()
  const [visible, setVisible] = useState(null)

  if (!user) return null

  return (
    <div style={styles.container}>
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          @page { margin: 1.5cm; }
        }
        .indice a { color: #2563eb; text-decoration: none; }
        .indice a:hover { text-decoration: underline; }
        section { scroll-margin-top: 20px; }
      `}</style>

      <div className="no-print" style={{ marginBottom: 16 }}>
        <button onClick={() => window.print()}
          style={{
            padding: '10px 24px', borderRadius: 8, border: 'none',
            background: '#2563eb', color: '#fff', fontSize: 14,
            fontWeight: 600, cursor: 'pointer'
          }}>
          📄 Guardar como PDF
        </button>
        <span style={{ marginLeft: 12, fontSize: 13, color: '#64748b' }}>
          Haz clic y luego seleccioná &quot;Guardar como PDF&quot;
        </span>
      </div>

      <div style={styles.header}>
        <h1 style={styles.h1}>Manual de usuario — SPSystem</h1>
        <p style={{ ...styles.p, color: '#64748b', fontSize: 15 }}>
          Sistema de punto de venta, inventario y facturación
        </p>
      </div>

      <div className="indice" style={{ marginBottom: 40 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Índice</h3>
        {secciones.map(s => (
          <div key={s.id} style={{ marginBottom: 4 }}>
            <a href={`#${s.id}`} style={{ fontSize: 14 }}>{s.titulo}</a>
          </div>
        ))}
      </div>

      <section id="inicio-sesion">
        <h2 style={styles.h2}>1. Inicio de sesión</h2>
        <p style={styles.p}>
          Al acceder al sistema por primera vez verás la pantalla de inicio de sesión.
          Ingresá tu nombre de usuario y contraseña proporcionados por el administrador.
        </p>
        <ul style={styles.ul}>
          <li style={styles.li}>El usuario y contraseña distinguen entre mayúsculas y minúsculas.</li>
          <li style={styles.li}>Después de 5 intentos fallidos, el acceso se bloquea por 5 minutos.</li>
          <li style={styles.li}>Si permanecés 30 minutos sin actividad, la sesión expira automáticamente.</li>
          <li style={styles.li}>Los usuarios <strong>cajero</strong> y <strong>supervisor</strong> son redirigidos automáticamente al POS.</li>
        </ul>
        <div style={styles.note}>
          <strong>Credenciales por defecto:</strong> admin / admin123 (rol: administrador).
        </div>
      </section>

      <section id="roles">
        <h2 style={styles.h2}>2. Roles y permisos</h2>
        <p style={styles.p}>El sistema cuenta con 4 roles, cada uno con diferentes niveles de acceso:</p>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Rol</th>
              <th style={styles.th}>Permisos</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ ...styles.td, fontWeight: 600 }}><span style={{ ...styles.roleBadge, background: '#dc2626' }}>Admin</span></td>
              <td style={styles.td}>Acceso completo a todos los módulos, configuración, usuarios, respaldos y licencia.</td>
            </tr>
            <tr>
              <td style={{ ...styles.td, fontWeight: 600 }}><span style={{ ...styles.roleBadge, background: '#ea580c' }}>Supervisor</span></td>
              <td style={styles.td}>Puede crear/editar productos, compras, facturas, anular facturas (con su contraseña), ver reportes. No puede administrar usuarios ni configuración del sistema.</td>
            </tr>
            <tr>
              <td style={{ ...styles.td, fontWeight: 600 }}><span style={{ ...styles.roleBadge, background: '#ca8a04' }}>Encargado</span></td>
              <td style={styles.td}>Similar a supervisor: puede gestionar productos, facturas, caja. No accede a usuarios ni configuración.</td>
            </tr>
            <tr>
              <td style={{ ...styles.td, fontWeight: 600 }}><span style={{ ...styles.roleBadge, background: '#16a34a' }}>Cajero</span></td>
              <td style={styles.td}>Solo puede vender en el POS y consultar stock de productos. No puede crear/editar productos, anular facturas ni ver reportes. Para anular, necesita contraseña de un superior.</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section id="dashboard">
        <h2 style={styles.h2}>3. Inicio (Dashboard)</h2>
        <p style={styles.p}>
          La pantalla de inicio muestra un resumen del negocio con tarjetas informativas:
        </p>
        <ul style={styles.ul}>
          <li style={styles.li}><strong>Ventas hoy</strong> — total facturado del día.</li>
          <li style={styles.li}><strong>Facturas hoy</strong> — cantidad de facturas emitidas.</li>
          <li style={styles.li}><strong>Stock bajo</strong> — productos con existencia menor a 5 unidades.</li>
          <li style={styles.li}><strong>Clientes</strong> — total de clientes registrados.</li>
        </ul>
        <p style={styles.p}>
          Desde aquí podés acceder rápidamente al POS, Facturas o Caja usando las tarjetas de acceso directo.
          Los usuarios no-admin (cajero, supervisor, encargado) son redirigidos automáticamente al POS.
        </p>
      </section>

      <section id="pos">
        <h2 style={styles.h2}>4. POS — Punto de Venta</h2>
        <p style={styles.p}>
          El POS es el módulo principal para registrar ventas. Antes de vender, la caja debe estar abierta
          (ver sección Caja).
        </p>

        <h3 style={styles.h3}>4.1 Agregar productos</h3>
        <ul style={styles.ul}>
          <li style={styles.li}>Escribí el nombre o código del producto en el campo de búsqueda.</li>
          <li style={styles.li}>Seleccioná el producto de la lista desplegable.</li>
          <li style={styles.li}>Si el producto tiene <strong>unidadVenta2</strong> (ej. quintal → libras), podés cambiar entre presentaciones con el botón <strong>⟳</strong>.</li>
          <li style={styles.li}>Ingresá la cantidad (permité decimales para productos por peso: 0.5, 1.5).</li>
        </ul>

        <h3 style={styles.h3}>4.2 Código de barras</h3>
        <p style={styles.p}>
          Conectá un escáner de código de barras USB. Al escanear un producto, el sistema lo agrega automáticamente
          al carrito. El escáner funciona como si escribiera rápidamente y presionara Enter.
        </p>

        <h3 style={styles.h3}>4.3 Cliente rápido</h3>
        <p style={styles.p}>
          Si el cliente no está registrado, escribí su nombre en el campo de cliente y hacé clic en
          <strong> &quot;+ Crear cliente rápido&quot;</strong>. Se abrirá un formulario para ingresar
          nombre, teléfono y dirección. El cliente se guarda y se selecciona automáticamente.
        </p>

        <h3 style={styles.h3}>4.4 Descuentos</h3>
        <p style={styles.p}>
          Hacé clic en <strong>Descuento</strong> en la pantalla de cobro. Podés alternar entre:
        </p>
        <ul style={styles.ul}>
          <li style={styles.li}><strong>Monto fijo (C$)</strong> — descontás una cantidad específica.</li>
          <li style={styles.li}><strong>Porcentaje (%)</strong> — descontás un porcentaje del subtotal.</li>
        </ul>
        <p style={styles.p}>Usá el botón <strong>C$ / %</strong> para cambiar entre los dos modos.</p>

        <h3 style={styles.h3}>4.5 Pagos mixtos</h3>
        <p style={styles.p}>
          Podés dividir el pago en varios métodos en una misma venta:
        </p>
        <ul style={styles.ul}>
          <li style={styles.li}>Hacé clic en cada método de pago deseado (Efectivo C$, Efectivo $, Tarjeta, Transferencia, Crédito).</li>
          <li style={styles.li}>Al seleccionar múltiples métodos, el sistema muestra un campo para ingresar el monto de cada uno.</li>
          <li style={styles.li}><strong>Crédito</strong>: si seleccionás crédito junto con otro método, el crédito cubre el saldo restante después de descontar los otros pagos.</li>
          <li style={styles.li}>Si seleccionás solo crédito, se deseleccionan los demás métodos y se oculta el campo &quot;pago con&quot;.</li>
        </ul>

        <h3 style={styles.h3}>4.6 Límite de crédito</h3>
        <ul style={styles.ul}>
          <li style={styles.li}>Cada cliente tiene un <strong>límite de crédito</strong> configurable desde la ficha del cliente.</li>
          <li style={styles.li}>Al vender a crédito, el sistema verifica que el saldo pendiente del cliente más el nuevo crédito no supere su límite.</li>
          <li style={styles.li}>Si se excede el límite, la venta no se completa y se muestra un mensaje de advertencia.</li>
        </ul>

        <h3 style={styles.h3}>4.7 Finalizar venta</h3>
        <p style={styles.p}>
          Una vez seleccionados los productos, hacé clic en <strong>Cobrar</strong>.
          El sistema genera la factura, descuenta del stock, actualiza la caja y muestra el comprobante
          en formato de ticket térmico de 80mm. Desde allí podés:
        </p>
        <ul style={styles.ul}>
          <li style={styles.li}><strong>🖨 Imprimir</strong> — envía el ticket a la impresora térmica.</li>
          <li style={styles.li}><strong>📱 Compartir</strong> — abre WhatsApp con el resumen de la venta.</li>
          <li style={styles.li}><strong>Nueva venta</strong> — limpia el carrito para empezar otra.</li>
        </ul>
      </section>

      <section id="productos">
        <h2 style={styles.h2}>5. Productos</h2>
        <p style={styles.p}>
          El módulo de productos permite gestionar el catálogo completo.
        </p>

        <h3 style={styles.h3}>5.1 Listado y búsqueda</h3>
        <ul style={styles.ul}>
          <li style={styles.li}>Se muestra una tabla paginada con todos los productos.</li>
          <li style={styles.li}>Podés buscar por nombre o código de barras.</li>
          <li style={styles.li}>Cada producto muestra: código, nombre, categoría, existencias, precio de venta, y estado (activo/inactivo).</li>
        </ul>

        <h3 style={styles.h3}>5.2 Crear y editar</h3>
        <ul style={styles.ul}>
          <li style={styles.li}><strong>Campos principales:</strong> código, nombre, categoría, existencias actuales, precio de costo y venta, unidad de medida.</li>
          <li style={styles.li}><strong>Segunda presentación:</strong> podés configurar una unidad alterna (ej. quintal además de libra) con su propio precio de venta, costo y factor de conversión.</li>
          <li style={styles.li}>Marcar como <strong>inactivo</strong> oculta el producto del POS sin eliminarlo.</li>
        </ul>

        <h3 style={styles.h3}>5.3 Importar desde Excel</h3>
        <ul style={styles.li}>
          <li style={styles.li}>Descargá la plantilla desde el botón <strong>Descargar plantilla</strong>.</li>
          <li style={styles.li}>Completá los datos requeridos: Código, Nombre, Categoría, Existencia, PrecioCosto, PrecioVenta, Unidad, UnidadVenta2, PrecioVenta2, CostoVenta2, FactorVenta2.</li>
          <li style={styles.li}>Guardá el archivo y subilo con <strong>Importar Excel</strong>.</li>
        </ul>

        <h3 style={styles.h3}>5.4 Eliminar producto</h3>
        <p style={styles.p}>
          Solo se puede eliminar un producto si no tiene movimientos (compras o proformas asociadas).
          Si tiene movimientos, deberás marcarlo como inactivo en lugar de eliminarlo.
        </p>
      </section>

      <section id="compras">
        <h2 style={styles.h2}>6. Compras</h2>
        <p style={styles.p}>
          Permite registrar las compras realizadas a proveedores.
        </p>
        <ul style={styles.ul}>
          <li style={styles.li}><strong>Nueva compra:</strong> seleccioná el proveedor, fecha, número de factura del proveedor, y los productos comprados.</li>
          <li style={styles.li}>Si la unidad de compra coincide con la <strong>unidadVenta2</strong> del producto, el sistema actualiza automáticamente el <strong>costoVenta2</strong>.</li>
          <li style={styles.li}>Si la unidad de compra es diferente a la base, el sistema calcula el costo por unidad base dividiendo por el factor de conversión.</li>
          <li style={styles.li}>Podés registrar la <strong>fecha de vencimiento</strong> de la factura de compra (para control de cuentas por pagar).</li>
          <li style={styles.li}>La lista de compras está paginada para mejor navegación.</li>
        </ul>
      </section>

      <section id="facturas">
        <h2 style={styles.h2}>7. Facturas</h2>
        <p style={styles.p}>
          Listado de todas las facturas emitidas desde el POS.
        </p>
        <ul style={styles.ul}>
          <li style={styles.li}>Vista paginada con búsqueda por número de factura o nombre de cliente.</li>
          <li style={styles.li}>Cada factura muestra: número, cliente, fecha, total, método de pago, estado (vigente/anulada).</li>
          <li style={styles.li}>Podés imprimir o compartir por WhatsApp cualquier factura desde la lista.</li>
          <li style={styles.li}>Las facturas a crédito tienen un icono 💳 y muestran el saldo pendiente.</li>
        </ul>

        <h3 style={styles.h3}>7.1 Anular factura</h3>
        <ul style={styles.ul}>
          <li style={styles.li}>Hacé clic en <strong>Anular</strong> en la factura deseada.</li>
          <li style={styles.li}>El sistema solicita <strong>autorización por contraseña</strong>:</li>
          <ul style={{ paddingLeft: 20, marginTop: 4 }}>
            <li style={styles.li}>Admin/Supervisor/Encargado: ingresan su propia contraseña.</li>
            <li style={styles.li}>Cajero: debe ingresar la contraseña de un Supervisor, Encargado o Admin.</li>
          </ul>
          <li style={styles.li}>Al anular, el sistema restaura automáticamente el stock de todos los productos y registra el movimiento en el inventario.</li>
          <li style={styles.li}>La anulación es atómica: si falla algún paso, se revierte todo (no hay anulaciones a medias).</li>
        </ul>
      </section>

      <section id="cxc">
        <h2 style={styles.h2}>8. Cuentas por Cobrar (CxC)</h2>
        <p style={styles.p}>
          Gestiona las facturas pendientes de cobro a clientes.
        </p>
        <ul style={styles.ul}>
          <li style={styles.li}>Muestra las facturas con saldo pendiente mayor a cero.</li>
          <li style={styles.li}>Cada fila muestra: factura, cliente, fecha, total, <strong>abonado</strong>, saldo pendiente, vencimiento.</li>
          <li style={styles.li}><strong>Registrar abono:</strong> hacé clic en el botón verde 💰 de la factura. Ingresá el monto y una nota opcional.</li>
          <li style={styles.li}>Al registrar un abono, se imprime automáticamente un <strong>comprobante de abono</strong> (formato ticket térmico).</li>
          <li style={styles.li}>En el detalle de la factura podés ver el historial completo de abonos con fechas.</li>
        </ul>
      </section>

      <section id="cxp">
        <h2 style={styles.h2}>9. Cuentas por Pagar (CxP)</h2>
        <p style={styles.p}>
          Gestiona las deudas pendientes con proveedores (compras a crédito).
        </p>
        <ul style={styles.ul}>
          <li style={styles.li}>Muestra las compras con saldo pendiente, con filtro de pendientes/pagadas.</li>
          <li style={styles.li}>Columnas: factura, proveedor, fecha, vencimiento, total, <strong>abonado</strong>, pendiente.</li>
          <li style={styles.li}><strong>Abonar:</strong> similar a CxC, registrás el pago y se imprime comprobante.</li>
          <li style={styles.li}>El historial de abonos por compra está disponible en el detalle.</li>
        </ul>
      </section>

      <section id="caja">
        <h2 style={styles.h2}>10. Caja</h2>
        <p style={styles.p}>
          Control del dinero en caja registradora.
        </p>

        <h3 style={styles.h3}>10.1 Apertura de caja</h3>
        <ul style={styles.ul}>
          <li style={styles.li}>Antes de vender, un supervisor o admin debe <strong>abrir la caja</strong> desde el módulo Caja.</li>
          <li style={styles.li}>Se registra el monto inicial en efectivo C$ y USD, y quién abre la caja.</li>
        </ul>

        <h3 style={styles.h3}>10.2 Movimientos</h3>
        <ul style={styles.ul}>
          <li style={styles.li}><strong>Entrada:</strong> registrá dinero que ingresa a caja (ej. retiro de abono, préstamo).</li>
          <li style={styles.li}><strong>Salida:</strong> registrá dinero que sale (ej. pago a proveedor, gasto menor).</li>
          <li style={styles.li}>Estos movimientos son independientes de las ventas y se registran por separado.</li>
        </ul>

        <h3 style={styles.h3}>10.3 Arqueo y cierre</h3>
        <ul style={styles.ul}>
          <li style={styles.li}>Al final del día, el supervisor debe hacer el <strong>arqueo</strong>.</li>
          <li style={styles.li}>Se muestra un desglose por método de pago: Efectivo C$, Efectivo USD, Abonos de clientes, Tarjeta, Transferencia.</li>
          <li style={styles.li}>El sistema calcula el &quot;Esperado&quot; (lo que debería haber según ventas + abonos) y la diferencia con el &quot;Ingresado&quot; real.</li>
          <li style={styles.li}>El arqueo incluye un desglose de billetes y monedas en C$ y USD.</li>
          <li style={styles.li}>Al cerrar la caja, no se pueden registrar más ventas hasta que se abra nuevamente.</li>
        </ul>
      </section>

      <section id="proformas">
        <h2 style={styles.h2}>11. Proformas</h2>
        <p style={styles.p}>
          Las proformas son cotizaciones o presupuestos que se entregan al cliente antes de la venta final.
        </p>
        <ul style={styles.ul}>
          <li style={styles.li}>Funciona similar al POS: agregás productos, definís cantidades y se genera el PDF de la proforma.</li>
          <li style={styles.li}>Las proformas incluyen cálculo de IVA si está activo en Configuración.</li>
          <li style={styles.li}>Se pueden imprimir y compartir por WhatsApp.</li>
          <li style={styles.li}>El listado está paginado y se puede buscar.</li>
          <li style={styles.li}>Una proforma no afecta stock ni caja — solo es un documento informativo.</li>
        </ul>
      </section>

      <section id="reportes">
        <h2 style={styles.h2}>12. Reportes</h2>
        <p style={styles.p}>
          Reportes de ventas para análisis del negocio.
        </p>
        <ul style={styles.ul}>
          <li style={styles.li}>Seleccioná un rango de fechas (por defecto: últimos 30 días).</li>
          <li style={styles.li}>El reporte muestra: facturas emitidas, totales, métodos de pago usados, productos más vendidos.</li>
          <li style={styles.li}>Cada factura en el reporte indica su estado (Vigente / Anulada).</li>
          <li style={styles.li}>Se puede descargar o imprimir el reporte.</li>
        </ul>
      </section>

      <section id="configuracion">
        <h2 style={styles.h2}>13. Configuración</h2>
        <p style={styles.p}>
          Accesible solo para administradores.
        </p>

        <h3 style={styles.h3}>13.1 General</h3>
        <ul style={styles.ul}>
          <li style={styles.li}><strong>Nombre del negocio</strong> — aparece en tickets, reportes y dashboard.</li>
          <li style={styles.li}><strong>Teléfono, dirección, slogan</strong> — datos de contacto en los comprobantes.</li>
          <li style={styles.li}><strong>Logo</strong> — imagen que aparece en tickets y dashboard.</li>
        </ul>

        <h3 style={styles.h3}>13.2 IVA</h3>
        <ul style={styles.ul}>
          <li style={styles.li}>Podés activar o desactivar el IVA desde el interruptor en Configuración.</li>
          <li style={styles.li}>Cuando está desactivado, el POS, las proformas y los tickets no muestran ni calculan IVA.</li>
          <li style={styles.li}>Cuando está activado, se aplica el porcentaje configurado (ej. 15%).</li>
        </ul>

        <h3 style={styles.h3}>13.3 DGI — e-Factura Nicaragua</h3>
        <ul style={styles.ul}>
          <li style={styles.li}>Campos disponibles: NRC, CAI, rango de facturación autorizado.</li>
          <li style={styles.li}>El sistema cuenta con un generador de XML para e-factura, pero la integración con los servicios web de DGI requiere credenciales oficiales.</li>
        </ul>

        <h3 style={styles.h3}>13.4 Usuarios</h3>
        <ul style={styles.ul}>
          <li style={styles.li}>Crear, editar y desactivar usuarios del sistema.</li>
          <li style={styles.li}>Asignar rol: admin, supervisor, encargado, cajero.</li>
          <li style={styles.li}>Asignar módulos permitidos (qué secciones verá cada usuario no-admin).</li>
          <li style={styles.li}>El nombre de usuario se recorta automáticamente (sin espacios al inicio/final).</li>
        </ul>

        <h3 style={styles.h3}>13.5 Licencia</h3>
        <ul style={styles.ul}>
          <li style={styles.li}>El sistema requiere una licencia para funcionar.</li>
          <li style={styles.li}>La licencia está vinculada al hardware del servidor (machine-id).</li>
          <li style={styles.li}>El administrador puede generar archivos de licencia (.lic) mediante un script en Node.js.</li>
          <li style={styles.li}>Si la licencia vence o es inválida, el sistema muestra una pantalla de advertencia.</li>
        </ul>

        <h3 style={styles.h3}>13.6 Respaldos</h3>
        <ul style={styles.ul}>
          <li style={styles.li}><strong>Descargar respaldo:</strong> genera un archivo .sql con toda la base de datos.</li>
          <li style={styles.li}><strong>Restaurar respaldo:</strong> permite subir un archivo .sql previo para recuperar el sistema.</li>
          <li style={styles.li}><strong>Respaldos automáticos:</strong> el sistema genera un respaldo automático cada domingo a las 2:00 AM, guardando solo los últimos 4 respaldos.</li>
          <li style={styles.li}>Los respaldos se almacenan en <strong>C:\respaldos-spsystem</strong> (configurable).</li>
          <li style={styles.li}>Configurá Google Drive para sincronizar esa carpeta y tener backup en la nube.</li>
        </ul>
      </section>

      <section id="accesos">
        <h2 style={styles.h2}>14. Accesos directos — Atajos de teclado</h2>
        <p style={styles.p}>Dentro del POS, los siguientes atajos están disponibles:</p>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Tecla</th>
              <th style={styles.th}>Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr><td style={styles.td}><span style={styles.shortcut}>F1</span></td><td style={styles.td}>Buscar producto</td></tr>
            <tr><td style={styles.td}><span style={styles.shortcut}>F2</span></td><td style={styles.td}>Ingresar monto (pago con)</td></tr>
            <tr><td style={styles.td}><span style={styles.shortcut}>F3</span></td><td style={styles.td}>Cobrar / finalizar venta</td></tr>
            <tr><td style={styles.td}><span style={styles.shortcut}>F4</span></td><td style={styles.td}>Descuento</td></tr>
            <tr><td style={styles.td}><span style={styles.shortcut}>F5</span></td><td style={styles.td}>Buscar cliente</td></tr>
            <tr><td style={styles.td}><span style={styles.shortcut}>F6</span></td><td style={styles.td}>Factura a crédito</td></tr>
            <tr><td style={styles.td}><span style={styles.shortcut}>F7</span></td><td style={styles.td}>Estacionar venta (park)</td></tr>
            <tr><td style={styles.td}><span style={styles.shortcut}>F8</span></td><td style={styles.td}>Retirar venta estacionada</td></tr>
          </tbody>
        </table>
      </section>

      <div className="no-print" style={{ textAlign: 'center', marginTop: 40, paddingTop: 20, borderTop: '1px solid #e2e8f0', fontSize: 12, color: '#94a3b8' }}>
        SPSystem — Manual de usuario — Última actualización: {new Date().toLocaleDateString('es-NI')}
      </div>
    </div>
  )
}
