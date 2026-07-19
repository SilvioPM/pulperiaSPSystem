const http = require('http')
const fs = require('fs')
const path = require('path')

const CONFIG_PATH = path.join(__dirname, 'config.json')
let config = { port: 5123, printer: { type: 'usb', interface: 'USB001' } }
if (fs.existsSync(CONFIG_PATH)) {
  try { config = { ...config, ...JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')) } } catch {}
}

function pad(text, len) {
  text = String(text || '')
  return text.length >= len ? text : text + ' '.repeat(len - text.length)
}

function center(text, width = 42) {
  text = String(text || '')
  const diff = width - text.length
  if (diff <= 0) return text
  const left = Math.floor(diff / 2)
  return ' '.repeat(left) + text
}

function generarTicket(factura, configuracion) {
  let lines = []
  const c = configuracion || {}
  const w = 42

  lines.push(center((c.nombre || 'Negocio').toUpperCase()))
  if (c.slogan) lines.push(center(c.slogan))
  if (c.direccion) lines.push(center(c.direccion))
  if (c.telefono) lines.push(center('Tel: ' + c.telefono))
  if (c.ruc) lines.push(center('RUC: ' + c.ruc))
  lines.push('='.repeat(w))

  lines.push(pad('Factura: ' + (factura.numero || '')))
  lines.push(pad('Fecha: ' + new Date(factura.creadoEn).toLocaleString('es-NI')))
  lines.push(pad('Cliente: ' + (factura.cliente?.nombre || 'General')))
  if (factura.metodoPago) lines.push(pad('Pago: ' + factura.metodoPago))
  lines.push('-'.repeat(w))

  lines.push(pad(factura.esCredito ? '** CREDITO **' : '', w))
  lines.push(pad('Producto', 20) + ' ' + pad('Cant', 6) + ' ' + pad('Precio', 7) + ' ' + pad('Sub', 7))

  if (factura.detalles) {
    for (const d of factura.detalles) {
      const nombre = (d.producto?.nombre || '').substring(0, 18)
      const cant = String(d.cantidad || 0) + (d.unidadVenta ? ' ' + d.unidadVenta.substring(0, 2) : '')
      lines.push(pad(nombre, 20) + ' ' + pad(cant, 6) + ' ' + pad((d.precio || 0).toFixed(2), 7) + ' ' + pad((d.subtotal || 0).toFixed(2), 7))
    }
  }

  lines.push('-'.repeat(w))
  lines.push(pad('Subtotal:', 28) + ' '.repeat(4) + 'C$ ' + (factura.subtotal || 0).toFixed(2))
  if (factura.descuento > 0) lines.push(pad('Descuento:', 28) + ' '.repeat(4) + 'C$ ' + factura.descuento.toFixed(2))
  if (factura.iva > 0) lines.push(pad('IVA (' + (factura.porcIva || 0) + '%):', 28) + ' '.repeat(4) + 'C$ ' + factura.iva.toFixed(2))
  lines.push('='.repeat(w))
  lines.push(center('TOTAL: C$ ' + (factura.total || 0).toFixed(2), w))
  lines.push('='.repeat(w))

  if (factura.pagoCon > 0) {
    lines.push(pad('Pago con:', 28) + ' '.repeat(4) + 'C$ ' + (factura.pagoCon || 0).toFixed(2))
    lines.push(pad('Cambio:', 28) + ' '.repeat(4) + 'C$ ' + (factura.cambio || 0).toFixed(2))
  }

  lines.push('')
  lines.push(center(c.mensajePie || 'Gracias por su compra!'))
  lines.push(center(c.ciudad || ''))
  lines.push('')
  lines.push('')
  lines.push('')
  lines.push('')

  return lines.join('\r\n') + '\r\n'
}

const { execSync } = require('child_process')

async function detectarImpresoras() {
  const impresoras = []
  try {
    const out = execSync('wmic printer get name', { encoding: 'utf8', timeout: 3000 })
    for (const linea of out.split('\n')) {
      const nombre = linea.trim()
      if (nombre && !nombre.startsWith('Name')) impresoras.push(nombre)
    }
  } catch {}
  return impresoras
}

async function probarInterfaz(texto, interfaz) {
  try {
    const ThermalPrinter = require('node-thermal-printer').printer
    const PrinterTypes = require('node-thermal-printer').types

    const printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: interfaz,
      width: 42,
      characterSet: 'PC437_USA',
      removeSpecialCharacters: false,
      lineCharacter: '=',
    })

    const connected = await printer.isPrinterConnected()
    if (!connected) return null

    for (const line of texto.split('\r\n')) {
      if (line.startsWith('=') || line.startsWith('-')) printer.println(line)
      else if (line.trim() === '') printer.newLine()
      else printer.println(line)
    }

    printer.cut(true)
    await printer.execute()
    return true
  } catch { return null }
}

async function imprimir(texto) {
  const interfacesAPprobar = [
    config.printer.interface,
    'USB001', 'USB002', 'USB003',
    ...(config.printer.autoDetected ? [] : ['auto']),
  ]
  const yaProbadas = new Set()

  for (const interfaz of interfacesAPprobar) {
    if (interfaz === 'auto') {
      const disponibles = await detectarImpresoras()
      for (const nombre of disponibles) {
        if (yaProbadas.has(nombre)) continue
        yaProbadas.add(nombre)
        const ok = await probarInterfaz(texto, nombre)
        if (ok) {
          config.printer.interface = nombre
          config.printer.autoDetected = true
          try { fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2)) } catch {}
          return { ok: true, autoDetected: nombre }
        }
      }
      continue
    }
    if (yaProbadas.has(interfaz)) continue
    yaProbadas.add(interfaz)
    const ok = await probarInterfaz(texto, interfaz)
    if (ok) return { ok: true }
  }

  const disponibles = await detectarImpresoras()
  return {
    ok: false,
    error: 'No se encontró impresora en ' + config.printer.interface
      + (disponibles.length ? '. Impresoras disponibles: ' + disponibles.join(', ') : '. No hay impresoras instaladas.'),
    disponibles
  }
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end() }

  if (req.method === 'GET' && req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({ ok: true, config, running: true }))
  }

  if (req.method === 'GET' && req.url === '/detect') {
    detectarImpresoras().then(impresoras => {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: true, impresoras, configurada: config.printer.interface }))
    })
    return
  }

  if (req.method === 'POST' && req.url === '/print') {
    let body = ''
    req.on('data', chunk => body += chunk)
    req.on('end', async () => {
      try {
        const data = JSON.parse(body)
        let ticket
        if (data.texto) {
          ticket = data.texto
        } else if (data.factura) {
          ticket = generarTicket(data.factura, data.config || {})
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          return res.end(JSON.stringify({ ok: false, error: 'Enviá factura o texto' }))
        }
        const result = await imprimir(ticket)
        res.writeHead(result.ok ? 200 : 500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(result))
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: false, error: e.message }))
      }
    })
    return
  }

  if (req.method === 'POST' && req.url === '/config') {
    let body = ''
    req.on('data', chunk => body += chunk)
    req.on('end', () => {
      try {
        const newConfig = JSON.parse(body)
        config = { ...config, ...newConfig }
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2))
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true, config }))
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: false, error: e.message }))
      }
    })
    return
  }

  res.writeHead(404); res.end()
})

server.listen(config.port, '127.0.0.1', () => {
  console.log('SP System Print Agent corriendo en http://127.0.0.1:' + config.port)
  console.log('Impresora configurada: ' + JSON.stringify(config.printer))
  console.log('Para probar: http://127.0.0.1:' + config.port + '/status')
})
