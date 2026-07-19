'use client'
import { useState } from 'react'
import { useAuth } from '@/app/context/AuthContext'
import * as Icons from 'lucide-react'

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
  { id: 'gastos', titulo: 'Gastos' },
  { id: 'proformas', titulo: 'Proformas' },
  { id: 'reportes', titulo: 'Reportes' },
  { id: 'configuracion', titulo: 'Configuración' },
  { id: 'accesos', titulo: 'Accesos directos' },
  { id: 'teclado-virtual', titulo: 'Teclado virtual' },
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
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icons.FileText size={16} /> Guardar como PDF</span>
        </button>
        <span style={{ marginLeft: 12, fontSize: 13, color: '#64748b' }}>
          Haz clic y luego seleccioná &quot;Guardar como PDF&quot;
        </span>
      </div>

      <div style={styles.header}>
        <h1 style={{ ...styles.h1, display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}><Icons.BookOpen size={24} /> Manual de usuario — SPSystem</h1>
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
          <li style={styles.li}>Si el producto tiene <strong>presentaciones alternas</strong> (venta2, venta3, venta4), podés cambiar entre ellas con el botón <strong>⟳</strong>. Cada presentación tiene su propia unidad, precio y factor de conversión.</li>
          <li style={styles.li}>Ingresá la cantidad (permité decimales para productos por peso: 0.5, 1.5).</li>
          <li style={styles.li}>Los <strong>productos genéricos</strong> (precio variable) muestran &ldquo;Precio variable&rdquo; en vez del precio fijo. Al tocarlos se abre un modal para ingresar precio unitario y cantidad manualmente.</li>
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
          <li style={styles.li}><strong><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icons.Printer size={16} /> Imprimir</span></strong> — envía el ticket a la impresora térmica.</li>
          <li style={styles.li}><strong><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icons.Smartphone size={16} /> Compartir</span></strong> — abre WhatsApp con el resumen de la venta.</li>
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
          <li style={styles.li}><strong>4 presentaciones de precio:</strong> además de la unidad base, podés configurar hasta 3 presentaciones alternas (venta2, venta3, venta4), cada una con su unidad, precio, costo y factor de conversión.</li>
          <li style={styles.li}>Marcar como <strong>inactivo</strong> oculta el producto del POS sin eliminarlo.</li>
          <li style={styles.li}><strong>Producto genérico:</strong> podés marcar un producto como genérico (precio variable). Al venderlo en el POS, el cajero ingresa el precio y cantidad manualmente. No afecta inventario ni stock. Ideal para verduras sueltas, artículos sin código de barras, o productos de precio cambiante.</li>
        </ul>

        <h3 style={styles.h3}>5.3 Importar desde Excel</h3>
        <ul style={styles.li}>
          <li style={styles.li}>Descargá la plantilla desde el botón <strong>Descargar plantilla</strong>.</li>
          <li style={styles.li}>Columnas disponibles: <strong>Nombre</strong>, Codigo, Precio, Costo, Stock, StockMinimo, Unidad, Categoria, UnidadVenta2/3/4, PrecioVenta2/3/4, CostoVenta2/3/4, FactorVenta2/3/4, EsGenerico, PrecioMayor, CantidadMinimaMayor, FechaVencimiento.</li>
          <li style={styles.li}>Guardá el archivo y subilo con <strong>Importar Excel</strong>.</li>
        </ul>

        <h3 style={styles.h3}>5.4 Eliminar producto</h3>
        <p style={styles.p}>
          Solo se puede eliminar un producto si no tiene movimientos (compras o proformas asociadas).
          Si tiene movimientos, deberás marcarlo como inactivo en lugar de eliminarlo.
        </p>

        <h3 style={styles.h3}>5.5 Control de Vencimientos</h3>
        <ul style={styles.ul}>
          <li style={styles.li}><strong>Cada producto</strong> puede tener una <strong>fecha de vencimiento</strong> asignada directamente.</li>
          <li style={styles.li}>Al <strong>crear o editar</strong> un producto, hay un campo <em>Fecha de vencimiento</em> en el formulario.</li>
          <li style={styles.li}>Al <strong>comprar</strong> productos, se puede asignar la fecha de vencimiento por cada detalle.</li>
          <li style={styles.li}>En el <strong>Dashboard</strong> se muestra una alerta de productos próximos a vencer.</li>
          <li style={styles.li}>En <strong>Inventario</strong> hay un panel de alertas con filtros de 15, 30, 60 y 90 días.</li>
        </ul>
      </section>

      <section id="compras">
        <h2 style={styles.h2}>6. Compras</h2>
        <p style={styles.p}>
          Permite registrar las compras realizadas a proveedores.
        </p>
        <ul style={styles.ul}>
          <li style={styles.li}><strong>Nueva compra:</strong> seleccioná el proveedor, fecha, número de factura del proveedor, y los productos comprados.</li>
          <li style={styles.li}>Si la unidad de compra coincide con alguna presentación del producto (venta2, venta3, venta4), el sistema actualiza automáticamente el costo de esa presentación.</li>
          <li style={styles.li}>Si la unidad de compra es diferente a la base, el sistema calcula el costo por unidad base dividiendo por el factor de conversión.</li>
          <li style={styles.li}>Podés registrar la <strong>fecha de vencimiento</strong> de la factura de compra (para control de cuentas por pagar).</li>
          <li style={styles.li}>Por cada producto podés ingresar <strong>fecha de vencimiento</strong>; al guardar la compra se actualiza el vencimiento del producto y se incrementa el stock automáticamente.</li>
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
          <li style={styles.li}>Las facturas a crédito tienen un icono <Icons.CreditCard size={14} /> y muestran el saldo pendiente.</li>
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
          <li style={styles.li}><strong>Registrar abono:</strong> hacé clic en el botón verde <Icons.DollarSign size={14} /> de la factura. Ingresá el monto y una nota opcional.</li>
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
          <li style={styles.li}>Los gastos registrados desde el módulo <strong>Gastos</strong> con método de pago <strong>Efectivo</strong> aparecen automáticamente como salidas en la caja abierta, identificados con el badge <span style={{background:'#fef3c7',padding:'1px 6px',borderRadius:4,fontSize:11,fontWeight:600,color:'#92400e'}}>Gasto</span>.</li>
        </ul>

        <h3 style={styles.h3}>10.3 Arqueo y cierre</h3>
        <ul style={styles.ul}>
          <li style={styles.li}>Al final del día, el supervisor debe hacer el <strong>arqueo</strong>.</li>
          <li style={styles.li}>Se muestra un desglose por método de pago: Efectivo C$, Efectivo USD, Abonos de clientes, Tarjeta, Transferencia.</li>
          <li style={styles.li}>El sistema calcula el &quot;Esperado&quot; = Inicial + Efectivo ventas + Abonos + Ingresos extra − <strong>Egresos (incluye gastos)</strong>.</li>
          <li style={styles.li}>Los gastos registrados como <strong>Efectivo</strong> en el módulo Gastos se descuentan automáticamente del esperado.</li>
          <li style={styles.li}>Los gastos pagados por transferencia, tarjeta u otro método <strong>no afectan</strong> el arqueo.</li>
          <li style={styles.li}>El arqueo incluye un desglose de billetes y monedas en C$ y USD.</li>
          <li style={styles.li}>Al cerrar la caja, no se pueden registrar más ventas hasta que se abra nuevamente.</li>
        </ul>
      </section>

      <section id="gastos">
        <h2 style={styles.h2}>11. Gastos</h2>
        <p style={styles.p}>
          El módulo de Gastos permite registrar y controlar los egresos operativos del negocio
          (servicios, alquiler, salarios, etc.) de forma independiente a las ventas.
        </p>

        <h3 style={styles.h3}>11.1 Registrar un gasto</h3>
        <ul style={styles.ul}>
          <li style={styles.li}>Seleccioná el <strong>mes</strong> en el filtro superior para ver gastos de ese período.</li>
          <li style={styles.li}>Hacé clic en <strong>Nuevo gasto</strong> y completá: concepto, categoría, método de pago, monto, fecha y nota opcional.</li>
          <li style={styles.li}><strong>Método de pago:</strong> define si el gasto descuenta o no de la caja:</li>
          <ul style={{ paddingLeft: 20, marginTop: 4 }}>
            <li style={styles.li}><strong>Efectivo</strong> — el gasto sale de la caja física del día. Se descuenta automáticamente del efectivo esperado en el arqueo. Aparece como egreso en Movimientos de Caja con el badge <span style={{background:'#fef3c7',padding:'1px 6px',borderRadius:4,fontSize:11,fontWeight:600,color:'#92400e'}}>Gasto</span>.</li>
            <li style={styles.li}><strong>Transferencia / Tarjeta / Otro</strong> — el gasto se registra para contabilidad y el reporte de ganancias/pérdidas, pero <strong>no afecta</strong> la caja ni el arqueo. Ideal para gastos pagados desde una cuenta bancaria o tarjeta personal del dueño.</li>
          </ul>
          <li style={styles.li}>Si hay una caja abierta y seleccionás <strong>Efectivo</strong>, verás un aviso amarillo: &ldquo;Se descontará de la caja abierta automáticamente&rdquo;.</li>
        </ul>

        <h3 style={styles.h3}>11.2 Categorías de gasto</h3>
        <p style={styles.p}>
          Los gastos se clasifican en 9 categorías predefinidas:
          Operativos, Salarios, Servicios, Alquiler, Impuestos, Mantenimiento, Publicidad, Transporte y Otros.
          Cada categoría se muestra con un badge en la tabla para fácil identificación.
        </p>

        <h3 style={styles.h3}>11.3 Gastos y reporte de ganancias</h3>
        <p style={styles.p}>
          Todos los gastos registrados (sin importar el método de pago) se incluyen en el
          <strong> reporte de Ganancias y Pérdidas</strong> (ver sección 13.11), permitiendo calcular
          la ganancia neta real del negocio: <code>Ventas − Costo de mercancía − Gastos</code>.
        </p>

        <h3 style={styles.h3}>11.4 Eliminar un gasto</h3>
        <ul style={styles.ul}>
          <li style={styles.li}>Hacé clic en el icono <Icons.Trash2 size={14} /> de la fila correspondiente.</li>
          <li style={styles.li}>Si el gasto fue registrado como <strong>Efectivo</strong>, también se revierte el egreso de caja automáticamente.</li>
          <li style={styles.li}>Los gastos de transferencia/tarjeta/otro solo se eliminan del registro contable.</li>
        </ul>
      </section>

      <section id="proformas">
        <h2 style={styles.h2}>12. Proformas</h2>
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
        <h2 style={styles.h2}>13. Reportes</h2>
        <p style={styles.p}>
          El módulo de reportes ofrece <strong>18 tipos de consultas</strong> para analizar el negocio.
          Seleccioná un módulo en el desplegable, ajustá el rango de fechas si aplica y hacé clic en Buscar.
          Todos los reportes se pueden exportar a Excel o imprimir/guardar como PDF.
        </p>

        <h3 style={styles.h3}>13.1 Resumen general</h3>
        <p style={styles.p}>
          Panel principal con indicadores globales del negocio en el período seleccionado:
          ventas totales, ticket promedio, ganancia, margen, stock bajo, cuentas por cobrar (CxC) y por pagar (CxP).
          Incluye gráfica de ventas por día/mes, top 5 productos más vendidos, métodos de pago,
          e inventario valorizado (stock × costo de cada producto).
        </p>

        <h3 style={styles.h3}>13.2 Facturas / Ventas / Ganancias / Compras</h3>
        <p style={styles.p}>
          Listados detallados con todas las transacciones del período. Incluyen totales al final de la tabla.
          <strong>Ganancias</strong> calcula utilidad por producto (precio − costo) × cantidad.
        </p>

        <h3 style={styles.h3}>13.3 Productos / Clientes / Proveedores / Inventario / Proformas</h3>
        <p style={styles.p}>
          Listados maestros de cada módulo. <strong>Inventario</strong> muestra existencias actuales con
          valor total por producto (stock × costo).
        </p>

        <h3 style={styles.h3}>13.4 Rentabilidad por producto</h3>
        <p style={styles.p}>
          Analiza la rentabilidad de cada producto y categoría. Muestra ventas, costo total, ganancia
          y margen porcentual. Incluye un toggle para ver los datos agrupados por categoría.
          El margen se colorea: <strong style={{color:'#16a34a'}}>verde</strong> (&gt;30%),
          <strong style={{color:'#ca8a04'}}> amarillo</strong> (&gt;10%),
          <strong style={{color:'#dc2626'}}> rojo</strong> (≤10%).
        </p>

        <h3 style={styles.h3}>13.5 Clientes morosos</h3>
        <p style={styles.p}>
          Lista los clientes con saldo pendiente, ordenados por días de deuda (mayor a menor).
          Agrupa la cartera vencida en rangos: 0–30, 31–60, 61–90 y más de 90 días.
          Muestra teléfono, factura, total, saldo pendiente y si la factura está vencida.
        </p>

        <h3 style={styles.h3}>13.6 Rotación de inventario</h3>
        <p style={styles.p}>
          Calcula la rotación anualizada de cada producto: <code>vendido / stock × (12 / meses del período)</code>.
          Clasifica productos en:
        </p>
        <ul style={styles.ul}>
          <li style={styles.li}><strong>Sin movimiento</strong> — no se vendió ninguna unidad. Capital estancado.</li>
          <li style={styles.li}><strong>Rotación lenta</strong> — rotación &lt;1 (menos de una vez al año).</li>
          <li style={styles.li}><strong>Rotación normal</strong> — rotación ≥1.</li>
        </ul>
        <p style={styles.p}>
          Incluye el valor total del inventario sin movimiento para identificar capital inmovilizado.
          Se puede filtrar por categoría de rotación.
        </p>

        <h3 style={styles.h3}>13.7 Comparativo de períodos</h3>
        <p style={styles.p}>
          Compara dos períodos de fechas (actual vs anterior). Muestra ventas, costos, ganancia,
          margen, número de facturas y compras de cada período, junto con la diferencia absoluta
          y porcentual entre ambos.
        </p>

        <h3 style={styles.h3}>13.8 Flujo de caja proyectado</h3>
        <p style={styles.p}>
          Proyecta el flujo de caja a N días (7, 15, 30 o 60) basado en las cuentas por cobrar
          y por pagar con fecha de vencimiento dentro del período. Muestra:
        </p>
        <ul style={styles.ul}>
          <li style={styles.li}><strong>Por cobrar</strong> — facturas a crédito cuyo vencimiento cae en los próximos N días.</li>
          <li style={styles.li}><strong>Por pagar</strong> — compras a crédito cuyo vencimiento cae en los próximos N días.</li>
          <li style={styles.li}><strong>Saldo neto</strong> — total por cobrar − total por pagar.</li>
        </ul>

        <h3 style={styles.h3}>13.9 Mermas y ajustes</h3>
        <p style={styles.p}>
          Lista los movimientos de inventario por merma, vencimiento, robo, pérdida, daño o ajuste.
          Agrupa por producto para identificar cuáles generan más pérdida.
          También incluye salidas manuales sin motivo ni asociación a venta.
        </p>

        <h3 style={styles.h3}>13.10 Reporte fiscal</h3>
        <p style={styles.p}>
          Resumen tributario con desglose mensual de: ventas totales, IVA generado, descuentos,
          facturas exentas, y el detalle de contado vs crédito por mes.
          Incluye totales globales del período: número de facturas, clientes atendidos,
          total IVA y descuentos.
        </p>

        <h3 style={styles.h3}>13.11 Ganancias y Pérdidas (P&amp;L)</h3>
        <p style={styles.p}>
          Reporte que muestra la rentabilidad real del negocio combinando ventas, costos y gastos.
          Agrupa los datos en tres vistas seleccionables:
        </p>
        <ul style={styles.ul}>
          <li style={styles.li}><strong>Por día</strong> — cada fila es un día del período.</li>
          <li style={styles.li}><strong>Por quincena</strong> — agrupa en dos bloques mensuales (días 1–15 y 16–fin).</li>
          <li style={styles.li}><strong>Por mes</strong> — cada fila es un mes completo.</li>
        </ul>
        <p style={styles.p}>
          Cada fila muestra: ventas, costo de mercancía, ganancia bruta con margen, gastos operativos del período,
          ganancia neta y margen neto. Las tarjetas de resumen muestran los totales generales con colores
          indicadores (verde = ganancia positiva, rojo = pérdida).
          Los gastos se toman del módulo <strong>Gastos</strong> sin importar su método de pago.
        </p>

        <h3 style={styles.h3}>13.12 Exportar e imprimir</h3>
        <ul style={styles.ul}>
          <li style={styles.li}><strong>PDF</strong> — generá un archivo PDF del reporte actual listo para imprimir.</li>
          <li style={styles.li}><strong>Excel</strong> — descargá los datos en formato .xlsx. Para el resumen general, genera varias pestañas (Resumen, Ventas por día, Top productos, Métodos de pago, Inventario).</li>
        </ul>
      </section>

      <section id="configuracion">
        <h2 style={styles.h2}>14. Configuración</h2>
        <p style={styles.p}>
          Accesible solo para administradores.
        </p>

        <h3 style={styles.h3}>14.1 General</h3>
        <ul style={styles.ul}>
          <li style={styles.li}><strong>Nombre del negocio</strong> — aparece en tickets, reportes y dashboard.</li>
          <li style={styles.li}><strong>Teléfono, dirección, slogan</strong> — datos de contacto en los comprobantes.</li>
          <li style={styles.li}><strong>Logo</strong> — imagen que aparece en tickets y dashboard.</li>
        </ul>

        <h3 style={styles.h3}>14.2 IVA</h3>
        <ul style={styles.ul}>
          <li style={styles.li}>Podés activar o desactivar el IVA desde el interruptor en Configuración.</li>
          <li style={styles.li}>Cuando está desactivado, el POS, las proformas y los tickets no muestran ni calculan IVA.</li>
          <li style={styles.li}>Cuando está activado, se aplica el porcentaje configurado (ej. 15%).</li>
        </ul>

        <h3 style={styles.h3}>14.3 DGI — e-Factura Nicaragua</h3>
        <ul style={styles.ul}>
          <li style={styles.li}>Campos disponibles: NRC, CAI, rango de facturación autorizado.</li>
          <li style={styles.li}>El sistema cuenta con un generador de XML para e-factura, pero la integración con los servicios web de DGI requiere credenciales oficiales.</li>
        </ul>

        <h3 style={styles.h3}>14.4 Usuarios</h3>
        <ul style={styles.ul}>
          <li style={styles.li}>Crear, editar y desactivar usuarios del sistema.</li>
          <li style={styles.li}>Asignar rol: admin, supervisor, encargado, cajero.</li>
          <li style={styles.li}>Asignar módulos permitidos (qué secciones verá cada usuario no-admin).</li>
          <li style={styles.li}>El nombre de usuario se recorta automáticamente (sin espacios al inicio/final).</li>
        </ul>

        <h3 style={styles.h3}>14.5 Licencia</h3>
        <ul style={styles.ul}>
          <li style={styles.li}>El sistema requiere una licencia para funcionar.</li>
          <li style={styles.li}>La licencia está vinculada al hardware del servidor (machine-id).</li>
          <li style={styles.li}>El administrador puede generar archivos de licencia (.lic) mediante un script en Node.js.</li>
          <li style={styles.li}>Si la licencia vence o es inválida, el sistema muestra una pantalla de advertencia.</li>
        </ul>

        <h3 style={styles.h3}>14.6 Respaldos</h3>
        <ul style={styles.ul}>
          <li style={styles.li}><strong>Descargar respaldo:</strong> genera un archivo .sql con toda la base de datos.</li>
          <li style={styles.li}><strong>Restaurar respaldo:</strong> permite subir un archivo .sql previo para recuperar el sistema.</li>
          <li style={styles.li}><strong>Respaldos automáticos:</strong> el sistema genera un respaldo automático cada domingo a las 2:00 AM, guardando solo los últimos 4 respaldos.</li>
          <li style={styles.li}>Los respaldos se almacenan en <strong>C:\respaldos-spsystem</strong> (configurable).</li>
          <li style={styles.li}>Configurá Google Drive para sincronizar esa carpeta y tener backup en la nube.</li>
        </ul>
      </section>

      <section id="accesos">
        <h2 style={styles.h2}>15. Accesos directos — Atajos de teclado</h2>
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

      <section id="teclado-virtual">
        <h2 style={styles.h2}>16. Teclado virtual</h2>
        <p style={styles.p}>
          El sistema incluye un teclado virtual en pantalla para dispositivos táctiles
          (monitores táctiles HP Engage, tablets Android, iPad, etc.).
        </p>

        <h3 style={styles.h3}>16.1 Activación</h3>
        <ul style={styles.ul}>
          <li style={styles.li}>El teclado se activa <strong>automáticamente</strong> al tocar cualquier campo de texto o número en cualquier pantalla del sistema.</li>
          <li style={styles.li}><strong>No requiere configuración</strong> — funciona desde la primera vez que se abre el sistema en un dispositivo táctil.</li>
          <li style={styles.li}>Se cierra al presionar <strong>Listo</strong> o al tocar fuera del campo de texto.</li>
        </ul>

        <h3 style={styles.h3}>16.2 Layouts disponibles</h3>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Layout</th>
              <th style={styles.th}>Cuándo aparece</th>
              <th style={styles.th}>Teclas</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{...styles.td, fontWeight: 600}}>QWERTY español</td>
              <td style={styles.td}>Campos de texto (nombre, dirección, búsqueda, etc.)</td>
              <td style={styles.td}>a–z, ñ, Ñ, punto, coma</td>
            </tr>
            <tr>
              <td style={{...styles.td, fontWeight: 600}}>Numérico</td>
              <td style={styles.td}>Campos numéricos (precio, cantidad, teléfono)</td>
              <td style={styles.td}>0–9, . , - / : ; ( ) @ &amp;</td>
            </tr>
            <tr>
              <td style={{...styles.td, fontWeight: 600}}>Símbolos</td>
              <td style={styles.td}>Se accede desde el botón <strong>#+=</strong></td>
              <td style={styles.td}>? ! &apos; % * + = y símbolos adicionales</td>
            </tr>
          </tbody>
        </table>

        <h3 style={styles.h3}>16.3 Botones de control</h3>
        <ul style={styles.ul}>
          <li style={styles.li}><strong>⇧ (Shift)</strong> — activa mayúsculas. Se desactiva al presionar otra tecla.</li>
          <li style={styles.li}><strong>⌫ (Borrar)</strong> — elimina el último carácter.</li>
          <li style={styles.li}><strong>ABC / 123</strong> — alterna entre el teclado de letras y el numérico.</li>
          <li style={styles.li}><strong>#+=</strong> — muestra símbolos y caracteres especiales.</li>
          <li style={styles.li}><strong>Espacio</strong> — inserta un espacio.</li>
          <li style={styles.li}><strong>Listo</strong> — cierra el teclado y quita el foco del campo.</li>
        </ul>

        <h3 style={styles.h3}>16.4 Diseño adaptable</h3>
        <ul style={styles.ul}>
          <li style={styles.li}><strong>Tema claro/oscuro:</strong> el teclado se adapta automáticamente al tema del sistema (configurable en la barra lateral).</li>
          <li style={styles.li}><strong>Efecto glass:</strong> el fondo del teclado tiene un efecto semitransparente con blur, dejando ver el contenido detrás.</li>
          <li style={styles.li}><strong>Responsivo:</strong> en pantallas pequeñas (&le;600px), las teclas se reducen de tamaño para aprovechar mejor el espacio.</li>
        </ul>

        <h3 style={styles.h3}>16.5 Campos excluidos</h3>
        <ul style={styles.ul}>
          <li style={styles.li}>El campo de búsqueda por código de barras en el POS está excluido del teclado virtual, ya que recibe entrada del escáner (no táctil).</li>
          <li style={styles.li}>Los campos que ya tienen su propio teclado numérico integrado tampoco activan el teclado virtual.</li>
        </ul>
      </section>

      <div className="no-print" style={{ textAlign: 'center', marginTop: 40, paddingTop: 20, borderTop: '1px solid #e2e8f0', fontSize: 12, color: '#94a3b8' }}>
        SPSystem — Manual de usuario — Última actualización: {new Date().toLocaleDateString('es-NI')}
      </div>
    </div>
  )
}
