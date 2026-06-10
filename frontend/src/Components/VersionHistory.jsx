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

  const cardBg = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const headingColor = theme === 'dark' ? 'text-gray-100' : 'text-gray-800';
  const itemHover = theme === 'dark' ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50';

  return (
    <div className={`w-80 md:w-96 flex flex-col h-full border-l ${cardBg} shadow-2xl transition-all duration-300`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
          <History size={18} />
          <h2 className={`font-bold text-sm uppercase tracking-wider ${headingColor}`}>Version History</h2>
        </div>
        <button 
          onClick={onClose}
          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
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
            <div className="p-3 bg-blue-50/40 dark:bg-blue-950/10 rounded-lg border border-blue-100/50 dark:border-blue-900/20 mb-4 text-xs">
              <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 font-semibold mb-1">
                <History size={14} className="text-blue-600 dark:text-blue-400" />
                <span>Version {selectedVersion.versionNumber}</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 mb-1">
                <Calendar size={12} />
                <span>{new Date(selectedVersion.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                <User size={12} />
                <span>Edited by: {selectedVersion.createdByUserName?.split('@')[0]}</span>
              </div>
            </div>

            {/* Content Snapshot scroll box */}
            <div className="flex-1 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-950/50">
              {loadingContent ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div 
                  className="prose dark:prose-invert prose-xs max-w-none text-xs text-gray-800 dark:text-gray-200"
                  dangerouslySetInnerHTML={{ __html: selectedContent || '<p class="text-gray-400 italic">Empty document snapshot</p>' }}
                />
              )}
            </div>

            {/* Restore and back button controls */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setSelectedVersion(null)}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-lg text-xs font-semibold transition"
              >
                Back to List
              </button>
              <button
                onClick={handleRestoreVersion}
                disabled={restoring}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-500/20 transition disabled:opacity-50 flex items-center justify-center gap-1"
              >
                <RefreshCw size={12} className={restoring ? 'animate-spin' : ''} />
                <span>{restoring ? 'Restoring...' : 'Restore Version'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* VERSION RECORDS LIST */
          <div className="flex-1 overflow-y-auto p-2 divide-y divide-gray-100 dark:divide-gray-800/80">
            {loading ? (
              <p className="text-gray-500 text-center text-xs py-10">Loading versions...</p>
            ) : error ? (
              <p className="text-red-500 text-center text-xs py-10">{error}</p>
            ) : versions.length === 0 ? (
              <p className="text-gray-500 text-center text-xs py-10">No past versions found. Versions are automatically created every 5 minutes when edits are saved.</p>
            ) : (
              versions.map((ver) => (
                <div
                  key={ver.id}
                  onClick={() => handleSelectVersion(ver)}
                  className={`p-3 text-left transition duration-150 cursor-pointer flex items-center justify-between ${itemHover}`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800 dark:text-gray-200">
                      <span>Version {ver.versionNumber}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                      {new Date(ver.createdAt).toLocaleString()}
                    </p>
                    <span className="text-[9px] text-gray-500 dark:text-gray-400 mt-1 block truncate">
                      By: {ver.createdByUserName}
                    </span>
                  </div>

                  <button
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg transition"
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
