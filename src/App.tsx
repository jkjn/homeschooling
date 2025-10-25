import React, { useState } from 'react';
import { AppProvider } from './hooks/useAppState';
import { ThemeProvider } from './contexts/ThemeContext';
import Dashboard from './components/Dashboard';
import StudentsManager from './components/StudentsManager';
import SubjectsManager from './components/SubjectsManager';
import TimeTracker from './components/TimeTracker';
import Reports from './components/Reports';
import Settings from './components/Settings';
import ThemeToggle from './components/ThemeToggle';

type TabType = 'dashboard' | 'tracker' | 'students' | 'subjects' | 'reports' | 'settings';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleTabClick = (tab: TabType) => {
    setActiveTab(tab);
    setMobileMenuOpen(false); // Close mobile menu when tab is selected
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'tracker':
        return <TimeTracker />;
      case 'students':
        return <StudentsManager />;
      case 'subjects':
        return <SubjectsManager />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <ThemeProvider>
      <AppProvider>
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
          {renderActiveTab()}
        </main>

          <footer style={{
            textAlign: 'center',
            padding: '20px',
            color: 'var(--text-muted)',
            borderTop: '1px solid var(--border-color)',
            marginTop: '40px'
          }}>
            <p>Homeschool Time Tracker - Built with React & TypeScript</p>
          </footer>
        </div>
      </AppProvider>
    </ThemeProvider>
  );
};

export default App;