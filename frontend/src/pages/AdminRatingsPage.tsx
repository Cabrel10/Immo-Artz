import { useState, useEffect } from 'react'
import { Star, CheckCircle, XCircle, Clock, User, MessageSquare } from 'lucide-react'
import { ratingService } from '@/services/api'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { PaginationNav } from '@/components/ui/Pagination'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/hooks/useToast'
import { Toaster } from '@/components/ui/Toaster'
import { formatRelativeTime } from '@/utils/format'
import type { Rating, Pagination } from '@/types'

export function AdminRatingsPage() {
  const [ratings, setRatings] = useState<Rating[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [processing, setProcessing] = useState<number | null>(null)
  const toast = useToast()

  const fetchRatings = (p: number) => {
    setLoading(true)
    ratingService.getPending({ page: p, per_page: 15 })
      .then((r) => {
        if (r.data.success && r.data.data) {
          setRatings(r.data.data.ratings ?? [])
          setPagination(r.data.data.pagination ?? null)
        }
      })
      .catch(() => toast.error('Erreur', 'Impossible de charger les avis'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchRatings(page) }, [page])

  const handleAction = async (id: number, action: 'approve' | 'reject') => {
    setProcessing(id)
    try {
      if (action === 'approve') {
        await ratingService.approve(id)
        toast.success('Avis approuve')
      } else {
        await ratingService.reject(id)
        toast.success('Avis rejete')
      }
      setRatings((prev) => prev.filter((r) => r.id !== id))
    } catch {
      toast.error('Erreur', `Impossible de ${action === 'approve' ? 'approuver' : 'rejeter'} l'avis`)
    }
    setProcessing(null)
  }

  const renderStars = (score: number) => (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < score ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'}`}
        />
      ))}
    </div>
  )

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Toaster toasts={toast.toasts} onRemove={toast.removeToast} />

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Moderation des avis</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Approuvez ou rejetez les avis en attente</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            Avis en attente ({pagination?.total ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-lg bg-gray-100 dark:bg-gray-700 animate-pulse" />
              ))}
            </div>
          ) : ratings.length === 0 ? (
            <EmptyState
              icon={<CheckCircle className="h-12 w-12" />}
              title="Aucun avis en attente"
              description="Tous les avis ont ete traites."
            />
          ) : (
            <div className="space-y-4">
              {ratings.map((rating) => (
                <div
                  key={rating.id}
                  className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-full bg-immo-100 dark:bg-immo-900 flex items-center justify-center">
                          <User className="h-5 w-5 text-immo-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{rating.rater_name}</p>
                          <div className="flex items-center gap-2">
                            {renderStars(rating.score)}
                            <span className="text-xs text-gray-500">{formatRelativeTime(rating.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      {rating.comment && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 pl-13">
                          <MessageSquare className="h-3 w-3 inline mr-1" />
                          {rating.comment}
                        </p>
                      )}

                      <div className="flex gap-2 mt-2">
                        {rating.agent && (
                          <Badge variant="primary">Agent: {rating.agent.name}</Badge>
                        )}
                        {rating.property && (
                          <Badge variant="outline">Bien: {rating.property.title}</Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(rating.id, 'approve')}
                        isLoading={processing === rating.id}
                        leftIcon={<CheckCircle className="h-4 w-4 text-green-500" />}
                      >
                        Approuver
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleAction(rating.id, 'reject')}
                        isLoading={processing === rating.id}
                        leftIcon={<XCircle className="h-4 w-4" />}
                      >
                        Rejeter
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {pagination && <PaginationNav pagination={pagination} onPageChange={setPage} />}
        </CardContent>
      </Card>
    </div>
  )
}
