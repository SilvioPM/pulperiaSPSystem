export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id'))

    // Verificamos si tiene productos antes de borrar
    const categoria = await prisma.categoria.findUnique({
      where: { id },
      include: { _count: { select: { productos: true } } }
    })

    if (categoria._count.productos > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar. Tiene ${categoria._count.productos} producto(s) asignado(s).` },
        { status: 400 }
      )
    }

    await prisma.categoria.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar categoría' }, { status: 500 })
  }
}