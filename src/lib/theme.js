// Theme management
export function getTheme() {
  return localStorage.getItem('mdaih_theme') || 'dark'
}
export function setTheme(theme) {
  localStorage.setItem('mdaih_theme', theme)
  document.documentElement.setAttribute('data-theme', theme)
}
export function initTheme() {
  const theme = getTheme()
  document.documentElement.setAttribute('data-theme', theme)
  return theme
}
