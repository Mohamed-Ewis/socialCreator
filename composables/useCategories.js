import { ALL_CATEGORY, STORY_CATEGORIES, getCategoryById } from '~/data/categories'

export function useCategories() {
  const searchStore = useSearchStore()

  const categories = STORY_CATEGORIES
  const filterCategories = [ALL_CATEGORY, ...STORY_CATEGORIES]
  const currentCategory = computed(() => getCategoryById(searchStore.category))

  function setCategory(categoryId) {
    searchStore.setCategory(categoryId)
  }

  return {
    categories,
    filterCategories,
    currentCategory,
    setCategory
  }
}
