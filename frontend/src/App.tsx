import { Routes, Route } from 'react-router-dom'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { FloatingWhatsApp } from '@/components/FloatingWhatsApp'
import { ProtectedRoute } from '@/components/ProtectedRoute'

// Public pages
import { HomePage } from '@/pages/HomePage'
import { PropertiesPage } from '@/pages/PropertiesPage'
import { PropertyDetailPage } from '@/pages/PropertyDetailPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { CatalogPage } from '@/pages/CatalogPage'
import { AgentsListPage } from '@/pages/AgentsListPage'
import { AgentProfilePage } from '@/pages/AgentProfilePage'
import { NotFoundPage } from '@/pages/NotFoundPage'

// Protected pages (any authenticated user)
import { FavoritesPage } from '@/pages/FavoritesPage'
import { ProfilePage } from '@/pages/ProfilePage'

// Agent pages
import { AgentDashboardPage } from '@/pages/AgentDashboardPage'
import { PropertyFormPage } from '@/pages/PropertyFormPage'
import { AgentContactsPage } from '@/pages/AgentContactsPage'

// Admin pages
import { AdminDashboardPage } from '@/pages/AdminDashboardPage'
import { AdminRatingsPage } from '@/pages/AdminRatingsPage'
import { AdminFeaturedPage } from '@/pages/AdminFeaturedPage'
import { AdminCatalogPage } from '@/pages/AdminCatalogPage'

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
            {/* ==================== PUBLIC ==================== */}
            <Route path="/" element={<HomePage />} />
            <Route path="/properties" element={<PropertiesPage />} />
            <Route path="/properties/:id" element={<PropertyDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/agents" element={<AgentsListPage />} />
            <Route path="/agents/:id" element={<AgentProfilePage />} />

            {/* ==================== AUTHENTICATED ==================== */}
            <Route path="/favorites" element={
              <ProtectedRoute>
                <FavoritesPage />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />

            {/* ==================== AGENT ==================== */}
            <Route path="/agent/dashboard" element={
              <ProtectedRoute roles={['agent', 'admin']}>
                <AgentDashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/agent/properties/new" element={
              <ProtectedRoute roles={['agent', 'admin']}>
                <PropertyFormPage />
              </ProtectedRoute>
            } />
            <Route path="/agent/properties/:id/edit" element={
              <ProtectedRoute roles={['agent', 'admin']}>
                <PropertyFormPage />
              </ProtectedRoute>
            } />
            <Route path="/agent/contacts" element={
              <ProtectedRoute roles={['agent', 'admin']}>
                <AgentContactsPage />
              </ProtectedRoute>
            } />

            {/* ==================== ADMIN ==================== */}
            <Route path="/admin" element={
              <ProtectedRoute roles={['admin']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/ratings" element={
              <ProtectedRoute roles={['admin']}>
                <AdminRatingsPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/featured" element={
              <ProtectedRoute roles={['admin']}>
                <AdminFeaturedPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/catalog" element={
              <ProtectedRoute roles={['admin']}>
                <AdminCatalogPage />
              </ProtectedRoute>
            } />
            {/* Admin agents redirects to public agents list */}
            <Route path="/admin/agents" element={
              <ProtectedRoute roles={['admin']}>
                <AgentsListPage />
              </ProtectedRoute>
            } />

            {/* ==================== 404 ==================== */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        
        <Footer />
        <FloatingWhatsApp />
      </div>
    </div>
  )
}

export default App
