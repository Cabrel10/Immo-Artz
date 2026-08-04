import { useState, useEffect } from 'react'
import { Heart, Loader2 } from 'lucide-react'
import { favoriteService } from '@/services/api'
import { cn } from '@/utils/cn'

interface FavoriteButtonProps {
  propertyId: number
  className?: string
  size?: 'sm' | 'md'
}

export function FavoriteButton({ propertyId, className, size = 'md' }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [loading, setLoading] = useState(false)
  const token = localStorage.getItem('token')

  useEffect(() => {
    if (!token) return
    favoriteService.check(propertyId)
      .then((r) => {
        if (r.data.success && r.data.data) setIsFavorite(r.data.data.is_favorite)
      })
      .catch(() => {})
  }, [propertyId, token])

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!token) {
      window.location.href = '/login'
      return
    }
    setLoading(true)
    try {
      if (isFavorite) {
        await favoriteService.remove(propertyId)
        setIsFavorite(false)
      } else {
        await favoriteService.add(propertyId)
        setIsFavorite(true)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }

  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={cn(
        'rounded-full p-2 transition-all',
        isFavorite
          ? 'bg-red-50 dark:bg-red-900/30 text-red-500 hover:bg-red-100'
          : 'bg-white/90 dark:bg-gray-800/90 text-gray-400 hover:text-red-500 hover:bg-red-50',
        className,
      )}
      title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
    >
      {loading ? (
        <Loader2 className={`${iconSize} animate-spin`} />
      ) : (
        <Heart className={cn(iconSize, isFavorite && 'fill-current')} />
      )}
    </button>
  )
}
