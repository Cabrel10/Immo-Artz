import { useState, useEffect, useRef } from 'react'
import {
  Smartphone, Loader2, CheckCircle, XCircle, Clock, Copy, Check, AlertCircle,
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { paymentService } from '@/services/api'
import type { PaymentInitResponse, PaymentStatus } from '@/types'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (password: string) => void
}

type Step = 'form' | 'pending' | 'success' | 'error'

export function PaymentModal({ isOpen, onClose, onSuccess }: PaymentModalProps) {
  const [step, setStep] = useState<Step>('form')
  const [phone, setPhone] = useState('')
  const [provider, setProvider] = useState<'mtn' | 'orange'>('mtn')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [payment, setPayment] = useState<PaymentInitResponse | null>(null)
  const [, setStatus] = useState<PaymentStatus | null>(null)
  const [catalogPassword, setCatalogPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const r = await paymentService.initiateCatalog({ phone, provider })
      if (r.data.success && r.data.data) {
        setPayment(r.data.data)
        setStep('pending')
        startPolling(r.data.data.transaction_id, r.data.data.sandbox)
      } else {
        setError(r.data.message || 'Erreur lors de l\'initiation du paiement')
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } }
      setError(axiosError.response?.data?.message || 'Erreur de connexion')
    }
    setSubmitting(false)
  }

  const startPolling = (txId: string, isSandbox: boolean) => {
    // In sandbox mode, auto-force complete after 3 seconds
    if (isSandbox) {
      setTimeout(() => {
        paymentService.sandboxForceComplete(txId).catch(() => {})
      }, 3000)
    }

    pollRef.current = setInterval(async () => {
      try {
        const r = await paymentService.getStatus(txId)
        if (r.data.success && r.data.data) {
          setStatus(r.data.data)
          if (r.data.data.status === 'completed') {
            if (pollRef.current) clearInterval(pollRef.current)
            // Claim catalog password
            try {
              const claim = await paymentService.claimCatalog(txId)
              if (claim.data.success && claim.data.data) {
                setCatalogPassword(claim.data.data.password)
                setStep('success')
                onSuccess(claim.data.data.password)
              }
            } catch {
              setStep('success')
            }
          } else if (r.data.data.status === 'failed') {
            if (pollRef.current) clearInterval(pollRef.current)
            setStep('error')
          }
        }
      } catch { /* continue polling */ }
    }, 2000)
  }

  const handleClose = () => {
    if (pollRef.current) clearInterval(pollRef.current)
    setStep('form')
    setPhone('')
    setProvider('mtn')
    setPayment(null)
    setStatus(null)
    setCatalogPassword(null)
    setError(null)
    onClose()
  }

  const copyPassword = () => {
    if (!catalogPassword) return
    navigator.clipboard.writeText(catalogPassword).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Paiement Mobile Money" size="md">
      {/* Step 1: Form */}
      {step === 'form' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-center mb-4">
            <p className="text-3xl font-bold text-immo-600">2 000 FCFA</p>
            <p className="text-sm text-gray-500 mt-1">Acces catalogue premium - 12 heures</p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Operateur <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setProvider('mtn')}
                className={`p-4 rounded-lg border-2 text-center transition-colors ${
                  provider === 'mtn'
                    ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <Smartphone className="h-6 w-6 mx-auto mb-1 text-yellow-600" />
                <span className="font-semibold text-sm">MTN MoMo</span>
              </button>
              <button
                type="button"
                onClick={() => setProvider('orange')}
                className={`p-4 rounded-lg border-2 text-center transition-colors ${
                  provider === 'orange'
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <Smartphone className="h-6 w-6 mx-auto mb-1 text-orange-600" />
                <span className="font-semibold text-sm">Orange Money</span>
              </button>
            </div>
          </div>

          <Input
            label="Numero de telephone"
            required
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="6XXXXXXXX"
            leftIcon={<span className="text-sm font-medium text-gray-500">+237</span>}
            helperText="Format: 6XXXXXXXX (9 chiffres)"
          />

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" isLoading={submitting} className="flex-1">
              Payer 2 000 FCFA
            </Button>
          </div>

          <p className="text-xs text-gray-400 text-center">
            Paiement securise. Vous recevrez une notification sur votre telephone.
          </p>
        </form>
      )}

      {/* Step 2: Pending */}
      {step === 'pending' && (
        <div className="text-center py-8">
          <div className="mx-auto h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
            <Loader2 className="h-8 w-8 text-amber-600 animate-spin" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Paiement en cours...</h3>
          <p className="text-sm text-gray-500 mt-2">
            Veuillez confirmer le paiement sur votre telephone
          </p>
          {payment?.sandbox && (
            <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs">
              <Clock className="h-4 w-4 inline mr-1" />
              Mode sandbox : validation automatique en quelques secondes
            </div>
          )}
          <p className="text-xs text-gray-400 mt-4">
            Transaction : {payment?.transaction_id}
          </p>
        </div>
      )}

      {/* Step 3: Success */}
      {step === 'success' && (
        <div className="text-center py-8">
          <div className="mx-auto h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Paiement reussi !</h3>
          <p className="text-sm text-gray-500 mt-2">Voici votre mot de passe catalogue :</p>

          {catalogPassword && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <code className="text-3xl font-mono font-bold tracking-widest text-immo-600 bg-immo-50 dark:bg-immo-900/20 px-6 py-3 rounded-lg">
                {catalogPassword}
              </code>
              <button onClick={copyPassword} className="p-2 text-gray-400 hover:text-gray-600">
                {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>
          )}

          <p className="text-xs text-gray-400 mt-4">
            Valable 12 heures. Utilisez-le pour acceder au catalogue.
          </p>

          <Button className="mt-6" onClick={handleClose}>
            Acceder au catalogue
          </Button>
        </div>
      )}

      {/* Step 4: Error */}
      {step === 'error' && (
        <div className="text-center py-8">
          <div className="mx-auto h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
            <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Paiement echoue</h3>
          <p className="text-sm text-gray-500 mt-2">
            Le paiement n'a pas pu etre traite. Veuillez reessayer.
          </p>
          <div className="flex gap-3 mt-6 justify-center">
            <Button variant="outline" onClick={handleClose}>Fermer</Button>
            <Button onClick={() => { setStep('form'); setError(null) }}>Reessayer</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
