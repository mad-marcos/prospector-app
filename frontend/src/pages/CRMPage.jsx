import React, { useState, useEffect } from 'react';
import { Search, Download, PlusSquare, RefreshCcw, Loader2 } from 'lucide-react';

export default function CRMPage({ project }) {
  const [kanban, setKanban] = useState([]);
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);

  const fetchKanban = async () => {
    if(!project) return;
    const res = await fetch(`${import.meta.env.VITE_API_URL}/projects/${project.id}/kanban`);
    if(res.ok) {
      const data = await res.json();
      setKanban(data);
    }
  };

  const checkStatus = async () => {
    if(!project) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/projects/${project.id}/status`);
      if(res.ok) {
        const data = await res.json();
        setStatus(data.status);
        setProgress(data.progress);
        if(data.status === "completed") {
          fetchKanban();
        }
      }
    } catch(e) {}
  };

  useEffect(() => { 
    fetchKanban();
    checkStatus();
  }, [project]);

  useEffect(() => {
    let interval;
    if(status === "running") {
      interval = setInterval(checkStatus, 2000); // Check every 2 seconds for faster updates
    }
    return () => {
      if(interval) clearInterval(interval);
    }
  }, [status, project]);

  const handleScrape = async () => {
    await fetch(`${import.meta.env.VITE_API_URL}/projects/${project.id}/scrape`, { method: 'POST' });
    setStatus("running");
    setProgress(0);
  };

  const calculateETA = () => {
    // 20 leads target, ~1.5s per lead avg for SerpAPI + WhatsApp check
    const remainingLeads = 20 - (progress / 100 * 20);
    const seconds = remainingLeads * 1.5;
    const minutes = Math.ceil(seconds / 60);
    if(minutes <= 1) return "~1 minuto";
    return `~${minutes} minutos`;
  };

  if (!project) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
      Selecione ou crie um projeto na barra lateral
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h2 style={{ margin: 0, color: 'white' }}>{project.name}</h2>
          <span style={{ color: 'var(--text-muted)' }}>Busca: {project.keyword} em {project.city}, {project.state}, {project.country}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <button className="btn-secondary"><PlusSquare size={16}/> Importar CSV</button>
          
          {status === "idle" && (
            <button className="btn-primary" onClick={handleScrape}><Search size={16}/> Buscar Leads</button>
          )}
          
          {status === "completed" && (
            <button className="btn-primary" style={{ background: 'var(--success)' }} onClick={() => { setStatus("idle"); fetchKanban(); }}>
              <RefreshCcw size={16}/> Pesquisa concluída, Refresh
            </button>
          )}

          {status === "running" && (
            <div className="glass-panel" style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', width: '300px', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Loader2 size={14} className="animate-spin" /> Buscando contatos...
                </span>
                <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{progress}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.5s ease-in-out' }}></div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right' }}>
                Tempo restante estimado: {calculateETA()}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="KanbanBoard">
        {kanban.map(c => (
          <div key={c.id} className="kanban-column">
            <h3 style={{ marginTop: 0, borderBottom: '3px solid var(--primary)', paddingBottom: '8px' }}>{c.title} ({c.leads.length})</h3>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {c.leads.map(l => (
                <div key={l.id} className="kanban-card">
                  <div style={{ fontWeight: 600, color: 'white', marginBottom: '4px' }}>{l.name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{l.phone || 'Sem telefone'}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{l.email || l.website || ''}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
