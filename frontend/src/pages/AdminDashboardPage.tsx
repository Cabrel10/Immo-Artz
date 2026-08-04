import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, Home, Eye, DollarSign, Star, Shield, Key, TrendingUp,
  ArrowUpRight, Building2, BarChart3,
} from 'lucide-react'
import { adminService } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { AdminDashboardStats } from '@/types'
import { formatNumber, formatPrice } from '@/utils/format'

export function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminService.getDashboard()
      .then((r) => { if (r.data.success && r.data.data) setStats(r.data.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 text-center">
        <p className="text-gray-500">Impossible de charger les statistiques.</p>
      </div>
    )
  }

  const kpiCards = [
    { label: 'Utilisateurs', value: formatNumber(stats.users.total), sub: `${stats.users.new_this_month} ce mois`, icon: Users, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
    { label: 'Agents', value: formatNumber(stats.users.agents), sub: `${stats.users.visitors} visiteurs`, icon: Shield, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
    { label: 'Biens', value: formatNumber(stats.properties.total), sub: `${stats.properties.published} publiés`, icon: Home, color: 'text-immo-600 bg-immo-100 dark:bg-immo-900/30' },
    { label: 'En vedette', value: formatNumber(stats.properties.featured), sub: `${stats.properties.sold} vendus`, icon: Star, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
    { label: 'Vues totales', value: formatNumber(stats.views.total), sub: `${stats.views.today} aujourd'hui`, icon: Eye, color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
    { label: 'Vues ce mois', value: formatNumber(stats.views.this_month), sub: `${stats.views.this_week} cette semaine`, icon: TrendingUp, color: 'text-teal-600 bg-teal-100 dark:bg-teal-900/30' },
    { label: 'Revenu total', value: formatPrice(stats.revenue.total), sub: `${formatPrice(stats.revenue.this_month)} ce mois`, icon: DollarSign, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
    { label: 'Catalogue', value: formatNumber(stats.catalog.total_accesses), sub: `${stats.catalog.accesses_today} aujourd'hui`, icon: Key, color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Administration</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Vue d'ensemble de la plateforme IMMO</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <BarChart3 className="h-4 w-4 mr-1" /> Actualiser
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpiCards.map((kpi) => (
          <Card key={kpi.label} isHoverable>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{kpi.label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{kpi.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{kpi.sub}</p>
                </div>
                <div className={`p-2 rounded-lg ${kpi.color}`}>
                  <kpi.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actions rapides</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/admin/ratings">
          <Card isHoverable isClickable>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600">
                <Star className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">Modération avis</p>
                <p className="text-sm text-gray-500">Approuver / rejeter</p>
              </div>
              <ArrowUpRight className="h-5 w-5 text-gray-400" />
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/featured">
          <Card isHoverable isClickable>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-immo-100 dark:bg-immo-900/30 text-immo-600">
                <Building2 className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">Biens en vedette</p>
                <p className="text-sm text-gray-500">Gérer l'ordre</p>
              </div>
              <ArrowUpRight className="h-5 w-5 text-gray-400" />
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/catalog">
          <Card isHoverable isClickable>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600">
                <Key className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">Catalogue</p>
                <p className="text-sm text-gray-500">Mot de passe & logs</p>
              </div>
              <ArrowUpRight className="h-5 w-5 text-gray-400" />
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/agents">
          <Card isHoverable isClickable>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600">
                <Users className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">Agents</p>
                <p className="text-sm text-gray-500">{stats.users.agents} inscrits</p>
              </div>
              <ArrowUpRight className="h-5 w-5 text-gray-400" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Properties Status */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Statut des biens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Publiés', value: stats.properties.published, color: 'bg-green-500' },
                { label: 'En vedette', value: stats.properties.featured, color: 'bg-amber-500' },
                { label: 'Vendus', value: stats.properties.sold, color: 'bg-blue-500' },
                { label: 'Loués', value: stats.properties.rented, color: 'bg-purple-500' },
                { label: 'Total', value: stats.properties.total, color: 'bg-gray-500' },
              ].map((item) => (
                <div key={item.label} className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <div className={`w-3 h-3 rounded-full ${item.color} mx-auto mb-2`} />
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{item.value}</p>
                  <p className="text-xs text-gray-500">{item.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
