export function formatTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  const timeFormatter = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  })
  const weekdayFormatter = new Intl.DateTimeFormat(undefined, {
    weekday: 'short'
  })
  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric'
  })

  if (diffDays === 0) {
    return timeFormatter.format(date)
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return weekdayFormatter.format(date)
  } else {
    return dateFormatter.format(date)
  }
}

export function formatMessageTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
