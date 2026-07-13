import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as signalR from '@microsoft/signalr';
import DocumentForm from './DocumentForm';
import { 
  Trash2, FileText, Search, Users, MessageSquare, 
  Clock, Plus, Shield, Settings, User, Check, X
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7072';
const API_URL = `${API_BASE}/api/Documents`;
const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
};

const DocumentList = ({ token, hubConnection, theme }) => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tab & Search states
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'owned', 'shared', 'recent'
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Analytics states
  const [analytics, setAnalytics] = useState({
    totalDocuments: 0,
    ownedDocuments: 0,
    sharedDocuments: 0,
    totalCommentsOnMyDocs: 0,
    collaboratorsCount: 0
  });

  // Profile modal settings state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [isProfileSaving, setIsProfileSaving] = useState(false);

  // Parse token
  const userPayload = parseJwt(token);
  const userEmail = userPayload?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || "User";
  const userId = userPayload?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400); // 400ms debounce
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const apiClient = useMemo(() => {
    return axios.create({
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  }, [token]);

  // Fetch Analytics statistics
  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await apiClient.get(`${API_URL}/analytics`);
      setAnalytics(response.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  }, [apiClient]);

  // Fetch Documents
  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      let fetchUrl = API_URL;

      if (activeTab === 'recent') {
        fetchUrl = `${API_URL}/recent`;
      } else if (activeTab === 'shared') {
        fetchUrl = `${API_URL}/shared`;
      }

      const params = {};
      if (debouncedSearch && activeTab !== 'recent') {
        params.search = debouncedSearch;
      }

      const response = await apiClient.get(fetchUrl, { params });
      
      let docs = response.data;
      if (activeTab === 'owned') {
        docs = docs.filter(d => d.ownerId === userId);
      }

      setDocuments(docs);
      setError(null);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to fetch documents. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  }, [apiClient, activeTab, debouncedSearch, userId]);

  useEffect(() => {
    if (token) {
      fetchDocuments();
      fetchAnalytics();
    }
  }, [token, fetchDocuments, fetchAnalytics]);

  // SignalR real-time updates for list
  useEffect(() => {
    if (!hubConnection) return;

    const handleDocumentReceived = (doc, action) => {
      console.log(`Dashboard SignalR: Document ${action}. Auto-refreshing.`);
      fetchDocuments();
      fetchAnalytics();
    };

    hubConnection.on('DocumentReceived', handleDocumentReceived);

    return () => {
      hubConnection.off('DocumentReceived', handleDocumentReceived);
    };
  }, [hubConnection, fetchDocuments, fetchAnalytics]);

  // Delete Document
  const deleteDocument = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this document permanently?")) return;
    try {
      await apiClient.delete(`${API_URL}/${docId}`);
      fetchDocuments();
      fetchAnalytics();
    } catch (err) {
      console.error('Error deleting document:', err);
      alert('Failed to delete document. Only owners have delete privileges.');
    }
  };

  // Profile Save
  const handleSaveProfile = (e) => {
    e.preventDefault();
    setIsProfileSaving(true);
    setTimeout(() => {
      // Simulate profile details save
      localStorage.setItem('userDisplayName', profileName);
      setIsProfileSaving(false);
      setIsProfileOpen(false);
    }, 800);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-10 animate-fade-in">
      {/* Dashboard Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-gold-light/10 pb-6">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-gold-light/70 font-semibold">Workspace Dashboard</span>
          <h1 className="text-4xl font-serif font-bold text-luxury-gradient mt-1">Collab Canvas</h1>
          <p className="text-xs text-sand-light/65 mt-1 font-medium">
            Welcome back, <span className="text-gold-light font-semibold">{userEmail.split('@')[0]}</span>
          </p>
        </div>

        <button
          onClick={() => {
            setProfileName(localStorage.getItem('userDisplayName') || userEmail.split('@')[0]);
            setIsProfileOpen(true);
          }}
          className="flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl border border-gold-light/20 text-xs font-serif uppercase tracking-widest text-gold-light hover:bg-gold-glass/10 transition-all duration-300 shadow-sm"
        >
          <Settings size={14} />
          <span>Profile Settings</span>
        </button>
      </div>

      {/* Analytics Summary Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Documents */}
        <div className="p-5 rounded-2xl glass-panel hover-lift-gold flex items-center gap-5">
          <div className="p-3 rounded-xl bg-gold-glass border border-gold-light/20 text-gold-light">
            <FileText size={20} />
          </div>
          <div>
            <span className="text-[10px] text-sand-light/50 font-bold block uppercase tracking-widest">Total Files</span>
            <span className="text-2xl font-serif font-bold text-luxury-gradient">{analytics.totalDocuments}</span>
          </div>
        </div>

        {/* Owned Documents */}
        <div className="p-5 rounded-2xl glass-panel hover-lift-gold flex items-center gap-5">
          <div className="p-3 rounded-xl bg-gold-glass border border-gold-light/20 text-gold-light">
            <Shield size={20} />
          </div>
          <div>
            <span className="text-[10px] text-sand-light/50 font-bold block uppercase tracking-widest">My Canvas</span>
            <span className="text-2xl font-serif font-bold text-luxury-gradient">{analytics.ownedDocuments}</span>
          </div>
        </div>

        {/* Shared Documents */}
        <div className="p-5 rounded-2xl glass-panel hover-lift-gold flex items-center gap-5">
          <div className="p-3 rounded-xl bg-gold-glass border border-gold-light/20 text-gold-light">
            <Users size={20} />
          </div>
          <div>
            <span className="text-[10px] text-sand-light/50 font-bold block uppercase tracking-widest">Shared</span>
            <span className="text-2xl font-serif font-bold text-luxury-gradient">{analytics.sharedDocuments}</span>
          </div>
        </div>

        {/* Comments Count */}
        <div className="p-5 rounded-2xl glass-panel hover-lift-gold flex items-center gap-5">
          <div className="p-3 rounded-xl bg-gold-glass border border-gold-light/20 text-gold-light">
            <MessageSquare size={20} />
          </div>
          <div>
            <span className="text-[10px] text-sand-light/50 font-bold block uppercase tracking-widest">Comments</span>
            <span className="text-2xl font-serif font-bold text-luxury-gradient">{analytics.totalCommentsOnMyDocs}</span>
          </div>
        </div>
      </div>

      {/* Document Form Area */}
      <div className="p-6 rounded-2xl glass-panel hover-lift-gold">
        <DocumentForm onDocumentCreated={() => { fetchDocuments(); fetchAnalytics(); }} theme={theme} />
      </div>

      {/* Main Grid Area: Lists, Tabs, and Filter Controls */}
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-gold-light/10 pb-4">
          {/* Tabs Control */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'All Files', icon: FileText },
              { id: 'owned', label: 'My Docs', icon: Shield },
              { id: 'shared', label: 'Shared with Me', icon: Users },
              { id: 'recent', label: 'Recent', icon: Clock }
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }}
                  className={`flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-serif uppercase tracking-widest transition duration-300
                    ${isSelected 
                      ? 'bg-luxury-gold-button text-cocoa-darkest shadow-md' 
                      : 'text-sand-light hover:text-gold-light hover:bg-gold-glass/5'
                    }
                  `}
                >
                  <TabIcon size={12} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Filtering Bar */}
          {activeTab !== 'recent' && (
            <div className="relative w-full lg:w-80">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gold-light/60">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 rounded-xl glass-input placeholder-sand-light/40 text-xs tracking-wider font-semibold"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-sand-light/50 hover:text-gold-light"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Documents Render Box */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="p-3 rounded-full bg-gold-glass animate-pulse border border-gold-light/20">
              <Clock className="w-8 h-8 text-gold-light animate-spin" />
            </div>
            <p className="text-xs uppercase tracking-widest text-sand-light/70 animate-pulse font-semibold">Syncing canvases...</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-xl border border-red-500/20 bg-red-950/10 text-center text-red-400 font-semibold text-sm">
            {error}
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-20 glass-panel rounded-2xl border-dashed">
            <FileText size={40} className="mx-auto text-gold-light/40 mb-4 animate-pulse" />
            <h3 className="text-lg font-serif font-bold text-gold-light">No documents found</h3>
            <p className="text-xs text-sand-light/60 mt-1.5 max-w-xs mx-auto leading-relaxed">
              {searchQuery ? 'Try adjusting your search criteria.' : 'Create a new collaborative document above to start planning.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {documents.map((doc, idx) => (
              <div 
                key={doc.id}
                onClick={() => navigate(`/documents/${doc.id}`)}
                className="p-5 rounded-2xl glass-panel hover-lift-gold flex items-center justify-between cursor-pointer group animate-fade-in"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="flex items-center space-x-4 min-w-0">
                  <div className="p-3 rounded-xl bg-gold-glass border border-gold-light/10 text-gold-light group-hover:scale-105 transition duration-300">
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-serif font-bold text-base text-f5f0eb group-hover:text-gold-light transition duration-300 truncate">
                      {doc.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] text-sand-light/50 font-bold uppercase mt-1 tracking-wider">
                      <span>Owner: {doc.owner?.userName === userEmail ? 'me' : doc.owner?.userName?.split('@')[0]}</span>
                      <span>•</span>
                      <span>{new Date(doc.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {/* Delete (only for owner) */}
                  {doc.ownerId === userId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteDocument(doc.id);
                      }}
                      className="p-2.5 rounded-xl border border-transparent hover:border-red-500/20 text-sand-light hover:text-red-400 hover:bg-red-950/20 transition duration-300"
                      title="Delete document"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Profile Modal Dialog */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md p-8 rounded-2xl glass-panel shadow-3xl">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-gold-light/10">
              <div className="flex items-center space-x-2.5 text-gold-light">
                <User size={16} />
                <h3 className="text-lg font-serif font-bold">Profile settings</h3>
              </div>
              <button 
                onClick={() => setIsProfileOpen(false)}
                className="p-1 rounded-full text-sand-light hover:text-gold-light transition"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div>
                <label className="block text-xs uppercase tracking-widest font-semibold text-gold-light/80 mb-2 ml-1">
                  Email Address
                </label>
                <input
                  type="text"
                  value={userEmail}
                  disabled
                  className="w-full p-3.5 rounded-xl border bg-cocoa-darkest/45 text-sand-light/50 border-gold-light/10 cursor-not-allowed text-xs tracking-wider font-semibold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest font-semibold text-gold-light/80 mb-2 ml-1">
                  Display Name
                </label>
                <input
                  type="text"
                  placeholder="Enter display name"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  required
                  disabled={isProfileSaving}
                  className="w-full p-3.5 rounded-xl glass-input placeholder-sand-light/40 text-xs tracking-wider font-semibold"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex-1 py-3 border border-gold-light/20 text-gold-light hover:bg-gold-glass/10 rounded-xl text-xs uppercase font-serif tracking-widest transition duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProfileSaving || !profileName.trim()}
                  className="flex-1 py-3 bg-luxury-gold-button text-cocoa-darkest rounded-xl text-xs uppercase font-serif tracking-widest shadow-md transition duration-300 flex items-center justify-center gap-1.5"
                >
                  {isProfileSaving ? 'Saving...' : <><Check size={12} /><span>Save Changes</span></>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentList;