import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Star, MapPin, Phone, Mail, ArrowLeft, Home, Calendar, Building2, Loader2, MessageSquare,
} from 'lucide-react'
import { agentService, ratingService } from '@/services/api'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatPrice, formatDate, formatRelativeTime } from '@/utils/format'
import { STANDING_COLORS } from '@/types'
import type { AgentPublicProfile, Property, Rating, RatingStats } from '@/types'

export function AgentProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [agent, setAgent] = useState<AgentPublicProfile | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [ratings, setRatings] = useState<Rating[]>([])
  const [ratingStats, setRatingStats] = useState<RatingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      agentService.getById(id),
      ratingService.getByAgent(id, { per_page: 5 }),
      ratingService.getStats(id).catch(() => null),
    ])
      .then(([agentRes, ratingsRes, statsRes]) => {
        if (agentRes.data.success && agentRes.data.data) {
          setAgent(agentRes.data.data.agent)
          setProperties(agentRes.data.data.properties ?? [])
        }
        if (ratingsRes.data.success && ratingsRes.data.data) {
          setRatings(ratingsRes.data.data.ratings ?? [])
        }
        if (statsRes?.data.success && statsRes?.data.data) {
          setRatingStats(statsRes.data.data)
        }
      })
      .catch(() => setError('Agent introuvable'))
      .finally(() => setLoading(false))
  }, [id])

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-immo-600" />
      </div>
    )
  }

  if (error || !agent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Agent introuvable</h2>
        <Button className="mt-4" onClick={() => navigate('/agents')} leftIcon={<ArrowLeft className="h-4 w-4" />}>
          Retour aux agents
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-br from-immo-600 to-immo-800 text-white">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Retour
          </button>
          <div className="flex items-center gap-6">
            <div className="h-24 w-24 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              {agent.avatar ? (
                <img src={agent.avatar} alt={agent.name} className="h-24 w-24 rounded-full object-cover" />
              ) : (
                <span className="text-3xl font-bold">{agent.first_name.charAt(0)}{agent.last_name.charAt(0)}</span>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{agent.name}</h1>
              {agent.agency_name && (
                <p className="flex items-center gap-2 mt-1 text-white/80">
                  <Building2 className="h-4 w-4" /> {agent.agency_name}
                </p>
              )}
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                  <span className="font-semibold">{agent.rating_average.toFixed(1)}</span>
                  <span className="text-white/70">({agent.rating_count} avis)</span>
                </div>
                <span className="text-white/50">|</span>
                <span className="text-white/80 flex items-center gap-1">
                  <Calendar className="h-4 w-4" /> Membre depuis {formatDate(agent.created_at)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Bio */}
            {agent.bio && (
              <Card>
                <CardHeader><CardTitle>A propos</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">{agent.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Properties */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-immo-600" />
                  Biens actifs ({properties.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {properties.length === 0 ? (
                  <EmptyState title="Aucun bien" description="Cet agent n'a pas de bien actif." />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {properties.map((p) => (
                      <Link key={p.id} to={`/properties/${p.id}`}>
                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
                          <img
                            src={p.main_image || p.images?.[0] || '/placeholder.jpg'}
                            alt={p.title}
                            className="w-full h-36 object-cover"
                          />
                          <div className="p-3">
                            <h4 className="font-medium text-gray-900 dark:text-white line-clamp-1">{p.title}</h4>
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                              <MapPin className="h-3 w-3" /> {p.city}
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <span className="font-bold text-immo-600">{formatPrice(p.price)}</span>
                              <Badge className={`${STANDING_COLORS[p.standing]} text-white border-0 text-[10px]`}>
                                {p.standing_label}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ratings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-amber-500" />
                  Avis ({agent.rating_count})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Rating Distribution */}
                {ratingStats && (
                  <div className="mb-6 space-y-2">
                    {[5, 4, 3, 2, 1].map((n) => {
                      const count = ratingStats.distribution[n] ?? 0
                      const pct = ratingStats.count > 0 ? (count / ratingStats.count) * 100 : 0
                      return (
                        <div key={n} className="flex items-center gap-2 text-sm">
                          <span className="w-6 text-right">{n}</span>
                          <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-8 text-gray-500 text-right">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
                {ratings.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">Aucun avis pour le moment.</p>
                ) : (
                  <div className="space-y-4">
                    {ratings.map((r) => (
                      <div key={r.id} className="border-b border-gray-100 dark:border-gray-800 pb-4 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-medium">
                            {r.rater_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900 dark:text-white">{r.rater_name}</p>
                            <div className="flex items-center gap-2">
                              {renderStars(r.score)}
                              <span className="text-xs text-gray-500">{formatRelativeTime(r.created_at)}</span>
                            </div>
                          </div>
                        </div>
                        {r.comment && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 ml-11">{r.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Contact</h3>
                <div className="space-y-3">
                  {agent.phone && (
                    <a
                      href={`tel:${agent.phone}`}
                      className="flex items-center gap-3 p-3 rounded-lg bg-immo-50 dark:bg-immo-900/20 text-immo-700 dark:text-immo-300 hover:bg-immo-100 transition-colors"
                    >
                      <Phone className="h-5 w-5" />
                      <span>{agent.phone}</span>
                    </a>
                  )}
                  {agent.email && (
                    <a
                      href={`mailto:${agent.email}`}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 transition-colors"
                    >
                      <Mail className="h-5 w-5" />
                      <span className="truncate">{agent.email}</span>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>

            {agent.license_number && (
              <Card>
                <CardContent className="p-6">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Licence</p>
                  <p className="font-mono text-sm mt-1 text-gray-900 dark:text-white">{agent.license_number}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
