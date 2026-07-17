"use client";

import React, { useState, useEffect } from "react";
import { WorkflowVisualizer } from "@/components/workflow-visualizer";
import { Terminal, Clock, CheckCircle2, ChevronRight, XCircle } from "lucide-react";

export default function TasksPage() {
  const [missions, setMissions] = useState<any[]>([]);
  const [selectedMission, setSelectedMission] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMissions = async () => {
      try {
        const res = await fetch("/api/missions/list");
        if (res.ok) {
          const data = await res.json();
          setMissions(data.missions || []);
          if (data.missions?.length > 0) {
            setSelectedMission(data.missions[0]);
          }
        }
      } catch {} finally {
        setLoading(false);
      }
    };
    fetchMissions();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />;
      case "FAILED":
        return <XCircle className="h-4.5 w-4.5 text-rose-500" />;
      default:
        return <Clock className="h-4.5 w-4.5 text-neutral-400 animate-pulse" />;
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Workflow Execution History</h1>
        <p className="text-sm text-neutral-500">
          Review details of your recruitment missions, planning strategy tasks, and execution outcomes.
        </p>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center items-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-800" />
        </div>
      ) : missions.length === 0 ? (
        <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-8 bg-white dark:bg-neutral-900 text-center text-sm text-neutral-500">
          No recruitment missions found. Launch one from the dashboard!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Mission Navigation History */}
          <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900 shadow-sm overflow-hidden h-fit">
            <div className="px-4.5 py-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
              <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Historical Runs</span>
            </div>
            <div className="divide-y divide-neutral-150 dark:divide-neutral-800 max-h-[480px] overflow-y-auto">
              {missions.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMission(m)}
                  className={`w-full text-left p-4 transition flex items-center justify-between hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20 ${
                    selectedMission?.id === m.id ? "bg-neutral-50 dark:bg-neutral-800/40" : ""
                  }`}
                >
                  <div className="space-y-1 pr-2 truncate">
                    <p className="text-xs font-semibold text-neutral-850 dark:text-neutral-200 truncate">{m.prompt}</p>
                    <p className="text-[10px] text-neutral-400">{new Date(m.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {getStatusIcon(m.status)}
                    <ChevronRight className="h-3.5 w-3.5 text-neutral-400" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Details Column */}
          <div className="md:col-span-2 space-y-6">
            {selectedMission && (
              <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 bg-white dark:bg-neutral-900 shadow-sm space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-600 dark:text-neutral-400">
                      Objective
                    </span>
                    <span className="text-xs text-neutral-400">Mission ID: {selectedMission.id}</span>
                  </div>
                  <h2 className="text-base font-bold text-neutral-900 dark:text-white leading-tight">
                    {selectedMission.prompt}
                  </h2>
                </div>

                <WorkflowVisualizer tasks={selectedMission.tasks || []} />

                {/* AI Plan reasoning */}
                {selectedMission.planJson && (
                  <div className="space-y-2 border border-neutral-100 dark:border-neutral-850 p-4 rounded-lg bg-neutral-50/40 dark:bg-neutral-900/40">
                    <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Planner Strategic Reasoning</span>
                    <p className="text-xs text-neutral-600 dark:text-neutral-450 leading-relaxed font-mono">
                      {JSON.parse(selectedMission.planJson).reasoning}
                    </p>
                  </div>
                )}

                {/* Log Terminal */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-neutral-850 dark:text-neutral-200">
                    <Terminal className="h-3.5 w-3.5" />
                    <span>Orchestration Execution Logs</span>
                  </div>
                  <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 font-mono text-xs text-neutral-300 overflow-y-auto max-h-[200px] space-y-2">
                    {JSON.parse(selectedMission.logs || "[]").map((log: string, idx: number) => (
                      <div key={idx} className="text-neutral-200">
                        &gt; {log}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
