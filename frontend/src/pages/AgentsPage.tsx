import { useEffect, useState } from 'react'
import { Search, Star, Building2, Mail, Phone, ChevronLeft, ChevronRight, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { agentService } from '@/services/api'
import type { Agent } from '@/types'

export function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 })

  const fetchAgents = async (p: number = 1, q: string = '') => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await agentService.getAll({ page: p, search: q || undefined, per_page: 12 })
      if (response.data.success) {
        setAgents(response.data.data?.agents || [])
        setPagination(response.data.data?.pagination || { current_page: 1, last_page: 1, total: 0 })
        setPage(p)
      } else {
        setError(response.data.message || 'Erreur lors du chargement des agents')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAgents(1)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchAgents(1, search)
  }

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i <= Math.round(rating) ? 'fill-gold-400 text-gold-400' : 'text-gray-300'}`}
        />
      ))}
      <span className="ml-1 text-sm text-gray-500">({rating.toFixed(1)})</span>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-gradient-to-br from-immo-700 to-immo-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 text-center">
          <Users className="mx-auto h-12 w-12 mb-4" />
          <h1 className="text-3xl font-bold">Nos Agents</h1>
          <p className="mt-3 text-immo-100 max-w-xl mx-auto">
            Des professionnels certifiés pour vous accompagner dans votre projet immobilier.
          </p>
          <form onSubmit={handleSearch} className="mt-6 mx-auto max-w-md flex gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un agent, une agence..."
              className="bg-white/10 border-white/30 text-white placeholder:text-immo-200"
            />
            <Button type="submit" variant="secondary" leftIcon={<Search className="h-4 w-4" />}>
              Chercher
            </Button>
          </form>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6 h-48" />
              </Card>
            ))}
          </div>
        ) : agents.length === 0 ? (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">
            Aucun agent trouvé.
          </div>
        ) : (
          <>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              {pagination.total} agent{pagination.total > 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents.map((agent) => (
                <Card key={agent.id} isHoverable>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="h-16 w-16 rounded-full bg-immo-100 dark:bg-immo-900 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {agent.avatar ? (
                          <img src={agent.avatar} alt={agent.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-2xl font-bold text-immo-600">
                            {agent.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {agent.name}
                        </h3>
                        {agent.agency && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 truncate">
                            <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                            {agent.agency}
                          </p>
                        )}
                        {renderStars(agent.rating)}
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>{agent.properties_count} bien{agent.properties_count > 1 ? 's' : ''} publié{agent.properties_count > 1 ? 's' : ''}</span>
                      <span>{agent.rating_count} avis</span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-1 text-sm">
                      {agent.email && (
                        <a href={`mailto:${agent.email}`} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-immo-600 truncate">
                          <Mail className="h-4 w-4 flex-shrink-0" /> {agent.email}
                        </a>
                      )}
                      {agent.phone && (
                        <a href={`tel:${agent.phone}`} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-immo-600">
                          <Phone className="h-4 w-4 flex-shrink-0" /> {agent.phone}
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {pagination.last_page > 1 && (
              <div className="mt-10 flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => fetchAgents(page - 1, search)}
                  leftIcon={<ChevronLeft className="h-4 w-4" />}
                >
                  Précédent
                </Button>
                <span className="text-sm text-gray-500">
                  Page {pagination.current_page} / {pagination.last_page}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.last_page}
                  onClick={() => fetchAgents(page + 1, search)}
                  rightIcon={<ChevronRight className="h-4 w-4" />}
                >
                  Suivant
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
