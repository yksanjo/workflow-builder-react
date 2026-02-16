import React, { useCallback, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  Save, 
  Download, 
  Upload, 
  Code, 
  Plus, 
  Bot, 
  Users, 
  ArrowRight, 
  GitBranch 
} from 'lucide-react';

// Node type definitions
const nodeTypes = {
  agent: {
    label: 'Agent Node',
    icon: Bot,
    color: '#00D4AA',
    inputs: ['input'],
    outputs: ['output'],
  },
  groupchat: {
    label: 'Group Chat',
    icon: Users,
    color: '#7B61FF',
    inputs: ['input'],
    outputs: ['output'],
  },
  sequential: {
    label: 'Sequential',
    icon: ArrowRight,
    color: '#FF6B4A',
    inputs: ['input'],
    outputs: ['output'],
  },
  parallel: {
    label: 'Parallel',
    icon: GitBranch,
    color: '#FFD93D',
    inputs: ['input'],
    outputs: ['output'],
  },
};

// Custom node component
const CustomNode = ({ data }) => {
  const TypeIcon = nodeTypes[data.type]?.icon || Bot;
  const color = nodeTypes[data.type]?.color || '#00D4AA';
  
  return (
    <div 
      style={{ 
        border: `2px solid ${color}`,
        borderLeft: `4px solid ${color}`,
        borderRadius: '12px',
        background: '#16161D',
        minWidth: '200px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      }}
    >
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px', 
        padding: '12px 14px',
        borderBottom: '1px solid #2A2A36'
      }}>
        <div style={{ 
          width: '28px', 
          height: '28px', 
          borderRadius: '6px',
          background: `${color}26`,
          color: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <TypeIcon size={16} />
        </div>
        <span style={{ fontWeight: 600, fontSize: '13px' }}>{data.label}</span>
      </div>
      <div style={{ padding: '12px 14px', fontSize: '12px', color: '#8B8B9A' }}>
        {data.description}
      </div>
    </div>
  );
};

const initialNodes = [
  {
    id: '1',
    type: 'custom',
    position: { x: 100, y: 100 },
    data: { type: 'agent', label: 'triage_nurse', description: 'Single agent with LLM config' },
  },
  {
    id: '2',
    type: 'custom',
    position: { x: 400, y: 100 },
    data: { type: 'groupchat', label: 'consultation', description: 'Multi-agent discussion' },
  },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
];

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [showCode, setShowCode] = useState(false);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges],
  );

  const addNode = (type) => {
    const newNode = {
      id: `${nodes.length + 1}`,
      type: 'custom',
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { 
        type, 
        label: `new_${type}_${nodes.length + 1}`, 
        description: nodeTypes[type].label 
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const generateCode = () => {
    const workflow = {
      schema_version: '2.0',
      workflow_id: `workflow-${Date.now()}`,
      agents: nodes
        .filter((n) => n.data.type === 'agent')
        .map((n) => ({
          name: n.data.label,
          class: 'AssistantAgent',
          system_message: '',
          llm_config: { model: 'gpt-4', temperature: 0.3 },
          tools: [],
        })),
      orchestration: {
        type: 'Sequential',
        agents: nodes.map((n) => n.data.label),
      },
    };
    return JSON.stringify(workflow, null, 2);
  };

  const exportWorkflow = () => {
    const data = JSON.stringify({ nodes, edges }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workflow.json';
    a.click();
  };

  const nodeTypeArray = Object.entries(nodeTypes);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0D0D12' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={{ custom: CustomNode }}
        fitView
        style={{ background: '#0D0D12' }}
      >
        <Background color="#2A2A36" gap={20} />
        <Controls style={{ background: '#16161D', border: '1px solid #2A2A36' }} />
        <MiniMap 
          nodeColor={(n) => nodeTypes[n.data?.type]?.color || '#00D4AA'}
          style={{ background: '#16161D' }}
        />
        
        <Panel position="top-right" style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowCode(!showCode)}
            style={btnStyle}
          >
            <Code size={16} /> {showCode ? 'Visual' : 'Code'}
          </button>
          <button onClick={exportWorkflow} style={btnStyle}>
            <Download size={16} /> Export
          </button>
        </Panel>

        <Panel position="top-left">
          <div style={{ 
            display: 'flex', 
            gap: '12px',
            padding: '12px',
            background: '#16161D',
            borderRadius: '12px',
            border: '1px solid #2A2A36'
          }}>
            {nodeTypeArray.map(([type, config]) => (
              <button
                key={type}
                onClick={() => addNode(type)}
                style={{
                  ...paletteItemStyle,
                  borderLeft: `3px solid ${config.color}`,
                }}
              >
                <config.icon size={20} color={config.color} />
                <span>{config.label}</span>
              </button>
            ))}
          </div>
        </Panel>

        {showCode && (
          <Panel position="top-center" style={{ width: '80%', maxWidth: '600px' }}>
            <textarea
              value={generateCode()}
              readOnly
              style={{
                width: '100%',
                height: '300px',
                background: '#16161D',
                color: '#F4F4F6',
                border: '1px solid #2A2A36',
                borderRadius: '12px',
                padding: '16px',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '13px',
              }}
            />
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}

const btnStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 16px',
  background: '#16161D',
  border: '1px solid #2A2A36',
  borderRadius: '8px',
  color: '#F4F4F6',
  cursor: 'pointer',
  fontSize: '13px',
};

const paletteItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 14px',
  background: '#1E1E28',
  border: '1px solid #2A2A36',
  borderRadius: '8px',
  color: '#F4F4F6',
  cursor: 'pointer',
  fontSize: '13px',
  transition: 'transform 0.2s',
};
