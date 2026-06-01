import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const config = await prisma.config.findMany()
    const configObj = {}
    config.forEach(c => { configObj[c.clave] = c.valor })

    if (configObj.logo) {
      const match = configObj.logo.match(/^data:(image\/\w+);base64,(.+)$/)
      if (match) {
        const [, mimeType, base64] = match
        const buffer = Buffer.from(base64, 'base64')
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': mimeType,
            'Cache-Control': 'public, max-age=86400'
          }
        })
      }
    }

    return NextResponse.json({ error: 'No logo configured' }, { status: 404 })
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
