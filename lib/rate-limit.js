const ipLimiter = new Map()

function getKey(ip, prefix = '') {
  return `${prefix}:${ip}`
}

export function rateLimit(ip, max = 10, windowMs = 60000, prefix = '') {
  const key = getKey(ip, prefix)
  const now = Date.now()
  const record = ipLimiter.get(key) || { count: 0, resetAt: now + windowMs }

  if (now > record.resetAt) {
    record.count = 0
    record.resetAt = now + windowMs
  }

  record.count++
  ipLimiter.set(key, record)

  const remaining = Math.max(0, max - record.count)
  const resetIn = Math.ceil((record.resetAt - now) / 1000)

  return {
    allowed: record.count <= max,
    remaining,
    resetIn,
    limit: max,
  }
}

export function getClientIp(req) {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return req.headers.get('x-real-ip') || 'unknown'
}