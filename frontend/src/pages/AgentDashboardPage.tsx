import { useCallback, useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  LayoutDashboard, Building2, Eye, Heart, MessageSquare,
  Plus, AlertCircle, CheckCircle, XCircle, Star, TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useAuth } from '@/hooks/useAuth'
import { propertyService, ratingService } from '@/services/api'
import type { Property } from '@/types'

interface DashboardProperty extends Property {
  views_count?: number
  favorites_count?: number
  contacts_count?: number
}

const STATUS_BADGES: Record<string, { label: string; variant: 'success' | 'warning' | 'default' | 'danger' }> = {
  published: { label: 'Publié', variant: 'success' },
  draft: { label: 'Brouillon', variant: 'default' },
  sold: { label: 'Vendu', variant: 'warning' },
  rented: { label: 'Loué', variant: 'warning' },
  archived: { label: 'Archivé', variant: 'danger' },
}

export function AgentDashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [properties, setProperties] = useState<DashboardProperty[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [ratingStats, setRatingStats] = useState<{ average: number; count: number } | null>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  const fetchData = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    setError(null)
    try {
      const [propsRes, ratingsRes] = await Promise.all([
        propertyService.getMyProperties(),
        ratingService.getStats(user.id).catch(() => null),
      ])
      if (propsRes.data.success) {
        setProperties(propsRes.data.data?.properties || [])
      }
      if (ratingsRes?.data?.success) {
        setRatingStats(ratingsRes.data.data)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur de chargement du tableau de bord')
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || (user && user.role !== 'agent' && user.role !== 'admin')) {
        navigate('/')
        return
      }
      fetchData()
    }
  }, [authLoading, isAuthenticated, user, navigate, fetchData])

  const handlePublish = async (p: DashboardProperty) => {
    setActionLoading(p.id)
    setMessage(null)
    try {
      await propertyService.update(p.id, { status: 'published' })
      setMessage(`« ${p.title} » publié avec succès.`)
      fetchData()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la publication')
    } finally {
      setActionLoading(null)
    }
  }

  const handleArchive = async (p: DashboardProperty) => {
    setActionLoading(p.id)
    setMessage(null)
    try {
      await propertyService.update(p.id, { status: 'archived' })
      setMessage(`« ${p.title} » archivé.`)
      fetchData()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'archivage')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (p: DashboardProperty) => {
    if (!window.confirm(`Supprimer définitivement « ${p.title} » ?`)) return
    setActionLoading(p.id)
    try {
      await propertyService.delete(p.id)
      setMessage(`« ${p.title} » supprimé.`)
      fetchData()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression')
    } finally {
      setActionLoading(null)
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Chargement du tableau de bord...</div>
      </div>
    )
  }

  const published = properties.filter((p) => p.status === 'published').length
  const totalViews = properties.reduce((sum, p) => sum + (p.views_count ?? p.view_count ?? 0), 0)
  const totalContacts = properties.reduce((sum, p) => sum + (p.contacts_count ?? p.contact_count ?? 0), 0)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-gradient-to-br from-immo-700 to-immo-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <LayoutDashboard className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">Tableau de bord Agent</h1>
                <p className="text-immo-200">{user?.full_name} {user?.agency_name ? `— ${user.agency_name}` : ''}</p>
              </div>
            </div>
            <Button variant="secondary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate('/properties/new')}>
              Nouveau bien
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {message && (
          <div className="mb-6 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" /> {message}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" /> {error}
          </div>
        )}

        {/* Statistiques */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card><CardContent className="p-4 text-center">
            <Building2 className="h-6 w-6 mx-auto mb-2 text-immo-600" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{properties.length}</p>
            <p className="text-xs text-gray-500">Biens total</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{published}</p>
            <p className="text-xs text-gray-500">Publiés</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <Eye className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalViews}</p>
            <p className="text-xs text-gray-500">Vues</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <MessageSquare className="h-6 w-6 mx-auto mb-2 text-purple-600" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalContacts}</p>
            <p className="text-xs text-gray-500">Contacts</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <Star className="h-6 w-6 mx-auto mb-2 text-gold-500" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {ratingStats ? ratingStats.average.toFixed(1) : (user?.rating_average?.toFixed(1) ?? '—')}
            </p>
            <p className="text-xs text-gray-500">
              Note ({ratingStats?.count ?? user?.rating_count ?? 0} avis)
            </p>
          </CardContent></Card>
        </div>

        {/* Liste des biens */}
        <Card>
          <CardHeader>
            <CardTitle>Mes biens</CardTitle>
          </CardHeader>
          <CardContent>
            {properties.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <Building2 className="mx-auto h-12 w-12 mb-4 text-gray-300" />
                <p>Vous n'avez pas encore de bien. Créez votre première annonce.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                      <th className="pb-3 pr-4">Bien</th>
                      <th className="pb-3 pr-4">Prix</th>
                      <th className="pb-3 pr-4">Statut</th>
                      <th className="pb-3 pr-4 text-center"><Eye className="h-4 w-4 inline" /></th>
                      <th className="pb-3 pr-4 text-center"><Heart className="h-4 w-4 inline" /></th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {properties.map((p) => {
                      const status = STATUS_BADGES[p.status] || STATUS_BADGES.draft
                      return (
                        <tr key={p.id}>
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={p.main_image || '/placeholder-property.jpg'}
                                alt=""
                                className="h-10 w-14 rounded object-cover"
                              />
                              <div>
                                <Link to={`/properties/${p.id}`} className="font-medium text-gray-900 dark:text-white hover:text-immo-600">
                                  {p.title}
                                </Link>
                                <p className="text-xs text-gray-500">{p.type_label} — {p.city}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 pr-4 whitespace-nowrap">{p.formatted_price}</td>
                          <td className="py-3 pr-4"><Badge variant={status.variant}>{status.label}</Badge></td>
                          <td className="py-3 pr-4 text-center">{p.views_count ?? p.view_count}</td>
                          <td className="py-3 pr-4 text-center">{p.favorites_count ?? 0}</td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {p.status === 'draft' && (
                                <Button size="sm" variant="ghost" isLoading={actionLoading === p.id}
                                  onClick={() => handlePublish(p)} title="Publier">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </Button>
                              )}
                              {p.status === 'published' && (
                                <Button size="sm" variant="ghost" isLoading={actionLoading === p.id}
                                  onClick={() => handleArchive(p)} title="Archiver">
                                  <XCircle className="h-4 w-4 text-yellow-600" />
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" isLoading={actionLoading === p.id}
                                onClick={() => handleDelete(p)} title="Supprimer">
                                <AlertCircle className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
