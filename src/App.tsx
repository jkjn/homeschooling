import React, { useState } from 'react';
import { AppProvider } from './hooks/useAppState';
import { ThemeProvider } from './contexts/ThemeContext';
import Dashboard from './components/Dashboard';
import ChildrenManager from './components/ChildrenManager';
import SubjectsManager from './components/SubjectsManager';
import TimeTracker from './components/TimeTracker';
import Reports from './components/Reports';
import Settings from './components/Settings';
import ThemeToggle from './components/ThemeToggle';

type TabType = 'dashboard' | 'tracker' | 'children' | 'subjects' | 'reports' | 'settings';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'tracker':
        return <TimeTracker />;
      case 'children':
        return <ChildrenManager />;
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
          <header className="header">
            <div className="container">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h1>Homeschool Time Tracker</h1>
                  <p>Keep track of learning hours by subject and child</p>
                </div>
                <ThemeToggle />
              </div>

              <nav className="nav">
                <button
                  className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
                  onClick={() => setActiveTab('dashboard')}
                >
                  Dashboard
                </button>
                <button
                  className={`nav-link ${activeTab === 'tracker' ? 'active' : ''}`}
                  onClick={() => setActiveTab('tracker')}
                >
                  Time Tracker
                </button>
                <button
                  className={`nav-link ${activeTab === 'children' ? 'active' : ''}`}
                  onClick={() => setActiveTab('children')}
                >
                  Children
                </button>
                <button
                  className={`nav-link ${activeTab === 'subjects' ? 'active' : ''}`}
                  onClick={() => setActiveTab('subjects')}
                >
                  Subjects
                </button>
                <button
                  className={`nav-link ${activeTab === 'reports' ? 'active' : ''}`}
                  onClick={() => setActiveTab('reports')}
                >
                  Reports
                </button>
                <button
                  className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`}
                  onClick={() => setActiveTab('settings')}
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