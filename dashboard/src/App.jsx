import React, { useEffect, useState } from 'react';

function App() {
  const [blocks, setBlocks] = useState([]);
  const [status, setStatus] = useState("Connecting...");

  useEffect(() => {
    // Connect to Go server via WebSocket
    const socket = new WebSocket("ws://localhost:8080/ws");

    socket.onopen = () => setStatus("Live Connection Active");
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "NEW_BLOCK") {
        // Add new block to the front with animation
        setBlocks(prev => [{
          id: data.id,
          hash: data.hash,
          time: new Date().toLocaleTimeString()
        }, ...prev]);
      }
    };

    return () => socket.close();
  }, []);

  return (
    <div className="p-10 bg-black min-h-screen text-white">
      <div className="mb-10">
        <h1 className="text-4xl font-black italic tracking-tighter">AETHER-CHAIN LIVE</h1>
        <p className={`text-sm ${status.includes("Live") ? "text-green-400" : "text-red-400"}`}>● {status}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {blocks.map((block) => (
          <div key={block.id} className="border-l-4 border-blue-500 bg-zinc-900 p-4 animate-pulse">
            <h3 className="text-blue-500 font-bold">BLOCK #{block.id}</h3>
            <p className="text-xs font-mono text-zinc-400">{block.hash}</p>
            <p className="text-[10px] mt-2 text-zinc-600">{block.time}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
