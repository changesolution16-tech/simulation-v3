import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSimulationStore } from '../../store';
import { BrainCircuit, Lock, Mail, AlertCircle, Eye, EyeOff, Moon, Sun } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { useBranding } from '../../contexts/BrandingContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  const { branding } = useBranding();
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const login = useSimulationStore(state => state.login);
  const navigate = useNavigate();
  const location = useLocation();

  // Check for session expiration message
  useEffect(() => {
    const state = location.state as { message?: string };
    if (state?.message) {
      setError(state.message);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('Login form submitted for:', email);
      const success = await login(email, password);

      if (success) {
        console.log('Login successful, navigating to dashboard');
        navigate('/dashboard');
      } else {
        console.log('Login failed');
        setError(t('auth.invalidCredentials'));
      }
    } catch (err) {
      console.error('Login exception:', err);
      setError(t('auth.loginError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResetMessage('');
    setIsLoading(true);

    if (!isSupabaseConfigured) {
      setError(t('errors.generic'));
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError(error.message);
      } else {
        setResetMessage(t('auth.resetEmailSent'));
        setResetEmail('');
        setTimeout(() => {
          setShowForgotPassword(false);
          setResetMessage('');
        }, 3000);
      }
    } catch (err) {
      console.error('Password reset error:', err);
      setError(t('errors.generic'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg relative"
      >
        <button
          onClick={toggleTheme}
          className="absolute top-4 right-4 p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Toggle dark mode"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>

        <div className="flex justify-center mb-8">
          {branding.logo_url ? (
            <img
              src={branding.logo_url}
              alt="Company Logo"
              className="h-20 w-auto object-contain"
            />
          ) : (
            <div
              className="text-white p-4 rounded-2xl"
              style={{ backgroundColor: branding.primary_color }}
            >
              <BrainCircuit className="w-12 h-12" />
            </div>
          )}
        </div>

        <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-6">
          {branding.login_title || t('auth.loginTitle')}
        </h1>

        <p className="text-gray-600 dark:text-gray-300 text-center mb-8">
          {branding.login_subtitle || t('auth.loginSubtitle')}
        </p>

        {!isSupabaseConfigured && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md"
          >
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-amber-800 dark:text-amber-300">
                <p className="font-medium mb-1">{t('auth.demoMode')}</p>
                <p>{t('auth.demoModeDesc')}</p>
              </div>
            </div>
          </motion.div>
        )}

        {showForgotPassword ? (
          <form onSubmit={handleForgotPassword} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="reset-email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('auth.resetEmailLabel')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="reset-email"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder={t('auth.emailPlaceholder')}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('auth.resetEmailHelp')}
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-md text-sm"
              >
                {error}
              </motion.div>
            )}

            {resetMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-md text-sm"
              >
                {resetMessage}
              </motion.div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setError('');
                  setResetMessage('');
                  setResetEmail('');
                }}
                className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                {t('auth.backToLogin')}
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
                  isLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? t('auth.sending') : t('auth.sendResetLink')}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('auth.email')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.emailPlaceholder')}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('auth.password')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.passwordPlaceholder')}
                className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-5 h-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-md text-sm"
            >
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors ${
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
            style={{
              backgroundColor: branding.primary_color,
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = branding.secondary_color;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = branding.primary_color;
            }}
          >
            {isLoading ? t('auth.signingIn') : t('auth.login')}
          </button>

          {isSupabaseConfigured && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm font-medium transition-colors"
                style={{ color: branding.primary_color }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = branding.secondary_color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = branding.primary_color;
                }}
              >
                {t('auth.forgotPassword')}
              </button>
            </div>
          )}
        </form>
        )}

        {!isSupabaseConfigured && (
          <div className="mt-6">
            <p className="text-sm text-center text-gray-500">
              {t('auth.demoModeNote')}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Login;
