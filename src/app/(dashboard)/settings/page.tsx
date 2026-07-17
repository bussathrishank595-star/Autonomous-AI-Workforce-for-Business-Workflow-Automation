"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Link2, CheckCircle2, AlertCircle } from "lucide-react";

export default function SettingsPage() {
  const [googleConnected, setGoogleConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const successParam = searchParams.get("success");

  useEffect(() => {
    const checkOAuthStatus = async () => {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          setGoogleConnected(data.isConnected);
        }
      } catch {} finally {
        setLoading(false);
      }
    };
    checkOAuthStatus();
  }, []);

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Settings & Integrations</h1>
        <p className="text-sm text-neutral-500">
          Connect External Platforms to authorize Gmail outreach sending and Google Calendar meeting schedules.
        </p>
      </div>

      {successParam === "google-connected" && (
        <div className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-455 dark:border-emerald-900 p-3 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="h-4.5 w-4.5" />
          <span>Google Workspace credentials successfully linked and authenticated!</span>
        </div>
      )}

      {/* Integration Card */}
      <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-neutral-850 dark:text-neutral-200">Google OAuth API Connection</h3>
              <p className="text-xs text-neutral-500 max-w-md">
                Required for Email Execution Agent and Calendar Execution Agent to send mail drafts and schedule Google Meets.
              </p>
            </div>

            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border border-neutral-300 border-t-neutral-800" />
            ) : googleConnected ? (
              <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-900">
                Connected
              </span>
            ) : (
              <span className="text-[10px] font-semibold bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-800">
                Not Connected
              </span>
            )}
          </div>

          <div className="border-t border-neutral-100 dark:border-neutral-800 pt-5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <AlertCircle className="h-4 w-4 shrink-0 text-neutral-400" />
              <span>Uses official OAuth2 secure tokens callback flow.</span>
            </div>

            <a
              href="/api/connect/google"
              className="flex items-center gap-2 bg-neutral-900 dark:bg-neutral-50 text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 px-4 py-2 rounded-lg text-xs font-semibold transition"
            >
              <Link2 className="h-3.5 w-3.5" />
              {googleConnected ? "Reconnect Google Account" : "Connect Google Account"}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
