import { useState } from 'react'
import { MessageCircle, X } from 'lucide-react'

const WHATSAPP_NUMBERS = [
  { label: 'Support Commercial', number: '+237676416878' },
  { label: 'Service Client', number: '+237691929077' },
]

export function FloatingWhatsApp() {
  const [isOpen, setIsOpen] = useState(false)

  const openWhatsApp = (number: string) => {
    const message = encodeURIComponent('Bonjour, je vous contacte depuis IMMO.')
    window.open(`https://wa.me/${number.replace(/[^0-9]/g, '')}?text=${message}`, '_blank')
    setIsOpen(false)
  }

  return (
    <div className="fixed bottom-6 left-6 z-50">
      {isOpen && (
        <div className="mb-3 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 w-64 animate-fade-in">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Contactez-nous sur WhatsApp
          </p>
          <div className="space-y-2">
            {WHATSAPP_NUMBERS.map((item) => (
              <button
                key={item.number}
                onClick={() => openWhatsApp(item.number)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors text-left"
              >
                <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                  <MessageCircle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.number}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 rounded-full bg-green-500 text-white shadow-lg hover:bg-green-600 transition-colors flex items-center justify-center"
        title="WhatsApp"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  )
}
