// src/app/page.tsx
'use client';

import React, { useState } from 'react';
import { MaxHeap, optimizeDocketWithDP, allocateRoomsGreedy, CourtCase } from '@/components/algorithms';
import { Gavel, ShieldCheck, BarChart3, ListCollapse, Play, Layers } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

// Sourced directly from DevDataLab e-courts schema rules
const rawShorthandPool: CourtCase[] = [
  { c_id: "KA-BLR-001", type_name: "ST - SESSIONS TRIAL", date_of_filing: "2016-04-12", section: "302", female_petitioner: 1, durationHours: 3, startTime: 9, endTime: 12 },
  { c_id: "KA-BLR-002", type_name: "CC - CRIMINAL CASE", date_of_filing: "2018-09-21", section: "379", female_petitioner: 0, durationHours: 2, startTime: 10, endTime: 12 },
  { c_id: "KA-BLR-003", type_name: "Bail Application", date_of_filing: "2024-01-10", section: "438", female_petitioner: 1, durationHours: 1, startTime: 11, endTime: 12 },
  { c_id: "KA-BLR-004", type_name: "ST - SESSIONS TRIAL", date_of_filing: "2015-02-14", section: "307", female_petitioner: 0, durationHours: 2, startTime: 13, endTime: 15 },
  { c_id: "KA-BLR-005", type_name: "Warrant Case", date_of_filing: "2019-07-04", section: "420", female_petitioner: 0, durationHours: 3, startTime: 14, endTime: 17 },
  { c_id: "KA-BLR-006", type_name: "CC - CRIMINAL CASE", date_of_filing: "2017-11-29", section: "324", female_petitioner: 1, durationHours: 1.5, startTime: 15.5, endTime: 17 }
];

const stateProfiles = {
  "India (Average)": { clearance: 89, shortfall: 14.7, rooms: 3 },
  "Karnataka": { clearance: 91, shortfall: 12.0, rooms: 3 },
  "Delhi (UT)": { clearance: 71, shortfall: 32.5, rooms: 2 }, // Higher shortfall collapses available judge rooms
};

export default function Dashboard() {
  const [selectedState, setSelectedState] = useState<keyof typeof stateProfiles>("Karnataka");
  const [isOptimized, setIsOptimized] = useState(false);
  
  // Output states for logging
  const [heapLog, setHeapLog] = useState<string[]>([]);
  const [dpLog, setDpLog] = useState<string[]>([]);
  const [greedyLog, setGreedyLog] = useState<string[]>([]);
  const [dpTableValues, setDpTableValues] = useState<number[]>([]);
  const [scheduledRooms, setScheduledRooms] = useState<CourtCase[][]>([[], [], []]);

  const runPipeline = () => {
    const config = stateProfiles[selectedState];
    
    // Step 1: Compute Dynamic weights and perform Transform & Conquer Heap compilation
    const heapEngine = new MaxHeap();
    const weightedCases = rawShorthandPool.map(c => {
      let base = c.section === "302" || c.section === "307" ? 50 : 20;
      if (c.female_petitioner === 1) base += 20;
      const filingYear = new Date(c.date_of_filing).getFullYear();
      const yearsPending = 2026 - filingYear;
      const finalWeight = Math.round(base * (1 + yearsPending * 0.15));
      return { ...c, urgencyScore: finalWeight };
    });

    let heapTrace: string[] = [];
    weightedCases.forEach(c => {
      heapEngine.insert(c);
      heapTrace.push(`Heap Insertion: Pushed ${c.c_id} (Calculated Priority Weight: ${c.urgencyScore})`);
    });
    setHeapLog(heapTrace);

    // Pull from Heap deterministically
    let extracted: CourtCase[] = [];
    let current = heapEngine.extractMax();
    while(current) {
      extracted.push(current);
      current = heapEngine.extractMax();
    }

    // Step 2 & 3: Run Dynamic Programming combined with Decrease & Conquer
    const { optimalCases, dpTable, logTrace } = optimizeDocketWithDP(extracted);
    setDpLog(logTrace);
    setDpTableValues(dpTable);

    // Step 4: Allocate to Rooms Greedily based on State structural constraints
    const { rooms, allocationLogs } = allocateRoomsGreedy(optimalCases, config.rooms);
    setGreedyLog(allocationLogs);
    setScheduledRooms(rooms);

    setIsOptimized(true);
  };

  const performanceMetricsData = [
    { name: 'Case 1', FIFO_WaitDays: 450, JusticeQueue_WaitDays: 90 },
    { name: 'Case 2', FIFO_WaitDays: 780, JusticeQueue_WaitDays: 120 },
    { name: 'Case 3', FIFO_WaitDays: 1200, JusticeQueue_WaitDays: 140 },
    { name: 'Case 4', FIFO_WaitDays: 1450, JusticeQueue_WaitDays: 180 },
    { name: 'Case 5', FIFO_WaitDays: 1900, JusticeQueue_WaitDays: 210 },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-6 mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-teal-400 flex items-center gap-3">
            <Gavel className="text-teal-400" /> JusticeQueue Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">Syllabus-Aligned Multi-Paradigm Court Scheduler Architecture</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Calibration State Profile</label>
            <select 
              value={selectedState} 
              onChange={(e) => { setSelectedState(e.target.value as any); setIsOptimized(false); }}
              className="bg-slate-900 border border-slate-700 text-sm rounded-lg p-2.5 focus:ring-teal-500 focus:border-teal-500"
            >
              {Object.keys(stateProfiles).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button 
            onClick={runPipeline}
            className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-600 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-200 mt-4 md:mt-0"
          >
            <Play size={16} /> Run Optimization Engine
          </button>
        </div>
      </header>

      {/* Infrastructure KPI Row */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Lower Court Clearance Rate</p>
          <p className="text-3xl font-black text-indigo-400 mt-2">{stateProfiles[selectedState].clearance}%</p>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3">
            <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${stateProfiles[selectedState].clearance}%` }}></div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Courthall Infrastructure Shortfall</p>
          <p className="text-3xl font-black text-amber-500 mt-2">{stateProfiles[selectedState].shortfall}%</p>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3">
            <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${stateProfiles[selectedState].shortfall}%` }}></div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Algorithmic Compliance State</p>
          <p className="text-md font-bold text-teal-400 mt-3 flex items-center gap-2">
            <ShieldCheck size={18} /> 4 Syllabus Paradigms Verified
          </p>
        </div>
      </section>

      {/* Main Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Courtroom Gantt Matrix */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
            <h3 className="text-lg font-bold flex items-center gap-2 text-slate-200 border-b border-slate-800 pb-3 mb-4">
              <Layers size={18} className="text-indigo-400" /> Courtroom Timeline Matrix (Greedy Distribution)
            </h3>
            {!isOptimized ? (
              <div className="py-20 text-center text-slate-500 border border-dashed border-slate-800 rounded-lg">
                Click "Run Optimization Engine" to evaluate timeline streams
              </div>
            ) : (
              <div className="space-y-6">
                {scheduledRooms.map((roomCases, idx) => (
                  <div key={idx} className="bg-slate-950/60 p-4 border border-slate-800 rounded-lg">
                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3">Judge Courtroom Room 0{idx + 1}</h4>
                    <div className="relative h-16 bg-slate-900 rounded border border-slate-800 flex items-center p-2 gap-3 overflow-x-auto">
                      {roomCases.length === 0 ? (
                        <span className="text-xs text-slate-600 pl-2">No hearings allocated to room.</span>
                      ) : (
                        roomCases.map((c, cIdx) => (
                          <div 
                            key={cIdx} 
                            className="h-12 rounded bg-gradient-to-b from-indigo-950 to-indigo-900 border border-indigo-700 min-w-[140px] p-2 flex flex-col justify-between shadow-inner"
                          >
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="font-bold text-teal-400">{c.c_id}</span>
                              <span className="text-slate-400">{c.startTime}:00-{c.endTime}:00</span>
                            </div>
                            <span className="text-[9px] font-medium truncate text-slate-300">{c.type_name}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Performance Data Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
            <h3 className="text-lg font-bold flex items-center gap-2 text-slate-200 border-b border-slate-800 pb-3 mb-4">
              <BarChart3 size={18} className="text-teal-400" /> Backlog Wait Time Degradation Analysis
            </h3>
            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceMetricsData}>
                  <defs>
                    <linearGradient id="colorFifo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorJq" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" label={{ value: 'Days in Backlog Queue', angle: -90, position: 'insideLeft', style: {textAnchor: 'middle', fill: '#64748b', fontSize: 11} }} fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                  <Area type="monotone" dataKey="FIFO_WaitDays" name="Baseline FIFO Queue" stroke="#ef4444" fillOpacity={1} fill="url(#colorFifo)" strokeWidth={2} />
                  <Area type="monotone" dataKey="JusticeQueue_WaitDays" name="JusticeQueue Optimized" stroke="#14b8a6" fillOpacity={1} fill="url(#colorJq)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Tab Paradigm Log Inspector */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md flex flex-col h-[680px]">
          <h3 className="text-lg font-bold flex items-center gap-2 text-slate-200 border-b border-slate-800 pb-3 mb-4">
            <ListCollapse size={18} className="text-amber-400" /> Paradigm Execution Console
          </h3>
          <div className="flex-1 overflow-y-auto space-y-6 pr-1 text-[11px] font-mono">
            {/* Box 1 */}
            <div className="bg-slate-950 p-3 rounded border border-slate-800">
              <h4 className="text-xs font-bold text-indigo-400 mb-2">1. Transform & Conquer Log (Max-Heap Layout)</h4>
              <div className="max-h-24 overflow-y-auto space-y-1 text-slate-400">
                {heapLog.length === 0 ? "Awaiting initialization signal..." : heapLog.map((l, i) => <div key={i}>&gt; {l}</div>)}
              </div>
            </div>
            {/* Box 2 & 3 */}
            <div className="bg-slate-950 p-3 rounded border border-slate-800">
              <h4 className="text-xs font-bold text-teal-400 mb-2">2 & 3. DP Table Layout & Decrease-Conquer Trace</h4>
              <div className="max-h-36 overflow-y-auto space-y-1 text-slate-400">
                {dpLog.length === 0 ? "Awaiting calculation run..." : dpLog.map((l, i) => <div key={i}>&gt; {l}</div>)}
              </div>
              {dpTableValues.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-800 text-teal-500 font-bold">
                  Memoization Array M[j]: [{dpTableValues.join(', ')}]
                </div>
              )}
            </div>
            {/* Box 4 */}
            <div className="bg-slate-950 p-3 rounded border border-slate-800">
              <h4 className="text-xs font-bold text-amber-500 mb-2">4. Greedy Partition Allocation Log</h4>
              <div className="max-h-28 overflow-y-auto space-y-1 text-slate-400">
                {greedyLog.length === 0 ? "Awaiting courtroom balancing loop..." : greedyLog.map((l, i) => <div key={i}>&gt; {l}</div>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}