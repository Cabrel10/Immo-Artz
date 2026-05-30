import { useState, useEffect, useCallback } from 'react'
import { GripVertical, Star, StarOff, Eye, MapPin, Loader2 } from 'lucide-react'
import { adminService } from '@/services/api'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { PaginationNav } from '@/components/ui/Pagination'
import { useToast } from '@/hooks/useToast'
import { Toaster } from '@/components/ui/Toaster'
import { formatPrice } from '@/utils/format'
import type { Property, Pagination } from '@/types'
import { STANDING_COLORS } from '@/types'

export function AdminFeaturedPage() {
  const [featured, setFeatured] = useState<Property[]>([])
  const [allProperties, setAllProperties] = useState<Property[]>([])
  const [allPagination, setAllPagination] = useState<Pagination | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toggling, setToggling] = useState<number | null>(null)
  const toast = useToast()

  const fetchFeatured = useCallback(() => {
    adminService.getFeaturedProperties()
      .then((r) => {
        if (r.data.success && r.data.data) {
          setFeatured(r.data.data.properties ?? [])
        }
      })
      .catch(() => {})
  }, [])

  const fetchAll = useCallback((p: number) => {
    setLoading(true)
    adminService.getProperties({ page: p, per_page: 15 })
      .then((r) => {
        if (r.data.success && r.data.data) {
          setAllProperties(r.data.data.properties ?? [])
          setAllPagination(r.data.data.pagination ?? null)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchFeatured() }, [fetchFeatured])
  useEffect(() => { fetchAll(page) }, [page, fetchAll])

  const handleToggleFeatured = async (id: number, currentFeatured: boolean) => {
    setToggling(id)
    try {
      await adminService.toggleFeatured(id, !currentFeatured)
      toast.success(currentFeatured ? 'Bien retire des vedettes' : 'Bien mis en vedette')
      fetchFeatured()
      fetchAll(page)
    } catch {
      toast.error('Erreur', 'Impossible de modifier le statut')
    }
    setToggling(null)
  }

  const moveFeatured = (index: number, direction: 'up' | 'down') => {
    const newList = [...featured]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= newList.length) return
    ;[newList[index], newList[swapIndex]] = [newList[swapIndex], newList[index]]
    setFeatured(newList)
  }

  const saveOrder = async () => {
    setSaving(true)
    try {
      const orderedProperties = featured.map((p, i) => ({ id: p.id, order: i + 1 }))
      await adminService.setFeaturedOrder(orderedProperties)
      toast.success('Ordre sauvegarde')
    } catch {
      toast.error('Erreur', 'Impossible de sauvegarder l\'ordre')
    }
    setSaving(false)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Toaster toasts={toast.toasts} onRemove={toast.removeToast} />

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Biens en vedette</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gerez les proprietes mises en avant sur la page d'accueil</p>
        </div>
        {featured.length > 0 && (
          <Button onClick={saveOrder} isLoading={saving}>
            Sauvegarder l'ordre
          </Button>
        )}
      </div>

      {/* Featured Properties - Reorderable */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
            En vedette ({featured.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {featured.length === 0 ? (
            <EmptyState
              icon={<Star className="h-12 w-12" />}
              title="Aucun bien en vedette"
              description="Ajoutez des biens en vedette depuis la liste ci-dessous."
            />
          ) : (
            <div className="space-y-2">
              {featured.map((p, index) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/10"
                >
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => moveFeatured(index, 'up')}
                      disabled={index === 0}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                      <GripVertical className="h-3 w-3 rotate-90" />
                    </button>
                    <button
                      onClick={() => moveFeatured(index, 'down')}
                      disabled={index === featured.length - 1}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                      <GripVertical className="h-3 w-3 -rotate-90" />
                    </button>
                  </div>
                  <span className="text-sm font-bold text-amber-600 w-6">#{index + 1}</span>
                  <img src={p.main_image || '/placeholder.jpg'} alt="" className="h-12 w-16 rounded object-cover bg-gray-200" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{p.title}</p>
                    <p className="text-xs text-gray-500">{p.city} - {formatPrice(p.price)}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggleFeatured(p.id, true)}
                    isLoading={toggling === p.id}
                  >
                    <StarOff className="h-4 w-4 text-amber-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Properties */}
      <Card>
        <CardHeader>
          <CardTitle>Tous les biens ({allPagination?.total ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-immo-600" />
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {allProperties.map((p) => (
                <div key={p.id} className="flex items-center gap-4 py-3">
                  <img src={p.main_image || '/placeholder.jpg'} alt="" className="h-12 w-16 rounded object-cover bg-gray-200" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{p.title}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                      <MapPin className="h-3 w-3" />
                      <span>{p.city}</span>
                      <span>-</span>
                      <span>{formatPrice(p.price)}</span>
                      <Badge className={`${STANDING_COLORS[p.standing]} text-white border-0 text-[10px]`}>
                        {p.standing_label}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Eye className="h-3 w-3" /> {p.view_count}
                  </div>
                  <Button
                    size="sm"
                    variant={p.is_featured ? 'secondary' : 'outline'}
                    onClick={() => handleToggleFeatured(p.id, p.is_featured)}
                    isLoading={toggling === p.id}
                    leftIcon={p.is_featured ? <Star className="h-4 w-4 fill-current" /> : <Star className="h-4 w-4" />}
                  >
                    {p.is_featured ? 'En vedette' : 'Mettre en vedette'}
                  </Button>
                </div>
              ))}
            </div>
          )}
          {allPagination && <PaginationNav pagination={allPagination} onPageChange={setPage} />}
        </CardContent>
      </Card>
    </div>
  )
}
