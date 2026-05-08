import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PropertyCard } from '@/components/PropertyCard'
import { PropertyFilters } from '@/components/PropertyFilters'
import { Button } from '@/components/ui/Button'
import { useProperties } from '@/hooks/useProperties'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

export function PropertiesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  
  const {
    properties,
    isLoading,
    error,
    pagination,
    filters,
    updateFilters,
    resetFilters,
    setPage,
  } = useProperties({
    search: searchParams.get('search') || undefined,
    type: (searchParams.get('type') as any) || undefined,
    standing: (searchParams.get('standing') as any) || undefined,
    transaction_type: (searchParams.get('transaction_type') as any) || undefined,
  })

  // Synchroniser les filtres avec l'URL
  useEffect(() => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, value.toString())
      }
    })
    setSearchParams(params, { replace: true })
  }, [filters])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Biens
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {pagination.total} propriété{pagination.total > 1 ? 's' : ''} disponible{pagination.total > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Filters */}
        <PropertyFilters
          filters={filters}
          onChange={updateFilters}
          onReset={resetFilters}
        />

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className="mt-8 flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-immo-600" />
          </div>
        ) : (
          <>
            {/* Grid */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>

            {/* Empty State */}
            {properties.length === 0 && !isLoading && (
              <div className="mt-12 text-center py-12">
                <div className="mx-auto h-24 w-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <svg
                    className="h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                  Aucune propriété trouvée
                </h3>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                  Essayez de modifier vos filtres ou réinitialisez-les.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={resetFilters}
                >
                  Réinitialiser les filtres
                </Button>
              </div>
            )}

            {/* Pagination */}
            {pagination.lastPage > 1 && (
              <div className="mt-8 flex justify-center items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  leftIcon={<ChevronLeft className="h-4 w-4" />}
                >
                  Précédent
                </Button>
                
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {pagination.currentPage} sur {pagination.lastPage}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.lastPage}
                  rightIcon={<ChevronRight className="h-4 w-4" />}
                >
                  Suivant
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
