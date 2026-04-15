// Session-based listening history (per browser session + localStorage)
const SESSION_KEY = 'mdaih_session_history'
const MAX_HISTORY = 50

export function getSessionHistory() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || '[]')
  } catch { return [] }
}

export function addToSessionHistory(episode, podcast) {
  try {
    const history = getSessionHistory()
    const entry = {
      id: episode.id,
      title: episode.title,
      duration: episode.duration || 0,
      image: episode.image_url || episode.image || podcast?.image_url || '',
      podcastTitle: podcast?.title || episode.podcast_title || '',
      podcastId: podcast?.id || episode.podcast_id || '',
      audioUrl: episode.audio_url || episode.audioUrl || '',
      publishedAt: episode.published_at || '',
      lastPlayed: Date.now(),
      progress: 0,
    }
    const filtered = history.filter(h => h.id !== episode.id)
    filtered.unshift(entry)
    localStorage.setItem(SESSION_KEY, JSON.stringify(filtered.slice(0, MAX_HISTORY)))
  } catch {}
}

export function updateSessionProgress(episodeId, currentTime, duration) {
  try {
    const history = getSessionHistory()
    const idx = history.findIndex(h => h.id === episodeId)
    if (idx !== -1) {
      history[idx].progress = duration > 0 ? Math.round((currentTime / duration) * 100) : 0
      history[idx].currentTime = currentTime
      localStorage.setItem(SESSION_KEY, JSON.stringify(history))
    }
  } catch {}
}

export function getContinueListening() {
  // Episodes where progress is between 5% and 95% (i.e. started but not finished)
  return getSessionHistory()
    .filter(h => h.progress > 5 && h.progress < 95)
    .slice(0, 5)
}

export function getRecentlyPlayed() {
  return getSessionHistory().slice(0, 5)
}
