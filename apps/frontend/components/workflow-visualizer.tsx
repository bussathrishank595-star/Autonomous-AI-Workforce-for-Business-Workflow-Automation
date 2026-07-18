import React from "react";

interface WorkflowVisualizerProps {
  tasks: { agentName: string; status: string }[];
}

export function WorkflowVisualizer({ tasks }: WorkflowVisualizerProps) {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 bg-neutral-50 dark:bg-neutral-900/50 text-center text-sm text-neutral-500">
        No execution pipeline currently scheduled. Write a prompt to begin planning.
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <span className="text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 px-2 py-0.5 rounded-full font-medium">Completed</span>;
      case "RUNNING":
        return <span className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium animate-pulse">Running</span>;
      case "FAILED":
        return <span className="text-xs bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 px-2 py-0.5 rounded-full font-medium">Failed</span>;
      default:
        return <span className="text-xs bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 px-2 py-0.5 rounded-full font-medium">Pending</span>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
        <h3 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">Workflow Execution Pipeline</h3>
        <span className="text-xs text-neutral-500">{tasks.length} Agents Assigned</span>
      </div>

      <div className="grid grid-cols-1 gap-2 relative">
        {tasks.map((task, idx) => (
          <div key={idx} className="flex flex-col">
            <div className="flex items-center justify-between p-3.5 border border-neutral-150 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-900 shadow-sm transition hover:border-neutral-300 dark:hover:border-neutral-700">
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs font-mono font-medium text-neutral-600 dark:text-neutral-400">
                  {idx + 1}
                </span>
                <div>
                  <h4 className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{task.agentName}</h4>
                </div>
              </div>
              <div>{getStatusBadge(task.status)}</div>
            </div>
            {idx < tasks.length - 1 && (
              <div className="h-4 w-0.5 bg-neutral-200 dark:bg-neutral-800 mx-6 my-1 flex items-center justify-center">
                {/* Visual arrow spacer */}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
