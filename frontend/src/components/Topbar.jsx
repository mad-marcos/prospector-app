import React from 'react';
import { Settings, UserCog, LogOut, Wand } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Topbar({ user, setUser, activeProject }) {
  return (
    <div className="glass-panel" style={{ height: '64px', display: 'flex', alignItems: 'center', padding: '0 24px', justifyContent: 'space-between', borderRadius: 0, borderTop: 'none', borderRight: 'none', borderLeft: 'none' }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ margin: 0, fontSize: '18px' }}>{activeProject ? activeProject.name : 'Selecione um projeto'}</h2>
      </div>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <Link to="/" style={{ color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>CRM</Link>
        <Link to="/automations" style={{ color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}><Wand size={16}/> Automações</Link>
        <div style={{ width: '1px', height: '24px', background: 'var(--glass-border)' }}></div>
        <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserCog size={18} /> {user.email}
        </div>
        <button className="btn-secondary" onClick={() => alert('Configs modal mock')}>
          <Settings size={16} /> Configs
        </button>
        <button className="btn-secondary" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => setUser(null)}>
          <LogOut size={16} /> Sair
        </button>
      </div>
    </div>
  );
}
