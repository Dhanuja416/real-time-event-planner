import React, { useState, useEffect } from 'react';
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
const HUB_URL = `${API_BASE}/taskhub`;

const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

const DocumentList = ({ token, theme }) => {
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

  const getApiClient = () => {
    return axios.create({
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  };
  const apiClient = getApiClient();

  // Fetch Analytics statistics
  const fetchAnalytics = async () => {
    try {
      const response = await apiClient.get(`${API_URL}/analytics`);
      setAnalytics(response.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  // Fetch Documents
  const fetchDocuments = async () => {
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
  };

  useEffect(() => {
    if (token) {
      fetchDocuments();
      fetchAnalytics();
    }
  }, [token, activeTab, debouncedSearch]);

  // SignalR real-time updates for list
  useEffect(() => {
    let connection = null;
    if (!token) return;

    const startSignalR = async () => {
      try {
        connection = new signalR.HubConnectionBuilder()
          .withUrl(HUB_URL, { accessTokenFactory: () => token })
          .withAutomaticReconnect()
          .build();

        connection.on('DocumentReceived', (doc, action) => {
          console.log(`Dashboard SignalR: Document ${action}. Auto-refreshing.`);
          fetchDocuments();
          fetchAnalytics();
        });

        await connection.start();
      } catch (err) {
        console.error('Dashboard SignalR Error:', err);
      }
    };

    startSignalR();

    return () => {
      if (connection) connection.stop();
    };
  }, [token, activeTab, debouncedSearch]);

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

  const cardBg = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const headingColor = theme === 'dark' ? 'text-gray-100' : 'text-gray-800';
  const inputBg = theme === 'dark' ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-gray-50 text-gray-800 border-gray-300';

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-fade-in">
      {/* Dashboard Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-3xl font-extrabold tracking-tight ${headingColor}`}>Workspace Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Welcome back, <span className="font-semibold text-blue-600 dark:text-blue-400">{userEmail.split('@')[0]}</span>
          </p>
        </div>

        <button
          onClick={() => {
            setProfileName(localStorage.getItem('userDisplayName') || userEmail.split('@')[0]);
            setIsProfileOpen(true);
          }}
          className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-gray-300 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-150 dark:hover:bg-gray-800 transition shadow-sm"
        >
          <Settings size={16} />
          <span>Profile Settings</span>
        </button>
      </div>

      {/* Analytics Summary Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Documents */}
        <div className={`p-4 rounded-2xl border shadow-md flex items-center gap-4 ${cardBg}`}>
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
            <FileText size={22} />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-semibold block uppercase">Total Files</span>
            <span className={`text-2xl font-bold ${headingColor}`}>{analytics.totalDocuments}</span>
          </div>
        </div>

        {/* Owned Documents */}
        <div className={`p-4 rounded-2xl border shadow-md flex items-center gap-4 ${cardBg}`}>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <Shield size={22} />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-semibold block uppercase">My Docs</span>
            <span className={`text-2xl font-bold ${headingColor}`}>{analytics.ownedDocuments}</span>
          </div>
        </div>

        {/* Shared Documents */}
        <div className={`p-4 rounded-2xl border shadow-md flex items-center gap-4 ${cardBg}`}>
          <div className="p-3 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
            <Users size={22} />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-semibold block uppercase">Shared</span>
            <span className={`text-2xl font-bold ${headingColor}`}>{analytics.sharedDocuments}</span>
          </div>
        </div>

        {/* Comments Count */}
        <div className={`p-4 rounded-2xl border shadow-md flex items-center gap-4 ${cardBg}`}>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
            <MessageSquare size={22} />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-semibold block uppercase">Comments</span>
            <span className={`text-2xl font-bold ${headingColor}`}>{analytics.totalCommentsOnMyDocs}</span>
          </div>
        </div>
      </div>

      {/* Document Form Area */}
      <div className={`p-6 rounded-2xl border shadow-md ${cardBg}`}>
        <DocumentForm onDocumentCreated={() => { fetchDocuments(); fetchAnalytics(); }} theme={theme} />
      </div>

      {/* Main Grid Area: Lists, Tabs, and Filter Controls */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-700 pb-3">
          {/* Tabs Control */}
          <div className="flex flex-wrap gap-1">
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
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition
                    ${isSelected 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
                  `}
                >
                  <TabIcon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Filtering Bar */}
          {activeTab !== 'recent' && (
            <div className="relative w-full md:w-80">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Search by title or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-9 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition ${inputBg}`}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Documents Render Box */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <p className="text-red-500 text-center py-10 font-medium">{error}</p>
        ) : documents.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
            <FileText size={48} className="mx-auto text-gray-400 dark:text-gray-600 mb-3" />
            <h3 className={`text-md font-bold ${headingColor}`}>No documents found</h3>
            <p className="text-xs text-gray-400 mt-1">
              {searchQuery ? 'Try adjusting your search criteria.' : 'Create a new document to get started.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc) => (
              <div 
                key={doc.id}
                onClick={() => navigate(`/documents/${doc.id}`)}
                className={`p-4 rounded-xl border shadow-sm flex items-center justify-between cursor-pointer group hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition duration-150 ${cardBg}`}
              >
                <div className="flex items-center space-x-3.5 min-w-0">
                  <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 group-hover:scale-105 transition">
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className={`font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition truncate ${headingColor}`}>
                      {doc.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                      <span>Owner: {doc.owner?.userName === userEmail ? 'me' : doc.owner?.userName?.split('@')[0]}</span>
                      <span>•</span>
                      <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
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
                      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition"
                      title="Delete document"
                    >
                      <Trash2 size={15} />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl ${cardBg}`}>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                <User size={18} />
                <h3 className={`text-lg font-bold ${headingColor}`}>Profile Settings</h3>
              </div>
              <button 
                onClick={() => setIsProfileOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                  Email Address
                </label>
                <input
                  type="text"
                  value={userEmail}
                  disabled
                  className="w-full p-2.5 rounded-lg border bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 cursor-not-allowed text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  placeholder="Enter display name"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  required
                  disabled={isProfileSaving}
                  className={`w-full p-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm ${inputBg}`}
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-lg text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProfileSaving || !profileName.trim()}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-500/20 transition disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {isProfileSaving ? 'Saving...' : <><Check size={14} /><span>Save Profile</span></>}
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