import React, { useState } from 'react';
import axios from 'axios';
import { Plus } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7072';
const API_URL = `${API_BASE}/api/Documents`;

const createApiClient = (token) => {
  return axios.create({
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

const DocumentForm = ({ onDocumentCreated }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Get the token from localStorage for this component's request
  const token = localStorage.getItem('jwtToken');
  const apiClient = createApiClient(token);

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setLoading(true);
    setError(null);

    const newDocument = {
      title,
      content,
    };

    try {
      await apiClient.post(API_URL, newDocument);
      
      setTitle('');
      setContent('');
      onDocumentCreated(); 
    } catch (err) {
      console.error('Error creating document:', err);
      setError('Failed to create document. Authentication or API error.');
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full p-3.5 rounded-xl glass-input placeholder-sand-light/40 text-sm tracking-wide";
  const labelClasses = "block text-xs uppercase tracking-widest font-semibold text-gold-light/85 mb-1.5 ml-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      <div className="border-b border-gold-light/10 pb-3">
        <h3 className="text-xl font-serif font-bold text-luxury-gradient">Create Collaborative Canvas</h3>
        <p className="text-[10px] text-sand-light/60 uppercase tracking-widest mt-1">Initiate a new document workspace</p>
      </div>
      
      {error && (
        <div className="p-4 rounded-xl text-xs font-semibold tracking-wide border leading-relaxed bg-red-950/20 border-red-500/30 text-red-400">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
        <div className="md:col-span-5">
          <label className={labelClasses}>Document Title</label>
          <input
            type="text"
            placeholder="e.g. Q3 Strategic Project Blueprint"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={loading}
            className={inputClasses}
          />
        </div>
        
        <div className="md:col-span-5">
          <label className={labelClasses}>Initial Content</label>
          <input
            type="text"
            placeholder="Brief introduction or outline notes..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={loading}
            className={inputClasses}
          />
        </div>
        
        <div className="md:col-span-2">
          <button 
            type="submit" 
            disabled={!title || loading}
            className="w-full h-[47px] flex items-center justify-center gap-2 rounded-xl bg-luxury-gold-button font-serif tracking-widest text-xs uppercase transition-all duration-300 disabled:opacity-50"
          >
            <span>{loading ? 'Adding...' : 'Create'}</span>
            {!loading && <Plus size={14} />}
          </button>
        </div>
      </div>
    </form>
  );
};

export default DocumentForm;