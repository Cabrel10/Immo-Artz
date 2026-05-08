import { Routes, Route } from 'react-router-dom'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { FloatingWhatsApp } from '@/components/FloatingWhatsApp'
import { HomePage } from '@/pages/HomePage'
import { PropertiesPage } from '@/pages/PropertiesPage'
import { PropertyDetailPage } from '@/pages/PropertyDetailPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { CatalogPage } from '@/pages/CatalogPage'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'

function App() {
  const { user, isAuthenticated, logout } = useAuth()
  const { resolvedTheme } = useTheme()

  return (
    <div className={resolvedTheme}>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Header 
          user={user} 
          isAuthenticated={isAuthenticated} 
          onLogout={logout} 
        />
        
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/properties" element={<PropertiesPage />} />
            <Route path="/properties/:id" element={<PropertyDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            
            {/* Fallback route */}
            <Route path="*" element={
              <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">404</h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Page non trouvée</p>
              </div>
            } />
          </Routes>
        </main>
        
        <Footer />
        <FloatingWhatsApp />
      </div>
    </div>
  )
}

export default App
