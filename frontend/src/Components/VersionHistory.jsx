import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { History, X, RefreshCw, Eye, Calendar, User } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7072';
const DOCUMENTS_API = `${API_BASE}/api/Documents`;

const VersionHistory = ({ documentId, token, onClose, onRestore, theme }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected version details
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [selectedContent, setSelectedContent] = useState('');
  const [loadingContent, setLoadingContent] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // --- Fetch Version List ---
  const fetchVersions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${DOCUMENTS_API}/${documentId}/versions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVersions(response.data);
    } catch (err) {
      console.error('Error fetching versions:', err);
      setError('Failed to load version history.');
    } finally {
      setLoading(false);
    }
  }, [documentId, token]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  // --- Fetch Specific Version Content ---
  const handleSelectVersion = async (version) => {
    setSelectedVersion(version);
    setLoadingContent(true);
    setSelectedContent('');

    try {
      const response = await axios.get(`${DOCUMENTS_API}/${documentId}/versions/${version.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedContent(response.data.content);
    } catch (err) {
      console.error('Error fetching version content:', err);
      alert('Failed to load version snapshot content.');
    } finally {
      setLoadingContent(false);
    }
  };

  // --- Restore Version ---
  const handleRestoreVersion = async () => {
    if (!selectedVersion) return;
    if (!window.confirm(`Are you sure you want to restore the document to Version ${selectedVersion.versionNumber}? Current changes will be archived in a new snapshot.`)) return;

    setRestoring(true);

    try {
      await axios.post(`${DOCUMENTS_API}/${documentId}/versions/${selectedVersion.id}/restore`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Callback to parent to reload editor
      if (onRestore) {
        onRestore();
      }
      onClose();
    } catch (err) {
      console.error('Error restoring version:', err);
      alert('Failed to restore version.');
    } finally {
      setRestoring(false);
    }
  };

  const itemHover = theme === 'dark' ? 'hover:bg-gold-glass/10' : 'hover:bg-gold-glass/15';

  return (
    <div className={`w-80 md:w-96 flex flex-col h-full border-l glass-panel shadow-3xl transition-all duration-300 rounded-r-2xl`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gold-light/10">
        <div className="flex items-center space-x-2 text-gold-light">
          <History size={18} />
          <h2 className="font-serif font-bold text-sm uppercase tracking-wider text-luxury-gradient">Version History</h2>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-gold-glass/5 text-sand-light hover:text-gold-light transition-all"
        >
          <X size={16} />
        </button>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedVersion ? (
          /* PREVIEWING A VERSION */
          <div className="flex-1 flex flex-col overflow-hidden p-4">
            {/* Version Metadata info card */}
            <div className="p-3.5 bg-gold-glass border border-gold-light/15 rounded-xl mb-4 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-gold-light font-bold">
                <History size={14} />
                <span>Version {selectedVersion.versionNumber}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sand-light/85">
                <Calendar size={12} className="text-gold-light/60" />
                <span>{new Date(selectedVersion.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sand-light/85">
                <User size={12} className="text-gold-light/60" />
                <span className="truncate">Edited by: {selectedVersion.createdByUserName?.split('@')[0]}</span>
              </div>
            </div>

            {/* Content Snapshot scroll box */}
            <div className="flex-1 overflow-y-auto border border-gold-light/10 rounded-xl p-3.5 bg-cocoa-medium/20 text-sand-light">
              {loadingContent ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gold-light"></div>
                </div>
              ) : (
                <div 
                  className="prose dark:prose-invert prose-xs max-w-none text-xs text-sand-light/95 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: selectedContent || '<p class="text-sand-light/50 italic">Empty document snapshot</p>' }}
                />
              )}
            </div>

            {/* Restore and back button controls */}
            <div className="mt-4 flex gap-2.5">
              <button
                onClick={() => setSelectedVersion(null)}
                className="flex-1 py-2.5 bg-cocoa-medium border border-gold-light/10 hover:bg-cocoa-medium/80 text-sand-light rounded-xl text-xs font-semibold tracking-wider uppercase transition-all duration-200"
              >
                Back to List
              </button>
              <button
                onClick={handleRestoreVersion}
                disabled={restoring}
                className="flex-1 py-2.5 bg-luxury-gold-button text-cocoa-darkest rounded-xl text-xs font-serif tracking-widest uppercase transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <RefreshCw size={12} className={restoring ? 'animate-spin' : ''} />
                <span>{restoring ? 'Restoring...' : 'Restore'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* VERSION RECORDS LIST */
          <div className="flex-1 overflow-y-auto p-2 divide-y divide-gold-light/5">
            {loading ? (
              <p className="text-sand-light/60 text-center text-xs py-10 font-semibold animate-pulse">Loading versions...</p>
            ) : error ? (
              <p className="text-red-400 text-center text-xs py-10 font-semibold">{error}</p>
            ) : versions.length === 0 ? (
              <p className="text-sand-light/50 text-center text-xs py-10 px-4 leading-relaxed">No past versions found. Versions are automatically created every 5 minutes when edits are saved.</p>
            ) : (
              versions.map((ver) => (
                <div
                  key={ver.id}
                  onClick={() => handleSelectVersion(ver)}
                  className={`p-3 text-left transition duration-150 cursor-pointer flex items-center justify-between rounded-xl ${itemHover}`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-sand-light">
                      <span>Version {ver.versionNumber}</span>
                    </div>
                    <p className="text-[10px] text-sand-light/50 mt-0.5 font-medium">
                      {new Date(ver.createdAt).toLocaleString()}
                    </p>
                    <span className="text-[9px] text-sand-light/40 mt-1 block truncate">
                      By: {ver.createdByUserName}
                    </span>
                  </div>

                  <button
                    className="p-2 text-sand-light hover:text-gold-light hover:bg-gold-glass/5 rounded-lg transition-all"
                    title="Preview snapshot"
                  >
                    <Eye size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VersionHistory;
