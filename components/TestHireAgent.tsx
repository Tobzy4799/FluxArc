'use client';

import { useState } from 'react';

export default function TestHireAgent() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [agentId, setAgentId] = useState('agent-alpha-coder');
  const [userInput, setUserInput] = useState('Build me a Next.js landing page framework.');
  const [price, setPrice] = useState('5.00');
  const [mockUserWallet, setMockUserWallet] = useState('0x1234567890abcdef1234567890abcdef12345678');

  const handleHireAgent = async () => {
    setLoading(true);
    setResponse(null);
    try {
      const res = await fetch('/api/hire-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId,
          price,
          userInput,
          walletAddress: mockUserWallet,
          jobId: `test-job-${Math.floor(1000 + Math.random() * 9000)}` // Added to pass backend route checks
        }),
      });

      const data = await res.json();
      setResponse(data);
    } catch (error: any) {
      setResponse({ error: error.message || 'Frontend submission failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
        🛠️ Agentix Marketplace Pipeline Tester
      </h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
        <label>
          <strong>Agent ID:</strong>
          <input 
            type="text" 
            value={agentId} 
            onChange={(e) => setAgentId(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </label>

        <label>
          <strong>Task Input:</strong>
          <textarea 
            value={userInput} 
            onChange={(e) => setUserInput(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px', height: '60px' }} // Adjusted style height bug
          />
        </label>

        <label>
          <strong>Price (USDC):</strong>
          <input 
            type="text" 
            value={price} 
            onChange={(e) => setPrice(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </label>
      </div>

      <button
        onClick={handleHireAgent}
        disabled={loading}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: loading ? '#9ca3af' : '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontWeight: 'bold'
        }}
      >
        {loading ? '⏳ Triggering Circle Infrastructure...' : '🚀 Hire Autonomous Agent'}
      </button>

      {response && (
        <div style={{ marginTop: '24px', padding: '16px', backgroundColor: response.success ? '#f0fdf4' : '#fef2f2', border: response.success ? '1px solid #bbf7d0' : '1px solid #fecaca', borderRadius: '4px' }}>
          <h3 style={{ margin: '0 0 8px 0', color: response.success ? '#166534' : '#991b1b' }}>
            {response.success ? '🟢 Pipeline Success!' : '🔴 Pipeline Failed'}
          </h3>
          <pre style={{ fontSize: '12px', overflowX: 'auto', background: '#fff', padding: '10px', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}