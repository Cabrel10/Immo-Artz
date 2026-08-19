import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Trash2, AlertCircle } from 'lucide-react'
import { PropertyCard } from '@/components/PropertyCard'
import { Button } from '@/components/ui/Button'
import { favoriteService } from '@/services/api'
import type { Property } from '@/types'

interface FavoriteItem {
  id: number
  property_id: number
  created_at: string
  property: Property
}

export function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const fetchFavorites = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await favoriteService.getAll()
      if (response.data.success) {
        setFavorites(response.data.data?.favorites || [])
      } else {
        setError(response.data.message || 'Erreur lors du chargement')
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        navigate('/login')
        return
      }
      setError(err.response?.data?.message || 'Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchFavorites()
  }, [])

  const handleToggleFavorite = async (propertyId: number) => {
    try {
      await favoriteService.toggle(propertyId)
      setFavorites((prev) => prev.filter((f) => f.property_id !== propertyId))
    } catch {
      setError('Erreur lors de la mise à jour des favoris')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-gradient-to-br from-immo-700 to-immo-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Heart className="h-8 w-8 fill-current" />
            <h1 className="text-3xl font-bold">Mes Favoris</h1>
          </div>
          <p className="mt-2 text-immo-100">
            {favorites.length} bien{favorites.length > 1 ? 's' : ''} enregistré{favorites.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-xl h-80" />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600" />
            <h2 className="mt-4 text-xl font-semibold text-gray-700 dark:text-gray-300">
              Aucun favori pour le moment
            </h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Parcourez les biens et cliquez sur le coeur pour les retrouver ici.
            </p>
            <Button className="mt-6" onClick={() => navigate('/properties')}>
              Voir les biens
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((fav) => (
              <div key={fav.id} className="relative">
                <PropertyCard
                  property={fav.property}
                  isFavorite
                  onToggleFavorite={handleToggleFavorite}
                />
                <button
                  onClick={() => handleToggleFavorite(fav.property_id)}
                  title="Retirer des favoris"
                  className="absolute bottom-3 right-3 p-2 rounded-full bg-white/90 dark:bg-gray-800/90 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 shadow transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
