
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
import { useEffect } from 'react';
import { ToastProvider } from './components/ui/toast';
import FacebookSDKDemoPage from './pages/facebook-sdk-demo';

function App() {
  // Add scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public routes */}
            <Route
              path="/"
              element={
                <>
                  <Header />
                  <div className="pt-16"> {/* Add padding to account for fixed header */}
                    <HomePage />
                  </div>
                  <Footer />
                </>
              }
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route 
              path="/terms" 
              element={
                <>
                  <Header />
                  <div className="pt-16"> 
                    <TermsPage />
                  </div>
                  <Footer />
                </>
              } 
            />
            <Route 
              path="/privacy" 
              element={
                <>
                  <Header />
                  <div className="pt-16"> 
                    <PrivacyPage />
                  </div>
                  <Footer />
                </>
              } 
            />
            
            {/* Page de démonstration du SDK Facebook */}
            <Route 
              path="/facebook-sdk-demo" 
              element={
                <>
                  <Header />
                  <div className="pt-16"> 
                    <FacebookSDKDemoPage />
                  </div>
                  <Footer />
                </>
              } 
            />

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
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
