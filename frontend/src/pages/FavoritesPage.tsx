import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Trash2, MapPin, Loader2 } from 'lucide-react'
import { favoriteService } from '@/services/api'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { PaginationNav } from '@/components/ui/Pagination'
import { useToast } from '@/hooks/useToast'
import { Toaster } from '@/components/ui/Toaster'
import { formatPrice, formatRelativeTime } from '@/utils/format'
import type { Favorite, Pagination } from '@/types'
import { STANDING_COLORS } from '@/types'

export function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [removing, setRemoving] = useState<number | null>(null)
  const toast = useToast()

  useEffect(() => {
    setLoading(true)
    favoriteService.getAll({ page, per_page: 12 })
      .then((r) => {
        if (r.data.success && r.data.data) {
          setFavorites(r.data.data.favorites ?? [])
          setPagination(r.data.data.pagination ?? null)
        }
      })
      .catch(() => toast.error('Erreur', 'Impossible de charger vos favoris'))
      .finally(() => setLoading(false))
  }, [page])

  const handleRemove = async (propertyId: number) => {
    setRemoving(propertyId)
    try {
      await favoriteService.remove(propertyId)
      setFavorites((prev) => prev.filter((f) => f.property.id !== propertyId))
      toast.success('Retire des favoris')
    } catch {
      toast.error('Erreur', 'Impossible de retirer le favori')
    }
    setRemoving(null)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Toaster toasts={toast.toasts} onRemove={toast.removeToast} />

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Heart className="h-6 w-6 text-red-500 fill-red-500" />
          Mes favoris
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {pagination?.total ?? 0} bien(s) sauvegarde(s)
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-immo-600" />
        </div>
      ) : favorites.length === 0 ? (
        <EmptyState
          icon={<Heart className="h-16 w-16" />}
          title="Aucun favori"
          description="Ajoutez des biens a vos favoris pour les retrouver facilement."
          action={<Link to="/properties"><Button>Explorer les biens</Button></Link>}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((fav) => {
              const p = fav.property
              return (
                <Card key={fav.id} isHoverable>
                  <div className="relative">
                    <Link to={`/properties/${p.id}`}>
                      <img
                        src={p.main_image || p.images?.[0] || '/placeholder.jpg'}
                        alt={p.title}
                        className="w-full h-48 object-cover rounded-t-xl"
                      />
                    </Link>
                    <div className="absolute top-3 left-3 flex gap-2">
                      <Badge className={`${STANDING_COLORS[p.standing]} text-white border-0`}>
                        {p.standing_label}
                      </Badge>
                    </div>
                    <button
                      onClick={() => handleRemove(p.id)}
                      disabled={removing === p.id}
                      className="absolute top-3 right-3 p-2 rounded-full bg-white/90 dark:bg-gray-800/90 hover:bg-red-50 transition-colors"
                    >
                      {removing === p.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-red-500" />
                      )}
                    </button>
                  </div>
                  <CardContent className="p-4">
                    <Link to={`/properties/${p.id}`}>
                      <h3 className="font-semibold text-gray-900 dark:text-white hover:text-immo-600 transition-colors line-clamp-1">
                        {p.title}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{p.quartier}, {p.city}</span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-lg font-bold text-immo-600">{formatPrice(p.price)}</span>
                      <span className="text-xs text-gray-400">{formatRelativeTime(fav.created_at)}</span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          {pagination && <PaginationNav pagination={pagination} onPageChange={setPage} />}
        </>
      )}
    </div>
  )
}
