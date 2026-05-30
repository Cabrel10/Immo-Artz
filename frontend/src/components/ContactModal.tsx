import { useState } from 'react'
import { Send, CheckCircle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { contactService } from '@/services/api'

interface ContactModalProps {
  isOpen: boolean
  onClose: () => void
  propertyId: number
  propertyTitle: string
  agentName?: string
}

export function ContactModal({ isOpen, onClose, propertyId, propertyTitle, agentName }: ContactModalProps) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSending(true)

    try {
      await contactService.submit(propertyId, {
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        message: form.message,
      })
      setSent(true)
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } }
      setError(axiosError.response?.data?.message || 'Erreur lors de l\'envoi. Reessayez.')
    }
    setSending(false)
  }

  const handleClose = () => {
    setForm({ name: '', email: '', phone: '', message: '' })
    setSent(false)
    setError(null)
    onClose()
  }

  if (sent) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Message envoye">
        <div className="text-center py-6">
          <div className="mx-auto h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Message envoye !</h3>
          <p className="text-sm text-gray-500 mt-2">
            {agentName ? `${agentName} recevra` : 'L\'agent recevra'} votre demande de contact
            concernant "{propertyTitle}".
          </p>
          <Button className="mt-6" onClick={handleClose}>Fermer</Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Contacter l'agent"
      description={`A propos de : ${propertyTitle}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <Input
          label="Votre nom"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Jean Dupont"
        />

        <Input
          label="Email"
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="jean@example.com"
        />

        <Input
          label="Telephone (optionnel)"
          type="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="+237 6XX XXX XXX"
        />

        <Textarea
          label="Message"
          required
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          placeholder="Bonjour, je suis interesse(e) par ce bien..."
          rows={4}
        />

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
            Annuler
          </Button>
          <Button
            type="submit"
            isLoading={sending}
            className="flex-1"
            leftIcon={<Send className="h-4 w-4" />}
          >
            Envoyer
          </Button>
        </div>
      </form>
    </Modal>
  )
}
