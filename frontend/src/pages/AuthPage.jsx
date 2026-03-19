import { useState } from 'react';
import { Search } from 'lucide-react';

export default function AuthPage({ onAuth }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const res = await fetch(``" + import.meta.env.VITE_API_URL + `"${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) throw new Error(await res.text());
      const user = await res.json();
      onAuth(user);
    } catch (err) {
      alert("Erro: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
        <form onSubmit={handleSubmit} className="glass-panel" style={{ width: '400px', padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '1.5rem', color: 'var(--primary)' }}>
            <Search size={32} />
            <h1 style={{ margin: 0, color: 'white' }}>PROSPECTOR.AI</h1>
          </div>
          
          <h2 style={{ textAlign: 'center', marginTop: 0 }}>{isLogin ? 'Entrar na plataforma' : 'Criar conta'}</h2>
          
          <label>Email</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" />
          
          <label>Senha</label>
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          
          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '16px' }}>
            {loading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Cadastrar')}
          </button>
          
          <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '14px', color: 'var(--text-muted)' }}>
            {isLogin ? 'Ainda não tem conta? ' : 'Já tem uma conta? '}
            <span style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 500 }} onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? 'Cadastre-se' : 'Faça login'}
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
