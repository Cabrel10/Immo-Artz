import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User as UserIcon, Lock, Save, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/hooks/useAuth'
import { authService } from '@/services/api'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrateur',
  agent: 'Agent',
  visitor: 'Visiteur',
}

export function ProfilePage() {
  const { user, isAuthenticated, isLoading: authLoading, updateProfile } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '', bio: '' })
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' })
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isSavingPw, setIsSavingPw] = useState(false)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login')
    }
  }, [authLoading, isAuthenticated, navigate])

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        bio: user.bio || '',
      })
    }
  }, [user])

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileMsg(null)
    setIsSavingProfile(true)
    const result = await updateProfile({
      first_name: form.first_name,
      last_name: form.last_name,
      phone: form.phone || undefined,
      bio: form.bio || undefined,
    } as any)
    setIsSavingProfile(false)
    setProfileMsg(result.success
      ? { type: 'success', text: 'Profil mis à jour avec succès.' }
      : { type: 'error', text: result.message || 'Erreur de mise à jour' })
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwMsg(null)

    if (pwForm.new_password.length < 8) {
      setPwMsg({ type: 'error', text: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' })
      return
    }
    if (pwForm.new_password !== pwForm.confirm) {
      setPwMsg({ type: 'error', text: 'La confirmation ne correspond pas.' })
      return
    }

    setIsSavingPw(true)
    try {
      const response = await authService.changePassword(pwForm.current_password, pwForm.new_password)
      if (response.data.success) {
        setPwMsg({ type: 'success', text: 'Mot de passe modifié avec succès.' })
        setPwForm({ current_password: '', new_password: '', confirm: '' })
      } else {
        setPwMsg({ type: 'error', text: response.data.message || 'Erreur lors du changement' })
      }
    } catch (err: any) {
      setPwMsg({ type: 'error', text: err.response?.data?.message || 'Mot de passe actuel incorrect ou erreur serveur' })
    } finally {
      setIsSavingPw(false)
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Chargement du profil...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-gradient-to-br from-immo-700 to-immo-900 text-white">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                <UserIcon className="h-8 w-8" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{user.full_name}</h1>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant="secondary">{ROLE_LABELS[user.role] || user.role}</Badge>
                <span className="text-sm text-immo-200">{user.email}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Informations personnelles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-immo-600" />
              Informations personnelles
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profileMsg && (
              <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${
                profileMsg.type === 'success'
                  ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
              }`}>
                {profileMsg.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                {profileMsg.text}
              </div>
            )}
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Prénom"
                  required
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                />
                <Input
                  label="Nom"
                  required
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                />
              </div>
              <Input
                label="Téléphone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+237 6XX XX XX XX"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={3}
                  maxLength={1000}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-immo-500 focus:outline-none focus:ring-2 focus:ring-immo-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white transition-colors"
                />
              </div>
              <Button type="submit" isLoading={isSavingProfile} leftIcon={<Save className="h-4 w-4" />}>
                Enregistrer
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Changement de mot de passe */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-immo-600" />
              Changer le mot de passe
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pwMsg && (
              <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${
                pwMsg.type === 'success'
                  ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
              }`}>
                {pwMsg.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                {pwMsg.text}
              </div>
            )}
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input
                label="Mot de passe actuel"
                type="password"
                required
                value={pwForm.current_password}
                onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })}
              />
              <Input
                label="Nouveau mot de passe"
                type="password"
                required
                helperText="8 caractères minimum"
                value={pwForm.new_password}
                onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
              />
              <Input
                label="Confirmer le nouveau mot de passe"
                type="password"
                required
                value={pwForm.confirm}
                onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
              />
              <Button type="submit" variant="secondary" isLoading={isSavingPw} leftIcon={<Lock className="h-4 w-4" />}>
                Modifier le mot de passe
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
