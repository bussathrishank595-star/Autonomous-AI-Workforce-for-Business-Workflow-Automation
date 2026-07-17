"use client";

import React, { useState, useEffect } from "react";
import { WorkflowVisualizer } from "@/components/workflow-visualizer";
import { Terminal, Calendar, Mail, FileText, ArrowRight, Play, AlertCircle, CheckCircle } from "lucide-react";

export default function DashboardPage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [missions, setMissions] = useState<any[]>([]);
  const [activeMission, setActiveMission] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [pendingActions, setPendingActions] = useState<any[]>([]);
  const [authRequired, setAuthRequired] = useState(false);

  // Poll for active mission updates (logs, status, actions)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeMission) {
      const fetchStatus = async () => {
        try {
          const res = await fetch(`/api/missions?id=${activeMission.id}`);
          if (res.ok) {
            const data = await res.json();
            setActiveMission(data.mission);
            setLogs(JSON.parse(data.mission.logs || "[]"));
            setTasks(data.mission.tasks || []);
            setPendingActions(data.actions || []);
          }
        } catch {}
      };
      fetchStatus();
      interval = setInterval(fetchStatus, 3000);
    }
    return () => clearInterval(interval);
  }, [activeMission]);

  // Handle workflow trigger
  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    setAuthRequired(false);

    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Execution failed");
      }

      // Set active mission and begin polling
      setActiveMission({ id: data.missionId });
    } catch (err: any) {
      alert(`Pipeline error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle preview approvals
  const handleApproveActions = async () => {
    if (pendingActions.length === 0 || !activeMission) return;
    setLoading(true);

    try {
      const res = await fetch("/api/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          missionId: activeMission.id,
          actionIds: pendingActions.map(a => a.id),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error?.includes("Google OAuth")) {
          setAuthRequired(true);
        } else {
          alert(`Execution error: ${data.error}`);
        }
      } else {
        alert("Actions approved & executed successfully!");
        setPendingActions([]);
      }
    } catch (err: any) {
      alert(`Error during execution: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Recruitment Orchestrator</h1>
        <p className="text-sm text-neutral-500">
          State your recruitment criteria below. The AI workforce will parse, filter, rank, and stage outreaches automatically.
        </p>
      </div>

      {/* Input Prompter */}
      <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 bg-white dark:bg-neutral-900 shadow-sm">
        <form onSubmit={handleExecute} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Workforce Goal Directive</label>
            <textarea
              className="w-full min-h-[90px] px-3.5 py-3 text-sm border border-neutral-200 dark:border-neutral-800 rounded-lg bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-700"
              placeholder="e.g. Find React developers with 2+ years experience. Shortlist candidates and prepare invitations."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="flex items-center gap-2 bg-neutral-900 dark:bg-neutral-50 text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 px-5 py-2 rounded-lg text-sm font-medium transition focus:outline-none disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              {activeMission ? "Re-run Mission" : "Launch Mission"}
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Workflow Visualization & Logs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 bg-white dark:bg-neutral-900 shadow-sm space-y-6">
            <WorkflowVisualizer tasks={tasks} />

            {/* AI Reasoning Logs */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-neutral-850 dark:text-neutral-200">
                <Terminal className="h-4 w-4" />
                <span>AI Workforce Output Logs</span>
              </div>
              <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 font-mono text-xs text-neutral-350 overflow-y-auto max-h-[220px] space-y-2.5">
                {logs.length === 0 ? (
                  <span className="text-neutral-600">Waiting to initialize...</span>
                ) : (
                  logs.map((log, idx) => (
                    <div key={idx} className="flex gap-2">
                      <span className="text-neutral-500">[{new Date().toLocaleTimeString()}]</span>
                      <span className="text-neutral-200">{log}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Approval & Execution Layer */}
        <div className="space-y-6">
          <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 bg-white dark:bg-neutral-900 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-2">
              <CheckCircle className="h-4.5 w-4.5 text-neutral-600" />
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Actions Pending Approval</h3>
            </div>

            {pendingActions.length === 0 ? (
              <p className="text-xs text-neutral-500 py-3 text-center">No staging actions requiring approval.</p>
            ) : (
              <div className="space-y-4">
                {authRequired && (
                  <div className="text-xs bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900 p-3 rounded-lg flex items-start gap-2">
                    <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                    <div>
                      <strong>Google OAuth required.</strong> Connect your Gmail / Google Calendar account in{" "}
                      <a href="/settings" className="underline font-semibold">Settings</a> before executing actions.
                    </div>
                  </div>
                )}

                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {pendingActions.map((act) => (
                    <div key={act.id} className="border border-neutral-150 dark:border-neutral-800 rounded-lg p-3 bg-neutral-50 dark:bg-neutral-900/50 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider bg-neutral-200 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-600 dark:text-neutral-300">
                            {act.type}
                          </span>
                          <h4 className="text-xs font-semibold text-neutral-800 dark:text-neutral-250 mt-1">{act.candidateName}</h4>
                        </div>
                        {act.date && (
                          <span className="text-[10px] text-neutral-500 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(act.date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400 line-clamp-1">{act.subject}</p>
                      <p className="text-[11px] text-neutral-500 bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-850 p-2 rounded max-h-[80px] overflow-y-auto whitespace-pre-line font-mono">
                        {act.body}
                      </p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleApproveActions}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-xs font-semibold transition"
                >
                  Approve & Execute All Actions
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
