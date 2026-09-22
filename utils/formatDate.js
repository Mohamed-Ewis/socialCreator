export function formatDate(value = new Date()) {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(value))
}

export function formatShortDate(value = new Date()) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short'
  }).format(new Date(value))
}

export function toDateInputValue(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function fromDateInputValue(value, previous) {
  if (!value) {
    return previous || null
  }

  const [year, month, day] = String(value).split('-').map(Number)

  if (!year || !month || !day) {
    return previous || null
  }

  const previousDate = previous ? new Date(previous) : null
  const hasPrevious = previousDate && !Number.isNaN(previousDate.getTime())
  const next = new Date(
    year,
    month - 1,
    day,
    hasPrevious ? previousDate.getHours() : 12,
    hasPrevious ? previousDate.getMinutes() : 0,
    0,
    0
  )

  return next.toISOString()
}

export function formatRelativeTime(value) {
  const date = new Date(value)
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000))

  if (minutes < 60) {
    return `${Math.max(1, minutes)}m`
  }

  const hours = Math.round(minutes / 60)

  if (hours < 24) {
    return `${hours}h`
  }

  return `${Math.round(hours / 24)}d`
}
