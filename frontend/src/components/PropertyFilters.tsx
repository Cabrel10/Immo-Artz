import { Search, SlidersHorizontal, X } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { PROPERTY_TYPE_FILTERS, PROPERTY_STANDINGS, TRANSACTION_TYPES } from '@/types'
import type { PropertyFilters as Filters } from '@/types'

interface PropertyFiltersProps {
  filters: Filters
  onChange: (filters: Partial<Filters>) => void
  onReset: () => void
}

export function PropertyFilters({ filters, onChange, onReset }: PropertyFiltersProps) {
  const hasActiveFilters = Object.values(filters).some(v => 
    v !== undefined && v !== null && v !== ''
  )

  const typeOptions = Object.entries(PROPERTY_TYPE_FILTERS).map(([value, label]) => ({ value, label }))
  const standingOptions = Object.entries(PROPERTY_STANDINGS).map(([value, label]) => ({ value, label }))
  const transactionOptions = Object.entries(TRANSACTION_TYPES).map(([value, label]) => ({ value, label }))
  
  const sortOptions = [
    { value: 'created_at', label: 'Plus récent' },
    { value: 'price_asc', label: 'Prix croissant' },
    { value: 'price_desc', label: 'Prix décroissant' },
    { value: 'standing', label: 'Standing' },
    { value: 'popular', label: 'Plus populaire' },
  ]

  return (
    <div className="space-y-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-gray-500" />
          <h3 className="font-medium text-gray-900 dark:text-white">Filtres</h3>
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onReset} leftIcon={<X className="h-4 w-4" />}>
            Réinitialiser
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher..."
          value={filters.search || ''}
          onChange={(e) => onChange({ search: e.target.value || undefined })}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-immo-500 focus:ring-2 focus:ring-immo-500/20 outline-none transition-colors"
        />
      </div>

      {/* Filters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Select
          label="Type"
          placeholder="Tous les types"
          options={typeOptions}
          value={filters.type || ''}
          onChange={(e) => onChange({ type: e.target.value as any || undefined })}
        />

        <Select
          label="Standing"
          placeholder="Tous les standings"
          options={standingOptions}
          value={filters.standing || ''}
          onChange={(e) => onChange({ standing: e.target.value as any || undefined })}
        />

        <Select
          label="Transaction"
          placeholder="Toutes"
          options={transactionOptions}
          value={filters.transaction_type || ''}
          onChange={(e) => onChange({ transaction_type: e.target.value as any || undefined })}
        />

        <Input
          label="Prix min"
          type="number"
          placeholder="0"
          value={filters.min_price || ''}
          onChange={(e) => onChange({ min_price: e.target.value ? Number(e.target.value) : undefined })}
        />

        <Input
          label="Prix max"
          type="number"
          placeholder="∞"
          value={filters.max_price || ''}
          onChange={(e) => onChange({ max_price: e.target.value ? Number(e.target.value) : undefined })}
        />

        <Select
          label="Trier par"
          options={sortOptions}
          value={filters.sort_by || 'created_at'}
          onChange={(e) => onChange({ sort_by: e.target.value as any })}
        />
      </div>
    </div>
  )
}
