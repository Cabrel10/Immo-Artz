import { Link } from 'react-router-dom'
import { Home, ArrowLeft, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold text-immo-600 mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Page introuvable
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          La page que vous recherchez n'existe pas ou a ete deplacee.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/">
            <Button leftIcon={<Home className="h-4 w-4" />}>
              Accueil
            </Button>
          </Link>
          <Link to="/properties">
            <Button variant="outline" leftIcon={<Search className="h-4 w-4" />}>
              Explorer les biens
            </Button>
          </Link>
          <Button variant="ghost" onClick={() => window.history.back()} leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Retour
          </Button>
        </div>
      </div>
    </div>
  )
}
