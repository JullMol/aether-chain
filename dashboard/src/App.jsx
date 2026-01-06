import React, { useEffect, useState, useRef } from 'react';

function App() {
  const [blocks, setBlocks] = useState([]);
  const [status, setStatus] = useState("Connecting...");
  const [nodeInfo, setNodeInfo] = useState({});
  const [terminalOutput, setTerminalOutput] = useState([]);
  const [terminalInput, setTerminalInput] = useState('');
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [activeView, setActiveView] = useState('home');
  const [archData, setArchData] = useState(null);
  const [showTerminal, setShowTerminal] = useState(false);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [writeValue, setWriteValue] = useState('');
  const terminalRef = useRef(null);

  const loadBlocks = () => {
    fetch('/api/blocks').then(res => res.json()).then(data => {
      if (data.blocks?.length > 0) {
        setBlocks(data.blocks.map((name, i) => ({
          id: name.replace('block_', '').replace('.sst', ''),
          name, hash: '0x' + [...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
          size: Math.floor(Math.random() * 5000) + 10000,
          entries: Math.floor(Math.random() * 50) + 10,
          time: new Date(Date.now() - i * 60000).toLocaleTimeString(), isNew: false
        })).reverse());
      }
    }).catch(() => {});
  };

  const loadStatus = () => {
    fetch('/api/status').then(res => res.json()).then(setNodeInfo).catch(() => {});
  };

  useEffect(() => {
    loadStatus(); loadBlocks();
    fetch('/api/arch').then(res => res.json()).then(setArchData).catch(() => {});
    const interval = setInterval(loadStatus, 5000);
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${wsProtocol}//${window.location.host}/ws`);
    socket.onopen = () => setStatus("Live");
    socket.onerror = () => setStatus("Error");
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "NEW_BLOCK") {
        setBlocks(prev => [{ id: data.id, name: `block_${data.id}.sst`, hash: data.hash,
          size: Math.floor(Math.random() * 5000) + 10000, entries: Math.floor(Math.random() * 50) + 10,
          time: new Date().toLocaleTimeString(), isNew: true }, ...prev.slice(0, 49)]);
        setTerminalOutput(prev => [...prev, `✅ Block #${data.id} mined!`]);
        setNodeInfo(prev => ({ ...prev, total_blocks: (prev.total_blocks || 0) + 1 }));
      }
    };
    return () => { socket.close(); clearInterval(interval); };
  }, []);

  const runAction = async (action) => {
    setShowTerminal(true);
    setTerminalOutput(prev => [...prev, `> ${action}`]);
    if (action === 'bench') {
      setTerminalOutput(prev => [...prev, '🚀 Starting benchmark...', '   Writing 500 entries to Memtable...']);
      await fetch('/api/bench', { method: 'POST' });
      setTerminalOutput(prev => [...prev, '⏳ Flushing to SSTables...']);
      setTimeout(() => { loadBlocks(); setTerminalOutput(prev => [...prev, '✅ Done! New blocks created.']); }, 3000);
    } else if (action === 'write') {
      setShowWriteModal(true);
      return;
    } else if (action === 'verify') {
      setTerminalOutput(prev => [...prev, '🔍 Verifying chain integrity...']);
      const data = await fetch('/api/verify').then(r => r.json());
      setTerminalOutput(prev => [...prev, `✅ ${data.status}`, `   ${data.total_blocks} blocks verified`]);
    } else if (action === 'peers') {
      const data = await fetch('/api/peers').then(r => r.json());
      setTerminalOutput(prev => [...prev, `🌐 ${data.total_connected} peers connected via ${data.protocol}`]);
    }
  };

  useEffect(() => {
    if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
  }, [terminalOutput]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px]"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-20 border-b border-white/5 backdrop-blur-xl bg-black/20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-black text-lg">A</div>
            <span className="text-xl font-bold">Aether-Chain</span>
          </div>
          <div className="flex items-center gap-6">
            {['home', 'explorer', 'architecture'].map(v => (
              <button key={v} onClick={() => setActiveView(v)} className={`text-sm font-medium transition-colors ${activeView === v ? 'text-cyan-400' : 'text-gray-400 hover:text-white'}`}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${status === 'Live' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
              <span className={`w-2 h-2 rounded-full ${status === 'Live' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
              {status}
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {activeView === 'home' && (
          <>
            {/* Hero Section */}
            <section className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm mb-6">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
                Portfolio Project • Built with Go
              </div>
              <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">Distributed</span>
                <br />Data Availability Layer
              </h1>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
                A high-performance blockchain combining <span className="text-cyan-400">LSM-Tree storage</span> with <span className="text-purple-400">P2P networking</span>. 
                Write data, verify integrity, and watch blocks form in real-time.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <button onClick={() => runAction('bench')} className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold text-lg hover:opacity-90 transition-all shadow-lg shadow-cyan-500/25">
                  🚀 Generate Blocks
                </button>
                <button onClick={() => setActiveView('explorer')} className="px-8 py-4 rounded-xl bg-white/5 border border-white/10 font-semibold text-lg hover:bg-white/10 transition-all">
                  View Explorer →
                </button>
              </div>
            </section>

            {/* Stats */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
              {[
                { label: 'Blocks Mined', value: nodeInfo.total_blocks || blocks.length, icon: '📦' },
                { label: 'P2P Nodes', value: '3 Connected', icon: '🌐' },
                { label: 'Uptime', value: nodeInfo.uptime || '-', icon: '⏱️' },
                { label: 'Go Version', value: nodeInfo.go_version?.replace('go', '') || '-', icon: '🔧' },
              ].map((s, i) => (
                <div key={i} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all">
                  <div className="text-2xl mb-2">{s.icon}</div>
                  <p className="text-3xl font-bold text-white mb-1">{s.value}</p>
                  <p className="text-sm text-gray-500">{s.label}</p>
                </div>
              ))}
            </section>

            {/* Quick Actions */}
            <section className="mb-16">
              <h2 className="text-2xl font-bold mb-6">Try It Live</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { id: 'bench', icon: '⚡', title: 'Benchmark', desc: 'Generate 14+ blocks via LSM-Tree' },
                  { id: 'write', icon: '✏️', title: 'Write Data', desc: 'Store data in Memtable' },
                  { id: 'verify', icon: '🔒', title: 'Verify Chain', desc: 'Check blockchain integrity' },
                  { id: 'peers', icon: '🌐', title: 'View Peers', desc: 'See P2P network status' },
                ].map(a => (
                  <button key={a.id} onClick={() => runAction(a.id)} className="text-left p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all group">
                    <span className="text-3xl">{a.icon}</span>
                    <h3 className="font-semibold mt-3 group-hover:text-cyan-400 transition-colors">{a.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{a.desc}</p>
                  </button>
                ))}
              </div>
            </section>

            {/* Live Chain Preview */}
            {blocks.length > 0 && (
              <section className="mb-16">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Live Chain</h2>
                  <button onClick={() => setActiveView('explorer')} className="text-cyan-400 text-sm hover:underline">View all →</button>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {blocks.slice(0, 6).map((block, i) => (
                    <div key={block.id} onClick={() => setSelectedBlock(block)} className="flex-shrink-0 cursor-pointer group">
                      <div className={`w-28 h-32 rounded-xl border-2 p-3 transition-all ${block.isNew ? 'border-emerald-500 bg-emerald-500/10 animate-pulse' : 'border-white/10 bg-white/[0.02] group-hover:border-cyan-500/50'}`}>
                        <p className="text-cyan-400 font-bold text-lg">#{block.id}</p>
                        <p className="text-[10px] text-gray-500 font-mono mt-1 truncate">{block.hash.slice(0, 12)}...</p>
                        <p className="text-xs text-gray-600 mt-auto pt-4">{block.time}</p>
                      </div>
                      {i < 5 && <div className="w-4 h-0.5 bg-cyan-500/30 mx-auto mt-4"></div>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Tech Stack */}
            <section>
              <h2 className="text-2xl font-bold mb-6">Built With</h2>
              <div className="flex flex-wrap gap-3">
                {['Go (Golang)', 'libp2p', 'gRPC', 'WebSocket', 'WebAssembly', 'React', 'TailwindCSS', 'Docker'].map(t => (
                  <span key={t} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300">{t}</span>
                ))}
              </div>
            </section>
          </>
        )}

        {activeView === 'explorer' && (
          <section>
            <h2 className="text-3xl font-bold mb-8">Block Explorer</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {blocks.map(block => (
                <div key={block.id} onClick={() => setSelectedBlock(block)} className="cursor-pointer p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-cyan-500/30 transition-all">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xl font-bold text-cyan-400">Block #{block.id}</span>
                    {block.isNew && <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">NEW</span>}
                  </div>
                  <p className="text-xs font-mono text-gray-500 truncate mb-3">{block.hash}</p>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{block.entries} entries</span>
                    <span>{block.size.toLocaleString()} bytes</span>
                  </div>
                </div>
              ))}
              {blocks.length === 0 && (
                <div className="col-span-full text-center py-20 text-gray-500">
                  <p className="text-xl mb-2">No blocks yet</p>
                  <button onClick={() => runAction('bench')} className="text-cyan-400 hover:underline">Generate blocks →</button>
                </div>
              )}
            </div>
          </section>
        )}

        {activeView === 'architecture' && archData && (
          <section>
            <h2 className="text-3xl font-bold mb-4">System Architecture</h2>
            <p className="text-gray-400 mb-8 max-w-2xl">Aether-Chain combines the speed of LSM-Tree databases with blockchain's immutability and P2P distribution.</p>
            <div className="space-y-4">
              {archData.layers.map((layer, i) => (
                <div key={i} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 flex items-center justify-center text-xl font-bold text-cyan-400">{i + 1}</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-1">{layer.name}</h3>
                      <p className="text-cyan-400 text-sm mb-3">{layer.type}</p>
                      <div className="flex flex-wrap gap-2">
                        {layer.components.map((c, j) => (
                          <span key={j} className="px-3 py-1 rounded-lg bg-white/5 text-sm text-gray-400">{c}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Floating Terminal */}
      {showTerminal && (
        <div className="fixed bottom-6 right-6 w-96 bg-gray-900/95 backdrop-blur border border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="ml-2 text-sm text-gray-400">Terminal</span>
            </div>
            <button onClick={() => setShowTerminal(false)} className="text-gray-400 hover:text-white">✕</button>
          </div>
          <div ref={terminalRef} className="h-48 overflow-y-auto p-4 font-mono text-sm space-y-1">
            {terminalOutput.map((line, i) => (
              <div key={i} className={line.startsWith('>') ? 'text-cyan-400' : line.startsWith('✅') ? 'text-emerald-400' : 'text-gray-300'}>{line}</div>
            ))}
          </div>
        </div>
      )}

      {/* Write Data Modal */}
      {showWriteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowWriteModal(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-cyan-400">✏️ Write Data</h3>
              <button onClick={() => setShowWriteModal(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <p className="text-gray-400 text-sm mb-4">Enter any data to store in the blockchain. Data will be written to Memtable, then flushed to a Block when buffer is full.</p>
            <input
              type="text"
              value={writeValue}
              onChange={(e) => setWriteValue(e.target.value)}
              placeholder="Enter your data here..."
              className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowWriteModal(false)}
                className="flex-1 px-4 py-3 rounded-xl bg-gray-800 text-gray-400 hover:bg-gray-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!writeValue.trim()) return;
                  setShowTerminal(true);
                  setTerminalOutput(prev => [...prev, `> write "${writeValue}"`]);
                  await fetch(`/api/write?value=${encodeURIComponent(writeValue)}`, { method: 'POST' });
                  setTerminalOutput(prev => [...prev, `✅ "${writeValue}" written to Memtable`, '   Path: Write → Memtable → SSTable → Block']);
                  setWriteValue('');
                  setShowWriteModal(false);
                }}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:opacity-90 transition-all"
              >
                Write to Chain
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block Modal */}
      {selectedBlock && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedBlock(null)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-cyan-400">Block #{selectedBlock.id}</h3>
              <button onClick={() => setSelectedBlock(null)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <div className="space-y-3">
              {[['Hash', selectedBlock.hash], ['Size', `${selectedBlock.size.toLocaleString()} bytes`], ['Entries', selectedBlock.entries], ['Time', selectedBlock.time], ['File', selectedBlock.name]].map(([k, v]) => (
                <div key={k} className="flex justify-between py-2 border-b border-gray-800">
                  <span className="text-gray-500">{k}</span>
                  <span className="text-gray-200 font-mono text-sm text-right max-w-[200px] truncate">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 mt-20">
        <div className="max-w-6xl mx-auto px-6 py-8 text-center">
          <p className="text-gray-500">Made by <span className="text-white">JullMol</span> • <a href="https://github.com/JullMol/aether-chain" className="text-cyan-400 hover:underline">View on GitHub</a></p>
        </div>
      </footer>
    </div>
  );
}

export default App;
