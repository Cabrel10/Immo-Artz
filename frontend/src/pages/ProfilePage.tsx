import { useState } from 'react'
import { User, Phone, Building2, FileText, Lock, Save, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { authService } from '@/services/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/hooks/useToast'
import { Toaster } from '@/components/ui/Toaster'

export function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const toast = useToast()

  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name ?? '',
    last_name: user?.last_name ?? '',
    phone: user?.phone ?? '',
    bio: user?.bio ?? '',
    agency_name: user?.agency_name ?? '',
    license_number: user?.license_number ?? '',
  })
  const [savingProfile, setSavingProfile] = useState(false)

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [savingPassword, setSavingPassword] = useState(false)

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      const r = await authService.updateProfile(profileForm)
      if (r.data.success) {
        toast.success('Profil mis a jour')
        refreshUser()
      } else {
        toast.error('Erreur', r.data.message)
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } }
      toast.error('Erreur', axiosError.response?.data?.message || 'Impossible de mettre a jour le profil')
    }
    setSavingProfile(false)
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('Erreur', 'Les mots de passe ne correspondent pas')
      return
    }
    if (passwordForm.new_password.length < 8) {
      toast.error('Erreur', 'Le mot de passe doit faire au moins 8 caracteres')
      return
    }
    setSavingPassword(true)
    try {
      const r = await authService.changePassword(passwordForm.current_password, passwordForm.new_password)
      if (r.data.success) {
        toast.success('Mot de passe modifie')
        setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })
      } else {
        toast.error('Erreur', r.data.message)
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } }
      toast.error('Erreur', axiosError.response?.data?.message || 'Impossible de changer le mot de passe')
    }
    setSavingPassword(false)
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-immo-600" />
      </div>
    )
  }

  const roleLabels: Record<string, string> = { admin: 'Administrateur', agent: 'Agent', visitor: 'Visiteur' }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Toaster toasts={toast.toasts} onRemove={toast.removeToast} />

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mon profil</h1>
        <div className="flex items-center gap-3 mt-2">
          <Badge variant="primary">{roleLabels[user.role] ?? user.role}</Badge>
          <span className="text-sm text-gray-500">{user.email}</span>
        </div>
      </div>

      {/* Profile Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-immo-600" />
            Informations personnelles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Prenom"
                required
                value={profileForm.first_name}
                onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                leftIcon={<User className="h-4 w-4" />}
              />
              <Input
                label="Nom"
                required
                value={profileForm.last_name}
                onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
              />
            </div>

            <Input
              label="Telephone"
              type="tel"
              value={profileForm.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              leftIcon={<Phone className="h-4 w-4" />}
              placeholder="+237 6XX XXX XXX"
            />

            {(user.role === 'agent' || user.role === 'admin') && (
              <>
                <Input
                  label="Nom de l'agence"
                  value={profileForm.agency_name}
                  onChange={(e) => setProfileForm({ ...profileForm, agency_name: e.target.value })}
                  leftIcon={<Building2 className="h-4 w-4" />}
                />
                <Input
                  label="Numero de licence"
                  value={profileForm.license_number}
                  onChange={(e) => setProfileForm({ ...profileForm, license_number: e.target.value })}
                  leftIcon={<FileText className="h-4 w-4" />}
                />
                <Textarea
                  label="Bio / Description"
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  placeholder="Presentez-vous aux visiteurs..."
                  rows={3}
                />
              </>
            )}

            <Button type="submit" isLoading={savingProfile} leftIcon={<Save className="h-4 w-4" />}>
              Sauvegarder
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-amber-600" />
            Changer le mot de passe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <Input
              label="Mot de passe actuel"
              type="password"
              required
              value={passwordForm.current_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
              leftIcon={<Lock className="h-4 w-4" />}
            />
            <Input
              label="Nouveau mot de passe"
              type="password"
              required
              value={passwordForm.new_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
              helperText="Minimum 8 caracteres"
            />
            <Input
              label="Confirmer le nouveau mot de passe"
              type="password"
              required
              value={passwordForm.confirm_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
            />
            <Button type="submit" isLoading={savingPassword} variant="outline" leftIcon={<Lock className="h-4 w-4" />}>
              Changer le mot de passe
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
