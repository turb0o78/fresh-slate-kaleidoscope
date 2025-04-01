import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, RequireAuth } from './lib/auth';
import { HomePage } from './pages/home';
import { LoginPage } from './pages/auth/login';
import { SignUpPage } from './pages/auth/signup';
import { DashboardPage } from './pages/dashboard';
import { TermsPage } from './pages/legal/terms';
import { PrivacyPage } from './pages/legal/privacy';
import { Header } from './components/layout/header';
import { Footer } from './components/layout/footer';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route
            path="/"
            element={
              <>
                <Header />
                <HomePage />
                <Footer />
              </>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />

          {/* Protected routes */}
          <Route
            path="/dashboard/*"
            element={
              <RequireAuth>
                <DashboardPage />
              </RequireAuth>
            }
          />

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;