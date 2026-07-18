"use client";

import React, { useState, useEffect } from "react";
import { UploadCloud, File, Trash2, CheckCircle2, AlertCircle } from "lucide-react";

export default function UploadsPage() {
  const [resumes, setResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const fetchResumes = async () => {
    try {
      const res = await fetch("/api/upload/list");
      if (res.ok) {
        const data = await res.json();
        setResumes(data.resumes || []);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setSuccessMsg("");

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setSuccessMsg(`Successfully uploaded ${files.length} resume(s)!`);
        fetchResumes();
      } else {
        const data = await res.json();
        alert(`Upload error: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Network error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resume?")) return;
    try {
      const res = await fetch(`/api/upload/delete?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setResumes(resumes.filter(r => r.id !== id));
      } else {
        const data = await res.json();
        alert(`Delete error: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Network error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Resume Repository</h1>
        <p className="text-sm text-neutral-500">
          Upload and manage candidate CVs in PDF, DOCX, or text formats. The AI parser will automatically index them.
        </p>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div className="border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl p-8 bg-white dark:bg-neutral-900/40 text-center hover:border-neutral-300 transition relative">
        <input
          type="file"
          multiple
          accept=".pdf,.docx,.txt"
          onChange={handleFileUpload}
          disabled={uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center gap-3">
          <UploadCloud className="h-10 w-10 text-neutral-400" />
          <div>
            <p className="text-sm font-semibold text-neutral-850 dark:text-neutral-200">
              {uploading ? "Parsing and indexing resumes..." : "Click or drag resumes to upload"}
            </p>
            <p className="text-xs text-neutral-400 mt-1">Supports PDF, DOCX, and TXT up to 10MB each</p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900 p-3 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="h-4.5 w-4.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Repository Listing */}
      <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-900/50">
          <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Indexed Files ({resumes.length})</span>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center items-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-800" />
          </div>
        ) : resumes.length === 0 ? (
          <div className="py-12 text-center text-sm text-neutral-500 flex flex-col items-center gap-2">
            <AlertCircle className="h-5 w-5 text-neutral-400" />
            <span>No resumes in local repository. Upload resumes to launch recruitment pipeline.</span>
          </div>
        ) : (
          <div className="divide-y divide-neutral-150 dark:divide-neutral-800">
            {resumes.map((res) => (
              <div key={res.id} className="p-4 flex items-center justify-between hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20 transition">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-neutral-100 dark:bg-neutral-850 flex items-center justify-center">
                    <File className="h-4.5 w-4.5 text-neutral-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{res.filename}</h4>
                    <p className="text-[10px] text-neutral-400">{(res.fileSize / 1024).toFixed(1)} KB • Uploaded {new Date(res.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-semibold bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-700">
                    Status: {res.status || "PENDING"}
                  </span>
                  {res.name ? (
                    <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-900">
                      Parsed: {res.name}
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-450 px-2 py-0.5 rounded border border-amber-100 dark:border-amber-900 animate-pulse">
                      Parsing...
                    </span>
                  )}
                  <button
                    onClick={() => handleDelete(res.id)}
                    className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                    title="Delete resume"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
