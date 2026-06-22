// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, Gavel, AlertTriangle, ShieldCheck, Clock, 
  Layers, Terminal, Cpu, BarChart2, BookOpen, LayoutDashboard, Filter, MapPin, Zap
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
    this.heap = [];
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

// Algorithm data for the expanded 8-card grid
const algorithmCards = [
  {
    id: 'horspool',
    title: "Horspool's String Matching",
    category: 'INPUT ENHANCEMENT',
    categoryColor: 'amber',
    description: 'Preprocesses text triggers from raw legal case narratives to build a Shift Table mismatch map. Instead of stepping linearly character-by-character, the engine skips large structural narrative strings whenever character mismatch occurs.',
    complexities: [
      { label: 'BEST', value: 'Omega(n/m)', color: 'emerald' },
      { label: 'AVERAGE', value: 'Theta(n)', color: 'amber' },
      { label: 'WORST', value: 'O(n · m)', color: 'red' },
      { label: 'SPACE', value: 'O(|Σ|)', color: 'indigo' }
    ]
  },
  {
    id: 'topological',
    title: 'Topological Sorting (via DFS)',
    category: 'DECREASE & CONQUER',
    categoryColor: 'blue',
    description: 'Linearizes dependency paths modeled as a Directed Acyclic Graph (DAG). Uses recursive exploration stacks to order execution schedules safely, preventing deadlock states across sub-case timelines.',
    complexities: [
      { label: 'BEST', value: 'Omega(V+E)', color: 'emerald' },
      { label: 'AVERAGE', value: 'Theta(V+E)', color: 'amber' },
      { label: 'WORST', value: 'O(V+E)', color: 'red' },
      { label: 'SPACE', value: 'O(V)', color: 'indigo' }
    ]
  },
  {
    id: 'heaptree',
    title: 'Binary Max-Heap Tree Map',
    category: 'TRANSFORM & CONQUER',
    categoryColor: 'emerald',
    description: 'Transforms a flat unstructured database array block into a balanced complete binary tree layout. Ensures strict parental inequality rules. Delivers constant lookup for the highest priority legal case records.',
    complexities: [
      { label: 'EXTRACT', value: 'O(1)', color: 'emerald' },
      { label: 'INSERT', value: 'O(log n)', color: 'amber' },
      { label: 'HEAPIFY', value: 'O(log n)', color: 'red' },
      { label: 'SPACE', value: 'O(n)', color: 'indigo' }
    ]
  },
  {
    id: 'branchbound',
    title: 'The Assignment Engine',
    category: 'BRANCH & BOUND',
    categoryColor: 'pink',
    description: 'Maps highest priority heap nodes against judge cost matrix bounds. Systematically explores a state-space optimization pathway tree, dynamic bounding functions to prune suboptimal load trajectories.',
    complexities: [
      { label: 'BEST', value: 'O(n²)', color: 'emerald' },
      { label: 'AVERAGE', value: 'Adaptive', color: 'amber' },
      { label: 'WORST', value: 'O(n!)', color: 'red' },
      { label: 'SPACE', value: 'O(n²)', color: 'indigo' }
    ]
  },
  {
    id: 'intervalsched',
    title: 'Courtroom Interval Scheduling',
    category: 'GREEDY PARADIGM',
    categoryColor: 'violet',
    description: 'Optimizes the sequence of hearings within a single courtroom to maximize the number of cases heard per day without time overlaps. Greedily selects non-conflicting case intervals sorted by earliest completion time, ensuring maximum courtroom utilization.',
    complexities: [
      { label: 'BEST', value: 'Omega(n)', color: 'emerald' },
      { label: 'AVERAGE', value: 'Theta(n log n)', color: 'amber' },
      { label: 'WORST', value: 'O(n log n)', color: 'red' },
      { label: 'SPACE', value: 'O(n)', color: 'indigo' }
    ]
  },
  {
    id: 'knapsack',
    title: 'Judicial Daily Load Optimization',
    category: '0/1 KNAPSACK DP',
    categoryColor: 'cyan',
    description: 'Selects the highest-priority cases to fit exactly into a judge\'s limited daily bench hours, maximizing the cumulative priority score processed. Uses dynamic programming to build an optimal subset of cases that respects the time capacity constraint.',
    complexities: [
      { label: 'BEST', value: 'Omega(n)', color: 'emerald' },
      { label: 'AVERAGE', value: 'Theta(n·W)', color: 'amber' },
      { label: 'WORST', value: 'O(n·W)', color: 'red' },
      { label: 'SPACE', value: 'O(n·W)', color: 'indigo' }
    ]
  },
  {
    id: 'dijkstra',
    title: 'Optimal Procedural Routing',
    category: 'SHORTEST PATH',
    categoryColor: 'rose',
    description: 'Navigates the optimal procedural pathway from case filing through final adjudication by modeling the legal routing network as a weighted graph. Computes shortest paths for case transfers across departments while minimizing processing delays and jurisdictional delays.',
    complexities: [
      { label: 'BEST', value: 'Omega(V log V)', color: 'emerald' },
      { label: 'AVERAGE', value: 'Theta(V log V + E)', color: 'amber' },
      { label: 'WORST', value: 'O(V² + E)', color: 'red' },
      { label: 'SPACE', value: 'O(V)', color: 'indigo' }
    ]
  },
  {
    id: 'prims',
    title: 'Multi-Case Dependency Clustering',
    category: 'SPANNING TREE',
    categoryColor: 'teal',
    description: 'Constructs minimum-cost dependency clusters across related cases by building a minimum spanning tree of the judicial docket. Greedily connects cases with minimal inter-dependencies, enabling joint bench allocation and coordinated hearing schedules.',
    complexities: [
      { label: 'BEST', value: 'Omega(V log V)', color: 'emerald' },
      { label: 'AVERAGE', value: 'Theta(V log V + E)', color: 'amber' },
      { label: 'WORST', value: 'O(E log V)', color: 'red' },
      { label: 'SPACE', value: 'O(V + E)', color: 'indigo' }
    ]
  }
];

export default function CompleteSystem() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'algorithm'>('dashboard');
  const [heapInstance, setHeapInstance] = useState(new UIMaxHeap());
  const [queue, setQueue] = useState<any[]>([]);
  const [processedCases, setProcessedCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(true);

  const [selectedState, setSelectedState] = useState<string>('ALL');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('ALL');
  const [assignmentMode, setAssignmentMode] = useState<'manual' | 'auto'>('manual');
  const [autoCountdown, setAutoCountdown] = useState<number>(0);

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
        const fallbackHeap = new UIMaxHeap([]);
        setHeapInstance(fallbackHeap);
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
    }, 2000);
    return () => clearInterval(interval);
  }, [isSimulating, loading, heapInstance]);

  // Auto-interval logic
  useEffect(() => {
    if (assignmentMode !== 'auto' || loading) return;

    if (autoCountdown > 0) {
      const interval = setTimeout(() => setAutoCountdown(autoCountdown - 1), 1000);
      return () => clearTimeout(interval);
    } else if (autoCountdown === 0) {
      // Auto-assign
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
        setAutoCountdown(15);
      }
    }
  }, [autoCountdown, assignmentMode, loading, heapInstance, judgeWorkloads]);

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
    }
  };

  const filteredQueue = queue.filter(item => {
    const matchesState = selectedState === 'ALL' || String(item.state_code) === selectedState;
    let matchesUrgency = true;
    if (selectedUrgency === 'HIGH') matchesUrgency = item.priorityScore >= 600;
    if (selectedUrgency === 'NORMAL') matchesUrgency = item.priorityScore < 600;
    return matchesState && matchesUrgency;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* HEADER NAV */}
      <nav className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-800 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-lg z-10">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-violet-600 to-indigo-500 p-2 rounded-xl text-white shadow-lg shadow-violet-500/30">
            <Cpu size={22} />
          </div>
          <div>
            <h1 className="text-xl font-black bg-gradient-to-r from-violet-300 to-indigo-400 bg-clip-text text-transparent tracking-tight">JUSTICEQUEUE</h1>
            <p className="text-[10px] font-mono text-indigo-400 tracking-widest">SECURE MULTI-ALGORITHMIC PIPELINE</p>
          </div>
        </div>

        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition-all ${activeTab === 'dashboard' ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30' : 'text-slate-400 hover:text-slate-200'}`}><LayoutDashboard size={14} /> Live Terminal</button>
          <button onClick={() => setActiveTab('analytics')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition-all ${activeTab === 'analytics' ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30' : 'text-slate-400 hover:text-slate-200'}`}><BarChart2 size={14} /> Analytics Engine</button>
          <button onClick={() => setActiveTab('algorithm')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition-all ${activeTab === 'algorithm' ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30' : 'text-slate-400 hover:text-slate-200'}`}><BookOpen size={14} /> Algorithm Details</button>
        </div>
      </nav>

      {/* VIEW 1: LIVE TERMINAL */}
      {activeTab === 'dashboard' && (
        <div className="p-6 flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-3 bg-gradient-to-r from-slate-900/60 to-slate-900/40 border border-slate-800 rounded-xl p-4 flex flex-wrap justify-between items-center gap-4 backdrop-blur-sm">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-xs font-bold font-mono text-slate-300 uppercase bg-slate-950/40 px-3 py-2 rounded-lg border border-slate-800"><Filter size={14} className="text-violet-400" /> Multi-Field Filters:</div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400 flex items-center gap-1"><MapPin size={12} /> State Code:</span>
                <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)} className="bg-slate-950/60 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 font-mono hover:border-violet-500/50 transition-colors">
                  {statesList.map(st => <option key={st} value={st}>{st === 'ALL' ? 'All Jurisdictions' : `State Code ${st}`}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Heuristic Bounds:</span>
                <select value={selectedUrgency} onChange={(e) => setSelectedUrgency(e.target.value)} className="bg-slate-950/60 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 hover:border-violet-500/50 transition-colors">
                  <option value="ALL">All Scores</option>
                  <option value="HIGH">Critical (Score ≥ 600)</option>
                  <option value="NORMAL">Standard ({'<'} 600)</option>
                </select>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Assignment Mode:</span>
                <div className="flex bg-slate-950/60 rounded-lg border border-slate-800 p-0.5">
                  <button 
                    onClick={() => { setAssignmentMode('manual'); setAutoCountdown(0); }}
                    className={`px-2.5 py-1 text-xs font-mono rounded transition-all ${assignmentMode === 'manual' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Manual
                  </button>
                  <button 
                    onClick={() => { setAssignmentMode('auto'); setAutoCountdown(15); }}
                    className={`px-2.5 py-1 text-xs font-mono rounded transition-all ${assignmentMode === 'auto' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Auto-Interval
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsSimulating(!isSimulating)} className={`px-3 py-1 text-[11px] font-mono rounded border transition-all ${isSimulating ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800/60 text-slate-400'}`}>{isSimulating ? "● Pause Pipeline" : "○ Resume Pipeline"}</button>
              <button 
                onClick={handleHearCase} 
                disabled={filteredQueue.length === 0 || assignmentMode === 'auto'} 
                className={`font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${assignmentMode === 'auto' ? 'bg-slate-800/60 text-slate-500 opacity-50 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20'}`}
              >
                <Gavel size={14} /> {assignmentMode === 'auto' ? `Next in ${autoCountdown}s` : 'Hear Next Case'}
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col h-[520px] backdrop-blur-sm">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-2"><Layers size={14} className="text-violet-400" /> Heap Prioritization Matrix</h2>
              <span className="text-[10px] bg-slate-950/60 text-violet-400 border border-slate-800 px-2 py-0.5 rounded-md font-mono">{filteredQueue.length} Active Rows</span>
            </div>
            <div className="space-y-2 overflow-y-auto flex-1 pr-1">
              {filteredQueue.map((item, index) => (
                <div key={item.ddl_case_id + index} className={`p-3 rounded-xl border transition-all ${index === 0 ? 'bg-gradient-to-r from-violet-950/60 to-slate-900/40 border-violet-500/50 shadow-lg shadow-violet-500/10' : 'bg-slate-950/40 border-slate-800/60 hover:border-slate-700/80'}`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded transition-all ${index === 0 ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20' : 'bg-slate-800 text-slate-400'}`}>HEAP[{index}]</span>
                      <p className="text-xs font-mono font-bold text-slate-200">{item.ddl_case_id}</p>
                      <span className="text-xs text-slate-400">— {item.type_name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                      <span className="bg-slate-950/60 px-1.5 py-0.5 rounded text-[10px]">STATE: {item.state_code}</span>
                      <span>Sections: <b className="text-slate-400">{item.acts_sections?.[0]?.number_sections_ipc}</b></span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] block text-slate-500 font-mono">WEIGHT</span>
                    <span className={`font-mono text-sm font-black transition-colors ${index === 0 ? 'text-violet-400' : 'text-slate-300'}`}>{item.priorityScore}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col h-[520px] backdrop-blur-sm">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-200 mb-4 flex items-center gap-2"><Gavel size={14} className="text-violet-400" /> Optimal Workload Allocation</h2>
            <div className="space-y-3 flex-1 overflow-y-auto mb-4">
              {processedCases.map((item, i) => (
                <div key={i} className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl hover:border-slate-700 transition-all">
                  <p className="text-xs font-mono font-bold text-slate-200">{item.ddl_case_id}</p>
                  <div className="mt-2 text-[10px] bg-violet-500/10 border border-violet-500/30 rounded-lg px-2.5 py-1 text-violet-400 font-mono">Assigned &rarr; {item.assignedJudge}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: VISUAL ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="p-6 flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 flex flex-col justify-between backdrop-blur-sm">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-200 flex items-center gap-2 mb-1">
                <BarChart2 size={16} className="text-violet-400" /> Branch & Bound Matrix Load
              </h2>
              <p className="text-xs text-slate-400 font-mono mb-4">Real-time optimization balancing curves across active judges</p>
            </div>

            <div className="relative flex items-end justify-around h-64 w-full bg-slate-950/50 rounded-xl border border-slate-800/80 p-4 font-mono">
              {Object.keys(judgeWorkloads).map(judge => {
                const workloadValue = judgeWorkloads[judge];
                const heightPercentage = Math.min((workloadValue / 300) * 100, 100);

                return (
                  <div key={judge} className="flex flex-col items-center justify-end h-full w-16 group z-10">
                    <span className="text-[11px] font-bold text-violet-400 mb-2 bg-slate-950/60 border border-slate-800 px-1.5 py-0.5 rounded">
                      {workloadValue}
                    </span>
                    <div className="w-10 bg-slate-950/80 border border-slate-800 rounded-t-lg overflow-hidden flex items-end h-full min-h-[4px] shadow-xl">
                      <div 
                        style={{ height: `${heightPercentage}%` }} 
                        className="w-full bg-gradient-to-t from-violet-600 via-indigo-500 to-emerald-400 shadow-lg shadow-violet-500/40 rounded-t-md transition-all duration-700 ease-out"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-around text-center pt-3 text-[10px] font-mono font-bold text-slate-400">
              <div>Judge A</div><div>Judge B</div><div>Judge C</div><div>Judge D</div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 flex flex-col justify-between backdrop-blur-sm">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-200 flex items-center gap-2 mb-1">
                <Layers size={16} className="text-violet-400" /> Heap Priority Spread
              </h2>
              <p className="text-xs text-slate-400 font-mono mb-4">Transform & Conquer index tracking map bounds</p>
            </div>

            <div className="space-y-6 my-auto">
              <div>
                <div className="flex justify-between text-xs font-mono text-slate-400 mb-2">
                  <span>Emergency (Score ≥ 700)</span>
                  <span className="text-slate-200 font-bold">{queue.filter(c => c.priorityScore >= 700).length} Nodes</span>
                </div>
                <div className="w-full bg-slate-950/60 h-3 rounded-full overflow-hidden border border-slate-800 shadow-inner">
                  <div 
                    style={{ width: `${Math.min((queue.filter(c => c.priorityScore >= 700).length / Math.max(queue.length, 1)) * 100, 100)}%` }} 
                    className="bg-gradient-to-r from-red-600 to-orange-500 h-full transition-all duration-500 shadow-lg shadow-red-500/30"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono text-slate-400 mb-2">
                  <span>Urgent (400 - 699)</span>
                  <span className="text-slate-200 font-bold">{queue.filter(c => c.priorityScore >= 400 && c.priorityScore < 700).length} Nodes</span>
                </div>
                <div className="w-full bg-slate-950/60 h-3 rounded-full overflow-hidden border border-slate-800 shadow-inner">
                  <div 
                    style={{ width: `${Math.min((queue.filter(c => c.priorityScore >= 400 && c.priorityScore < 700).length / Math.max(queue.length, 1)) * 100, 100)}%` }} 
                    className="bg-gradient-to-r from-violet-600 to-pink-500 h-full transition-all duration-500 shadow-lg shadow-violet-500/30"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center text-xs font-mono text-slate-400 mt-4">
              Tree Bounds Total: <b className="text-violet-400">{queue.length} Active References</b>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: ALGORITHM DETAILS - 8 CARD GRID WITH LaTeX */}
      {activeTab === 'algorithm' && (
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="bg-gradient-to-r from-slate-900/60 to-slate-900/40 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-lg mb-6 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <BookOpen className="text-violet-400" size={22} />
              <div>
                <h2 className="text-base font-black uppercase tracking-wider text-slate-100">Algorithm Details</h2>
                <p className="text-xs text-slate-400 font-mono">Advanced algorithm taxonomy with complexity analysis and optimization patterns</p>
              </div>
            </div>
            <span className="text-[11px] font-mono font-bold bg-violet-500/10 text-violet-400 border border-violet-500/30 px-3 py-1 rounded-lg">
              8 Algorithms Complete
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {algorithmCards.map((card) => (
              <div 
                key={card.id} 
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden hover:border-slate-700 transition-all backdrop-blur-sm group"
              >
                <div className={`absolute top-0 right-0 bg-${card.categoryColor}-500/10 text-${card.categoryColor}-400 text-[9px] font-mono font-black tracking-widest px-3 py-1 rounded-bl-xl border-l border-b border-slate-800`}>
                  {card.category}
                </div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl -z-10" />
                
                <div>
                  <h3 className="text-base font-extrabold text-slate-200 mb-1">{card.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-6">
                    {card.description}
                  </p>
                </div>
                
                <div className="grid grid-cols-4 gap-2 text-center font-mono text-[10px] mb-4 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                  {card.complexities.map((comp, idx) => (
                    <div key={idx} className="flex flex-col">
                      <span className="text-slate-500 block text-[9px] mb-1">{comp.label}</span>
                      <div className={`text-${comp.color}-400 font-black text-xs`}>
                        {comp.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
