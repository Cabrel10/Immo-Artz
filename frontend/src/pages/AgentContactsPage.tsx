import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  MessageSquare, Mail, Phone, CheckCircle, Reply, Archive, Eye,
  Loader2, Filter,
} from 'lucide-react'
import { contactService } from '@/services/api'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { PaginationNav } from '@/components/ui/Pagination'
import { useToast } from '@/hooks/useToast'
import { Toaster } from '@/components/ui/Toaster'
import { formatRelativeTime } from '@/utils/format'
import type { ContactRequest, Pagination } from '@/types'

const STATUS_CONFIG: Record<ContactRequest['status'], { label: string; variant: 'default' | 'primary' | 'success' | 'warning' }> = {
  new: { label: 'Nouveau', variant: 'warning' },
  read: { label: 'Lu', variant: 'primary' },
  replied: { label: 'Repondu', variant: 'success' },
  archived: { label: 'Archive', variant: 'default' },
}

export function AgentContactsPage() {
  const [contacts, setContacts] = useState<ContactRequest[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [processing, setProcessing] = useState<number | null>(null)
  const [expanded, setExpanded] = useState<number | null>(null)
  const toast = useToast()

  const fetchContacts = (p: number) => {
    setLoading(true)
    const params: Record<string, unknown> = { page: p, per_page: 15 }
    if (statusFilter) params.status = statusFilter
    contactService.getAll(params)
      .then((r) => {
        if (r.data.success && r.data.data) {
          setContacts(r.data.data.contacts ?? [])
          setPagination(r.data.data.pagination ?? null)
        }
      })
      .catch(() => toast.error('Erreur', 'Impossible de charger les messages'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchContacts(page) }, [page, statusFilter])

  const handleMarkRead = async (id: number) => {
    setProcessing(id)
    try {
      await contactService.markRead(id)
      setContacts((prev) => prev.map((c) => c.id === id ? { ...c, status: 'read' as const } : c))
      toast.success('Marque comme lu')
    } catch {
      toast.error('Erreur')
    }
    setProcessing(null)
  }

  const handleMarkReplied = async (id: number) => {
    setProcessing(id)
    try {
      await contactService.markReplied(id)
      setContacts((prev) => prev.map((c) => c.id === id ? { ...c, status: 'replied' as const } : c))
      toast.success('Marque comme repondu')
    } catch {
      toast.error('Erreur')
    }
    setProcessing(null)
  }

  const handleArchive = async (id: number) => {
    setProcessing(id)
    try {
      await contactService.archive(id)
      setContacts((prev) => prev.filter((c) => c.id !== id))
      toast.success('Message archive')
    } catch {
      toast.error('Erreur')
    }
    setProcessing(null)
  }

  const newCount = contacts.filter((c) => c.status === 'new').length

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Toaster toasts={toast.toasts} onRemove={toast.removeToast} />

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-immo-600" />
            Messages
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {newCount > 0 ? `${newCount} nouveau(x) message(s)` : 'Tous les messages lus'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { value: '', label: 'Tous' },
          { value: 'new', label: 'Nouveaux' },
          { value: 'read', label: 'Lus' },
          { value: 'replied', label: 'Repondus' },
        ].map((f) => (
          <Button
            key={f.value}
            size="sm"
            variant={statusFilter === f.value ? 'primary' : 'outline'}
            onClick={() => { setStatusFilter(f.value); setPage(1) }}
            leftIcon={f.value === '' ? <Filter className="h-3 w-3" /> : undefined}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-immo-600" />
            </div>
          ) : contacts.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<MessageSquare className="h-12 w-12" />}
                title="Aucun message"
                description="Vous n'avez pas encore recu de demande de contact."
              />
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {contacts.map((contact) => {
                const statusCfg = STATUS_CONFIG[contact.status]
                const isExpanded = expanded === contact.id
                return (
                  <div
                    key={contact.id}
                    className={`p-4 transition-colors ${contact.status === 'new' ? 'bg-immo-50/50 dark:bg-immo-900/10' : ''}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-full bg-immo-100 dark:bg-immo-900 flex items-center justify-center shrink-0">
                        <span className="font-semibold text-immo-600">{contact.name.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900 dark:text-white">{contact.name}</span>
                          <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                          <span className="text-xs text-gray-500 ml-auto">{formatRelativeTime(contact.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                          <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{contact.email}</span>
                          {contact.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{contact.phone}</span>}
                        </div>
                        {contact.property && (
                          <Link
                            to={`/properties/${contact.property.id}`}
                            className="text-xs text-immo-600 hover:underline mt-1 inline-block"
                          >
                            Bien: {contact.property.title}
                          </Link>
                        )}

                        {/* Message preview / full */}
                        <button
                          className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-left w-full"
                          onClick={() => setExpanded(isExpanded ? null : contact.id)}
                        >
                          {isExpanded ? contact.message : (
                            contact.message.length > 120 ? contact.message.slice(0, 120) + '...' : contact.message
                          )}
                        </button>

                        {/* Actions */}
                        <div className="flex gap-2 mt-3">
                          {contact.status === 'new' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkRead(contact.id)}
                              isLoading={processing === contact.id}
                              leftIcon={<Eye className="h-3 w-3" />}
                            >
                              Marquer lu
                            </Button>
                          )}
                          {(contact.status === 'new' || contact.status === 'read') && (
                            <>
                              <a href={`mailto:${contact.email}?subject=Re: ${contact.property?.title ?? 'Votre demande'}`}>
                                <Button size="sm" variant="primary" leftIcon={<Reply className="h-3 w-3" />}>
                                  Repondre
                                </Button>
                              </a>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkReplied(contact.id)}
                                isLoading={processing === contact.id}
                                leftIcon={<CheckCircle className="h-3 w-3" />}
                              >
                                Repondu
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleArchive(contact.id)}
                            isLoading={processing === contact.id}
                            leftIcon={<Archive className="h-3 w-3" />}
                          >
                            Archiver
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
        {pagination && (
          <div className="px-4">
            <PaginationNav pagination={pagination} onPageChange={setPage} />
          </div>
        )}
      </Card>
    </div>
  )
}
