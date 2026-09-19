import { APP_NAME } from '~/utils/constants'
import { formatDate } from '~/utils/formatDate'

export function useAppNav() {
  const items = [
    { to: '/', label: 'Overview', hint: 'Desks and workflow' },
    { to: '/research', label: 'Research', hint: 'Filter, check, submit' },
    { to: '/projects', label: 'Projects', hint: 'Briefing batches' }
  ]

  const todayLabel = computed(() => formatDate())

  return {
    appName: APP_NAME,
    items,
    todayLabel
  }
}
