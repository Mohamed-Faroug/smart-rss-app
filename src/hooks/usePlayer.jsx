import { createContext, useContext, useReducer, useRef, useEffect, useCallback } from 'react'
import { addToSessionHistory, updateSessionProgress } from '../lib/session'

const initialState = {
  currentEpisode: null,
  podcast: null,
  queue: [],
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  playbackRate: 1,
  isLoading: false,
  error: null,
  showFullPlayer: false,
}

function reducer(state, action) {
  switch (action.type) {
    case 'PLAY_EPISODE': return { ...state, currentEpisode: action.episode, podcast: action.podcast || state.podcast, isPlaying: true, currentTime: 0, isLoading: true, error: null }
    case 'TOGGLE_PLAY': return { ...state, isPlaying: !state.isPlaying }
    case 'SET_TIME': return { ...state, currentTime: action.time }
    case 'SET_DURATION': return { ...state, duration: action.duration }
    case 'SET_VOLUME': return { ...state, volume: action.volume }
    case 'SET_RATE': return { ...state, playbackRate: action.rate }
    case 'SET_LOADING': return { ...state, isLoading: action.loading }
    case 'SET_ERROR': return { ...state, error: action.error, isLoading: false }
    case 'TOGGLE_FULL_PLAYER': return { ...state, showFullPlayer: !state.showFullPlayer }
    case 'SET_FULL_PLAYER': return { ...state, showFullPlayer: action.show }
    case 'ADD_TO_QUEUE':
      if (state.queue.find(e => e.id === action.episode.id)) return state
      return { ...state, queue: [...state.queue, action.episode] }
    case 'REMOVE_FROM_QUEUE': return { ...state, queue: state.queue.filter(e => e.id !== action.episodeId) }
    case 'PLAY_NEXT':
      if (state.queue.length === 0) return { ...state, isPlaying: false }
      const [next, ...rest] = state.queue
      return { ...state, currentEpisode: next, queue: rest, isPlaying: true, currentTime: 0, isLoading: true }
    default: return state
  }
}

const PlayerContext = createContext(null)

export function PlayerProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const audioRef = useRef(new Audio())

  // When episode changes, load audio
  useEffect(() => {
    const audio = audioRef.current
    const src = state.currentEpisode?.audio_url || state.currentEpisode?.audioUrl
    if (!src) return
    audio.src = src
    audio.playbackRate = state.playbackRate
    audio.volume = state.volume
    if (state.isPlaying) audio.play().catch(e => dispatch({ type: 'SET_ERROR', error: e.message }))
    // Add to session history
    if (state.currentEpisode) addToSessionHistory(state.currentEpisode, state.podcast)
  }, [state.currentEpisode, state.playbackRate, state.volume])

  useEffect(() => {
    const audio = audioRef.current
    if (!state.currentEpisode) return
    if (state.isPlaying) audio.play().catch(e => dispatch({ type: 'SET_ERROR', error: e.message }))
    else audio.pause()
  }, [state.isPlaying])

  useEffect(() => {
    const audio = audioRef.current
    const onTimeUpdate = () => {
      dispatch({ type: 'SET_TIME', time: audio.currentTime })
      // Update progress every 5 seconds
      if (Math.floor(audio.currentTime) % 5 === 0 && state.currentEpisode) {
        updateSessionProgress(state.currentEpisode.id, audio.currentTime, audio.duration)
      }
    }
    const onDuration = () => dispatch({ type: 'SET_DURATION', duration: audio.duration })
    const onCanPlay = () => dispatch({ type: 'SET_LOADING', loading: false })
    const onWaiting = () => dispatch({ type: 'SET_LOADING', loading: true })
    const onEnded = () => dispatch({ type: 'PLAY_NEXT' })
    const onError = () => dispatch({ type: 'SET_ERROR', error: 'تعذّر تشغيل الحلقة' })

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('durationchange', onDuration)
    audio.addEventListener('canplay', onCanPlay)
    audio.addEventListener('waiting', onWaiting)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('error', onError)
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('durationchange', onDuration)
      audio.removeEventListener('canplay', onCanPlay)
      audio.removeEventListener('waiting', onWaiting)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('error', onError)
    }
  }, [state.currentEpisode])

  useEffect(() => { audioRef.current.volume = state.volume }, [state.volume])
  useEffect(() => { audioRef.current.playbackRate = state.playbackRate }, [state.playbackRate])

  const seek = useCallback((time) => {
    audioRef.current.currentTime = time
    dispatch({ type: 'SET_TIME', time })
  }, [])

  const playEpisode = useCallback((episode, podcast = null) => dispatch({ type: 'PLAY_EPISODE', episode, podcast }), [])
  const togglePlay = useCallback(() => dispatch({ type: 'TOGGLE_PLAY' }), [])
  const setVolume = useCallback((v) => dispatch({ type: 'SET_VOLUME', volume: v }), [])
  const setRate = useCallback((r) => dispatch({ type: 'SET_RATE', rate: r }), [])
  const skipForward = useCallback((s = 30) => seek(Math.min(audioRef.current.currentTime + s, audioRef.current.duration || 0)), [seek])
  const skipBackward = useCallback((s = 15) => seek(Math.max(audioRef.current.currentTime - s, 0)), [seek])
  const addToQueue = useCallback((episode) => dispatch({ type: 'ADD_TO_QUEUE', episode }), [])
  const removeFromQueue = useCallback((id) => dispatch({ type: 'REMOVE_FROM_QUEUE', episodeId: id }), [])
  const toggleFullPlayer = useCallback(() => dispatch({ type: 'TOGGLE_FULL_PLAYER' }), [])
  const setFullPlayer = useCallback((show) => dispatch({ type: 'SET_FULL_PLAYER', show }), [])

  const value = {
    ...state,
    playEpisode, togglePlay, seek, setVolume, setRate,
    skipForward, skipBackward, addToQueue, removeFromQueue,
    toggleFullPlayer, setFullPlayer,
    progress: state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0,
  }

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
}

export const usePlayer = () => {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be inside PlayerProvider')
  return ctx
}
