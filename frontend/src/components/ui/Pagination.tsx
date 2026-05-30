import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './Button'
import type { Pagination as PaginationType } from '@/types'

interface PaginationProps {
  pagination: PaginationType
  onPageChange: (page: number) => void
}

export function PaginationNav({ pagination, onPageChange }: PaginationProps) {
  const { current_page, last_page, total } = pagination
  if (last_page <= 1) return null

  return (
    <div className="flex items-center justify-between px-1 py-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Page {current_page} / {last_page} ({total} resultats)
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={current_page <= 1}
          onClick={() => onPageChange(current_page - 1)}
          leftIcon={<ChevronLeft className="h-4 w-4" />}
        >
          Prec.
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={current_page >= last_page}
          onClick={() => onPageChange(current_page + 1)}
          rightIcon={<ChevronRight className="h-4 w-4" />}
        >
          Suiv.
        </Button>
      </div>
    </div>
  )
}
