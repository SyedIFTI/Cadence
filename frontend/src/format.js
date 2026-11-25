export const clock = (seconds) => {
  const s = Math.max(0, Math.floor(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

export const levelOf = (score) =>
  score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 50 ? 'Fair' : 'Needs work'
