import React, { useState, useCallback, useEffect } from 'react';
import { 
  ReactFlow, 
  addEdge, 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState,
  Panel,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Save, Plus, Zap, MessageSquare, Clock, Filter, Trash2 } from 'lucide-react';

const initialNodes = [
  {
    id: 'node-1',
    type: 'trigger',
    position: { x: 250, y: 5 },
    data: { label: 'Novo Lead Extraído', description: 'Ativa sempre que uma empresa é capturada' },
  },
];

const initialEdges = [];

// Custom Node Components
const TriggerNode = ({ data }) => (
  <div className="glass-panel" style={{ padding: '15px', minWidth: '180px', borderLeft: '4px solid #f59e0b' }}>
    <Handle type="source" position={Position.Bottom} />
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#f59e0b' }}>
      <Zap size={18} /> <strong>Gatilho</strong>
    </div>
    <div style={{ fontSize: '13px', fontWeight: 600 }}>{data.label}</div>
    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{data.description}</div>
  </div>
);

const ActionNode = ({ data }) => (
  <div className="glass-panel" style={{ padding: '15px', minWidth: '180px', borderLeft: '4px solid var(--primary)' }}>
    <Handle type="target" position={Position.Top} />
    <Handle type="source" position={Position.Bottom} />
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--primary)' }}>
      <MessageSquare size={18} /> <strong>WhatsApp</strong>
    </div>
    <div style={{ fontSize: '13px', fontWeight: 600 }}>Enviar Mensagem</div>
    <textarea 
      style={{ width: '100%', fontSize: '11px', background: 'rgba(0,0,0,0.2)', border: 'none', color: 'white', marginTop: '4px', borderRadius: '4px', padding: '4px' }}
      placeholder="Olá {{name}}..."
      defaultValue={data.message || ''}
    />
  </div>
);

const DelayNode = ({ data }) => (
  <div className="glass-panel" style={{ padding: '15px', minWidth: '150px', borderLeft: '4px solid #6366f1' }}>
    <Handle type="target" position={Position.Top} />
    <Handle type="source" position={Position.Bottom} />
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#6366f1' }}>
      <Clock size={18} /> <strong>Atraso</strong>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <input type="number" style={{ width: '40px', fontSize: '12px', background: 'rgba(0,0,0,0.2)', color: 'white', border: 'none' }} defaultValue="10" />
      <span style={{ fontSize: '12px' }}>minutos</span>
    </div>
  </div>
);

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  delay: DelayNode,
};

export default function AutomationsPage({ project }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if(project) loadFlow();
  }, [project]);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const loadFlow = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/projects/${project.id}/automations`);
      const autos = await res.json();
      if(autos && autos.length > 0) {
        const flow = JSON.parse(autos[0].flow_json);
        setNodes(flow.nodes || initialNodes);
        setEdges(flow.edges || initialEdges);
      }
    } catch(e) {}
  };

  const saveFlow = async () => {
    if(!project) return;
    setSaving(true);
    const flow = { nodes, edges };
    try {
      // Logic for creating or updating
      const res = await fetch(`${import.meta.env.VITE_API_URL}/projects/${project.id}/automations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: "Fluxo de Prospecção", flow_json: JSON.stringify(flow) })
      });
      if(res.ok) alert("Automação Salva com Sucesso!");
    } catch(e) {
      alert("Erro ao salvar fluxo");
    } finally {
      setSaving(false);
    }
  };

  const addNode = (type) => {
    const id = `node-${nodes.length + 1}`;
    const newNode = {
      id,
      type,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { label: type.toUpperCase(), message: '' },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  if (!project) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
      Selecione um projeto para configurar automações
    </div>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h2 style={{ margin: 0, color: 'white' }}>Fluxo de Automação</h2>
          <span style={{ color: 'var(--text-muted)' }}>Defina o que acontece quando um lead é encontrado</span>
        </div>
        <button className="btn-primary" onClick={saveFlow} disabled={saving}>
          <Save size={18}/> {saving ? 'Salvando...' : 'Salvar Fluxo'}
        </button>
      </div>

      <div style={{ flex: 1, position: 'relative', background: 'rgba(0,0,0,0.1)', borderRadius: '12px', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          colorMode="dark"
        >
          <Background color="#333" gap={20} />
          <Controls />
          <MiniMap nodeStrokeColor={(n) => (n.type === 'trigger' ? '#f59e0b' : '#4f46e5')}  maskColor="rgba(0,0,0,0.5)" />
          
          <Panel position="top-left" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="glass-panel" style={{ padding: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-muted)' }}>ADICIONAR BLOCOS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button className="btn-secondary" style={{ fontSize: '11px', padding: '6px 10px', justifyContent: 'flex-start' }} onClick={() => addNode('action')}>
                  <MessageSquare size={14}/> Enviar WhatsApp
                </button>
                <button className="btn-secondary" style={{ fontSize: '11px', padding: '6px 10px', justifyContent: 'flex-start' }} onClick={() => addNode('delay')}>
                  <Clock size={14}/> Esperar Tempo
                </button>
                <button className="btn-secondary" style={{ fontSize: '11px', padding: '6px 10px', justifyContent: 'flex-start' }}>
                  <Filter size={14}/> Filtrar Lead
                </button>
              </div>
            </div>
            
            <div className="glass-panel" style={{ padding: '8px', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => { setNodes(initialNodes); setEdges([]); }}>
               <Trash2 size={14} /> <span style={{ fontSize: '11px' }}>Limpar Tudo</span>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}
