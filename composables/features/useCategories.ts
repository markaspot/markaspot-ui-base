export const useCategories = () => {
  const api = useApiClient()
  const categories = ref<Category[]>([])
  const loading = ref(true)
  const error = ref<string | null>(null)

  const categoryOptions = computed(() => {
    if (!categories.value?.length) return []

    
    const categoryMap = new Map(
      categories.value.map(cat => [cat.id, cat])
    )

    
    const childrenMap = new Map<string, Category[]>()
    categories.value.forEach(cat => {
      const parentId = cat.relationships?.parent?.data?.[0]?.id
      if (parentId && parentId !== 'virtual') {
        if (!childrenMap.has(parentId)) {
          childrenMap.set(parentId, [])
        }
        childrenMap.get(parentId)?.push(cat)
      }
    })

    
    const buildOptions = (cats: Category[], level = 0): { label: string; value: string }[] => {
      return cats
        .sort((a, b) => {
          const weightDiff = (a.attributes.weight || 0) - (b.attributes.weight || 0)
          return weightDiff !== 0 ? weightDiff : a.attributes.name.localeCompare(b.attributes.name)
        })
        .reduce((acc, cat) => {
          acc.push({
            label: `${'\u2003'.repeat(level)}${cat.attributes.name}`,
            value: cat.id
          })

          const children = childrenMap.get(cat.id) || []
          acc.push(...buildOptions(children, level + 1))

          return acc
        }, [] as { label: string; value: string }[])
    }

    
    const rootCategories = categories.value.filter(cat => {
      const parentId = cat.relationships?.parent?.data?.[0]?.id
      return !parentId || parentId === 'virtual' || !categoryMap.has(parentId)
    })

    return buildOptions(rootCategories)
  })

  const fetchCategories = async () => {
    loading.value = true
    error.value = null
    const allCategories: Category[] = []

    try {
      let offset = 0
      const limit = 50

      
      let response = await api.get<DrupalJsonApiResponse<Category[]>>(
        '/jsonapi/taxonomy_term/service_category',
        {
          'fields[taxonomy_term--service_category]': 'name,weight,parent',
          'include': 'parent',
          'filter[status][value]': '1',
          'sort': 'name',
          'page[offset]': offset.toString(),
          'page[limit]': limit.toString()
        }
      )

      if (response?.data) {
        allCategories.push(...response.data)
        offset += limit

        
        if (response.links?.next) {
          response = await api.get<DrupalJsonApiResponse<Category[]>>(
            '/jsonapi/taxonomy_term/service_category',
            {
              'fields[taxonomy_term--service_category]': 'name,weight,parent',
              'include': 'parent',
              'filter[status][value]': '1',
              'sort': 'name',
              'page[offset]': offset.toString(),
              'page[limit]': limit.toString()
            }
          )
          if (response?.data) {
            allCategories.push(...response.data)
          }
        }
      }

      categories.value = allCategories

    } catch (e) {
      console.error('Error fetching categories:', e)
      error.value = e instanceof Error ? e.message : 'Failed to fetch categories'
    } finally {
      loading.value = false
    }
  }

  return {
    categories,
    categoryOptions,
    loading,
    error,
    fetchCategories
  }
}
