import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Key, RefreshCw, Building2, Users, Star,
  Eye, AlertCircle, CheckCircle, Copy, History, TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useAuth } from '@/hooks/useAuth'
import { adminService, agentService, catalogService, ratingService } from '@/services/api'
import type { Agent, CatalogPasswordHistoryItem, CatalogPasswordInfo, Rating } from '@/types'

type Tab = 'dashboard' | 'catalog' | 'properties' | 'agents' | 'ratings'

interface AdminProperty {
  id: number
  title: string
  type: string
  standing: string
  price: string
  status: string
  is_featured: boolean
  is_premium: boolean
  view_count: number
  created_at: string
  agent: string | null
}

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { id: 'catalog', label: 'Catalogue (MDP)', icon: Key },
  { id: 'properties', label: 'Biens', icon: Building2 },
  { id: 'agents', label: 'Agents', icon: Users },
  { id: 'ratings', label: 'Avis', icon: Star },
]

const AGENT_STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger'> = {
  active: 'success',
  inactive: 'warning',
  suspended: 'danger',
}

export function AdminPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [tab, setTab] = useState<Tab>('dashboard')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  // Dashboard
  const [stats, setStats] = useState<any>(null)

  // Catalogue
  const [currentPassword, setCurrentPassword] = useState<CatalogPasswordInfo | null>(null)
  const [history, setHistory] = useState<CatalogPasswordHistoryItem[]>([])
  const [catalogStats, setCatalogStats] = useState<any>(null)
  const [copied, setCopied] = useState(false)

  // Biens
  const [properties, setProperties] = useState<AdminProperty[]>([])
  const [propertiesPagination, setPropertiesPagination] = useState({ current_page: 1, last_page: 1, total: 0 })

  // Agents
  const [agents, setAgents] = useState<Agent[]>([])

  // Avis
  const [pendingRatings, setPendingRatings] = useState<Rating[]>([])

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true); setError(null)
    try {
      const res = await adminService.getDashboard()
      if (res.data.success) setStats(res.data.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur de chargement du dashboard')
    } finally { setIsLoading(false) }
  }, [])

  const fetchCatalog = useCallback(async () => {
    setIsLoading(true); setError(null)
    try {
      const [pwdRes, histRes, statsRes] = await Promise.all([
        catalogService.getCurrentPassword().catch(() => null),
        catalogService.getHistory().catch(() => null),
        catalogService.getStats().catch(() => null),
      ])
      if (pwdRes?.data?.success) setCurrentPassword(pwdRes.data.data)
      else setCurrentPassword(null)
      if (histRes?.data?.success) setHistory(histRes.data.data?.passwords || [])
      if (statsRes?.data?.success) setCatalogStats(statsRes.data.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur de chargement du catalogue')
    } finally { setIsLoading(false) }
  }, [])

  const fetchProperties = useCallback(async (page = 1) => {
    setIsLoading(true); setError(null)
    try {
      const res = await adminService.getProperties({ page, per_page: 15 })
      if (res.data.success) {
        setProperties(res.data.data?.properties || [])
        setPropertiesPagination(res.data.data?.pagination || { current_page: 1, last_page: 1, total: 0 })
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur de chargement des biens')
    } finally { setIsLoading(false) }
  }, [])

  const fetchAgents = useCallback(async () => {
    setIsLoading(true); setError(null)
    try {
      const res = await agentService.adminGetAll({ per_page: 50 })
      if (res.data.success) setAgents(res.data.data?.agents || [])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur de chargement des agents')
    } finally { setIsLoading(false) }
  }, [])

  const fetchRatings = useCallback(async () => {
    setIsLoading(true); setError(null)
    try {
      const res = await ratingService.getPending()
      if (res.data.success) setPendingRatings(res.data.data?.ratings || [])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur de chargement des avis')
    } finally { setIsLoading(false) }
  }, [])

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || user?.role !== 'admin') {
        navigate('/')
        return
      }
      fetchDashboard()
    }
  }, [authLoading, isAuthenticated, user, navigate, fetchDashboard])

  useEffect(() => {
    if (!user || user.role !== 'admin') return
    if (tab === 'dashboard') fetchDashboard()
    if (tab === 'catalog') fetchCatalog()
    if (tab === 'properties') fetchProperties()
    if (tab === 'agents') fetchAgents()
    if (tab === 'ratings') fetchRatings()
  }, [tab, user, fetchDashboard, fetchCatalog, fetchProperties, fetchAgents, fetchRatings])

  // ==================== ACTIONS ====================

  const handleRotatePassword = async () => {
    if (!window.confirm('Générer un nouveau mot de passe catalogue ? L\'ancien sera désactivé immédiatement.')) return
    setIsLoading(true); setError(null); setMessage(null)
    try {
      const res = await catalogService.rotatePassword()
      if (res.data.success) {
        setMessage(`Nouveau mot de passe généré : ${res.data.data?.password}`)
        fetchCatalog()
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la rotation')
    } finally { setIsLoading(false) }
  }

  const handleCopyPassword = async (pwd: string) => {
    try {
      await navigator.clipboard.writeText(pwd)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Impossible de copier dans le presse-papiers')
    }
  }

  const handleToggleFeatured = async (p: AdminProperty) => {
    setError(null); setMessage(null)
    try {
      const res = await adminService.toggleFeatured(p.id, !p.is_featured)
      if (res.data.success) {
        setMessage(res.data.message)
        fetchProperties(propertiesPagination.current_page)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la mise en vedette')
    }
  }

  const handleAgentStatus = async (agent: Agent, status: string) => {
    setError(null); setMessage(null)
    try {
      const res = await agentService.adminUpdateStatus(agent.id, status)
      if (res.data.success) {
        setMessage(`Statut de ${agent.name} → ${status}`)
        fetchAgents()
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur de mise à jour du statut')
    }
  }

  const handleRating = async (id: number, action: 'approve' | 'reject') => {
    setError(null); setMessage(null)
    try {
      const res = action === 'approve' ? await ratingService.approve(id) : await ratingService.reject(id)
      if (res.data.success) {
        setMessage(`Avis ${action === 'approve' ? 'approuvé' : 'rejeté'}.`)
        fetchRatings()
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la modération')
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Chargement...</div>
      </div>
    )
  }

  // ==================== RENDER ====================

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-5">
          <Users className="h-6 w-6 text-immo-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.users?.total ?? '—'}</p>
          <p className="text-xs text-gray-500">Utilisateurs ({stats?.users?.agents ?? 0} agents)</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <Building2 className="h-6 w-6 text-green-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.properties?.total ?? '—'}</p>
          <p className="text-xs text-gray-500">Biens ({stats?.properties?.published ?? 0} publiés)</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <Eye className="h-6 w-6 text-blue-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.views?.total ?? '—'}</p>
          <p className="text-xs text-gray-500">Vues totales</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <TrendingUp className="h-6 w-6 text-gold-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats?.revenue?.total ? `${Number(stats.revenue.total).toLocaleString('fr-FR')} F` : '—'}
          </p>
          <p className="text-xs text-gray-500">Revenus catalogue</p>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Biens par statut</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Publiés</span><Badge variant="success">{stats?.properties?.published ?? 0}</Badge></div>
            <div className="flex justify-between"><span>En vedette</span><Badge variant="primary">{stats?.properties?.featured ?? 0}</Badge></div>
            <div className="flex justify-between"><span>Vendus</span><Badge variant="warning">{stats?.properties?.sold ?? 0}</Badge></div>
            <div className="flex justify-between"><span>Loués</span><Badge variant="warning">{stats?.properties?.rented ?? 0}</Badge></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Catalogue</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Accès totaux</span><Badge>{stats?.catalog?.total_accesses ?? 0}</Badge></div>
            <div className="flex justify-between"><span>Accès aujourd'hui</span><Badge variant="primary">{stats?.catalog?.accesses_today ?? 0}</Badge></div>
            <div className="flex justify-between"><span>Utilisations MDP actuel</span><Badge variant="secondary">{stats?.catalog?.current_password_uses ?? 0}</Badge></div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderCatalog = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-gold-500" />
              Mot de passe actuel
            </CardTitle>
            <Button size="sm" onClick={handleRotatePassword} isLoading={isLoading}
              leftIcon={<RefreshCw className="h-4 w-4" />}>
              Générer un nouveau MDP
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {currentPassword ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-immo-50 dark:bg-immo-900/30 border border-immo-200 dark:border-immo-800">
                <code className="text-2xl font-mono font-bold tracking-widest text-immo-700 dark:text-immo-300">
                  {currentPassword.password}
                </code>
                <Button size="sm" variant="ghost" onClick={() => handleCopyPassword(currentPassword.password)}>
                  {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <p className="text-xs text-gray-500">Valide jusqu'au</p>
                  <p className="font-medium">{new Date(currentPassword.valid_until).toLocaleString('fr-FR')}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <p className="text-xs text-gray-500">Temps restant</p>
                  <p className="font-medium">{currentPassword.time_remaining ?? '—'}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <p className="text-xs text-gray-500">Utilisations</p>
                  <p className="font-medium">{currentPassword.current_uses ?? 0} / {currentPassword.max_uses ?? '∞'}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <p className="text-xs text-gray-500">Restantes</p>
                  <p className="font-medium">{currentPassword.uses_remaining}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="mx-auto h-10 w-10 mb-3 text-yellow-500" />
              <p>Aucun mot de passe actif. Générez-en un pour ouvrir l'accès au catalogue.</p>
              <Button className="mt-4" onClick={handleRotatePassword} leftIcon={<Key className="h-4 w-4" />}>
                Générer un mot de passe
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {catalogStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card><CardContent className="p-4 text-center">
            <p className="text-xl font-bold">{catalogStats.total_accesses}</p>
            <p className="text-xs text-gray-500">Accès totaux</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <p className="text-xl font-bold text-green-600">{catalogStats.successful_accesses}</p>
            <p className="text-xs text-gray-500">Réussis</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <p className="text-xl font-bold text-red-600">{catalogStats.failed_accesses}</p>
            <p className="text-xs text-gray-500">Échoués</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <p className="text-xl font-bold">{catalogStats.unique_ips}</p>
            <p className="text-xs text-gray-500">IP uniques</p>
          </CardContent></Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-gray-500" />
            Historique des mots de passe
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-gray-500">Aucun historique.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-2 pr-4">Mot de passe</th>
                    <th className="pb-2 pr-4">Validité</th>
                    <th className="pb-2 pr-4">Utilisations</th>
                    <th className="pb-2">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {history.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2 pr-4 font-mono">{p.password}</td>
                      <td className="py-2 pr-4 text-xs">
                        {new Date(p.valid_from).toLocaleDateString('fr-FR')} → {new Date(p.valid_until).toLocaleString('fr-FR')}
                      </td>
                      <td className="py-2 pr-4">{p.current_uses} / {p.max_uses}</td>
                      <td className="py-2">
                        <Badge variant={p.is_valid ? 'success' : p.is_active ? 'warning' : 'default'}>
                          {p.is_valid ? 'Valide' : p.is_active ? 'Actif (hors fenêtre)' : 'Inactif'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  const renderProperties = () => (
    <Card>
      <CardHeader><CardTitle>Gestion des biens</CardTitle></CardHeader>
      <CardContent>
        {properties.length === 0 ? (
          <p className="text-sm text-gray-500 py-6 text-center">Aucun bien.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-2 pr-4">Bien</th>
                  <th className="pb-2 pr-4">Type</th>
                  <th className="pb-2 pr-4">Prix</th>
                  <th className="pb-2 pr-4">Agent</th>
                  <th className="pb-2 pr-4">Statut</th>
                  <th className="pb-2 text-right">Vedette</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {properties.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2 pr-4 font-medium text-gray-900 dark:text-white max-w-[200px] truncate">{p.title}</td>
                    <td className="py-2 pr-4">{p.type}</td>
                    <td className="py-2 pr-4 whitespace-nowrap">{p.price}</td>
                    <td className="py-2 pr-4">{p.agent ?? '—'}</td>
                    <td className="py-2 pr-4"><Badge>{p.status}</Badge></td>
                    <td className="py-2 text-right">
                      <Button
                        size="sm"
                        variant={p.is_featured ? 'secondary' : 'outline'}
                        onClick={() => handleToggleFeatured(p)}
                      >
                        {p.is_featured ? 'Retirer' : 'Mettre en vedette'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {propertiesPagination.last_page > 1 && (
              <div className="mt-4 flex justify-center gap-3">
                <Button size="sm" variant="outline" disabled={propertiesPagination.current_page <= 1}
                  onClick={() => fetchProperties(propertiesPagination.current_page - 1)}>
                  Précédent
                </Button>
                <span className="text-sm self-center text-gray-500">
                  {propertiesPagination.current_page} / {propertiesPagination.last_page}
                </span>
                <Button size="sm" variant="outline" disabled={propertiesPagination.current_page >= propertiesPagination.last_page}
                  onClick={() => fetchProperties(propertiesPagination.current_page + 1)}>
                  Suivant
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )

  const renderAgents = () => (
    <Card>
      <CardHeader><CardTitle>Gestion des agents</CardTitle></CardHeader>
      <CardContent>
        {agents.length === 0 ? (
          <p className="text-sm text-gray-500 py-6 text-center">Aucun agent enregistré.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-2 pr-4">Agent</th>
                  <th className="pb-2 pr-4">Agence</th>
                  <th className="pb-2 pr-4">Biens</th>
                  <th className="pb-2 pr-4">Note</th>
                  <th className="pb-2 pr-4">Statut</th>
                  <th className="pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {agents.map((a) => (
                  <tr key={a.id}>
                    <td className="py-2 pr-4">
                      <p className="font-medium text-gray-900 dark:text-white">{a.name}</p>
                      <p className="text-xs text-gray-500">{a.email}</p>
                    </td>
                    <td className="py-2 pr-4">{a.agency ?? '—'}</td>
                    <td className="py-2 pr-4">{a.properties_count}</td>
                    <td className="py-2 pr-4">{a.rating?.toFixed(1)} ({a.rating_count})</td>
                    <td className="py-2 pr-4">
                      <Badge variant={AGENT_STATUS_VARIANT[a.status || 'active'] || 'default'}>{a.status}</Badge>
                    </td>
                    <td className="py-2 text-right">
                      <div className="flex justify-end gap-1">
                        {a.status !== 'active' && (
                          <Button size="sm" variant="outline" onClick={() => handleAgentStatus(a, 'active')}>Activer</Button>
                        )}
                        {a.status !== 'suspended' && (
                          <Button size="sm" variant="ghost" onClick={() => handleAgentStatus(a, 'suspended')}>Suspendre</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )

  const renderRatings = () => (
    <Card>
      <CardHeader><CardTitle>Avis en attente de modération</CardTitle></CardHeader>
      <CardContent>
        {pendingRatings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="mx-auto h-10 w-10 mb-3 text-green-500" />
            <p>Aucun avis en attente. Tout est modéré.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRatings.map((r) => (
              <div key={r.id} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">{r.rater_name}</span>
                      <span className="text-gold-500 text-sm">{'★'.repeat(r.score)}{'☆'.repeat(5 - r.score)}</span>
                    </div>
                    {r.agent && <p className="text-xs text-gray-500">Agent : {r.agent.name}</p>}
                    {r.comment && <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{r.comment}</p>}
                    <p className="mt-1 text-xs text-gray-400">{new Date(r.created_at).toLocaleString('fr-FR')}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button size="sm" onClick={() => handleRating(r.id, 'approve')}>Approuver</Button>
                    <Button size="sm" variant="danger" onClick={() => handleRating(r.id, 'reject')}>Rejeter</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-gradient-to-br from-gray-800 to-gray-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <LayoutDashboard className="h-7 w-7" />
            Administration IMMO
          </h1>
          <p className="mt-1 text-gray-400 text-sm">Connecté en tant que {user?.full_name}</p>
        </div>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setError(null); setMessage(null) }}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                tab === t.id
                  ? 'border-immo-600 text-immo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
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

        {isLoading && tab !== 'catalog' ? (
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          </div>
        ) : (
          <>
            {tab === 'dashboard' && renderDashboard()}
            {tab === 'catalog' && renderCatalog()}
            {tab === 'properties' && renderProperties()}
            {tab === 'agents' && renderAgents()}
            {tab === 'ratings' && renderRatings()}
          </>
        )}
      </div>
    </div>
  )
}
