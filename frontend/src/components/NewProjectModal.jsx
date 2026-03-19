import React, { useState } from 'react';

const COUNTRIES = [
  "Brasil", "Estados Unidos", "Portugal", "Espanha", "Reino Unido", 
  "Canadá", "Austrália", "Argentina", "França", "Alemanha", "Itália"
];

const ALL_STATES = {
  "Brasil": ["São Paulo", "Rio de Janeiro", "Minas Gerais", "Bahia", "Paraná", "Rio Grande do Sul", "Pernambuco", "Ceará", "Santa Catarina", "Goiás"],
  "Estados Unidos": ["Califórnia", "Flórida", "Texas", "Nova York", "Illinois", "Geórgia", "Ohio", "Michigan", "Pensilvânia", "Washington"],
  "Portugal": ["Lisboa", "Porto", "Braga", "Setúbal", "Aveiro", "Faro", "Leiria", "Coimbra", "Santarém", "Viseu"],
  "Espanha": ["Madrid", "Barcelona", "Valência", "Sevilha", "Saragoça", "Málaga", "Múrcia", "Palma", "Las Palmas", "Bilbau"],
  "Reino Unido": ["Londres", "Manchester", "Birmingham", "Leeds", "Glasgow", "Liverpool", "Southampton", "Newcastle", "Nottingham", "Sheffield"]
};

export default function NewProjectModal({ onClose, onSuccess, userId }) {
  const [formData, setFormData] = useState({
    name: '',
    keyword: '',
    country: 'Brasil',
    state: '',
    city: ''
  });
  const [loading, setLoading] = useState(false);

  const states = ALL_STATES[formData.country] || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/projects`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': String(userId) 
        },
        body: JSON.stringify(formData)
      });
      if(res.ok) {
        const newProject = await res.json();
        onSuccess(newProject);
      }
    } catch(e) {}
    setLoading(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '32px', animation: 'fadeIn 0.3s ease-out' }}>
        <h2 style={{ margin: 0, marginBottom: '24px', color: 'white' }}>Novo Projeto de Prospecção</h2>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: 'var(--text-muted)' }}>Nome do Projeto</label>
            <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Clínicas Odonto SP" style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'white' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: 'var(--text-muted)' }}>País</label>
              <select 
                value={formData.country} 
                onChange={e => setFormData({...formData, country: e.target.value, state: '', city: ''})} 
                style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'white' }}
              >
                {COUNTRIES.map(c => <option key={c} value={c} style={{ background: '#111' }}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: 'var(--text-muted)' }}>Estado / Região</label>
              {states.length > 0 ? (
                <select 
                  required
                  value={formData.state} 
                  onChange={e => setFormData({...formData, state: e.target.value})} 
                  style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'white' }}
                >
                  <option value="" style={{ background: '#111' }}>Selecione...</option>
                  {states.map(s => <option key={s} value={s} style={{ background: '#111' }}>{s}</option>)}
                </select>
              ) : (
                <input required value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} placeholder="Digite a região" style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'white' }} />
              )}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: 'var(--text-muted)' }}>Cidade (Opcional)</label>
            <input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} placeholder="Ex: São Paulo" style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'white' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: 'var(--text-muted)' }}>Nicho / Palavra-chave</label>
            <input required value={formData.keyword} onChange={e => setFormData({...formData, keyword: e.target.value})} placeholder="Ex: Dentista, Pet Shop, Advogado..." style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'white' }} />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" style={{ flex: 2 }} disabled={loading}>{loading ? 'Criando...' : 'Criar e Iniciar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
