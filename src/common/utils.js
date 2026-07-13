const PRIORITY_COLORS = { '高': '#ff6a24', '中': '#ffc043', '低': '#4cd964', '无': '#6f6f6f' }

export function getPriorityColor(priority) {
  return PRIORITY_COLORS[priority] || '#6f6f6f'
}
