import React, { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSimulationStore } from './store';
import { LTIProvider } from './contexts/LTIContext';
import { DialogProvider } from './contexts/DialogContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { BrandingProvider } from './contexts/BrandingContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { supabase, isSupabaseConfigured } from './lib/supabase';

// Core Components (always loaded)
import Layout from './components/Layout';
import NetworkStatusIndicator from './components/NetworkStatusIndicator';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './components/auth/Login';
import NotFound from './components/NotFound';

// Lazy-loaded Components
const ResetPassword = lazy(() => import('./components/auth/ResetPassword'));
const Dashboard = lazy(() => import('./components/dashboard/Dashboard'));
const TopicSelection = lazy(() => import('./components/simulation/TopicSelection'));
const DifficultySelection = lazy(() => import('./components/simulation/DifficultySelection'));
const DifficultyLandingPage = lazy(() => import('./components/simulation/DifficultyLandingPage'));
const SimulationScenario = lazy(() => import('./components/simulation/SimulationScenario'));
const SimulationPlayer = lazy(() => import('./components/simulation/SimulationPlayer'));
const SimulationLandingPage = lazy(() => import('./components/simulation/SimulationLandingPage'));
const SimulationIntroduction = lazy(() => import('./components/simulation/SimulationIntroduction'));
const IntroductionPage = lazy(() => import('./components/simulation/IntroductionPage'));
const QuestionPage = lazy(() => import('./components/simulation/QuestionPage'));
const FeedbackPage = lazy(() => import('./components/simulation/FeedbackPage'));
const TransitionPage = lazy(() => import('./components/simulation/TransitionPage'));
const SimulationClosingPage = lazy(() => import('./components/simulation/SimulationClosingPage'));
const Results = lazy(() => import('./components/simulation/Results'));
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const ScenarioManager = lazy(() => import('./components/admin/ScenarioManager'));
const VideoManager = lazy(() => import('./components/admin/VideoManager'));
const ScenarioFlowBuilder = lazy(() => import('./components/admin/ScenarioFlowBuilder'));
const PathAnalyticsDashboard = lazy(() => import('./components/admin/PathAnalyticsDashboard'));
const LTIConfig = lazy(() => import('./components/lti/LTIConfig'));
const InstructorDashboard = lazy(() => import('./components/instructor/InstructorDashboard'));
const TeacherDashboard = lazy(() => import('./components/teacher/TeacherDashboard'));
const LearnerDashboard = lazy(() => import('./components/learner/LearnerDashboard'));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));
const UserSettings = lazy(() => import('./components/settings/UserSettings'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

// Protected route wrapper
const ProtectedRoute = ({ children, requireAdmin = false, requireTeacher = false }: { children: React.ReactNode, requireAdmin?: boolean, requireTeacher?: boolean }) => {
  const { isAuthenticated, currentUser } = useSimulationStore(state => ({
    isAuthenticated: state.isAuthenticated,
    currentUser: state.currentUser
  }));

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && currentUser?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireTeacher && currentUser?.role !== 'instructor' && currentUser?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Dashboard router to redirect based on user role
const DashboardRouter = () => {
  const { currentUser } = useSimulationStore(state => ({
    currentUser: state.currentUser
  }));

  if (currentUser?.role === 'admin') {
    return <Navigate to="/admin-dashboard" replace />;
  }

  if (currentUser?.role === 'instructor') {
    return <Navigate to="/teacher" replace />;
  }

  if (currentUser?.role === 'student') {
    return <Navigate to="/learner" replace />;
  }

  return <Navigate to="/learner" replace />;
};

const mapRoleFromDb = (role: string): 'student' | 'instructor' | 'admin' => {
  return role === 'learner' ? 'student' : role as 'student' | 'instructor' | 'admin';
};

function App() {
  const setCurrentUser = useSimulationStore(state => state.setCurrentUser);

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        console.log('App: Initial session check', session ? 'Active' : 'None');
        if (session?.user) {
          console.log('App: Fetching profile for user:', session.user.id);
          supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
            .then(({ data: profile, error }) => {
              if (error) {
                console.error('App: Error fetching profile:', error);
                if (error.code === 'PGRST116') {
                  console.error('App: Profile not found - this is a database issue, not logging out');
                  return;
                }
                return;
              }
              if (profile) {
                console.log('App: Profile loaded:', profile);
                const userRole = mapRoleFromDb(profile.role || 'admin');
                console.log('App: Mapped role:', profile.role, '->', userRole);
                setCurrentUser({
                  id: session.user.id,
                  name: profile.full_name || 'User',
                  email: session.user.email!,
                  username: profile.username,
                  role: userRole,
                  institution: profile.institution,
                  department: profile.department,
                  position: profile.position,
                  is_active: profile.is_active,
                  progress: profile.progress || {
                    userId: session.user.id,
                    completedScenarios: [],
                    skillLevels: {}
                  }
                });
              }
            })
            .catch((err) => {
              console.error('App: Unexpected error during profile fetch:', err);
            });
        } else {
          console.log('App: No active session, clearing user state');
          setCurrentUser(null);
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        console.log('Auth state change event:', _event, session ? 'Session exists' : 'No session');

        if (_event === 'SIGNED_OUT') {
          console.log('User explicitly signed out');
          setCurrentUser(null);
          return;
        }

        if (_event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully, maintaining current user state');
          return;
        }

        if (session?.user && (_event === 'SIGNED_IN' || _event === 'INITIAL_SESSION' || _event === 'USER_UPDATED')) {
          console.log('Auth state change: Fetching profile for event', _event);
          supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
            .then(({ data: profile, error: profileError }) => {
              if (profileError) {
                console.error('Auth state change - profile fetch error:', profileError);
                if (profileError.code === 'PGRST116') {
                  console.error('Profile not found - maintaining existing session');
                  return;
                }
                if (profileError.code === '42501' || profileError.message?.includes('permission')) {
                  console.error('Permission error - this is likely temporary, maintaining session');
                  return;
                }
                return;
              }
              if (profile) {
                const userRole = mapRoleFromDb(profile.role || 'admin');
                console.log('Updating user in store from auth state change');
                setCurrentUser({
                  id: session.user.id,
                  name: profile.full_name || 'User',
                  email: session.user.email!,
                  username: profile.username,
                  role: userRole,
                  institution: profile.institution,
                  department: profile.department,
                  position: profile.position,
                  is_active: profile.is_active,
                  progress: profile.progress || {
                    userId: session.user.id,
                    completedScenarios: [],
                    skillLevels: {}
                  }
                });
              }
            })
            .catch((err) => {
              console.error('Auth state change - unexpected error:', err);
              console.log('Maintaining existing user session despite error');
            });
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [setCurrentUser]);

  return (
    <ErrorBoundary>
      <BrandingProvider>
        <ThemeProvider>
          <LanguageProvider>
            <DialogProvider>
              <LTIProvider>
                <NetworkStatusIndicator />
                <Suspense fallback={<LoadingFallback />}>
                  <Routes>
        <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/login" replace />} />
        <Route path="login" element={<Login />} />
        <Route path="reset-password" element={<ResetPassword />} />
        
        <Route path="dashboard" element={
          <ProtectedRoute>
            <DashboardRouter />
          </ProtectedRoute>
        } />

        <Route path="admin-dashboard" element={
          <ProtectedRoute requireAdmin>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        <Route path="teacher" element={
          <ProtectedRoute requireTeacher>
            <TeacherDashboard />
          </ProtectedRoute>
        } />

        <Route path="learner" element={
          <ProtectedRoute>
            <LearnerDashboard />
          </ProtectedRoute>
        } />

        <Route path="settings" element={
          <ProtectedRoute>
            <UserSettings />
          </ProtectedRoute>
        } />

        <Route path="simulation">
          <Route index element={
            <ProtectedRoute>
              <TopicSelection />
            </ProtectedRoute>
          } />

          <Route path=":simulationId/landing" element={
            <SimulationLandingPage />
          } />

          <Route path="play/:simulationId" element={
            <ProtectedRoute>
              <SimulationPlayer />
            </ProtectedRoute>
          } />

          <Route path=":simulationId/intro" element={
            <ProtectedRoute>
              <SimulationIntroduction />
            </ProtectedRoute>
          } />

          <Route path=":simulationId/scenario/:scenarioIndex/introduction" element={
            <ProtectedRoute>
              <IntroductionPage />
            </ProtectedRoute>
          } />

          <Route path=":simulationId/scenario/:scenarioIndex/question" element={
            <ProtectedRoute>
              <QuestionPage />
            </ProtectedRoute>
          } />

          <Route path=":simulationId/scenario/:scenarioIndex/feedback" element={
            <ProtectedRoute>
              <FeedbackPage />
            </ProtectedRoute>
          } />

          <Route path=":simulationId/scenario/:scenarioIndex/transition" element={
            <ProtectedRoute>
              <TransitionPage />
            </ProtectedRoute>
          } />

          <Route path="difficulty" element={
            <ProtectedRoute>
              <DifficultySelection />
            </ProtectedRoute>
          } />

          <Route path=":topicId/:difficulty/landing" element={
            <ProtectedRoute>
              <DifficultyLandingPage />
            </ProtectedRoute>
          } />

          <Route path="scenario" element={
            <ProtectedRoute>
              <SimulationScenario />
            </ProtectedRoute>
          } />

          <Route path=":simulationId/closing" element={
            <ProtectedRoute>
              <SimulationClosingPage />
            </ProtectedRoute>
          } />

          <Route path="results" element={
            <ProtectedRoute>
              <Results />
            </ProtectedRoute>
          } />

          <Route path="results/:simulationId" element={
            <ProtectedRoute>
              <Results />
            </ProtectedRoute>
          } />
        </Route>
        
        <Route path="admin" element={
          <ProtectedRoute requireAdmin>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/admin/flow-builder" replace />} />
          <Route path="flow-builder" element={<ScenarioFlowBuilder />} />
          <Route path="scenarios" element={<ScenarioManager />} />
          <Route path="videos" element={<VideoManager />} />
          <Route path="analytics" element={<PathAnalyticsDashboard />} />
        </Route>
        
        <Route path="lti/config" element={<LTIConfig />} />

        <Route path="instructor" element={
          <ProtectedRoute requireAdmin>
            <InstructorDashboard />
          </ProtectedRoute>
        } />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
                </Suspense>
              </LTIProvider>
            </DialogProvider>
          </LanguageProvider>
        </ThemeProvider>
      </BrandingProvider>
    </ErrorBoundary>
  );
}

export default App;