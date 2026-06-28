export function useApexTheme() {
  const theme = useThemeStore()
  const axis = computed(() => (theme.isDark ? '#94a3b8' : '#64748b'))
  const grid = computed(() => (theme.isDark ? '#1e293b' : '#e2e8f0'))
  const base = computed(() => ({
    chart: {
      fontFamily: 'Inter, sans-serif',
      foreColor: axis.value,
      toolbar: { show: false },
      animations: { enabled: true, speed: 400 },
    },
    grid: { borderColor: grid.value, strokeDashArray: 4, padding: { left: 8, right: 8 } },
    tooltip: { theme: theme.isDark ? 'dark' : 'light' },
    dataLabels: { enabled: false },
    legend: { labels: { colors: axis.value } },
    states: { hover: { filter: { type: 'darken', value: 0.9 } } },
  }))
  return { axis, grid, base, isDark: computed(() => theme.isDark) }
}
