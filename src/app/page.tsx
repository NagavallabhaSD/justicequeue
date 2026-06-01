'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Gavel, AlertTriangle, ShieldCheck, Clock, Layers, PlusCircle } from 'lucide-react';

// --- Inline Max-Heap Engine for State Management ---
class UIMaxHeap {
  constructor(items = []) {
    this.heap = [];
    items.forEach(item => this.insert(item));
  }

  calculatePriority(item) {
    let score = 0;
    const details = item.acts_sections?.[0] || {};
    
    if (details.criminal === '1' || details.criminal === 1) score += 500;
    if (details.bailable_ipc === '0' || details.bailable_ipc === 0) score += 300;
    
    const sections = parseInt(details.number_sections_ipc) || 0;
    score += sections * 25;

    if (item.date_of_filing) {
      const daysPending = Math.ceil((new Date() - new Date(item.date_of_filing)) / (1000 * 60 * 60 * 24));
      score += Math.min(daysPending * 0.1, 400);
    }
    return Math.round(score) || 100;
  }

  insert(item) {
    const priorityScore = item.priorityScore || this.calculatePriority(item);
    const node = { ...item, priorityScore };
    this.heap.push(node);
    this.heapifyUp(this.heap.length - 1);
  }

  heapifyUp(index) {
    while (index > 0) {
      let parent = Math.floor((index - 1) / 2);
      if (this.heap[index].priorityScore <= this.heap[parent].priorityScore) break;
      [this.heap[index], this.heap[parent]] = [this.heap[parent], this.heap[index]];
      index = parent;
    }
  }

  extractMax() {
    if (this.heap.length === 0) return null;
    const max = this.heap[0];
    const end = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = end;
      this.heapifyDown(0);
    }
    return max;
  }

  heapifyDown(index) {
    const len = this.heap.length;
    const item = this.heap[index];
    while (true) {
      let left = 2 * index + 1;
      let right = 2 * index + 2;
      let swap = null;

      if (left < len && this.heap[left].priorityScore > item.priorityScore) swap = left;
      if (right < len && this.heap[right].priorityScore > (swap === null ? item.priorityScore : this.heap[left].priorityScore)) swap = right;
      
      if (swap === null) break;
      this.heap[index] = this.heap[swap];
      this.heap[swap] = item;
      index = swap;
    }
  }
}

export default function Dashboard() {
  const [heapInstance, setHeapInstance] = useState(new UIMaxHeap());
  const [queue, setQueue] = useState([]);
  const [processedCases, setProcessedCases] = useState([]);
  const [isSimulating, setIsSimulating] = useState(true);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, criminal: 0, nonBailable: 0 });

  // Mock pool generator to simulate live state-wide e-Courts streaming feed
  const caseTypes = ["Criminal Appeal", "Writ Petition", "Special Civil Application", "Session Case"];
  const acts = ["IPC", "CrPC", "NDPS Act", "Prevention of Corruption"];

  // 1. Initial Data Fetch from your live Supabase API route
  useEffect(() => {
    async function initFetch() {
      try {
        const res = await fetch('/api/cases');
        const data = await res.json();
        
        if (data.success && data.cases) {
          const initialHeap = new UIMaxHeap(data.cases);
          setHeapInstance(initialHeap);
          setQueue([...initialHeap.heap]);
          updateMetrics([...initialHeap.heap]);
        }
      } catch (err) {
        console.error("Failed loading Supabase dataset", err);
      } finally {
        setLoading(false);
      }
    }
    initFetch();
  }, []);

  // 2. Continuous Live Ingestion Simulation loop (Runs every 4 seconds)
  useEffect(() => {
    if (!isSimulating || loading) return;

    const interval = setInterval(() => {
      // Create random simulated emergency incoming case
      const randomId = `${Math.floor(Math.random() * 90 + 10)}-${Math.floor(Math.random() * 90 + 10)}-2026${Math.floor(Math.random() * 900000 + 100000)}`;
      const isCriminal = Math.random() > 0.4;
      const isNonBailable = isCriminal && Math.random() > 0.3;

      const newIncomingCase = {
        ddl_case_id: randomId,
        type_name: caseTypes[Math.floor(Math.random() * caseTypes.length)],
        date_of_filing: new Date().toISOString().split('T')[0],
        acts_sections: [{
          act: acts[Math.floor(Math.random() * acts.length)],
          criminal: isCriminal ? '1' : '0',
          bailable_ipc: isNonBailable ? '0' : '1',
          number_sections_ipc: Math.floor(Math.random() * 8 + 1).toString()
        }]
      };

      // Push into our Max-Heap structure tracking state pointers
      heapInstance.insert(newIncomingCase);
      const updatedQueue = [...heapInstance.heap];
      setQueue(updatedQueue);
      updateMetrics(updatedQueue);
    }, 4000);

    return () => clearInterval(interval);
  }, [isSimulating, loading, heapInstance]);

  const updateMetrics = (currentQueue) => {
    const criminalCount = currentQueue.filter(c => c.acts_sections?.[0]?.criminal === '1' || c.acts_sections?.[0]?.criminal === 1).length;
    const nonBailableCount = currentQueue.filter(c => c.acts_sections?.[0]?.bailable_ipc === '0' || c.acts_sections?.[0]?.bailable_ipc === 0).length;
    setStats({ total: currentQueue.length, criminal: criminalCount, nonBailable: nonBailableCount });
  };

  // 3. Interactive Max-Heap Extraction O(log N) trigger button
  const handleHearCase = () => {
    const nextCase = heapInstance.extractMax();
    if (nextCase) {
      setQueue([...heapInstance.heap]);
      setProcessedCases(prev => [
        { ...nextCase, processedAt: new Date().toLocaleTimeString() },
        ...prev.slice(0, 4)
      ]);
      updateMetrics([...heapInstance.heap]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
        <p className="text-slate-400 font-mono tracking-wider">CONNECTING TO SUPABASE CLOUD PIPELINE...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      {/* Top Banner Header Layout */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-5 mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono tracking-widest uppercase bg-emerald-500/10 px-2.5 py-1 rounded-md w-fit mb-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Live e-Courts Ingestion In Sync
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
            National Judicial Priority Engine
          </h1>
          <p className="text-slate-400 text-sm mt-0.5 font-mono">Algorithm Concept: Max-Heap Real-Time Scheduling Optimizer</p>
        </div>

        {/* Live Presentation Control Panel */}
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-2 rounded-xl">
          <button 
            onClick={() => setIsSimulating(!isSimulating)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${isSimulating ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-800 text-slate-300'}`}
          >
            {isSimulating ? <Pause size={14} className="animate-pulse" /> : <Play size={14} />}
            {isSimulating ? "Pause Feed Simulation" : "Resume Stream"}
          </button>
          <button 
            onClick={handleHearCase}
            disabled={queue.length === 0}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-1.5 rounded-lg text-xs tracking-wider uppercase shadow-lg shadow-emerald-900/30 active:scale-95 transition-all disabled:opacity-40"
          >
            <Gavel size={14} />
            Hear Next Case (Extract Max)
          </button>
        </div>
      </header>

      {/* Dynamic Animated Status Metric Cards */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400"><Layers size={20} /></div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Heap Queue Size</p>
            <h3 className="text-2xl font-bold font-mono transition-all duration-300">{stats.total}</h3>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-red-500/10 text-red-400"><AlertTriangle size={20} /></div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Criminal Filings</p>
            <h3 className="text-2xl font-bold text-red-400 font-mono">{stats.criminal}</h3>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400"><Clock size={20} /></div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Non-Bailable Urgency</p>
            <h3 className="text-2xl font-bold text-amber-400 font-mono">{stats.nonBailable}</h3>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400"><ShieldCheck size={20} /></div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Root Priority Index</p>
            <h3 className="text-2xl font-bold text-emerald-400 font-mono">
              {queue[0]?.priorityScore || 0}
            </h3>
          </div>
        </div>
      </section>

      {/* Main Dual Component Grid View */}
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Visual Active Max-Heap Array Order Structure */}
        <div className="lg:col-span-2 flex flex-col bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-md font-bold tracking-wide text-slate-200 uppercase flex items-center gap-2">
              <span>📊</span> Prioritized Scheduling Order (Heap Array Visualizer)
            </h2>
            <span className="text-xs font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
              Index [0] represents Heap Root
            </span>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
            {queue.map((item, index) => {
              const details = item.acts_sections?.[0] || {};
              return (
                <div 
                  key={item.ddl_case_id + index}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between border p-3.5 rounded-lg transition-all duration-500 transform ${index === 0 ? 'bg-gradient-to-r from-emerald-950/40 to-slate-900 border-emerald-500/40 scale-[1.01] shadow-md shadow-emerald-950/20' : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'}`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${index === 0 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                        HEAP IDX [{index}]
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-300">{item.ddl_case_id}</span>
                      <span className="text-slate-500 text-xs">•</span>
                      <span className="text-xs text-slate-400 font-medium">{item.type_name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 pt-0.5">
                      <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800/60 text-slate-400">
                        Act: <b className="text-slate-300">{details.act || 'N/A'}</b>
                      </span>
                      <span>IPC Sections: <b className="text-slate-400">{details.number_sections_ipc || 0}</b></span>
                      {details.criminal === '1' && <span className="text-red-400 text-[11px] font-bold">⚠️ Criminal Case</span>}
                      {details.bailable_ipc === '0' && <span className="text-amber-400 text-[11px] font-bold">🚫 Non-Bailable</span>}
                    </div>
                  </div>
                  
                  {/* Visual Weight Index Tag */}
                  <div className="mt-2 sm:mt-0 flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0">
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Calculated Score</p>
                      <p className={`font-mono text-base font-black ${index === 0 ? 'text-emerald-400' : 'text-slate-300'}`}>{item.priorityScore}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            {queue.length === 0 && (
              <div className="text-center py-16 text-slate-500 border border-dashed border-slate-800 rounded-lg">
                No legal files loaded in current queue context.
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Real-Time Historical Processing Log */}
        <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl">
          <h2 className="text-md font-bold tracking-wide text-slate-200 uppercase mb-4 flex items-center gap-2">
            <span>⚖️</span> Active Disposal Log (Processed Output)
          </h2>
          
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px]">
            {processedCases.map((item, i) => (
              <div 
                key={item.ddl_case_id + i} 
                className="bg-slate-950/60 border border-slate-800/60 p-3 rounded-lg text-xs relative overflow-hidden animate-fadeIn"
              >
                <div className="absolute right-2 top-2 bg-emerald-500/10 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded font-mono font-medium">
                  Disposed @ {item.processedAt}
                </div>
                <p className="font-mono font-bold text-slate-300 mb-1">{item.ddl_case_id}</p>
                <p className="text-slate-400 mb-2">{item.type_name}</p>
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                  Disposal Complexity Multiplier: <span className="text-emerald-500 font-bold">{item.priorityScore}</span>
                </p>
              </div>
            ))}
            
            {processedCases.length === 0 && (
              <div className="text-center py-12 text-slate-600 font-mono text-xs border border-dashed border-slate-800 rounded-lg h-full flex flex-col justify-center items-center gap-1">
                <Gavel size={24} className="text-slate-700 mb-1" />
                Waiting for judge actions...
                <p className="text-[10px] text-slate-600 max-w-[180px] mt-1">Click "Hear Next Case" above to execute O(1) retrieval</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}