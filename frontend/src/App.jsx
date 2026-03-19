import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage.jsx';
import CRMPage from './pages/CRMPage.jsx';
import AutomationsPage from './pages/AutomationsPage.jsx';
import Sidebar from './components/Sidebar.jsx';
import Topbar from './components/Topbar.jsx';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeProject, setActiveProject] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('prospector_user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  if (loading) return null;

  if (!user) {
    return <AuthPage onAuth={(u) => {
      setUser(u);
      localStorage.setItem('prospector_user', JSON.stringify(u));
    }} />;
  }

  return (
    <Router>
      <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
        <Sidebar user={user} activeProject={activeProject} setActiveProject={setActiveProject} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <Topbar user={user} setUser={(u) => {
            if(!u) {
              localStorage.removeItem('prospector_user');
              setActiveProject(null);
            }
            setUser(u);
          }} activeProject={activeProject} />
          
          <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
            <Routes>
              <Route path="/" element={<CRMPage project={activeProject} />} />
              <Route path="/automations" element={<AutomationsPage project={activeProject} />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
