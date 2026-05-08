import { useNavigate } from 'react-router-dom'
import { Search, Building2, MapPin, Star, Shield, Clock, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PropertyCard } from '@/components/PropertyCard'
import { useFeaturedProperties } from '@/hooks/useProperties'
import { useState } from 'react'

export function HomePage() {
  const navigate = useNavigate()
  const { properties: featuredProperties, isLoading } = useFeaturedProperties(6)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/properties?search=${encodeURIComponent(searchQuery)}`)
    }
  }

  const stats = [
    { value: '500+', label: 'Biens' },
    { value: '50+', label: 'Agents' },
    { value: '1000+', label: 'Clients satisfaits' },
    { value: '10+', label: 'Années d\'expérience' },
  ]

  const features = [
    {
      icon: Shield,
      title: 'Sécurisé',
      description: 'Toutes nos transactions sont sécurisées et vérifiées.',
    },
    {
      icon: Star,
      title: 'Premium',
      description: 'Une sélection rigoureuse des meilleures Biens.',
    },
    {
      icon: Clock,
      title: '24/7',
      description: 'Support client disponible à tout moment.',
    },
    {
      icon: MapPin,
      title: 'Local',
      description: 'Expertise locale sur tout le territoire camerounais.',
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-immo-900 via-immo-800 to-immo-900 text-white">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000')] bg-cover bg-center opacity-20" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Trouvez votre bien idéal
              <span className="block text-gold-400">au Cameroun</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-300">
              Découvrez notre sélection exclusive d'appartements, villas et terrains. 
              Un service premium pour trouver la propriété de vos rêves.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mx-auto mt-10 max-w-2xl">
              <div className="flex gap-2 rounded-xl bg-white/10 p-2 backdrop-blur-sm">
                <div className="flex-1 relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Où cherchez-vous ? (ville, quartier...)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg bg-white px-10 py-3 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-immo-500"
                  />
                </div>
                <Button type="submit" size="lg" leftIcon={<Search className="h-5 w-5" />}>
                  Rechercher
                </Button>
              </div>
            </form>

            {/* Quick Links */}
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <button
                onClick={() => navigate('/properties?transaction_type=sale')}
                className="rounded-full bg-white/10 px-6 py-2 text-sm font-medium backdrop-blur-sm hover:bg-white/20 transition-colors"
              >
                À vendre
              </button>
              <button
                onClick={() => navigate('/properties?transaction_type=rent')}
                className="rounded-full bg-white/10 px-6 py-2 text-sm font-medium backdrop-blur-sm hover:bg-white/20 transition-colors"
              >
                À louer
              </button>
              <button
                onClick={() => navigate('/properties?standing=haut_de_gamme')}
                className="rounded-full bg-gold-500/80 px-6 py-2 text-sm font-medium backdrop-blur-sm hover:bg-gold-500 transition-colors"
              >
                Haut de gamme
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="relative border-t border-white/10 bg-black/20">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-bold text-gold-400">{stat.value}</div>
                  <div className="mt-1 text-sm text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Biens en vedette
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Découvrez notre sélection du moment
              </p>
            </div>
            <Button
              variant="outline"
              rightIcon={<ArrowRight className="h-4 w-4" />}
              onClick={() => navigate('/properties')}
            >
              Voir tout
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[4/3] bg-gray-200 dark:bg-gray-700 rounded-t-xl" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Pourquoi choisir IMMO ?
            </h2>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Nous vous offrons le meilleur service immobilier au Cameroun
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="text-center p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
              >
                <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-lg bg-immo-100 dark:bg-immo-900">
                  <feature.icon className="h-6 w-6 text-immo-600 dark:text-immo-400" />
                </div>
                <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-immo-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <Building2 className="mx-auto h-16 w-16 text-gold-400" />
          <h2 className="mt-6 text-3xl font-bold text-white">
            Vous êtes agent immobilier ?
          </h2>
          <p className="mt-4 text-lg text-gray-300 max-w-2xl mx-auto">
            Rejoignez notre réseau d'agents professionnels et développez votre activité 
            avec notre plateforme premium.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/register', { state: { role: 'agent' } })}
            >
              Devenir agent
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white/10"
              onClick={() => navigate('/contact')}
            >
              En savoir plus
            </Button>
          </div>
        </div>
      </section>

      {/* Catalog CTA */}
      <section className="py-16 bg-gold-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <h2 className="text-3xl font-bold text-white">
                Catalogue Premium
              </h2>
              <p className="mt-2 text-gold-100">
                Accédez à notre catalogue exclusif avec mot de passe pour 2 000 FCFA
              </p>
            </div>
            <Button
              size="lg"
              className="bg-white text-gold-600 hover:bg-gray-100"
              onClick={() => navigate('/catalog')}
            >
              Accéder au catalogue
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
