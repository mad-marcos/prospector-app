import React, { useState, useEffect } from 'react';

const COUNTRIES = [
  "Brasil", "Estados Unidos", "Portugal", "Espanha", "Reino Unido", 
  "Canadá", "Austrália", "Argentina", "França", "Alemanha", "Itália"
];

const STATES = {
  "Brasil": [
    "Acre", "Alagoas", "Amapá", "Amazonas", "Bahia", "Ceará", "Distrito Federal", "Espírito Santo", 
    "Goiás", "Maranhão", "Mato Grosso", "Mato Grosso do Sul", "Minas Gerais", "Pará", "Paraíba", 
    "Paraná", "Pernambuco", "Piauí", "Rio de Janeiro", "Rio Grande do Norte", "Rio Grande do Sul", 
    "Rondônia", "Roraima", "Santa Catarina", "São Paulo", "Sergipe", "Tocantins"
  ],
  "Estados Unidos": [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", 
    "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", 
    "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", 
    "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", 
    "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", 
    "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", 
    "Washington", "West Virginia", "Wisconsin", "Wyoming"
  ],
  "Portugal": [
    "Aveiro", "Beja", "Braga", "Bragança", "Castelo Branco", "Coimbra", "Évora", "Faro", "Guarda", 
    "Leiria", "Lisboa", "Portalegre", "Porto", "Santarém", "Setúbal", "Viana do Castelo", "Vila Real", "Viseu", "Açores", "Madeira"
  ]
};

export default function NewProjectModal({ onClose, onSuccess, userId }) {
  const [form, setForm] = useState({ name: '', country: 'Brasil', state: 'São Paulo', city: '', keyword: '' });
  const [loading, setLoading] = useState(false);

  // When country changes, reset state
  useEffect(() => {
    const available = STATES[form.country];
    if (available && available.length > 0) {
      setForm(prev => ({ ...prev, state: available[0] }));
    } else {
      setForm(prev => ({ ...prev, state: '' }));
    }
  }, [form.country]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(``${import.meta.env.VITE_API_URL}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': String(userId)
        },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      onSuccess(data);
    } catch (err) {
      alert("Erro ao criar projeto: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCountryChange = (e) => {
    setForm({ ...form, country: e.target.value });
  };

  const availableStates = STATES[form.country];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" style={{ width: '500px' }} onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>✕</button>
        <h2 style={{ marginTop: 0 }}>Criar Novo Projeto</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
          Defina os parâmetros de busca para extrair empresas automaticamente.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
          <label>Nome da Campanha/Projeto</label>
          <input required type="text" placeholder="Ex: Clínicas Odontológicas SP" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />

          <label>País</label>
          <select value={form.country} onChange={handleCountryChange}>
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <label>Estado / Região</label>
          {availableStates ? (
            <select value={form.state} onChange={e => setForm({...form, state: e.target.value})}>
              <option value="">Qualquer estado</option>
              {availableStates.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          ) : (
            <input type="text" placeholder="Digite o estado/região" value={form.state} onChange={e => setForm({...form, state: e.target.value})} />
          )}

          <label>Cidade (Opcional)</label>
          <input type="text" placeholder="Ex: São Paulo" value={form.city} onChange={e => setForm({...form, city: e.target.value})} />

          <label>Nicho / Palavra-chave</label>
          <input required type="text" placeholder="Ex: Clínica, Construtora, Dentista" value={form.keyword} onChange={e => setForm({...form, keyword: e.target.value})} />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading} style={{ background: 'var(--success)' }}>
              {loading ? 'Criando...' : 'Criar e Buscar Leads'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
