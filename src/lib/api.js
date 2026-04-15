import { supabase } from './supabase'

// ─── Podcasts ────────────────────────────────────────────────────────────────

export const podcastsApi = {
  async getAll({ page = 1, limit = 20, category = null, search = null } = {}) {
    let query = supabase
      .from('podcasts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (category) query = query.eq('category', category)
    if (search) query = query.ilike('title', `%${search}%`)

    const { data, error, count } = await query
    if (error) throw error
    return { data, count, page, limit }
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('podcasts')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async getFeatured() {
    const { data, error } = await supabase
      .from('podcasts')
      .select('*')
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(6)
    if (error) throw error
    return data
  },

  async create(podcast) {
    const { data, error } = await supabase
      .from('podcasts')
      .insert(podcast)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('podcasts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase.from('podcasts').delete().eq('id', id)
    if (error) throw error
  },

  async syncFromRSS(podcastId) {
    // Trigger RSS sync - in a real app, this would call a Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('sync-rss', {
      body: { podcast_id: podcastId },
    })
    if (error) throw error
    return data
  },
}

// ─── Episodes ────────────────────────────────────────────────────────────────

export const episodesApi = {
  async getByPodcast(podcastId, { page = 1, limit = 20 } = {}) {
    const { data, error, count } = await supabase
      .from('episodes')
      .select('*, podcasts(title, image_url, author)', { count: 'exact' })
      .eq('podcast_id', podcastId)
      .order('published_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)
    if (error) throw error
    return { data, count }
  },

  async getLatest({ limit = 20 } = {}) {
    const { data, error } = await supabase
      .from('episodes')
      .select('*, podcasts(title, image_url, author, category)')
      .order('published_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('episodes')
      .select('*, podcasts(*)')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async search(query, { limit = 20 } = {}) {
    const { data, error } = await supabase
      .from('episodes')
      .select('*, podcasts(title, image_url, author)')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order('published_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data
  },

  async upsertMany(episodes) {
    const { data, error } = await supabase
      .from('episodes')
      .upsert(episodes, { onConflict: 'guid' })
      .select()
    if (error) throw error
    return data
  },
}

// ─── RSS Feeds ───────────────────────────────────────────────────────────────

export const rssApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('rss_feeds')
      .select('*, podcasts(title, image_url)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async create(feed) {
    const { data, error } = await supabase
      .from('rss_feeds')
      .insert(feed)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updateSyncStatus(id, status, episodesCount = null) {
    const updates = {
      sync_status: status,
      last_synced_at: new Date().toISOString(),
    }
    if (episodesCount !== null) updates.episodes_count = episodesCount

    const { data, error } = await supabase
      .from('rss_feeds')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase.from('rss_feeds').delete().eq('id', id)
    if (error) throw error
  },
}

// ─── Categories ──────────────────────────────────────────────────────────────

export const categoriesApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name_ar')
    if (error) throw error
    return data
  },
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export const statsApi = {
  async getDashboard() {
    const [podcasts, episodes, feeds] = await Promise.all([
      supabase.from('podcasts').select('id', { count: 'exact', head: true }),
      supabase.from('episodes').select('id', { count: 'exact', head: true }),
      supabase.from('rss_feeds').select('id', { count: 'exact', head: true }),
    ])

    const recentEpisodes = await supabase
      .from('episodes')
      .select('published_at')
      .gte(
        'published_at',
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      )
      .select('id', { count: 'exact', head: true })

    return {
      totalPodcasts: podcasts.count || 0,
      totalEpisodes: episodes.count || 0,
      totalFeeds: feeds.count || 0,
      newEpisodesThisWeek: recentEpisodes.count || 0,
    }
  },
}
