import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as Y from 'yjs';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import { Awareness } from 'y-protocols/awareness';
import { ArrowLeft, Share2, Save, CheckCircle2, AlertCircle, Users, X, MessageSquare, History, Loader } from 'lucide-react';

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

const DocumentEditor = ({ token: tokenProp, hubConnection, theme }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = tokenProp || localStorage.getItem('jwtToken');

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
  const ydocRef = useRef(new Y.Doc());
  const awarenessRef = useRef(new Awareness(ydocRef.current));
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
    if (!token || !hubConnection || error) return;

    let active = true;
    let provider = null;

    const initConnection = () => {
      try {
        connectionRef.current = hubConnection;

        // Initialize local awareness user details
        awarenessRef.current.setLocalStateField('user', {
          name: userName,
          email: userEmail,
          color: userColor
        });

        // Initialize custom provider
        provider = new SignalRYjsProvider(hubConnection, parseInt(id), ydocRef.current, awarenessRef.current);
        providerRef.current = provider;

        provider.on('status', ({ status }) => {
          console.log(`Collab provider status: ${status}`);
        });

        provider.on('synced', (synced) => {
          if (synced && active) {
            setLoading(false);
          }
        });

        // Real-time Comment Update listener
        const handleCommentReceived = (comment, action) => {
          console.log(`SignalR: Comment ${action} event received.`);
          // Fire a custom event to notify the CommentSidebar
          window.dispatchEvent(new CustomEvent('comments-updated'));
        };

        // Document Restored listener - SPA-friendly hot rollback!
        const handleDocumentRestored = (stateBytes, version) => {
          console.log(`SignalR: Document restored to version ${version}. Restoring state...`);
          const uint8State = providerRef.current?._convertToUint8Array(stateBytes);
          if (uint8State && uint8State.length > 0) {
            const ydoc = ydocRef.current;
            
            // Clear current Y.js XML fragment content and apply the restored state
            ydoc.transact(() => {
              const xmlFragment = ydoc.getXmlFragment('default');
              if (xmlFragment.length > 0) {
                xmlFragment.delete(0, xmlFragment.length);
              }
              Y.applyUpdate(ydoc, uint8State, providerRef.current);
            }, providerRef.current);
          }
        };

        hubConnection.on('CommentReceived', handleCommentReceived);
        hubConnection.on('DocumentRestored', handleDocumentRestored);

        return () => {
          active = false;
          if (provider) {
            provider.destroy();
          }
          hubConnection.off('CommentReceived', handleCommentReceived);
          hubConnection.off('DocumentRestored', handleDocumentRestored);
          connectionRef.current = null;
        };

      } catch (err) {
        console.error('Failed to initialize collaboration connection:', err);
        if (active) {
          setError('Failed to establish real-time collaboration server connection.');
          setLoading(false);
        }
      }
    };

    const cleanup = initConnection();
    return cleanup;
  }, [id, token, hubConnection, error, userName, userEmail, userColor]);

  // 3. Set up Tiptap Editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false, // Collaboration handles history instead of starter kit
      }),
      // Bind Yjs document
      Collaboration.configure({
        document: ydocRef.current,
      }),
      // Bind Awareness (collaborators cursors)
      CollaborationCursor.configure({
        provider: { awareness: awarenessRef.current },
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
  }, []); // Initialize only once

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


  if (loading && !error) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-8 flex flex-col items-center justify-center min-h-[500px] animate-pulse">
        <div className="p-4 rounded-full bg-gold-glass border border-gold-light/25 mb-4">
          <Loader className="w-10 h-10 text-gold-light animate-spin" />
        </div>
        <p className="text-xs uppercase tracking-widest text-sand-light/70 font-semibold">Opening collaborative canvas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 glass-panel rounded-2xl shadow-3xl text-center animate-fade-in">
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full bg-red-950/20 border border-red-500/30">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
        </div>
        <h2 className="text-2xl font-serif font-bold text-luxury-gradient mb-3">Access Denied</h2>
        <p className="text-xs text-sand-light/80 leading-relaxed mb-8">{error}</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="w-full py-3.5 rounded-xl bg-luxury-gold-button font-serif tracking-widest text-sm uppercase transition-all duration-300"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      {/* Editor Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-8 border-b border-gold-light/10 pb-5">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-3 rounded-xl border border-gold-light/10 text-sand-light hover:text-gold-light hover:bg-gold-glass/5 transition duration-300"
            title="Back to Dashboard"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <span className="text-[10px] uppercase tracking-widest text-gold-light/70 font-semibold block">REAP Canvas</span>
            <h1 className="text-2xl font-serif font-bold text-luxury-gradient mt-0.5 truncate max-w-md">
              {documentDetails?.title || 'Loading document...'}
            </h1>
            <p className="text-[10px] text-sand-light/50 font-bold uppercase tracking-wider mt-0.5">
              Owner: {documentDetails?.owner?.userName === userEmail ? 'me' : documentDetails?.owner?.userName || 'unknown'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Active Collaborators list */}
          <CollaboratorPresence awareness={awarenessRef.current} />

          {/* Panel Toggles */}
          <div className="flex items-center space-x-1.5 border-l border-gold-light/10 pl-4">
            <button
              onClick={() => {
                setIsVersionSidebarOpen(false);
                setIsCommentSidebarOpen(!isCommentSidebarOpen);
              }}
              className={`p-2.5 rounded-xl border transition-all duration-300 ${
                isCommentSidebarOpen 
                  ? 'bg-gold-glass border-gold-light/30 text-gold-light' 
                  : 'border-transparent text-sand-light hover:text-gold-light hover:bg-gold-glass/5'
              }`}
              title="Toggle Comments"
            >
              <MessageSquare size={16} />
            </button>
            <button
              onClick={() => {
                setIsCommentSidebarOpen(false);
                setIsVersionSidebarOpen(!isVersionSidebarOpen);
              }}
              className={`p-2.5 rounded-xl border transition-all duration-300 ${
                isVersionSidebarOpen 
                  ? 'bg-gold-glass border-gold-light/30 text-gold-light' 
                  : 'border-transparent text-sand-light hover:text-gold-light hover:bg-gold-glass/5'
              }`}
              title="Toggle Version History"
            >
              <History size={16} />
            </button>
          </div>

          {/* Save status notification badge */}
          {saveStatus && (
            <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all duration-300
              ${saveStatus === 'saving' && 'bg-cocoa-darkest/45 border-gold-light/10 text-gold-light'}
              ${saveStatus === 'saved' && 'bg-gold-glass border-gold-light/35 text-gold-light'}
              ${saveStatus === 'error' && 'bg-red-950/20 border-red-500/30 text-red-400'}
            `}>
              {saveStatus === 'saving' && <div className="w-1.5 h-1.5 rounded-full bg-gold-light animate-ping" />}
              {saveStatus === 'saved' && <CheckCircle2 size={12} />}
              {saveStatus === 'error' && <AlertCircle size={12} />}
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
        <div className="flex-1 w-full rounded-2xl glass-panel overflow-hidden hover-lift-gold">
          {/* Editor formatting toolbar */}
          <EditorToolbar 
            editor={editor} 
            onSave={saveDocument} 
            isSaving={isSaving}
            onShare={documentDetails?.ownerId === userPayload?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ? () => setIsShareModalOpen(true) : null}
            theme={theme}
          />

          {/* ProseMirror Editor Content */}
          <div className="bg-cocoa-darkest/30 dark:bg-cocoa-darkest/35 text-f5f0eb p-6 md:p-10">
            {editor && <EditorContent editor={editor} />}
          </div>
        </div>

        {/* Comments Sidebar Panel */}
        {isCommentSidebarOpen && (
          <div className="w-full lg:w-auto h-[600px] lg:h-[500px] animate-fade-in">
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
          <div className="w-full lg:w-auto h-[600px] lg:h-[500px] animate-fade-in">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md p-8 rounded-2xl glass-panel shadow-3xl">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-gold-light/10">
              <div className="flex items-center space-x-2.5 text-gold-light">
                <Users size={16} />
                <h3 className="text-lg font-serif font-bold">Share Document</h3>
              </div>
              <button 
                onClick={() => {
                  setIsShareModalOpen(false);
                  setShareSuccess(null);
                  setShareError(null);
                }}
                className="p-1 rounded-full text-sand-light hover:text-gold-light transition"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleShare} className="space-y-6">
              {shareError && (
                <div className="p-4 rounded-xl text-xs font-semibold tracking-wide border bg-red-950/20 border-red-500/30 text-red-400">
                  {shareError}
                </div>
              )}
              {shareSuccess && (
                <div className="p-4 rounded-xl text-xs font-semibold tracking-wide border bg-gold-glass border-gold-light/25 text-gold-light">
                  {shareSuccess}
                </div>
              )}

              <div>
                <label className="block text-xs uppercase tracking-widest font-semibold text-gold-light/80 mb-2 ml-1">
                  Collaborator Email
                </label>
                <input
                  type="email"
                  placeholder="collaborator@example.com"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  required
                  disabled={shareLoading}
                  className="w-full p-3.5 rounded-xl glass-input placeholder-sand-light/40 text-xs tracking-wider font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest font-semibold text-gold-light/80 mb-2 ml-1">
                  Access Level
                </label>
                <select
                  value={shareLevel}
                  onChange={(e) => setShareLevel(e.target.value)}
                  disabled={shareLoading}
                  className="w-full p-3.5 rounded-xl glass-input text-xs tracking-wider font-semibold"
                >
                  <option value={1}>Viewer (Read-Only)</option>
                  <option value={2}>Editor (Can Edit)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={shareLoading || !shareEmail}
                className="w-full py-3 bg-luxury-gold-button text-cocoa-darkest rounded-xl text-xs uppercase font-serif tracking-widest shadow-md transition duration-300"
              >
                {shareLoading ? 'Sharing...' : 'Add Collaborator'}
              </button>
            </form>

            {/* List of current permissions */}
            {documentDetails?.permissions && documentDetails.permissions.length > 0 && (
              <div className="mt-6 border-t border-gold-light/10 pt-4">
                <h4 className="text-[10px] uppercase tracking-widest font-bold text-gold-light/75 mb-3">
                  Authorized Collaborators:
                </h4>
                <div className="max-h-32 overflow-y-auto space-y-2.5 pr-1">
                  {documentDetails.permissions.map((perm) => (
                    <div key={perm.id} className="flex justify-between items-center text-xs py-1.5 border-b border-gold-light/5 text-sand-light">
                      <span className="truncate max-w-[220px] font-semibold">{perm.user?.userName || 'User'}</span>
                      <span className="px-2 py-0.5 rounded border border-gold-light/10 bg-gold-glass text-[9px] uppercase tracking-wider font-bold text-gold-light">
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
