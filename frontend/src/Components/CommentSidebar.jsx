import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { MessageSquare, Check, Trash2, Send, X, CornerDownRight, CheckSquare } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7072';
const COMMENTS_API = `${API_BASE}/api/Comments`;

const CommentSidebar = ({ documentId, token, editor, activeCommentId, setActiveCommentId, onClose, theme }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New comment input (new thread)
  const [newCommentText, setNewCommentText] = useState('');
  const [selectionText, setSelectionText] = useState('');
  const [selectionRange, setSelectionRange] = useState(null);

  // Replies inputs (keyed by parent comment ID)
  const [replyTexts, setReplyTexts] = useState({});

  const parseJwt = (token) => {
    try { return JSON.parse(atob(token.split('.')[1])); } catch { return null; }
  };
  const currentUserId = parseJwt(token)?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];

  // --- Fetch Comments ---
  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${COMMENTS_API}/document/${documentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Filter out resolved threads
      const activeThreads = response.data.filter(c => !c.resolvedAt);
      setComments(activeThreads);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('Failed to load comments.');
    } finally {
      setLoading(false);
    }
  }, [documentId, token]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Listen for editor selection changes to support adding comments
  useEffect(() => {
    if (!editor) return;

    const handleSelection = () => {
      const { from, to } = editor.state.selection;
      if (from === to) {
        setSelectionText('');
        setSelectionRange(null);
        return;
      }
      const text = editor.state.doc.textBetween(from, to, ' ');
      setSelectionText(text);
      setSelectionRange({ from, to });
    };

    editor.on('selectionUpdate', handleSelection);
    return () => {
      editor.off('selectionUpdate', handleSelection);
    };
  }, [editor]);

  // Handle SignalR real-time updates for comments
  useEffect(() => {
    // If the parent editor connects to SignalR, it will listen to comment updates.
    // To make sure we update, we can hook into window custom events or let parent pass updates.
    // Alternatively, we can listen for a window custom event we dispatch from DocumentEditor.jsx!
    const handleRemoteComment = () => {
      console.log('SignalR: Comments updated remotely, refreshing list.');
      fetchComments();
    };

    window.addEventListener('comments-updated', handleRemoteComment);
    return () => {
      window.removeEventListener('comments-updated', handleRemoteComment);
    };
  }, [fetchComments]);

  // --- Post New Thread ---
  const handleAddThread = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim() || !selectionRange) return;

    const anchorId = `comment_${Date.now()}`;

    try {
      // 1. Post to API
      await axios.post(COMMENTS_API, {
        documentId: parseInt(documentId),
        content: newCommentText,
        selectionText: selectionText,
        commentAnchorId: anchorId,
        parentCommentId: null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 2. Set TipTap mark
      editor.chain().focus().setMark('comment', { commentId: anchorId }).run();

      setNewCommentText('');
      setSelectionText('');
      setSelectionRange(null);
      fetchComments();
    } catch (err) {
      console.error('Error adding comment:', err);
      alert('Failed to post comment.');
    }
  };

  // --- Post Reply ---
  const handleAddReply = async (parentId) => {
    const replyText = replyTexts[parentId];
    if (!replyText || !replyText.trim()) return;

    const parentComment = comments.find(c => c.id == parentId);
    if (!parentComment) return;

    try {
      await axios.post(COMMENTS_API, {
        documentId: parseInt(documentId),
        content: replyText,
        selectionText: '',
        commentAnchorId: parentComment.commentAnchorId,
        parentCommentId: parentId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setReplyTexts(prev => ({ ...prev, [parentId]: '' }));
      fetchComments();
    } catch (err) {
      console.error('Error posting reply:', err);
      alert('Failed to post reply.');
    }
  };

  // --- Resolve Thread ---
  const handleResolve = async (commentId, anchorId) => {
    try {
      await axios.put(`${COMMENTS_API}/${commentId}/resolve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Remove mark from Tiptap editor
      if (editor) {
        // Tiptap way to remove a specific mark:
        // We find the positions where this mark is and unset it.
        // Or we can just use custom Yjs/ProseMirror transactions.
        // For local styling update, we can simply unset mark or let collab sync.
        // Removing the mark locally is easy:
        // Since we resolved it, we can keep the mark in the text but styled differently,
        // or just select and unset. Unsetting is optional since Yjs will sync text.
      }

      fetchComments();
      if (activeCommentId === anchorId) {
        setActiveCommentId(null);
      }
    } catch (err) {
      console.error('Error resolving comment:', err);
    }
  };

  // --- Delete Comment ---
  const handleDelete = async (commentId) => {
    if (!window.confirm("Delete this comment permanently?")) return;

    try {
      await axios.delete(`${COMMENTS_API}/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchComments();
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  // --- Helper: Initials ---
  const getInitials = (userName) => {
    if (!userName) return 'U';
    return userName.substring(0, 2).toUpperCase();
  };

  const cardBg = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const headingColor = theme === 'dark' ? 'text-gray-100' : 'text-gray-800';
  const inputBg = theme === 'dark' ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-gray-50 text-gray-800 border-gray-300';

  return (
    <div className={`w-80 md:w-96 flex flex-col h-full border-l ${cardBg} shadow-2xl transition-all duration-300`}>
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
          <MessageSquare size={18} />
          <h2 className={`font-bold text-sm uppercase tracking-wider ${headingColor}`}>Comments</h2>
        </div>
        <button 
          onClick={onClose}
          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
        >
          <X size={16} />
        </button>
      </div>

      {/* Main Comment Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error ? (
          <p className="text-red-500 text-center text-xs py-10">{error}</p>
        ) : loading && comments.length === 0 ? (
          <p className="text-gray-500 text-center text-xs py-10">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-gray-500 text-center text-xs py-10">No active comments on this document.</p>
        ) : (
          comments.map((thread) => {
            const isActive = activeCommentId === thread.commentAnchorId;
            return (
              <div 
                key={thread.id} 
                className={`p-3.5 rounded-xl border transition-all duration-200 ${
                  isActive 
                    ? 'border-yellow-500 bg-yellow-50/30 dark:bg-yellow-500/5 ring-1 ring-yellow-400 shadow-md' 
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/40 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => setActiveCommentId(thread.commentAnchorId)}
              >
                {/* Text selection snippet */}
                {thread.selectionText && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 border-l-2 border-yellow-500 pl-2 py-0.5 italic mb-2 truncate">
                    "{thread.selectionText}"
                  </div>
                )}

                {/* Root Comment Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                      {getInitials(thread.user?.userName)}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[120px]">
                        {thread.user?.userName?.split('@')[0] || 'User'}
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">
                        {new Date(thread.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Actions (Resolve / Delete) */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleResolve(thread.id, thread.commentAnchorId)}
                      className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20 rounded transition"
                      title="Resolve Thread"
                    >
                      <Check size={14} />
                    </button>
                    {(thread.userId === currentUserId) && (
                      <button
                        onClick={() => handleDelete(thread.id)}
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded transition"
                        title="Delete Comment"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Comment Text */}
                <p className="text-xs text-gray-700 dark:text-gray-300 mt-2 whitespace-pre-wrap">
                  {thread.content}
                </p>

                {/* Threaded Replies */}
                {thread.replies && thread.replies.length > 0 && (
                  <div className="mt-3 space-y-2.5 pl-3 border-l border-gray-100 dark:border-gray-800">
                    {thread.replies.map((reply) => (
                      <div key={reply.id} className="text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1.5">
                            <CornerDownRight size={10} className="text-gray-400" />
                            <div className="w-5 h-5 rounded-full bg-gray-500 text-white flex items-center justify-center text-[8px] font-bold">
                              {getInitials(reply.user?.userName)}
                            </div>
                            <span className="font-semibold text-gray-800 dark:text-gray-300 text-[10px]">
                              {reply.user?.userName?.split('@')[0] || 'User'}
                            </span>
                          </div>
                          {reply.userId === currentUserId && (
                            <button
                              onClick={() => handleDelete(reply.id)}
                              className="text-gray-400 hover:text-red-500 p-0.5"
                            >
                              <Trash2 size={10} />
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-600 dark:text-gray-400 pl-6 mt-0.5 whitespace-pre-wrap">
                          {reply.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Form */}
                <div className="flex items-center space-x-2 mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-800/80">
                  <input
                    type="text"
                    placeholder="Reply..."
                    value={replyTexts[thread.id] || ''}
                    onChange={(e) => setReplyTexts(prev => ({ ...prev, [thread.id]: e.target.value }))}
                    className={`flex-1 p-1.5 text-xs rounded border focus:outline-none focus:ring-1 focus:ring-blue-500 ${inputBg}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddReply(thread.id);
                    }}
                  />
                  <button
                    onClick={() => handleAddReply(thread.id)}
                    className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  >
                    <Send size={10} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add New Comment Box (Anchored at the bottom) */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
        {selectionRange ? (
          <form onSubmit={handleAddThread} className="space-y-2">
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate font-medium">
              Comment on: <span className="italic">"{selectionText}"</span>
            </div>
            <textarea
              placeholder="Write a comment..."
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              required
              rows={2}
              className={`w-full p-2 text-xs rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${inputBg}`}
            />
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-500/20 transition"
            >
              <MessageSquare size={12} />
              <span>Add Comment</span>
            </button>
          </form>
        ) : (
          <div className="text-center text-xs text-gray-400 py-2">
            Highlight text in the editor to insert a comment.
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSidebar;
