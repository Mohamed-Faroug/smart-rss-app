import { useState, useCallback } from 'react'
import { fetchRSSFeed } from '../lib/rss'
import { podcastsApi, episodesApi, rssApi } from '../lib/api'
import { supabase } from '../lib/supabase'

export function useRSSSync() {
  const [syncing, setSyncing] = useState(false)
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState(null)

  const syncFeed = useCallback(async (feedUrl, podcastId = null, isFeatured = false) => {
    setSyncing(true)
    setError(null)
    setProgress({ stage: 'fetching', message: 'جاري جلب الـ RSS Feed...' })

    try {
      // 1. Fetch and parse RSS
      const rssData = await fetchRSSFeed(feedUrl)
      setProgress({ stage: 'parsing', message: `تم العثور على ${rssData.episodes.length} حلقة` })

      // 2. Create or update podcast
      let podcast
      if (podcastId) {
        podcast = await podcastsApi.update(podcastId, {
          title: rssData.title,
          description: rssData.description,
          image_url: rssData.image,
          author: rssData.author,
          language: rssData.language,
          rss_url: feedUrl,
          ...(isFeatured ? { is_featured: true } : {}),
        })
      } else {
        // Check if podcast with this RSS URL already exists
        const { data: existing, error } = await supabase
          .from('podcasts')
          .select('id, is_featured')
          .eq('rss_url', feedUrl)
          .maybeSingle()

        if (error) {
          console.error('Error checking existing podcast:', error)
          throw error
        }

        if (existing) {
          podcast = await podcastsApi.update(existing.id, {
            title: rssData.title,
            description: rssData.description,
            image_url: rssData.image,
            author: rssData.author,
            language: rssData.language,
            ...(isFeatured ? { is_featured: true } : {}),
          })
        } else {
          podcast = await podcastsApi.create({
            title: rssData.title,
            description: rssData.description,
            image_url: rssData.image,
            author: rssData.author,
            language: rssData.language || 'ar',
            rss_url: feedUrl,
            is_featured: isFeatured,
          })
        }
      }

      setProgress({ stage: 'saving', message: 'جاري حفظ الحلقات...' })

      // 3. Upsert episodes in batches
      const BATCH_SIZE = 50
      let saved = 0

      for (let i = 0; i < rssData.episodes.length; i += BATCH_SIZE) {
        const batch = rssData.episodes.slice(i, i + BATCH_SIZE).map(ep => ({
          podcast_id: podcast.id,
          guid: ep.id,
          title: ep.title,
          description: ep.description,
          audio_url: ep.audioUrl,
          audio_type: ep.audioType,
          audio_size: ep.audioSize,
          duration: ep.duration,
          image_url: ep.image || podcast.image_url,
          published_at: ep.pubDate,
          episode_number: ep.episodeNumber,
          season: ep.season,
          link: ep.link,
        }))

        await episodesApi.upsertMany(batch)
        saved += batch.length

        setProgress({
          stage: 'saving',
          message: `تم حفظ ${saved} من ${rssData.episodes.length} حلقة`,
          percent: Math.round((saved / rssData.episodes.length) * 100),
        })
      }

      // 4. Update RSS feed record
      const { data: feedRecord } = await supabase
        .from('rss_feeds')
        .select('id')
        .eq('url', feedUrl)
        .single()

      if (feedRecord) {
        await rssApi.updateSyncStatus(feedRecord.id, 'success', rssData.episodes.length)
      }

      setProgress({ stage: 'done', message: 'تمت المزامنة بنجاح!' })
      return { podcast, episodesCount: rssData.episodes.length }
    } catch (err) {
      setError(err.message)
      setProgress(null)
      throw err
    } finally {
      setSyncing(false)
    }
  }, [])

  const addFeed = useCallback(async (feedUrl, podcastId = null, isFeatured = false) => {
    // Save RSS feed record first
    const { data: existing } = await supabase
      .from('rss_feeds')
      .select('id')
      .eq('url', feedUrl)
      .single()

    if (!existing) {
      await rssApi.create({
        url: feedUrl,
        podcast_id: podcastId,
        sync_status: 'pending',
      })
    }

    return syncFeed(feedUrl, podcastId, isFeatured)
  }, [syncFeed])

  return { syncing, progress, error, syncFeed, addFeed }
}
