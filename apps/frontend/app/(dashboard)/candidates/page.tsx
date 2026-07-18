"use client";

import React, { useState, useEffect } from "react";
import { Search, UserCheck, XCircle, Mail, Calendar } from "lucide-react";

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("SCORE_DESC");

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const res = await fetch("/api/candidates");
        if (res.ok) {
          const data = await res.json();
          setCandidates(data.candidates || []);
        }
      } catch {} finally {
        setLoading(false);
      }
    };
    fetchCandidates();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SHORTLISTED":
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 px-2.5 py-0.5 rounded-full">Shortlisted</span>;
      case "REJECTED":
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 px-2.5 py-0.5 rounded-full">Rejected</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 px-2.5 py-0.5 rounded-full">Considered</span>;
    }
  };

  const processedCandidates = candidates
    .filter(c => {
      const skillsStr = c.skills || "";
      const matchQuery =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
        skillsStr.toLowerCase().includes(search.toLowerCase());
      
      if (statusFilter === "ALL") return matchQuery;
      return matchQuery && c.status === statusFilter;
    })
    .sort((a, b) => {
      if (sortBy === "SCORE_DESC") return (b.matchScore || 0) - (a.matchScore || 0);
      if (sortBy === "SCORE_ASC") return (a.matchScore || 0) - (b.matchScore || 0);
      if (sortBy === "NAME_ASC") return (a.name || "").localeCompare(b.name || "");
      return 0;
    });

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Candidates Dashboard</h1>
        <p className="text-sm text-neutral-500">
          Monitor candidate scoring, semantic fit analysis, and contact information extracted from parsed resumes.
        </p>
      </div>

      {/* Control Panel: Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-neutral-900 p-4 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-neutral-400" />
          <input
            type="text"
            className="w-full pl-9 pr-4 py-2 text-sm border border-neutral-200 dark:border-neutral-800 rounded-lg bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-700"
            placeholder="Search by name, skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex w-full sm:w-auto items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 rounded-lg focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="SHORTLISTED">Shortlisted</option>
            <option value="REJECTED">Rejected</option>
            <option value="CONSIDERED">Considered</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 rounded-lg focus:outline-none"
          >
            <option value="SCORE_DESC">Rank: High to Low</option>
            <option value="SCORE_ASC">Rank: Low to High</option>
            <option value="NAME_ASC">Name: A to Z</option>
          </select>
        </div>
      </div>

      {/* Candidate Table */}
      <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 flex justify-center items-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-800" />
          </div>
        ) : processedCandidates.length === 0 ? (
          <div className="py-12 text-center text-sm text-neutral-500">
            No candidates matched the criteria. Launch a recruitment mission to parse resumes.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
              <thead className="bg-neutral-50 dark:bg-neutral-900/50">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Candidate Name</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Skills</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Experience Details</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Match Score</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">AI Analysis Reasoning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {processedCandidates.map((cand) => (
                  <tr key={cand.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{cand.name}</div>
                      <div className="text-xs text-neutral-500 font-mono">{cand.email || "No email"}</div>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate">
                      <div className="text-xs text-neutral-600 dark:text-neutral-350 truncate">
                        {(() => {
                          try {
                            const parsed = JSON.parse(cand.skills || "[]");
                            return Array.isArray(parsed) ? parsed.join(", ") : parsed;
                          } catch {
                            return cand.skills || "None";
                          }
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate">
                      <div className="text-xs text-neutral-600 dark:text-neutral-350 truncate">
                        {(() => {
                          try {
                            const parsed = JSON.parse(cand.experience || "[]");
                            return Array.isArray(parsed) ? parsed.join("; ") : parsed;
                          } catch {
                            return cand.experience || "None";
                          }
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${cand.matchScore >= 70 ? "bg-emerald-500" : "bg-neutral-300"}`} />
                        {cand.matchScore}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(cand.status)}</td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-neutral-500 line-clamp-2 max-w-sm">{cand.reasoning}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
