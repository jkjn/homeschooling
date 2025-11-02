import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AppProvider } from './hooks/useAppState';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import Dashboard from './components/Dashboard';
import StudentsManager from './components/StudentsManager';
import SubjectsManager from './components/SubjectsManager';
import TimeTracker from './components/TimeTracker';
import VolunteerHours from './components/VolunteerHours';
import Reports from './components/Reports';
import Settings from './components/Settings';
import ThemeToggle from './components/ThemeToggle';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import ForgotPassword from './components/auth/ForgotPassword';
import ProtectedRoute from './components/auth/ProtectedRoute';
import UserMenu from './components/auth/UserMenu';
import { useAuth } from './contexts/AuthContext';
import { Button } from '@mui/material';

type TabType = 'dashboard' | 'tracker' | 'students' | 'subjects' | 'volunteer' | 'reports' | 'settings';

const MainApp: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Determine active tab from location
  const getActiveTab = (): TabType => {
    const path = location.pathname;
    if (path.includes('/tracker')) return 'tracker';
    if (path.includes('/students')) return 'students';
    if (path.includes('/subjects')) return 'subjects';
    if (path.includes('/volunteer')) return 'volunteer';
    if (path.includes('/reports')) return 'reports';
    if (path.includes('/settings')) return 'settings';
    return 'dashboard';
  };

  const activeTab = getActiveTab();

  const handleTabClick = (tab: TabType) => {
    const routes: Record<TabType, string> = {
      dashboard: '/',
      tracker: '/tracker',
      students: '/students',
      subjects: '/subjects',
      volunteer: '/volunteer-hours',
      reports: '/reports',
      settings: '/settings',
    };
    navigate(routes[tab]);
    setMobileMenuOpen(false);
  };

  return (
    <div>
      {/* Mobile menu backdrop overlay */}
      {mobileMenuOpen && (
        <div
          className="mobile-menu-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <header className="header">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1>Homeschool Time Tracker</h1>
              <p>Keep track of learning hours by subject and student</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                className="mobile-menu-button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {mobileMenuOpen ? (
                    <>
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </>
                  ) : (
                    <>
                      <line x1="3" y1="12" x2="21" y2="12"></line>
                      <line x1="3" y1="6" x2="21" y2="6"></line>
                      <line x1="3" y1="18" x2="21" y2="18"></line>
                    </>
                  )}
                </svg>
              </button>
              <ThemeToggle />
              {currentUser ? (
                <UserMenu />
              ) : (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate('/login')}
                  sx={{ textTransform: 'none' }}
                >
                  Login
                </Button>
              )}
            </div>
          </div>

          <nav className={`nav ${mobileMenuOpen ? 'nav-mobile-open' : ''}`}>
            <button
              className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleTabClick('dashboard')}
            >
              Dashboard
            </button>
            <button
              className={`nav-link ${activeTab === 'tracker' ? 'active' : ''}`}
              onClick={() => handleTabClick('tracker')}
            >
              Time Tracker
            </button>
            <button
              className={`nav-link ${activeTab === 'students' ? 'active' : ''}`}
              onClick={() => handleTabClick('students')}
            >
              Students
            </button>
            <button
              className={`nav-link ${activeTab === 'subjects' ? 'active' : ''}`}
              onClick={() => handleTabClick('subjects')}
            >
              Subjects
            </button>
            <button
              className={`nav-link ${activeTab === 'volunteer' ? 'active' : ''}`}
              onClick={() => handleTabClick('volunteer')}
            >
              Volunteer Hours
            </button>
            <button
              className={`nav-link ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => handleTabClick('reports')}
            >
              Reports
            </button>
            <button
              className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => handleTabClick('settings')}
            >
              Settings
            </button>
          </nav>
        </div>
      </header>

      <main className="container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tracker"
            element={
              <ProtectedRoute>
                <TimeTracker />
              </ProtectedRoute>
            }
          />
          <Route
            path="/students"
            element={
              <ProtectedRoute>
                <StudentsManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subjects"
            element={
              <ProtectedRoute>
                <SubjectsManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/volunteer-hours"
            element={
              <ProtectedRoute>
                <VolunteerHours />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>

      <footer
        style={{
          textAlign: 'center',
          padding: '20px',
          color: 'var(--text-muted)',
          borderTop: '1px solid var(--border-color)',
          marginTop: '40px',
        }}
      >
        <p>Homeschool Time Tracker - Built with React & TypeScript</p>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AppProvider>
            <MainApp />
          </AppProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;