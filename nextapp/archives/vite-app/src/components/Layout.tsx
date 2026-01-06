import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useSimulationStore } from '../store';
import { LogOut, Home, User, Moon, Sun } from 'lucide-react';
import { useBranding } from '../contexts/BrandingContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

const Layout: React.FC = () => {
  const { isAuthenticated, logout } = useSimulationStore(state => ({
    isAuthenticated: state.isAuthenticated,
    logout: state.logout
  }));

  const { branding } = useBranding();
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isLoginPage = location.pathname === '/login' || location.pathname === '/reset-password';
  const showNavigation = isAuthenticated && !isLoginPage;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            {branding.logo_url ? (
              <img
                src={branding.logo_url}
                alt="Company Logo"
                className="h-10 w-auto object-contain"
              />
            ) : (
              <div className="bg-brand-primary text-white p-2 rounded-lg">
                <BrainCircuit className="w-6 h-6" />
              </div>
            )}
            <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">SoftSkills Simulation</h1>
          </div>

          {showNavigation && (
            <nav className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center text-gray-600 dark:text-gray-300 hover:text-brand-primary dark:hover:text-brand-primary transition-colors"
              >
                <Home className="w-5 h-5 mr-1" />
                <span>{t('navigation.dashboard')}</span>
              </button>

              <button
                onClick={() => navigate('/settings')}
                className="flex items-center text-gray-600 dark:text-gray-300 hover:text-brand-primary dark:hover:text-brand-primary transition-colors"
              >
                <User className="w-5 h-5 mr-1" />
                <span>{t('navigation.profile')}</span>
              </button>

              <LanguageSwitcher />

              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle dark mode"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                <LogOut className="w-5 h-5 mr-1" />
                <span>{t('auth.logout')}</span>
              </button>
            </nav>
          )}
          {!showNavigation && (
            <LanguageSwitcher />
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500 dark:text-gray-400">
          © {branding.company_name}
        </div>
      </footer>
    </div>
  );
};

// Import this separately to avoid ESLint errors
import { BrainCircuit } from 'lucide-react';

export default Layout;