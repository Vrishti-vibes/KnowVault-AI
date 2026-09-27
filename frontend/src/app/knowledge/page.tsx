"use client";

import { useState, useEffect } from "react";
import { FileText, Search, Zap, Trash2, ArrowLeft, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Document {
  document_id: string;
  source_name: string;
  version: number;
  source_type: string;
  created_at: string;
  chunk_count: number;
}

export default function Knowledge() {
  const router = useRouter();
  const [userId, setUserId] = useState("user_a");
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [fetchingDocs, setFetchingDocs] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("knowvault_userid") || "user_a";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUserId(savedUser);
     
    setMounted(true);
  }, []);

  useEffect(() => {
    let active = true;
    const fetchDocs = async () => {
      setFetchingDocs(true);
      try {
        const res = await fetch(`${API_URL}/api/documents?user_id=${userId}`);
        if (res.ok) {
          const data = await res.json();
          if (active) setDocuments(data);
        }
      } catch (e) {
        console.error("Failed to fetch documents", e);
      }
      if (active) setFetchingDocs(false);
    };
    
    fetchDocs();
    return () => { active = false; };
  }, [userId]);

  const handleDelete = async (docId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/documents/${docId}?user_id=${userId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setDocuments(docs => docs.filter(d => d.document_id !== docId));
        setSelectedDocs(prev => {
          const newSet = new Set(prev);
          newSet.delete(docId);
          return newSet;
        });
      }
    } catch (e) {
      console.error("Delete failed", e);
    }
  };

  const toggleSelect = (docId: string) => {
    setSelectedDocs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(docId)) newSet.delete(docId);
      else newSet.add(docId);
      return newSet;
    });
  };

  const handleAskSelected = () => {
    if (selectedDocs.size === 0) return;
    if (typeof window !== "undefined") {
      localStorage.setItem("knowvault_selected_docs", JSON.stringify(Array.from(selectedDocs)));
    }
    router.push("/");
  };

  const filteredDocs = documents.filter(doc => 
    doc.source_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    doc.source_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalChunks = documents.reduce((sum, doc) => sum + doc.chunk_count, 0);
  const activeVersions = new Set(documents.map(d => d.source_name)).size;

  if (!mounted) {
    return <div className="min-h-screen bg-slate-950"></div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col md:flex-row font-sans">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col p-6">
        <div className="mb-10">
          <div className="flex items-center gap-2 text-indigo-400 mb-1">
            <Zap className="w-6 h-6" />
            <h1 className="text-xl font-bold tracking-tight text-white">KNOWVAULT</h1>
          </div>
          <div className="text-xs font-semibold tracking-widest text-indigo-500">AI</div>
          <p className="text-xs text-slate-500 mt-2">Private Knowledge Assistant</p>
        </div>

        <nav className="space-y-2 flex-1">
          <Link href="/" className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg font-medium transition">
            <Search className="w-4 h-4" />
            Dashboard
          </Link>
          <Link href="/knowledge" className="flex items-center gap-3 px-3 py-2 bg-indigo-500/10 text-indigo-400 rounded-lg font-medium transition">
            <FileText className="w-4 h-4" />
            Knowledge
          </Link>
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800">
          <div className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Demo Mode</div>
          <select 
            className="w-full bg-slate-950 text-sm text-slate-300 border border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            value={userId}
            onChange={(e) => {
              const newId = e.target.value;
              setUserId(newId);
              setSelectedDocs(new Set());
              if (typeof window !== "undefined") {
                localStorage.setItem("knowvault_userid", newId);
                localStorage.removeItem("knowvault_selected_docs");
              }
            }}
          >
            <option value="user_a">User A</option>
            <option value="user_b">User B</option>
          </select>
          <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            Data isolated
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col max-h-screen overflow-hidden">
        {/* Header */}
        <header className="px-8 py-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-sm">
          <div>
            <h2 className="text-2xl font-semibold text-white">Knowledge Base</h2>
            <p className="text-sm text-slate-400 mt-1">Manage everything stored in your private knowledge vault.</p>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="text-sm px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20">
              Demo: {userId === 'user_a' ? 'User A' : 'User B'}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              System Online
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col">
              <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Documents</span>
              <span className="text-3xl font-bold text-white">{documents.length}</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col">
              <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Chunks</span>
              <span className="text-3xl font-bold text-indigo-400">{totalChunks}</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col">
              <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Active Versions</span>
              <span className="text-3xl font-bold text-slate-300">{activeVersions}</span>
            </div>
          </div>

          {/* Document List */}
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Search documents by name or type..." 
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500 transition"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {selectedDocs.size > 0 && (
                <button 
                  onClick={handleAskSelected}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition animate-in fade-in"
                >
                  <MessageSquare className="w-4 h-4" />
                  Ask from {selectedDocs.size} selected
                </button>
              )}
            </div>

            {fetchingDocs ? (
              <div className="text-slate-500 text-sm py-4">Loading knowledge base...</div>
            ) : documents.length > 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/50 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="px-6 py-4 w-12"></th>
                      <th className="px-6 py-4">Document Name</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Version</th>
                      <th className="px-6 py-4">Chunks</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {filteredDocs.map((doc) => (
                      <tr key={doc.document_id} className={`hover:bg-slate-800/30 transition ${selectedDocs.has(doc.document_id) ? 'bg-indigo-500/5' : ''}`}>
                        <td className="px-6 py-4">
                          <input 
                            type="checkbox" 
                            className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500/50"
                            checked={selectedDocs.has(doc.document_id)}
                            onChange={() => toggleSelect(doc.document_id)}
                          />
                        </td>
                        <td className="px-6 py-4 flex items-center gap-3">
                          <FileText className="w-4 h-4 text-indigo-400" />
                          <span className="font-medium text-slate-200">{doc.source_name}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">{doc.source_type}</td>
                        <td className="px-6 py-4 text-sm text-slate-400">v{doc.version}</td>
                        <td className="px-6 py-4 text-sm text-slate-400">{doc.chunk_count} chunks</td>
                        <td className="px-6 py-4">
                          <span className="text-xs px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 font-medium">
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleDelete(doc.document_id)}
                            className="text-slate-500 hover:text-rose-400 transition p-2 rounded hover:bg-rose-500/10"
                            title="Delete document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredDocs.length === 0 && (
                  <div className="py-12 text-center text-slate-500">
                    No documents found matching &quot;{searchQuery}&quot;
                  </div>
                )}
              </div>
            ) : (
              <div className="border border-dashed border-slate-800 rounded-2xl p-16 text-center bg-slate-900/30 max-w-2xl mx-auto mt-12">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-500">
                  <FileText className="w-10 h-10" />
                </div>
                <h4 className="text-xl font-medium text-slate-200 mb-3">Your knowledge vault is empty.</h4>
                <p className="text-slate-400 max-w-md mx-auto mb-8">
                  Upload a document or paste some knowledge from the dashboard to get started.
                </p>
                <Link 
                  href="/"
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-medium transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Add Knowledge
                </Link>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
