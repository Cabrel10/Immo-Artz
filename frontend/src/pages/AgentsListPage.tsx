import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Star, Loader2 } from 'lucide-react'
import { agentService } from '@/services/api'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { PaginationNav } from '@/components/ui/Pagination'
import { EmptyState } from '@/components/ui/EmptyState'
import type { AgentPublicProfile, Pagination } from '@/types'

export function AgentsListPage() {
  const [agents, setAgents] = useState<AgentPublicProfile[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)

  const fetchAgents = (p: number, q: string) => {
    setLoading(true)
    agentService.getAll({ page: p, per_page: 12, search: q || undefined })
      .then((r) => {
        if (r.data.success && r.data.data) {
          setAgents(r.data.data.agents ?? [])
          setPagination(r.data.data.pagination ?? null)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchAgents(page, search) }, [page])

  const handleSearch = (value: string) => {
    setSearch(value)
    if (searchTimeout) clearTimeout(searchTimeout)
    const t = setTimeout(() => {
      setPage(1)
      fetchAgents(1, value)
    }, 400)
    setSearchTimeout(t)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero */}
      <div className="bg-gradient-to-br from-immo-600 to-immo-800 text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-bold">Nos agents immobiliers</h1>
          <p className="mt-2 text-immo-100 max-w-xl mx-auto">
            Trouvez l'agent qui vous accompagnera dans votre projet immobilier au Cameroun
          </p>
          <div className="mt-6 max-w-md mx-auto">
            <Input
              placeholder="Rechercher un agent..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              leftIcon={<Search className="h-5 w-5" />}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-immo-600" />
          </div>
        ) : agents.length === 0 ? (
          <EmptyState
            icon={<Search className="h-16 w-16" />}
            title="Aucun agent trouve"
            description={search ? `Aucun resultat pour "${search}"` : 'Aucun agent inscrit pour le moment.'}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {agents.map((agent) => (
                <Link key={agent.id} to={`/agents/${agent.id}`}>
                  <Card isHoverable isClickable className="h-full">
                    <CardContent className="p-6 text-center">
                      <div className="mx-auto h-20 w-20 rounded-full bg-immo-100 dark:bg-immo-900 flex items-center justify-center mb-4">
                        {agent.avatar ? (
                          <img src={agent.avatar} alt={agent.name} className="h-20 w-20 rounded-full object-cover" />
                        ) : (
                          <span className="text-2xl font-bold text-immo-600">
                            {agent.first_name.charAt(0)}{agent.last_name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{agent.name}</h3>
                      {agent.agency_name && (
                        <p className="text-sm text-gray-500 mt-1">{agent.agency_name}</p>
                      )}
                      <div className="flex items-center justify-center gap-1 mt-2">
                        <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                        <span className="text-sm font-medium">{agent.rating_average.toFixed(1)}</span>
                        <span className="text-xs text-gray-500">({agent.rating_count} avis)</span>
                      </div>
                      {agent.bio && (
                        <p className="text-xs text-gray-500 mt-3 line-clamp-2">{agent.bio}</p>
                      )}
                      <Badge variant="primary" className="mt-3">Voir le profil</Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
            {pagination && <PaginationNav pagination={pagination} onPageChange={setPage} />}
          </>
        )}
      </div>
    </div>
  )
}
