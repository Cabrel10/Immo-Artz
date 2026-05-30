import { useState } from 'react'
import { Lock, Unlock, Download, Eye, Clock, Users, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PaymentModal } from '@/components/PaymentModal'
import { catalogService } from '@/services/api'
import type { CatalogAccess } from '@/types'

export function CatalogPage() {
  const [password, setPassword] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [access, setAccess] = useState<CatalogAccess | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsVerifying(true)

    try {
      const response = await catalogService.verifyPassword(password)
      if (response.data.success && response.data.data) {
        setAccess(response.data.data)
      } else {
        setError(response.data.message || 'Mot de passe invalide')
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string; error_code?: string } } }
      if (axiosError.response?.data?.error_code === 'RATE_LIMITED') {
        setError('Trop de tentatives. Veuillez réessayer dans une heure.')
      } else {
        setError(axiosError.response?.data?.message || 'Erreur de vérification')
      }
    } finally {
      setIsVerifying(false)
    }
  }

  const handleDownload = async () => {
    if (!access) return
    
    try {
      const response = await catalogService.download(password)
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `immo-catalogue-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch {
      setError('Erreur lors du téléchargement')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero */}
      <div className="bg-gradient-to-br from-gold-500 to-gold-600 text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center">
          <Lock className="mx-auto h-16 w-16 mb-6" />
          <h1 className="text-4xl font-bold">Catalogue Premium</h1>
          <p className="mt-4 text-lg text-gold-100 max-w-2xl mx-auto">
            Accédez à notre sélection exclusive de propriétés haut de gamme avec notre catalogue PDF.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {!access ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Access Form */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                J'ai déjà un mot de passe
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Saisissez votre mot de passe pour accéder au catalogue.
              </p>

              {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  {error}
                </div>
              )}

              <form onSubmit={handleVerify} className="space-y-4">
                <Input
                  label="Mot de passe"
                  required
                  maxLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value.toUpperCase())}
                  placeholder="XXXXXXXX"
                  leftIcon={<Lock className="h-5 w-5" />}
                />
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  isLoading={isVerifying}
                >
                  <Unlock className="h-5 w-5 mr-2" />
                  Accéder au catalogue
                </Button>
              </form>
            </div>

            {/* Purchase Card */}
            <div className="bg-gradient-to-br from-immo-900 to-immo-800 rounded-2xl shadow-xl p-8 text-white">
              <h2 className="text-2xl font-bold mb-4">
                Obtenir un accès
              </h2>
              <p className="text-gray-300 mb-6">
                Achetez un mot de passe pour accéder au catalogue premium pendant 12 heures.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-gold-400" />
                  <span>Accès pendant 12 heures</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-gold-400" />
                  <span>Catalogue PDF téléchargeable</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-gold-400" />
                  <span>Propriétés classées par standing</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-gold-400" />
                  <span>QR codes pour chaque propriété</span>
                </div>
              </div>

              <div className="text-center mb-6">
                <span className="text-4xl font-bold text-gold-400">2 000 FCFA</span>
              </div>

              <Button
                variant="secondary"
                className="w-full"
                size="lg"
                onClick={() => setShowPaymentModal(true)}
              >
                Acheter maintenant
              </Button>
            </div>
          </div>
        ) : (
          /* Access Granted */
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="mx-auto h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Accès autorisé !
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Vous pouvez maintenant consulter et télécharger le catalogue.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                <Clock className="h-6 w-6 mx-auto mb-2 text-immo-600" />
                <p className="text-sm text-gray-500">Temps restant</p>
                <p className="font-semibold">{access.time_remaining}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                <Users className="h-6 w-6 mx-auto mb-2 text-immo-600" />
                <p className="text-sm text-gray-500">Utilisations restantes</p>
                <p className="font-semibold">{access.uses_remaining}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                <Eye className="h-6 w-6 mx-auto mb-2 text-immo-600" />
                <p className="text-sm text-gray-500">Validité</p>
                <p className="font-semibold">Jusqu'au {new Date(access.valid_until).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                className="flex-1"
                size="lg"
                leftIcon={<Eye className="h-5 w-5" />}
                onClick={() => window.open(`/catalog/view?password=${password}`, '_blank')}
              >
                Voir en ligne
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                size="lg"
                leftIcon={<Download className="h-5 w-5" />}
                onClick={handleDownload}
              >
                Télécharger le PDF
              </Button>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6">
            <div className="mx-auto h-12 w-12 rounded-lg bg-immo-100 dark:bg-immo-900 flex items-center justify-center mb-4">
              <Clock className="h-6 w-6 text-immo-600" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Validité 12h
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Votre mot de passe est valable pendant 12 heures après l'achat.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="mx-auto h-12 w-12 rounded-lg bg-immo-100 dark:bg-immo-900 flex items-center justify-center mb-4">
              <Download className="h-6 w-6 text-immo-600" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              PDF Téléchargeable
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Téléchargez le catalogue au format PDF pour le consulter hors ligne.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="mx-auto h-12 w-12 rounded-lg bg-immo-100 dark:bg-immo-900 flex items-center justify-center mb-4">
              <Unlock className="h-6 w-6 text-immo-600" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Accès Illimité
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Consultez le catalogue autant de fois que vous le souhaitez pendant la validité.
            </p>
          </div>
        </div>
      </div>

      {/* Payment Modal - Mobile Money */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={(pwd) => {
          setPassword(pwd)
          setShowPaymentModal(false)
          // Auto-verify with the received password
          catalogService.verifyPassword(pwd)
            .then((r) => { if (r.data.success) setAccess(r.data.data ?? null) })
            .catch(() => {})
        }}
      />
    </div>
  )
}
