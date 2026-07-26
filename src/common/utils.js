const PRIORITY_COLORS = { '高': '#ff6a24', '中': '#ffc043', '低': '#4cd964', '无': '#6f6f6f' }

const THEME_COLORS = [
  { name: 'blue', hex: '#3184d0' },
  { name: 'orange', hex: '#f78803' },
  { name: 'red', hex: '#e74c3c' },
  { name: 'green', hex: '#27ae60' },
  { name: 'purple', hex: '#9b59b6' }
]

const THEME_ADJUST_MAP = {
  '#3184d0': ['#f78803', '#3184d0'],
  '#f78803': ['#fdb763', '#f78803'],
  '#e74c3c': ['#e74c3c', '#f29f97'],
  '#27ae60': ['#104627', '#27ae60'],
  '#9b59b6': ['#532c64', '#9b59b6']
}

export function getPriorityColor(priority) {
  return PRIORITY_COLORS[priority] || '#6f6f6f'
}

export function getThemeColors() {
  return THEME_COLORS
}

export function adjustThemeColor(baseColor, already) {
  const colors = THEME_ADJUST_MAP[baseColor]
  if (colors) return already ? colors[0] : colors[1]
  return baseColor
}
