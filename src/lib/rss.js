const CORS_PROXIES = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://cors-anywhere.herokuapp.com/${url}`,
]

export async function fetchRSSWithProxy(feedUrl) {
  // Try direct first
  try {
    const r = await fetch(feedUrl, { signal: AbortSignal.timeout(8000) })
    if (r.ok) return r.text()
  } catch {}

  // Try proxies
  for (const proxy of CORS_PROXIES) {
    try {
      const r = await fetch(proxy(feedUrl), { signal: AbortSignal.timeout(10000) })
      if (r.ok) return r.text()
    } catch {}
  }

  throw new Error('تعذّر الوصول إلى RSS Feed. يرجى التحقق من الرابط أو المحاولة لاحقاً.')
}

export function parseRSSFeed(xmlText) {
  const parser = new DOMParser()
  const xml = parser.parseFromString(xmlText, 'application/xml')
  const channel = xml.querySelector('channel')
  if (!channel) throw new Error('Invalid RSS feed')

  const getText = (parent, selector) => {
    const el = parent.querySelector(selector)
    return el ? el.textContent.trim() : ''
  }
  const getAttr = (parent, selector, attr) => {
    const el = parent.querySelector(selector)
    return el ? el.getAttribute(attr) : ''
  }

  const podcast = {
    title: getText(channel, 'title'),
    description: getText(channel, 'description'),
    link: getText(channel, 'link'),
    language: getText(channel, 'language'),
    author: getText(channel, 'itunes\\:author') || getText(channel, 'author'),
    image: getAttr(channel, 'itunes\\:image', 'href') || getText(channel, 'image url'),
    category: getText(channel, 'itunes\\:category'),
    episodes: [],
  }

  channel.querySelectorAll('item').forEach((item, index) => {
    const enclosure = item.querySelector('enclosure')
    const itunesDuration = item.querySelector('itunes\\:duration')
    const itunesImage = item.querySelector('itunes\\:image')
    const itunesEpisode = item.querySelector('itunes\\:episode')
    const itunesSeason = item.querySelector('itunes\\:season')
    const pubDateStr = getText(item, 'pubDate')
    const pubDate = pubDateStr ? new Date(pubDateStr) : new Date()
    const durationStr = itunesDuration ? itunesDuration.textContent.trim() : ''

    podcast.episodes.push({
      id: getText(item, 'guid') || `ep-${index}`,
      title: getText(item, 'title'),
      description: cleanHTML(getText(item, 'description')),
      pubDate: pubDate.toISOString(),
      audioUrl: enclosure ? enclosure.getAttribute('url') : '',
      audioType: enclosure ? enclosure.getAttribute('type') : 'audio/mpeg',
      audioSize: enclosure ? parseInt(enclosure.getAttribute('length')) || 0 : 0,
      duration: parseDuration(durationStr),
      durationFormatted: formatDuration(parseDuration(durationStr)),
      image: (itunesImage ? itunesImage.getAttribute('href') : '') || podcast.image,
      episodeNumber: itunesEpisode ? parseInt(itunesEpisode.textContent) : null,
      season: itunesSeason ? parseInt(itunesSeason.textContent) : null,
      link: getText(item, 'link'),
    })
  })

  podcast.episodes.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
  return podcast
}

function parseDuration(str) {
  if (!str) return 0
  const parts = str.split(':').map(Number)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return parseInt(str) || 0
}

export function formatDuration(seconds) {
  if (!seconds || seconds === 0) return '0:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m}:${s.toString().padStart(2, '0')}`
}

function cleanHTML(html) {
  if (!html) return ''
  // Use regex to strip HTML tags for safety
  return html.replace(/<[^>]*>/g, '').trim()
}

// Alias for backward compat
export const fetchRSSFeed = fetchRSSWithProxy
