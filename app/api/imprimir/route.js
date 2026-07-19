import { NextResponse } from 'next/server'

const AGENT_URL = process.env.PRINT_AGENT_URL || 'http://host.docker.internal:5123'

export async function POST(req) {
  try {
    const body = await req.json()

    const res = await fetch(AGENT_URL + '/print', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    })

    const data = await res.json()
    if (!res.ok) {
      let msg = data.error || 'Error al imprimir'
      if (data.disponibles?.length) {
        msg += '. Probá: curl http://localhost:5123/config -X POST -H "Content-Type: application/json" -d \'{"printer":{"interface":"' + data.disponibles[0] + '"}}\''
      }
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    const mensaje = e.cause?.code === 'ECONNREFUSED' || e.cause?.code === 'ECONNRESET'
      ? 'Agente de impresión no está corriendo. Ejecutá install.bat en la carpeta print-agent de la PC.'
      : 'Error al imprimir: ' + e.message
    return NextResponse.json({ error: mensaje }, { status: 502 })
  }
}
