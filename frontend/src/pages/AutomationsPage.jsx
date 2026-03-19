import React from 'react';
import { Wand } from 'lucide-react';

export default function AutomationsPage({ project }) {
  if (!project) return <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Selecione um projeto</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, color: 'white' }}>Automations for {project.name}</h2>
          <span style={{ color: 'var(--text-muted)' }}>Crie fluxos de trabalho visuais para sua prospecção</span>
        </div>
        <button className="btn-primary"><Wand size={16}/> Nova Automação</button>
      </div>

      <div className="glass-panel" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', flexDirection: 'column', textAlign: 'center' }}>
        <Wand size={48} color="var(--primary)" style={{ opacity: 0.5, marginBottom: '16px' }} />
        <h3 style={{ margin: 0, marginBottom: '8px' }}>Em Construção</h3>
        <p style={{ color: 'var(--text-muted)', maxWidth: '400px' }}>
          O construtor visual de automações no-code (estilo n8n) está sendo implementado. Em breve você poderá arrastar cards para disparar e-mails e WhatsApp!
        </p>
      </div>
    </div>
  );
}
