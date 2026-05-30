import { useState, useEffect } from 'react'
import { Key, RefreshCw, Clock, Users, Hash, Shield, Copy, Check } from 'lucide-react'
import { catalogService } from '@/services/api'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { PaginationNav } from '@/components/ui/Pagination'
import { useToast } from '@/hooks/useToast'
import { Toaster } from '@/components/ui/Toaster'
import { formatDateTime, formatNumber } from '@/utils/format'
import type { CatalogPassword, Pagination } from '@/types'

export function AdminCatalogPage() {
  const [current, setCurrent] = useState<CatalogPassword | null>(null)
  const [history, setHistory] = useState<CatalogPassword[]>([])
  const [histPagination, setHistPagination] = useState<Pagination | null>(null)
  const [stats, setStats] = useState<Record<string, number> | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [rotating, setRotating] = useState(false)
  const [copied, setCopied] = useState(false)
  const toast = useToast()

  const fetchAll = () => {
    setLoading(true)
    Promise.all([
      catalogService.getCurrentPassword().catch(() => null),
      catalogService.getHistory({ page, per_page: 10 }).catch(() => null),
      catalogService.getStats().catch(() => null),
    ]).then(([currentRes, histRes, statsRes]) => {
      if (currentRes?.data.success && currentRes?.data.data) setCurrent(currentRes.data.data)
      if (histRes?.data.success && histRes?.data.data) {
        setHistory(histRes.data.data.passwords ?? [])
        setHistPagination(histRes.data.data.pagination ?? null)
      }
      if (statsRes?.data.success && statsRes?.data.data) setStats(statsRes.data.data)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { fetchAll() }, [page])

  const handleRotate = async () => {
    if (!confirm('Etes-vous sur de vouloir generer un nouveau mot de passe? L\'ancien sera invalide.')) return
    setRotating(true)
    try {
      const r = await catalogService.rotatePassword()
      if (r.data.success) {
        toast.success('Nouveau mot de passe genere', r.data.data?.password)
        fetchAll()
      }
    } catch {
      toast.error('Erreur', 'Impossible de generer un nouveau mot de passe')
    }
    setRotating(false)
  }

  const copyPassword = () => {
    if (!current?.password) return
    navigator.clipboard.writeText(current.password).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Toaster toasts={toast.toasts} onRemove={toast.removeToast} />

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion du Catalogue</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Mot de passe rotatif et historique des acces</p>
        </div>
        <Button
          onClick={handleRotate}
          isLoading={rotating}
          leftIcon={<RefreshCw className="h-4 w-4" />}
          variant="danger"
        >
          Rotation du mot de passe
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Acces total', value: formatNumber(stats.total_accesses ?? 0), icon: Users, color: 'text-blue-600' },
            { label: 'Aujourd\'hui', value: formatNumber(stats.accesses_today ?? 0), icon: Clock, color: 'text-green-600' },
            { label: 'Utilisations', value: formatNumber(stats.current_password_uses ?? 0), icon: Hash, color: 'text-amber-600' },
            { label: 'Mots de passe', value: formatNumber(stats.total_passwords ?? 0), icon: Shield, color: 'text-purple-600' },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                  <div>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                    <p className="text-xs text-gray-500">{s.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Current Password */}
      {current && (
        <Card className="mb-8 border-immo-200 dark:border-immo-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-immo-600" />
              Mot de passe actuel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 flex items-center gap-3">
                <code className="text-3xl font-mono font-bold tracking-widest text-immo-600 bg-immo-50 dark:bg-immo-900/20 px-6 py-3 rounded-lg">
                  {current.password}
                </code>
                <Button variant="ghost" size="sm" onClick={copyPassword}>
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <Badge variant={current.is_valid ? 'success' : 'danger'} size="md">
                {current.is_valid ? 'Actif' : 'Expire'}
              </Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Valide depuis</p>
                <p className="font-medium text-gray-900 dark:text-white">{formatDateTime(current.valid_from)}</p>
              </div>
              <div>
                <p className="text-gray-500">Expire le</p>
                <p className="font-medium text-gray-900 dark:text-white">{formatDateTime(current.valid_until)}</p>
              </div>
              <div>
                <p className="text-gray-500">Utilisations</p>
                <p className="font-medium text-gray-900 dark:text-white">{current.current_uses} / {current.max_uses}</p>
              </div>
              <div>
                <p className="text-gray-500">Temps restant</p>
                <p className="font-medium text-gray-900 dark:text-white">{current.time_remaining ?? 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des mots de passe</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-2 font-medium text-gray-500">Mot de passe</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500">Valide depuis</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500">Expire le</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-500">Utilisations</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-500">Statut</th>
                </tr>
              </thead>
              <tbody>
                {history.map((pwd) => (
                  <tr key={pwd.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-2">
                      <code className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {pwd.password}
                      </code>
                    </td>
                    <td className="py-3 px-2 text-gray-600 dark:text-gray-400">{formatDateTime(pwd.valid_from)}</td>
                    <td className="py-3 px-2 text-gray-600 dark:text-gray-400">{formatDateTime(pwd.valid_until)}</td>
                    <td className="py-3 px-2 text-center">{pwd.current_uses} / {pwd.max_uses}</td>
                    <td className="py-3 px-2 text-center">
                      <Badge variant={pwd.is_valid ? 'success' : pwd.is_active ? 'warning' : 'default'}>
                        {pwd.is_valid ? 'Actif' : pwd.is_active ? 'Expire' : 'Inactive'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {histPagination && <PaginationNav pagination={histPagination} onPageChange={setPage} />}
        </CardContent>
      </Card>
    </div>
  )
}
