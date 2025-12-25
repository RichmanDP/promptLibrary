import { create } from 'zustand'

export interface Image {
  id: number
  filename: string
  originalName: string
  path: string
  uploadDate: string
  prompt: string
  negativePrompt: string
  model: string
  parameters: Record<string, any>
  category: string
  tags: string[]
  software: string
  isPrivate?: boolean
}

interface GalleryState {
  images: Image[]
  categories: string[]
  selectedCategory: string
  searchQuery: string
  isAdminMode: boolean
  isPrivateMode: boolean
  loading: boolean
  setImages: (images: Image[]) => void
  setCategories: (categories: string[]) => void
  setSelectedCategory: (category: string) => void
  setSearchQuery: (query: string) => void
  toggleAdminMode: () => void
  setPrivateMode: (isPrivate: boolean) => void
  setLoading: (loading: boolean) => void
  addImage: (image: Image) => void
  updateImage: (id: number, image: Partial<Image>) => void
  deleteImage: (id: number) => void
}

export const useGalleryStore = create<GalleryState>((set) => ({
  images: [],
  categories: [],
  selectedCategory: 'all',
  searchQuery: '',
  isAdminMode: false,
  isPrivateMode: false,
  loading: false,
  setImages: (images) => set({ images }),
  setCategories: (categories) => set({ categories }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  toggleAdminMode: () => set((state) => ({ isAdminMode: !state.isAdminMode })),
  setPrivateMode: (isPrivate) => set({ isPrivateMode: isPrivate }),
  setLoading: (loading) => set({ loading }),
  addImage: (image) => set((state) => ({ images: [image, ...state.images] })),
  updateImage: (id, updatedImage) => 
    set((state) => ({
      images: state.images.map((img) => 
        img.id === id ? { ...img, ...updatedImage } : img
      )
    })),
  deleteImage: (id) => 
    set((state) => ({
      images: state.images.filter((img) => img.id !== id)
    }))
}))
