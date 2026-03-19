import React, { useState, useEffect } from 'react';
import { Plus, Search, Folder } from 'lucide-react';
import NewProjectModal from './NewProjectModal.jsx';

export default function Sidebar({ user, activeProject, setActiveProject }) {
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/projects`, { headers: { 'X-User-Id': String(user.id) } });
      const data = await res.json();
      setProjects(data);
      if(!activeProject && data.length > 0) setActiveProject(data[0]);
    } catch(e) {}
  };

  useEffect(() => { fetchProjects(); }, [activeProject]);

  const handleModalSuccess = (newProject) => {
    setProjects([newProject, ...projects]);
    setActiveProject(newProject);
    setIsModalOpen(false);
  };

  return (
    <>
      {isModalOpen && (
        <NewProjectModal 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={handleModalSuccess} 
          userId={user.id} 
        />
      )}
      <div className="glass-panel" style={{ width: '260px', height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderBottom: 'none' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 700, fontSize: '18px', marginBottom: '16px' }}>
            <Search size={24} /> PROSPECTOR.AI
          </div>
          <button className="btn-primary" style={{ width: '100%' }} onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> Novo Projeto
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          <div style={{ padding: '12px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Meus Projetos</div>
          {projects.map(p => (
            <div key={p.id} onClick={() => setActiveProject(p)} style={{ padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', background: activeProject?.id === p.id ? 'rgba(79, 70, 229, 0.2)' : 'transparent', color: activeProject?.id === p.id ? 'white' : 'var(--text-muted)' }}>
              <Folder size={16} /> <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '14px' }}>{p.name}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
