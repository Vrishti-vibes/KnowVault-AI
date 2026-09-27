"use client";

import { useState, useEffect, useRef } from "react";
import { UploadCloud, FileText, Trash2, Search, Zap, CheckCircle, AlertCircle, RefreshCw, Send, Loader2 } from "lucide-react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Source {
  source_name: string;
  relevance: number;
  snippet: string;
  chunk_id: string;
  version: number;
  source_type: string;
}

interface Document {
  document_id: string;
  source_name: string;
  version: number;
  source_type: string;
  created_at: string;
  chunk_count: number;
}

export default function Dashboard() {
  const [userId, setUserId] = useState("user_a");
  
  interface ChatInteraction {
    id: string;
    question: string;
    answer: string;
    sources: Source[];
  }
  
  const [chatHistory, setChatHistory] = useState<ChatInteraction[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [uploadText, setUploadText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{type: 'idle' | 'success' | 'error', msg: string}>({ type: 'idle', msg: '' });
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [fetchingDocs, setFetchingDocs] = useState(false);
  
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [expandedSources, setExpandedSources] = useState<Set<number>>(new Set());

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("knowvault_userid") || "user_a";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUserId(savedUser);
    
    const savedDocs = localStorage.getItem("knowvault_selected_docs");
    if (savedDocs) {
       
      setSelectedDocIds(JSON.parse(savedDocs));
    }
    
    const history = localStorage.getItem(`knowvault_history_${savedUser}`);
    if (history) {
       
      setChatHistory(JSON.parse(history));
    }
    
     
    setMounted(true);
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    setFetchingDocs(true);
    try {
      const res = await fetch(`${API_URL}/api/documents?user_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (e) {
      console.error("Failed to fetch documents", e);
    }
    setFetchingDocs(false);
  };

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

  const saveHistory = (newHistory: ChatInteraction[]) => {
    setChatHistory(newHistory);
    if (typeof window !== "undefined") {
      localStorage.setItem(`knowvault_history_${userId}`, JSON.stringify(newHistory));
    }
  };

  const startNewChat = () => {
    setCurrentChatId(null);
    setQuestion("");
    setAnswer(null);
    setSources([]);
    setExpandedSources(new Set());
    if (typeof window !== "undefined") {
      localStorage.removeItem("knowvault_selected_docs");
      setSelectedDocIds([]);
    }
  };

  const loadChat = (chat: ChatInteraction) => {
    setCurrentChatId(chat.id);
    setQuestion(chat.question);
    setAnswer(chat.answer);
    setSources(chat.sources);
    setExpandedSources(new Set());
  };
  
  const deleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newHistory = chatHistory.filter(c => c.id !== id);
    saveHistory(newHistory);
    if (currentChatId === id) startNewChat();
  };

  const handleAsk = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer(null);
    setSources([]);
    setExpandedSources(new Set());
    
    try {
      const payload: Record<string, unknown> = { user_id: userId, question };
      if (selectedDocIds.length > 0) {
        payload.document_ids = selectedDocIds;
      }
      
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        setAnswer(data.answer);
        setSources(data.sources || []);
        
        const newChat: ChatInteraction = {
          id: Date.now().toString(),
          question,
          answer: data.answer,
          sources: data.sources || []
        };
        saveHistory([newChat, ...chatHistory]);
        setCurrentChatId(newChat.id);
        
      } else {
        setAnswer("Failed to connect to the knowledge base.");
      }
    } catch (e) {
      console.error(e);
      setAnswer("An error occurred during retrieval.");
    }
    setLoading(false);
  };

  const toggleSource = (idx: number) => {
    setExpandedSources(prev => {
      const newSet = new Set(prev);
      if (newSet.has(idx)) newSet.delete(idx);
      else newSet.add(idx);
      return newSet;
    });
  };

  const handlePasteUpload = async () => {
    if (!uploadText.trim()) return;
    setUploading(true);
    setUploadStatus({ type: 'idle', msg: 'Uploading & indexing...' });
    try {
      const res = await fetch(`${API_URL}/api/documents/paste`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, text: uploadText, source_name: "Pasted Knowledge" })
      });
      if (res.ok) {
        const data = await res.json();
        setUploadStatus({ type: 'success', msg: `Knowledge added. ${data.chunk_count} chunks indexed.` });
        setUploadText("");
        fetchDocuments();
      } else {
        setUploadStatus({ type: 'error', msg: 'Failed to ingest text.' });
      }
    } catch (e) {
      console.error(e);
      setUploadStatus({ type: 'error', msg: 'Network error during upload.' });
    }
    setUploading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadStatus({ type: 'idle', msg: 'Uploading & indexing...' });
    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_id", userId);
    try {
      const res = await fetch(`${API_URL}/api/documents/upload`, {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setUploadStatus({ type: 'success', msg: `Uploaded successfully. ${data.chunk_count} chunks indexed.` });
        fetchDocuments();
      } else {
        setUploadStatus({ type: 'error', msg: 'Server rejected the file.' });
      }
    } catch (err) {
      console.error(err);
      setUploadStatus({ type: 'error', msg: 'Network error during upload.' });
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (docId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/documents/${docId}?user_id=${userId}`, {
        method: "DELETE"
      });
      if (res.ok) fetchDocuments();
    } catch (e) {
      console.error("Delete failed", e);
    }
  };

  const handleFeedback = async (isHelpful: boolean) => {
    try {
      await fetch(`${API_URL}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, question, is_helpful: isHelpful })
      });
      alert(isHelpful ? "Thanks for the positive feedback!" : "Thanks for the feedback, we will improve.");
    } catch (e) {
      console.error(e);
    }
  };

  if (!mounted) {
    return <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row font-sans"></div>;
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
          <Link href="/" className="flex items-center gap-3 px-3 py-2 bg-indigo-500/10 text-indigo-400 rounded-lg font-medium transition">
            <Search className="w-4 h-4" />
            Dashboard
          </Link>
          <Link href="/knowledge" className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg font-medium transition">
            <FileText className="w-4 h-4" />
            Knowledge
          </Link>
          
          <div className="pt-6 pb-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Chat History</span>
              <button onClick={startNewChat} className="text-xs text-indigo-400 hover:text-indigo-300">New</button>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {chatHistory.length === 0 ? (
                <div className="text-xs text-slate-600">No recent chats</div>
              ) : (
                chatHistory.map(chat => (
                  <div 
                    key={chat.id}
                    onClick={() => loadChat(chat)}
                    className={`group flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer text-sm transition ${currentChatId === chat.id ? 'bg-slate-800 text-slate-200' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-300'}`}
                  >
                    <span className="truncate flex-1">{chat.question}</span>
                    <button 
                      onClick={(e) => deleteChat(chat.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800">
          <div className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Demo Mode</div>
          <select 
            className="w-full bg-slate-950 text-sm text-slate-300 border border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            value={userId}
            onChange={(e) => {
              const newId = e.target.value;
              setUserId(newId);
              if (typeof window !== "undefined") {
                localStorage.setItem("knowvault_userid", newId);
                const newHistory = localStorage.getItem(`knowvault_history_${newId}`);
                setChatHistory(newHistory ? JSON.parse(newHistory) : []);
              }
              setAnswer(null);
              setSources([]);
              setUploadStatus({ type: 'idle', msg: '' });
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
            <h2 className="text-2xl font-semibold text-white">Your Knowledge. Your Vault.</h2>
            <p className="text-sm text-slate-400 mt-1">Ask questions across your private documents.</p>
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
          
          {/* Top Row: Ask & Upload */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Ask Card */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Ask your knowledge</h3>
                {selectedDocIds.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded-md border border-indigo-500/30">
                      Filtering by {selectedDocIds.length} document(s)
                    </span>
                    <button 
                      onClick={() => {
                        setSelectedDocIds([]);
                        if (typeof window !== "undefined") localStorage.removeItem("knowvault_selected_docs");
                      }}
                      className="text-xs text-slate-500 hover:text-rose-400 underline"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
              <div className="relative flex-1 flex flex-col justify-end">
                <textarea
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition resize-none h-32 mb-4"
                  placeholder="What do you want to know?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAsk(); } }}
                />
                <button
                  onClick={handleAsk}
                  disabled={loading}
                  className="absolute bottom-7 right-3 bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg transition disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Upload Card */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl flex flex-col">
              <h3 className="text-lg font-semibold text-white mb-4">Add to Vault</h3>
              
              <div 
                className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition bg-slate-950/50 mb-4 group relative"
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  accept=".txt,.docx,.pdf"
                />
                {uploading ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-2" />
                    <span className="text-sm text-indigo-400 font-medium">Uploading & indexing...</span>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="w-8 h-8 text-slate-500 group-hover:text-indigo-400 transition mb-2" />
                    <span className="text-sm text-slate-300 font-medium">Drop your knowledge here</span>
                    <span className="text-xs text-slate-500 mt-1">TXT, DOCX, or PDF • Browse files</span>
                  </>
                )}
              </div>

              {uploadStatus.msg && (
                <div className={`px-4 py-3 rounded-lg flex items-center gap-3 text-sm mb-4 ${uploadStatus.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : uploadStatus.type === 'error' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-slate-800 text-slate-300'}`}>
                  {uploadStatus.type === 'success' && <CheckCircle className="w-4 h-4" />}
                  {uploadStatus.type === 'error' && <AlertCircle className="w-4 h-4" />}
                  {uploadStatus.msg}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 transition"
                  placeholder="Quick add: Paste notes, documentation, research..."
                  value={uploadText}
                  onChange={(e) => setUploadText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handlePasteUpload()}
                />
                <button
                  onClick={handlePasteUpload}
                  disabled={uploading}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>

          </div>

          {/* Results Area */}
          {(answer || loading) && (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              {loading ? (
                <div className="flex items-center gap-3 text-indigo-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Searching your vault...
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 mt-1">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-slate-400 mb-1">KnowVault AI</h4>
                      <div className="text-lg text-slate-200 leading-relaxed whitespace-pre-wrap">
                        {answer}
                      </div>
                    </div>
                  </div>

                  {sources.length > 0 ? (
                    <div className="mt-8 pt-6 border-t border-slate-800">
                      <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Sources</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {sources.map((src, idx) => {
                          const isExpanded = expandedSources.has(idx);
                          return (
                            <div key={idx} className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl hover:border-slate-700 transition flex flex-col">
                              <div className="flex justify-between items-start mb-2">
                                <span className="font-medium text-indigo-400 flex items-center gap-2 truncate pr-2">
                                  <FileText className="w-4 h-4 shrink-0" />
                                  <span className="truncate">{src.source_name}</span>
                                </span>
                                <span className="text-xs font-mono px-2 py-1 bg-slate-800 rounded-md text-slate-400 shrink-0">
                                  {(src.relevance * 100).toFixed(0)}% Match
                                </span>
                              </div>
                              <div className="text-xs text-slate-500 mb-3 flex items-center gap-2">
                                <span>{src.source_type}</span>
                                <span>•</span>
                                <span>v{src.version}</span>
                                <span>•</span>
                                <span>Chunk {src.chunk_id}</span>
                              </div>
                              <p className={`text-sm text-slate-400 italic ${isExpanded ? '' : 'line-clamp-3'} mb-2`}>
                                &quot;...{src.snippet}...&quot;
                              </p>
                              <button 
                                onClick={() => toggleSource(idx)}
                                className="mt-auto self-start text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                              >
                                {isExpanded ? 'Show less' : 'Show evidence'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="mt-6 flex items-center gap-3 border-t border-slate-800 pt-4">
                        <span className="text-xs text-slate-500">Was this helpful?</span>
                        <button onClick={() => handleFeedback(true)} className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded-full transition">👍 Yes</button>
                        <button onClick={() => handleFeedback(false)} className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded-full transition">👎 No</button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 pt-6 border-t border-slate-800 flex items-center gap-3 text-amber-400/80">
                      <Search className="w-5 h-5" />
                      <span className="text-sm font-medium">Not found in your vault. I could not find enough relevant information.</span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Document List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Recent Knowledge</h3>
              <button onClick={fetchDocuments} className="text-slate-500 hover:text-indigo-400 transition p-2">
                <RefreshCw className={`w-4 h-4 ${fetchingDocs ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            {documents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc) => (
                  <div key={doc.document_id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition flex flex-col group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-200 truncate max-w-[150px]">{doc.source_name}</h4>
                          <div className="text-xs text-slate-500">{doc.source_type} • v{doc.version}</div>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 font-medium">
                        Active
                      </span>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-800">
                      <span className="text-xs text-slate-500">{doc.chunk_count} chunks</span>
                      <button 
                        onClick={() => handleDelete(doc.document_id)}
                        className="text-slate-500 hover:text-rose-400 transition p-1 opacity-0 group-hover:opacity-100"
                        title="Delete document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-slate-800 rounded-2xl p-12 text-center bg-slate-900/30">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
                  <FileText className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-medium text-slate-300 mb-2">Your vault is empty</h4>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">Upload a document or paste knowledge above to get started.</p>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
