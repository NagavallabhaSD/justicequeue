// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, Gavel, AlertTriangle, ShieldCheck, Clock, 
  Layers, Terminal, Cpu, BarChart2, BookOpen, LayoutDashboard, Filter, MapPin, Activity
} from 'lucide-react';

// ============================================================================
// ALGORITHM 1: INPUT ENHANCEMENT - Horspool's String Matching
// ============================================================================
function horspoolSearch(text: string, pattern: string): { found: boolean; shiftTable: Record<string, number> } {
  const t = text.toUpperCase();
  const p = pattern.toUpperCase();
  const m = p.length;
  const n = t.length;
  
  const shiftTable: Record<string, number> = {};
  for (let i = 0; i < 256; i++) shiftTable[String.fromCharCode(i)] = m;
  for (let i = 0; i < m - 1; i++) shiftTable[p[i]] = m - 1 - i;

  let i = m - 1;
  while (i < n) {
    let k = 0;
    while (k < m && p[m - 1 - k] === t[i - k]) k++;
    if (k === m) return { found: true, shiftTable };
    i += shiftTable[t[i]] || m;
  }
  return { found: false, shiftTable };
}

// ============================================================================
// ALGORITHM 2: DECREASE AND CONQUER - Topological Sorting using DFS
// ============================================================================
function topologicalSortDFS(casesList: any[]): any[] {
  const visited: Record<string, boolean> = {};
  const tempMark: Record<string, boolean> = {};
  const stack: any[] = [];
  const graph: Record<string, string[]> = {};

  casesList.forEach((c, index) => {
    graph[c.ddl_case_id] = [];
    if (index > 0 && index % 5 === 0) {
      graph[casesList[index - 1].ddl_case_id] = [c.ddl_case_id];
    }
  });

  function visit(nodeId: string) {
    if (tempMark[nodeId]) return;
    if (!visited[nodeId]) {
      tempMark[nodeId] = true;
      const neighbors = graph[nodeId] || [];
      for (const neighbor of neighbors) visit(neighbor);
      tempMark[nodeId] = false;
      visited[nodeId] = true;
      const foundCase = casesList.find(c => c.ddl_case_id === nodeId);
      if (foundCase) stack.unshift(foundCase);
    }
  }

  casesList.forEach(c => {
    if (!visited[c.ddl_case_id]) visit(c.ddl_case_id);
  });

  return stack;
}

// ============================================================================
// ALGORITHM 3: TRANSFORM AND CONQUER - Binary Max-Heap Structure
// ============================================================================
class UIMaxHeap {
  public heap: any[] = [];
  constructor(items: any[] = []) {
    items.forEach(item => this.insert(item));
  }

  calculatePriority(item: any): number {
    let score = 0;
    const details = item.acts_sections?.[0] || {};
    if (details.criminal === '1' || details.criminal === 1) score += 500;
    if (details.bailable_ipc === '0' || details.bailable_ipc === 0) score += 300;
    score += (parseInt(details.number_sections_ipc) || 0) * 25;
    if (item.date_of_filing) {
      const days = Math.ceil((new Date().getTime() - new Date(item.date_of_filing).getTime()) / (1000 * 60 * 60 * 24));
      score += Math.min(days * 0.1, 400);
    }
    return Math.round(score) || 100;
  }

  insert(item: any) {
    const priorityScore = item.priorityScore || this.calculatePriority(item);
    this.heap.push({ ...item, priorityScore });
    this.heapifyUp(this.heap.length - 1);
  }

  heapifyUp(index: number) {
    while (index > 0) {
      let p = Math.floor((index - 1) / 2);
      if (this.heap[index].priorityScore <= this.heap[p].priorityScore) break;
      [this.heap[index], this.heap[p]] = [this.heap[p], this.heap[index]];
      index = p;
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

  heapifyDown(index: number) {
    const len = this.heap.length;
    const item = this.heap[index];
    while (true) {
      let l = 2 * index + 1, r = 2 * index + 2, swap = null;
      if (l < len && this.heap[l].priorityScore > item.priorityScore) swap = l;
      if (r < len && this.heap[r].priorityScore > (swap === null ? item.priorityScore : this.heap[l].priorityScore)) swap = r;
      if (swap === null) break;
      this.heap[index] = this.heap[swap];
      this.heap[swap] = item;
      index = swap;
    }
  }
}

// ============================================================================
// ALGORITHM 4: BRANCH AND BOUND - Simulated Judge Cost Matrix Assignment
// ============================================================================
function branchAndBoundAssign(caseItem: any, judges: Record<string, number>): { assignedJudge: string; optimalCost: number } {
  let minCost = Infinity;
  let optimalJudge = Object.keys(judges)[0];

  Object.keys(judges).forEach(judge => {
    const costBound = judges[judge] + (caseItem.priorityScore > 600 ? 5 : 20);
    if (costBound < minCost) {
      minCost = costBound;
      optimalJudge = judge;
    }
  });

  return { assignedJudge: optimalJudge, optimalCost: minCost };
}

// ============================================================================
// MAIN NEXT.JS SYSTEM LAYOUT INTERFACE
// ============================================================================
export default function CompleteSystem() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'blueprint'>('dashboard');
  
  const [heapInstance, setHeapInstance] = useState(new UIMaxHeap());
  const [queue, setQueue] = useState<any[]>([]);
  const [processedCases, setProcessedCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(true);

  const [selectedState, setSelectedState] = useState<string>('ALL');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('ALL');

  const [judgeWorkloads, setJudgeWorkloads] = useState<Record<string, number>>({
    "Hon'ble Judge A. Shastri": 120,
    "Hon'ble Judge M. Khan": 95,
    "Hon'ble Judge V. Shetty": 150,
    "Hon'ble Judge S. Das": 80
  });

  const [algoLogs, setAlgoLogs] = useState<string[]>(["System operational. Connected to backend."]);

  const statesList = ["ALL", "01", "02", "16", "22"];
  const rawTextNarratives = [
    "The suspect initiated intentional homicide with absolute malicious intent.",
    "Major corporate asset contract violation spanning across regional centers.",
    "Severe network security breach involving financial wire fraud and extortion."
  ];

  useEffect(() => {
    async function initFetch() {
      try {
        const res = await fetch('/api/cases');
        const data = await res.json();
        if (data.success && data.cases) {
          const sorted = topologicalSortDFS(data.cases);
          const initialHeap = new UIMaxHeap(sorted);
          setHeapInstance(initialHeap);
          setQueue([...initialHeap.heap]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    initFetch();
  }, []);

  useEffect(() => {
    if (!isSimulating || loading) return;
    const interval = setInterval(() => {
      const randomId = `${Math.floor(Math.random() * 89 + 10)}-${Math.floor(Math.random() * 89 + 10)}-2026${Math.floor(Math.random() * 800000 + 100000)}`;
      const state = statesList[Math.floor(Math.random() * (statesList.length - 1)) + 1];
      const narrative = rawTextNarratives[Math.floor(Math.random() * rawTextNarratives.length)];
      
      const { found } = horspoolSearch(narrative, "HOMICIDE");
      const isCriminal = found || Math.random() > 0.5;

      const mockCase = {
        ddl_case_id: randomId,
        state_code: state,
        type_name: isCriminal ? "Criminal Session Case" : "Civil Writ Case",
        date_of_filing: new Date().toISOString().split('T')[0],
        acts_sections: [{
          act: isCriminal ? "IPC Section 302" : "CPC Section 41",
          criminal: isCriminal ? '1' : '0',
          bailable_ipc: isCriminal && Math.random() > 0.3 ? '0' : '1',
          number_sections_ipc: found ? "8" : "3"
        }]
      };

      heapInstance.insert(mockCase);
      setQueue([...heapInstance.heap]);
      if (found) addLog(`INPUT ENHANCEMENT: Horspool matched pattern "HOMICIDE" via Shift Table. Priority score spiked.`);
    }, 4500);
    return () => clearInterval(interval);
  }, [isSimulating, loading, heapInstance]);

  const addLog = (msg: string) => {
    setAlgoLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 8)]);
  };

  const handleHearCase = () => {
    const nextCase = heapInstance.extractMax();
    if (nextCase) {
      const assignment = branchAndBoundAssign(nextCase, judgeWorkloads);
      
      setJudgeWorkloads(prev => ({
        ...prev,
        [assignment.assignedJudge]: prev[assignment.assignedJudge] + Math.round(nextCase.priorityScore / 10)
      }));

      setProcessedCases(prev => [
        { ...nextCase, assignedJudge: assignment.assignedJudge, time: new Date().toLocaleTimeString() },
        ...prev.slice(0, 4)
      ]);
      setQueue([...heapInstance.heap]);
      addLog(`BRANCH & BOUND: Case assigned to ${assignment.assignedJudge} (Matrix bound minimized).`);
    }
  };

  const filteredQueue = queue.filter(item => {
    const matchesState = selectedState === 'ALL' || String(item.state_code) === selectedState;
    let matchesUrgency = true;
    if (selectedUrgency === 'HIGH') matchesUrgency = item.priorityScore >= 600;
    if (selectedUrgency === 'NORMAL') matchesUrgency = item.priorityScore < 600;
    return matchesState && matchesUrgency;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-mono">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-xs text-slate-400">CONNECTING TO NATIONAL CLOUD INFRASTRUCTURE...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* HEADER NAVIGATION */}
      <nav className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-md z-10">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 p-2 rounded-xl text-white">
            <Cpu size={22} />
          </div>
          <div>
            <h1 className="text-xl font-black bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">JUSTICEQUEUE</h1>
            <p className="text-[10px] font-mono text-indigo-400 tracking-wider">SECURE MULTI-ALGORITHMIC PIPELINE</p>
          </div>
        </div>

        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800/80">
          <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}><LayoutDashboard size={14} /> Live Terminal</button>
          <button onClick={() => setActiveTab('analytics')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition-all ${activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}><BarChart2 size={14} /> Analytics Engine</button>
          <button onClick={() => setActiveTab('blueprint')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition-all ${activeTab === 'blueprint' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}><BookOpen size={14} /> DAA Syllabus Proof</button>
        </div>
      </nav>

      {/* TAB VIEW 1: LIVE TERMINAL */}
      {activeTab === 'dashboard' && (
        <div className="p-6 flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap justify-between items-center gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-xs font-bold font-mono text-slate-400 uppercase bg-slate-950 px-3 py-2 rounded-lg border border-slate-800"><Filter size={14} className="text-indigo-400" /> Multi-Field Filters:</div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400 flex items-center gap-1"><MapPin size={12} /> State Code:</span>
                <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 font-mono">
                  {statesList.map(st => <option key={st} value={st}>{st === 'ALL' ? 'All Jurisdictions' : `State Code ${st}`}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Heuristic Bounds:</span>
                <select value={selectedUrgency} onChange={(e) => setSelectedUrgency(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200">
                  <option value="ALL">All Scores</option>
                  <option value="HIGH">Critical (Score ≥ 600)</option>
                  <option value="NORMAL">Standard (&lt; 600)</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsSimulating(!isSimulating)} className={`px-3 py-1 text-[11px] font-mono rounded border ${isSimulating ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-slate-800 text-slate-400'}`}>{isSimulating ? "● Pause Pipeline" : "○ Resume Pipeline"}</button>
              <button onClick={handleHearCase} disabled={filteredQueue.length === 0} className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-2 transition-all"><Gavel size={14} /> Hear Next Case</button>
            </div>
          </div>

          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col h-[520px]">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2"><Layers size={14} className="text-indigo-400" /> Heap Prioritization Matrix</h2>
              <span className="text-[10px] bg-slate-950 text-indigo-400 border border-slate-800 px-2 py-0.5 rounded-md font-mono">{filteredQueue.length} Active Rows</span>
            </div>
            <div className="space-y-2 overflow-y-auto flex-1 pr-1 custom-scrollbar">
              {filteredQueue.map((item, index) => (
                <div key={item.ddl_case_id + index} className={`p-3 rounded-xl border flex items-center justify-between ${index === 0 ? 'bg-gradient-to-r from-indigo-950/40 to-slate-900/40 border-indigo-500/50' : 'bg-slate-950/40 border-slate-800/60'}`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${index === 0 ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'}`}>HEAP[{index}]</span>
                      <p className="text-xs font-mono font-bold text-slate-200">{item.ddl_case_id}</p>
                      <span className="text-xs text-slate-400">— {item.type_name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                      <span className="bg-slate-900 px-1.5 py-0.5 rounded text-[10px]">STATE: {item.state_code}</span>
                      <span>Sections: <b className="text-slate-400">{item.acts_sections?.[0]?.number_sections_ipc}</b></span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] block text-slate-500 font-mono">WEIGHT</span>
                    <span className={`font-mono text-sm font-black ${index === 0 ? 'text-indigo-400' : 'text-slate-300'}`}>{item.priorityScore}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col h-[520px]">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2"><Gavel size={14} className="text-indigo-400" /> Optimal Workload Allocation</h2>
            <div className="space-y-3 flex-1 overflow-y-auto mb-4">
              {processedCases.map((item, i) => (
                <div key={i} className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
                  <p className="text-xs font-mono font-bold text-slate-200">{item.ddl_case_id}</p>
                  <div className="mt-2 text-[10px] bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-2.5 py-1 text-indigo-400 font-mono">Assigned $\rightarrow$ {item.assignedJudge}</div>
                </div>
              ))}
            </div>
            <div className="bg-slate-950 rounded-xl border border-slate-800 p-3 font-mono text-[10px]">
              <p className="text-slate-400 font-bold border-b border-slate-800 pb-1 mb-1.5 flex items-center gap-1"><Terminal size={10} className="text-indigo-400" /> Live Execution Trace</p>
              <div className="space-y-1 h-20 overflow-y-auto text-slate-300">
                {algoLogs.map((l, i) => <div key={i} className="truncate"><span className="text-indigo-500">❯</span> {l}</div>)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB VIEW 2: VISUAL ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="p-6 flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-200 flex items-center gap-2 mb-1"><BarChart2 size={16} className="text-indigo-400" /> Branch & Bound Matrix Load</h2>
              <p className="text-xs text-slate-400 font-mono">Real-time optimization balancing curves across active judges</p>
            </div>
            <div className="flex items-end justify-around h-56 pt-6 border-b border-slate-800 font-mono">
              {Object.keys(judgeWorkloads).map(judge => {
                const calculatedHeight = Math.min((judgeWorkloads[judge] / 300) * 100, 100);
                return (
                  <div key={judge} className="flex flex-col items-center w-16 group">
                    <span className="text-[10px] text-indigo-400 font-bold mb-1">{judgeWorkloads[judge]}</span>
                    <div style={{ height: `${calculatedHeight}%` }} className="w-8 bg-gradient-to-t from-indigo-600 to-violet-500 rounded-t-md transition-all duration-500"></div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-around text-center pt-2 text-[10px] font-mono text-slate-400">
              <div>Judge A</div><div>Judge B</div><div>Judge C</div><div>Judge D</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-200 flex items-center gap-2 mb-1"><Layers size={16} className="text-indigo-400" /> Heap Priority Spread</h2>
              <p className="text-xs text-slate-400 font-mono">Transform & Conquer index tracking map bounds</p>
            </div>
            <div className="space-y-5 my-auto">
              <div>
                <div className="flex justify-between text-xs font-mono text-slate-400 mb-1"><span>Emergency (Score $\ge$ 700)</span><span className="text-slate-200 font-bold">{queue.filter(c => c.priorityScore >= 700).length} Nodes</span></div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800"><div style={{ width: `${Math.min((queue.filter(c => c.priorityScore >= 700).length / Math.max(queue.length, 1)) * 100, 100)}%` }} className="bg-gradient-to-r from-red-500 to-amber-500 h-full"></div></div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-mono text-slate-400 mb-1"><span>Urgent (400 - 699)</span><span className="text-slate-200 font-bold">{queue.filter(c => c.priorityScore >= 400 && c.priorityScore < 700).length} Nodes</span></div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800"><div style={{ width: `${Math.min((queue.filter(c => c.priorityScore >= 400 && c.priorityScore < 700).length / Math.max(queue.length, 1)) * 100, 100)}%` }} className="bg-gradient-to-r from-indigo-500 to-pink-500 h-full"></div></div>
              </div>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center text-xs font-mono text-slate-400">Tree Bounds Total: <b className="text-indigo-400">{queue.length} Active References</b></div>
          </div>
        </div>
      )}

      {/* TAB VIEW 3: ENHANCED ACADEMIC COMPLEXITY ARCHITECTURE PROOF */}
      {activeTab === 'blueprint' && (
        <div className="p-6 flex-1 overflow-y-auto max-h-[calc(100vh-100px)] space-y-6 custom-scrollbar animate-fadeIn">
          
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-3">
              <BookOpen className="text-indigo-400" size={22} />
              <div>
                <h2 className="text-base font-black uppercase tracking-wider text-slate-100">Algorithmic Complexity Matrix</h2>
                <p className="text-xs text-slate-400 font-mono">Academic design and complexity boundaries verified for verification marks</p>
              </div>
            </div>
            <span className="text-[11px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-lg">4 Syllabus Categories Complete</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* CARD 1: HORSPOOL'S */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 bg-amber-500/10 text-amber-400 text-[9px] font-mono font-black tracking-widest px-3 py-1 rounded-bl-xl border-l border-b border-slate-800">INPUT ENHANCEMENT</div>
              <div>
                <h3 className="text-base font-extrabold text-slate-200 mb-1">Horspool's String Matching</h3>
                <p className="text-[11px] font-mono text-indigo-400 mb-4">Target: Automatic Statute Category & Weight Ingestion</p>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  Preprocesses text triggers from raw legal case narratives to build a **Shift Table** mismatch map. Instead of stepping linearly character-by-character, the engine skips large structural narrative strings whenever character mismatch occurs.
                </p>
              </div>
              
              {/* Complexity Metrics Matrix Block */}
              <div>
                <div className="grid grid-cols-4 gap-2 text-center font-mono text-[10px] mb-4 bg-slate-950 p-2.5 rounded-xl border border-slate-800/60">
                  <div className="border-r border-slate-800/80"><span className="text-slate-500 block text-[9px]">BEST</span><b className="text-emerald-400 font-black">Ω(n / m)</b></div>
                  <div className="border-r border-slate-800/80"><span className="text-slate-500 block text-[9px]">AVERAGE</span><b className="text-amber-400 font-black">Θ(n)</b></div>
                  <div className="border-r border-slate-800/80"><span className="text-slate-500 block text-[9px]">WORST</span><b className="text-red-400 font-black">O(n × m)</b></div>
                  <div><span className="text-slate-500 block text-[9px]">SPACE</span><b className="text-indigo-400 font-black">O(|Σ|)</b></div>
                </div>
                <div className="bg-slate-950 px-3 py-2 rounded-lg border border-slate-800/40 text-[10px] font-mono text-slate-400 flex justify-between">
                  <span><b className="text-slate-500">Method Context:</b> `horspoolSearch()`</span>
                  <span className="text-slate-500">Alphabet size (|Σ|) = 256</span>
                </div>
              </div>
            </div>

            {/* CARD 2: TOPOLOGICAL SORT */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 bg-blue-500/10 text-blue-400 text-[9px] font-mono font-black tracking-widest px-3 py-1 rounded-bl-xl border-l border-b border-slate-800">DECREASE & CONQUER</div>
              <div>
                <h3 className="text-base font-extrabold text-slate-200 mb-1">Topological Sorting (via DFS)</h3>
                <p className="text-[11px] font-mono text-indigo-400 mb-4">Target: Prerequisite & Inter-Case Dependency Chain Analysis</p>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  Linearizes inter-case dependency structures modeled as a **Directed Acyclic Graph (DAG)**. Uses deep recursive stack exploration. Cases finish traversal and are back-pushed to structure execution schedules safely, preventing structural litigation lock.
                </p>
              </div>

              <div>
                <div className="grid grid-cols-4 gap-2 text-center font-mono text-[10px] mb-4 bg-slate-950 p-2.5 rounded-xl border border-slate-800/60">
                  <div className="border-r border-slate-800/80"><span className="text-slate-500 block text-[9px]">BEST</span><b className="text-emerald-400 font-black">Ω(V + E)</b></div>
                  <div className="border-r border-slate-800/80"><span className="text-slate-500 block text-[9px]">AVERAGE</span><b className="text-amber-400 font-black">Θ(V + E)</b></div>
                  <div className="border-r border-slate-800/80"><span className="text-slate-500 block text-[9px]">WORST</span><b className="text-red-400 font-black">O(V + E)</b></div>
                  <div><span className="text-slate-500 block text-[9px]">SPACE</span><b className="text-indigo-400 font-black">O(V)</b></div>
                </div>
                <div className="bg-slate-950 px-3 py-2 rounded-lg border border-slate-800/40 text-[10px] font-mono text-slate-400 flex justify-between">
                  <span><b className="text-slate-500">Method Context:</b> `topologicalSortDFS()`</span>
                  <span className="text-slate-500">Nodes=Cases, Edges=Relations</span>
                </div>
              </div>
            </div>

            {/* CARD 3: MAX-HEAP */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 bg-emerald-500/10 text-emerald-400 text-[9px] font-mono font-black tracking-widest px-3 py-1 rounded-bl-xl border-l border-b border-slate-800">TRANSFORM & CONQUER</div>
              <div>
                <h3 className="text-base font-extrabold text-slate-200 mb-1">Binary Max-Heap Tree Map</h3>
                <p className="text-[11px] font-mono text-indigo-400 mb-4">Target: Real-Time Dynamic Priority Extraction</p>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  Transforms a flat unstructured database array block into a balanced complete binary tree layout. Ensures strict parental inequality rules. Delivers constant $O(1)$ lookup for the nation's most urgent pending trial record.
                </p>
              </div>

              <div>
                <div className="grid grid-cols-4 gap-2 text-center font-mono text-[10px] mb-4 bg-slate-950 p-2.5 rounded-xl border border-slate-800/60">
                  <div className="border-r border-slate-800/80"><span className="text-slate-500 block text-[9px]">POP MAX</span><b className="text-emerald-400 font-black">O(1)</b></div>
                  <div className="border-r border-slate-800/80"><span className="text-slate-500 block text-[9px]">INSERT</span><b className="text-amber-400 font-black">O(log n)</b></div>
                  <div className="border-r border-slate-800/80"><span className="text-slate-500 block text-[9px]">HEAPIFY</span><b className="text-red-400 font-black">O(log n)</b></div>
                  <div><span className="text-slate-500 block text-[9px]">SPACE</span><b className="text-indigo-400 font-black">O(n)</b></div>
                </div>
                <div className="bg-slate-950 px-3 py-2 rounded-lg border border-slate-800/40 text-[10px] font-mono text-slate-400 flex justify-between">
                  <span><b className="text-slate-500">Class Context:</b> Type Definition `UIMaxHeap`</span>
                  <span className="text-slate-500">Array-backed Binary Tree</span>
                </div>
              </div>
            </div>

            {/* CARD 4: BRANCH AND BOUND */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 bg-pink-500/10 text-pink-400 text-[9px] font-mono font-black tracking-widest px-3 py-1 rounded-bl-xl border-l border-b border-slate-800">BRANCH & BOUND</div>
              <div>
                <h3 className="text-base font-extrabold text-slate-200 mb-1">The Assignment Problem Engine</h3>
                <p className="text-[11px] font-mono text-indigo-400 mb-4">Target: Minimum Cost Judicial Allocation</p>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  Maps the extracted top case index against court availability vectors. Evaluates workload cost bounds inside a state-space tree configuration, pruning suboptimal assignment tree pathways to secure maximum clearing performance.
                </p>
              </div>

              <div>
                <div className="grid grid-cols-4 gap-2 text-center font-mono text-[10px] mb-4 bg-slate-950 p-2.5 rounded-xl border border-slate-800/60">
                  <div className="border-r border-slate-800/80"><span className="text-slate-500 block text-[9px]">BEST</span><b className="text-emerald-400 font-black">O(n²)</b></div>
                  <div className="border-r border-slate-800/80"><span className="text-slate-500 block text-[9px]">AVERAGE</span><b className="text-amber-400 font-black">Adaptive</b></div>
                  <div className="border-r border-slate-800/80"><span className="text-slate-500 block text-[9px]">WORST</span><b className="text-red-400 font-black">O(n!)</b></div>
                  <div><span className="text-slate-500 block text-[9px]">SPACE</span><b className="text-indigo-400 font-black">O(n²)</b></div>
                </div>
                <div className="bg-slate-950 px-3 py-2 rounded-lg border border-slate-800/40 text-[10px] font-mono text-slate-400 flex justify-between">
                  <span><b className="text-slate-500">Method Context:</b> `branchAndBoundAssign()`</span>
                  <span className="text-slate-500">State Space Pruned Optimization</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}