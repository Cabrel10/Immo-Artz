import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BarChart3, Eye, MessageSquare, Star, Plus, Home, PenSquare, Trash2 } from 'lucide-react'
import { agentService, propertyService } from '@/services/api'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { PaginationNav } from '@/components/ui/Pagination'
import { formatPrice } from '@/utils/format'
import type { AgentStats, Property, Pagination } from '@/types'

export function AgentDashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<AgentStats | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  useEffect(() => {
    agentService.getMyStats().then((r) => { if (r.data.success) setStats(r.data.data ?? null) }).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    propertyService.getMyProperties({ page, per_page: 10 })
      .then((r) => {
        if (r.data.success && r.data.data) {
          setProperties(r.data.data.properties ?? [])
          setPagination(r.data.data.pagination ?? null)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page])

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce bien ?')) return
    setDeleteId(id)
    try {
      await propertyService.delete(id)
      setProperties((prev) => prev.filter((p) => p.id !== id))
    } catch { /* ignore */ }
    setDeleteId(null)
  }

  const statCards = stats ? [
    { label: 'Biens publiés', value: stats.properties.published, icon: Home, color: 'text-immo-600' },
    { label: 'Vues totales', value: stats.views.total, icon: Eye, color: 'text-blue-500' },
    { label: 'Nouveaux contacts', value: stats.contacts.new, icon: MessageSquare, color: 'text-green-500' },
    { label: 'Note moyenne', value: `${stats.ratings.average}/5`, icon: Star, color: 'text-amber-500' },
  ] : []

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tableau de bord Agent</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gérez vos biens et suivez vos performances</p>
        </div>
        <Button onClick={() => navigate('/agent/properties/new')} leftIcon={<Plus className="h-4 w-4" />}>
          Ajouter un bien
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-700 ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick links */}
      <div className="flex gap-3 mb-6">
        <Button variant="outline" size="sm" onClick={() => navigate('/agent/contacts')}>
          <MessageSquare className="h-4 w-4 mr-1" /> Messages {stats?.contacts.new ? `(${stats.contacts.new})` : ''}
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('/profile')}>
          <BarChart3 className="h-4 w-4 mr-1" /> Mon profil
        </Button>
      </div>

      {/* Properties list */}
      <Card>
        <CardHeader>
          <CardTitle>Mes biens ({pagination?.total ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-lg bg-gray-100 dark:bg-gray-700 animate-pulse" />)}</div>
          ) : properties.length === 0 ? (
            <EmptyState title="Aucun bien" description="Publiez votre premier bien immobilier."
              action={<Button onClick={() => navigate('/agent/properties/new')}>Ajouter un bien</Button>} />
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {properties.map((p) => (
                <div key={p.id} className="flex items-center gap-4 py-3">
                  <img src={p.main_image || '/placeholder.jpg'} alt="" className="h-14 w-20 rounded-lg object-cover bg-gray-200" />
                  <div className="flex-1 min-w-0">
                    <Link to={`/properties/${p.id}`} className="font-medium text-gray-900 dark:text-white hover:text-immo-600 truncate block">
                      {p.title}
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                      <span>{formatPrice(p.price)}</span>
                      <span>-</span>
                      <span>{p.city}</span>
                      <Badge variant={p.status === 'published' ? 'success' : p.status === 'draft' ? 'default' : 'warning'}>
                        {p.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{p.views_count ?? p.view_count}</span>
                    <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{p.contacts_count ?? p.contact_count}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/agent/properties/${p.id}/edit`)}>
                      <PenSquare className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)} isLoading={deleteId === p.id}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
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
