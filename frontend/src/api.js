async function request(path, options) {
  let response
  try {
    response = await fetch(`/api${path}`, options)
  } catch {
    throw new Error('Cannot reach the backend. Is it running on port 8000?')
  }
  if (response.status === 204) return null
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const detail = typeof data?.detail === 'string' ? data.detail : null
    throw new Error(detail || 'The backend did not respond. Check that it is running on port 8000.')
  }
  return data
}

export const getHealth = () => request('/health')
export const listReports = () => request('/reports')
export const getReport = (id) => request(`/reports/${id}`)
export const deleteReport = (id) => request(`/reports/${id}`, { method: 'DELETE' })
export const analyzeSample = () => request('/analyze/sample', { method: 'POST' })
export const audioUrl = (id) => `/api/reports/${id}/audio`

export function analyzeAudio(file, title, source) {
  const form = new FormData()
  form.append('file', file)
  form.append('title', title)
  form.append('source', source)
  return request('/analyze', { method: 'POST', body: form })
}
