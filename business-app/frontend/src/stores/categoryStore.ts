import { create } from 'zustand'

export type Category = 'redeem-rocket' | 'lead-management'

interface CategoryStore {
  activeCategory: Category | null
  setActiveCategory: (category: Category) => void
}

export const useCategoryStore = create<CategoryStore>((set) => {
  // Try to load from localStorage on creation
  const savedCategory = typeof window !== 'undefined' ? localStorage.getItem('activeCategory') : null
  const initialCategory = (savedCategory as Category | null) || null

  return {
    activeCategory: initialCategory,
    setActiveCategory: (category: Category) => {
      localStorage.setItem('activeCategory', category)
      set({ activeCategory: category })
    },
  }
})
