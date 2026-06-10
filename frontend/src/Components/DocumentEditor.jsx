import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as signalR from '@microsoft/signalr';
import * as Y from 'yjs';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import { ArrowLeft, Share2, Save, CheckCircle2, AlertCircle, Users, X, MessageSquare, History } from 'lucide-react';

import { SignalRYjsProvider } from '../Services/SignalRYjsProvider';
import EditorToolbar from './EditorToolbar';
import CollaboratorPresence from './CollaboratorPresence';
import CommentSidebar from './CommentSidebar';
import VersionHistory from './VersionHistory';
import CommentMark from '../Services/CommentMark';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7072';
const API_URL = `${API_BASE}/api/Documents`;
const HUB_URL = `${API_BASE}/documenthub`;

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899'];

const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
};

const DocumentEditor = ({ theme }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('jwtToken');

  const [documentDetails, setDocumentDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(''); // 'saved', 'saving', 'error'
  
  // Share modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareLevel, setShareLevel] = useState(2); // 1 = Viewer, 2 = Editor
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState(null);
  const [shareSuccess, setShareSuccess] = useState(null);

  // Comments and Version History sidebars state
  const [isCommentSidebarOpen, setIsCommentSidebarOpen] = useState(false);
  const [isVersionSidebarOpen, setIsVersionSidebarOpen] = useState(false);
  const [activeCommentId, setActiveCommentId] = useState(null);

  // References for cleanup
  const ydocRef = useRef(null);
  const providerRef = useRef(null);
  const connectionRef = useRef(null);

  // Parse current user details
  const userPayload = parseJwt(token);
  const userEmail = userPayload?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || "User";
  const userName = userEmail.split('@')[0];
  const userColor = useRef(COLORS[Math.floor(Math.random() * COLORS.length)]).current;

  // 1. Fetch metadata (Title, Owner)
  useEffect(() => {
    if (!token) {
      setError('Not authenticated.');
      setLoading(false);
      return;
    }

    const fetchMetadata = async () => {
      try {
        const response = await axios.get(`${API_URL}/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDocumentDetails(response.data);
      } catch (err) {
        console.error('Error fetching document details:', err);
        if (err.response?.status === 403) {
          setError('You do not have permission to access this document.');
        } else if (err.response?.status === 404) {
          setError('Document not found.');
        } else {
          setError('Failed to load document metadata.');
        }
      }
    };

    fetchMetadata();
  }, [id, token]);

  // 2. Initialize SignalR + Y.js + Provider
  useEffect(() => {
    if (!token || error) return;

    let active = true;

    const initConnection = async () => {
      try {
        // Create SignalR connection
        const connection = new signalR.HubConnectionBuilder()
          .withUrl(HUB_URL, { accessTokenFactory: () => token })
          .withAutomaticReconnect()
          .build();

        connectionRef.current = connection;

        await connection.start();
        console.log('SignalR connected to DocumentHub.');

        if (!active) {
          connection.stop();
          return;
        }

        // Initialize Y.js Doc
        const ydoc = new Y.Doc();
        ydocRef.current = ydoc;

        // Initialize Awareness (protocols/awareness)
        // The collaboration cursor extension needs provider.awareness.
        // We will pass an awareness instance to the provider.
        const { Awareness } = await import('y-protocols/awareness');
        const awareness = new Awareness(ydoc);
        awareness.setLocalStateField('user', {
          name: userName,
          email: userEmail,
          color: userColor
        });

        // Initialize custom provider
        const provider = new SignalRYjsProvider(connection, parseInt(id), ydoc, awareness);
        providerRef.current = provider;

        provider.on('status', ({ status }) => {
          console.log(`Collab provider status: ${status}`);
        });

        provider.on('synced', (synced) => {
          if (synced) {
            setLoading(false);
          }
        });

        // Real-time Comment Update listener
        connection.on('CommentReceived', (comment, action) => {
          console.log(`SignalR: Comment ${action} event received.`);
          // Fire a custom event to notify the CommentSidebar
          window.dispatchEvent(new CustomEvent('comments-updated'));
        });

        // Document Restored listener
        connection.on('DocumentRestored', (state, version) => {
          console.log(`SignalR: Document restored to version ${version}. Reloading canvas...`);
          // Reload the page to cleanly rebind all editors to the restored state
          window.location.reload();
        });

      } catch (err) {
        console.error('Failed to initialize SignalR/Collab connection:', err);
        if (active) {
          setError('Failed to establish real-time collaboration server connection.');
          setLoading(false);
        }
      }
    };

    initConnection();

    return () => {
      active = false;
      if (providerRef.current) {
        providerRef.current.destroy();
      }
      if (connectionRef.current) {
        connectionRef.current.stop();
      }
    };
  }, [id, token, error, userName, userEmail, userColor]);

  // 3. Set up Tiptap Editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false, // Collaboration handles history instead of starter kit
      }),
      // Bind Yjs document
      Collaboration.configure({
        document: ydocRef.current || new Y.Doc(),
      }),
      // Bind Awareness (collaborators cursors)
      CollaborationCursor.configure({
        provider: providerRef.current,
        user: {
          name: userName,
          color: userColor,
        }
      }),
      CommentMark, // Highlight comments inline
    ],
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none focus:outline-none min-h-[400px]',
      },
      handleClickOn(view, pos, node, nodePos, event) {
        if (event.target.hasAttribute('data-comment-id')) {
          const commentId = event.target.getAttribute('data-comment-id');
          setActiveCommentId(commentId);
          setIsVersionSidebarOpen(false);
          setIsCommentSidebarOpen(true);
        }
      }
    }
  }, [loading]); // Recreate when loading changes (once provider binds)

  // Sync editor with Y.js doc after they are initialized
  useEffect(() => {
    if (editor && ydocRef.current && providerRef.current) {
      // Bind editor to collaboration extensions dynamically if not done
    }
  }, [editor, loading]);

  // 4. Save state method (Triggered manually or automatically)
  const saveDocument = useCallback(async () => {
    if (!editor || !ydocRef.current || !providerRef.current) return;
    
    setIsSaving(true);
    setSaveStatus('saving');

    try {
      // Serialize full Yjs doc state as binary
      const stateBytes = Y.encodeStateAsUpdate(ydocRef.current);
      const htmlContent = editor.getHTML();

      // Send state to server
      await connectionRef.current.invoke(
        'SaveDocumentState', 
        parseInt(id), 
        Array.from(stateBytes), 
        htmlContent
      );

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (err) {
      console.error('Failed to save document:', err);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  }, [editor, id]);

  // Debounced auto-save (every 10 seconds if editor is focused and content changes)
  useEffect(() => {
    if (!editor) return;

    const timer = setInterval(() => {
      if (editor.isFocused) {
        saveDocument();
      }
    }, 15000);

    return () => clearInterval(timer);
  }, [editor, saveDocument]);

  // 5. Handle Sharing
  const handleShare = async (e) => {
    e.preventDefault();
    setShareLoading(true);
    setShareError(null);
    setShareSuccess(null);

    try {
      await axios.post(`${API_URL}/${id}/share`, {
        documentId: parseInt(id),
        userEmail: shareEmail,
        permissionLevel: parseInt(shareLevel)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setShareSuccess(`Shared successfully with ${shareEmail}!`);
      setShareEmail('');
      
      // Update local metadata to show new permission list
      const response = await axios.get(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocumentDetails(response.data);
    } catch (err) {
      console.error('Error sharing document:', err);
      setShareError(err.response?.data?.message || 'Failed to share document.');
    } finally {
      setShareLoading(false);
    }
  };

  // Layout styling
  const cardBg = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const headingColor = theme === 'dark' ? 'text-gray-100' : 'text-gray-800';
  const inputBg = theme === 'dark' ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-gray-50 text-gray-800 border-gray-300';

  if (loading && !error) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-8 flex flex-col items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Opening collaborative canvas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 rounded-xl border shadow-xl bg-white dark:bg-gray-800 border-red-200 dark:border-red-900/50">
        <div className="flex items-center space-x-3 text-red-600 dark:text-red-400 mb-4">
          <AlertCircle size={32} />
          <h2 className="text-xl font-bold">Access Error</h2>
        </div>
        <p className="text-gray-700 dark:text-gray-300 mb-6">{error}</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-lg transition font-medium"
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      {/* Editor Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition duration-150"
            title="Back to Dashboard"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className={`text-2xl font-bold ${headingColor} truncate max-w-md`}>
              {documentDetails?.title || 'Loading document...'}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Owned by: {documentDetails?.owner?.userName === userEmail ? 'me' : documentDetails?.owner?.userName || 'unknown'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Active Collaborators list */}
          {providerRef.current?.awareness && (
            <CollaboratorPresence awareness={providerRef.current.awareness} />
          )}

          {/* Panel Toggles */}
          <div className="flex items-center space-x-1 border-l border-gray-200 dark:border-gray-800 pl-3">
            <button
              onClick={() => {
                setIsVersionSidebarOpen(false);
                setIsCommentSidebarOpen(!isCommentSidebarOpen);
              }}
              className={`p-2 rounded-full transition duration-150 ${
                isCommentSidebarOpen 
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              title="Toggle Comments"
            >
              <MessageSquare size={18} />
            </button>
            <button
              onClick={() => {
                setIsCommentSidebarOpen(false);
                setIsVersionSidebarOpen(!isVersionSidebarOpen);
              }}
              className={`p-2 rounded-full transition duration-150 ${
                isVersionSidebarOpen 
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              title="Toggle Version History"
            >
              <History size={18} />
            </button>
          </div>

          {/* Save status notification badge */}
          {saveStatus && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold
              ${saveStatus === 'saving' && 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'}
              ${saveStatus === 'saved' && 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'}
              ${saveStatus === 'error' && 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'}
            `}>
              {saveStatus === 'saving' && <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />}
              {saveStatus === 'saved' && <CheckCircle2 size={14} />}
              {saveStatus === 'error' && <AlertCircle size={14} />}
              <span>
                {saveStatus === 'saving' && 'Saving...'}
                {saveStatus === 'saved' && 'Saved'}
                {saveStatus === 'error' && 'Failed'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Editor and Sidebar layout wrapper */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Editor Canvas Card */}
        <div className={`flex-1 w-full rounded-xl border shadow-2xl ${cardBg} overflow-hidden`}>
          {/* Editor formatting toolbar */}
          <EditorToolbar 
            editor={editor} 
            onSave={saveDocument} 
            isSaving={isSaving}
            onShare={documentDetails?.ownerId === userPayload?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ? () => setIsShareModalOpen(true) : null}
            theme={theme}
          />

          {/* ProseMirror Editor Content */}
          <div className="bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-200">
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Comments Sidebar Panel */}
        {isCommentSidebarOpen && (
          <div className="w-full lg:w-auto h-[600px] lg:h-[500px]">
            <CommentSidebar
              documentId={id}
              token={token}
              editor={editor}
              activeCommentId={activeCommentId}
              setActiveCommentId={setActiveCommentId}
              onClose={() => setIsCommentSidebarOpen(false)}
              theme={theme}
            />
          </div>
        )}

        {/* Version History Sidebar Panel */}
        {isVersionSidebarOpen && (
          <div className="w-full lg:w-auto h-[600px] lg:h-[500px]">
            <VersionHistory
              documentId={id}
              token={token}
              onClose={() => setIsVersionSidebarOpen(false)}
              onRestore={() => {
                console.log('Version restored. Reloading editor...');
              }}
              theme={theme}
            />
          </div>
        )}
      </div>

      {/* Share Modal Dialog */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md p-6 rounded-xl border shadow-2xl ${cardBg}`}>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                <Users size={20} />
                <h3 className={`text-lg font-bold ${headingColor}`}>Share Document</h3>
              </div>
              <button 
                onClick={() => {
                  setIsShareModalOpen(false);
                  setShareSuccess(null);
                  setShareError(null);
                }}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleShare} className="space-y-4">
              {shareError && <p className="text-red-500 text-sm">{shareError}</p>}
              {shareSuccess && <p className="text-green-500 text-sm font-semibold">{shareSuccess}</p>}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                  Collaborator Email
                </label>
                <input
                  type="email"
                  placeholder="collaborator@example.com"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  required
                  disabled={shareLoading}
                  className={`w-full p-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:outline-none ${inputBg}`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                  Access Level
                </label>
                <select
                  value={shareLevel}
                  onChange={(e) => setShareLevel(e.target.value)}
                  disabled={shareLoading}
                  className={`w-full p-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:outline-none ${inputBg}`}
                >
                  <option value={1}>Viewer (Read-Only)</option>
                  <option value={2}>Editor (Can Edit)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={shareLoading || !shareEmail}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-md shadow-blue-500/20 transition disabled:opacity-50"
              >
                {shareLoading ? 'Sharing...' : 'Add Collaborator'}
              </button>
            </form>

            {/* List of current permissions */}
            {documentDetails?.permissions && documentDetails.permissions.length > 0 && (
              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Who has access:
                </h4>
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {documentDetails.permissions.map((perm) => (
                    <div key={perm.id} className="flex justify-between items-center text-xs py-1 text-gray-700 dark:text-gray-300">
                      <span className="truncate max-w-[200px]">{perm.user?.userName || 'User'}</span>
                      <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-[10px] font-semibold">
                        {perm.level === 1 ? 'Viewer' : perm.level === 2 ? 'Editor' : 'Owner'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentEditor;
