export function sanitizarTexto(valor, max = 500) {
  if (typeof valor !== 'string') return valor
  let texto = valor.replace(/\0/g, '').replace(/[\u0001-\u001F\u007F]/g, '')
  texto = texto.replace(/<script[\s\S]*?<\/script>/gi, '')
  texto = texto.replace(/\son\w+\s*=/gi, ' ')
  texto = texto.replace(/javascript\s*:/gi, '')
  texto = texto.replace(/vbscript\s*:/gi, '')
  texto = texto.replace(/data\s*:\s*text\/html/gi, '')
  texto = texto.trim()
  if (texto.length > max) texto = texto.slice(0, max)
  return texto
}

export function sanitizarEntrada(entrada, max = 500, excluir = []) {
  if (!entrada || typeof entrada !== 'object') return entrada
  const copia = Array.isArray(entrada) ? [...entrada] : { ...entrada }
  for (const clave of Object.keys(copia)) {
    if (excluir.includes(clave)) continue
    const valor = copia[clave]
    if (typeof valor === 'string') copia[clave] = sanitizarTexto(valor, max)
    else if (typeof valor === 'object' && valor !== null) copia[clave] = sanitizarEntrada(valor, max, excluir)
  }
  return copia
}
