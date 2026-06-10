import React from 'react';
import { 
  Bold, Italic, Heading1, Heading2, 
  List, ListOrdered, Code, Quote, Undo, Redo,
  Save, Share2
} from 'lucide-react';

const EditorToolbar = ({ editor, onSave, isSaving, onShare }) => {
  if (!editor) return null;

  const btnClasses = (isActive) => `
    p-2 rounded-lg transition-all duration-150 focus:outline-none border border-transparent
    ${isActive 
      ? 'bg-gold-glass text-gold-light border-gold-light/20' 
      : 'text-sand-light hover:text-gold-light hover:bg-gold-glass/5'
    }
  `;

  return (
    <div className="flex flex-wrap items-center justify-between p-3 gap-3 border-b border-gold-light/10 bg-cocoa-glass backdrop-blur-md rounded-t-xl">
      {/* Text formatting group */}
      <div className="flex flex-wrap items-center gap-1">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={btnClasses(editor.isActive('bold'))}
          title="Bold"
          type="button"
        >
          <Bold size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={btnClasses(editor.isActive('italic'))}
          title="Italic"
          type="button"
        >
          <Italic size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={btnClasses(editor.isActive('strike'))}
          title="Strikethrough"
          type="button"
        >
          <span className="font-sans line-through font-bold text-xs px-0.5">S</span>
        </button>

        <div className="h-5 w-px bg-gold-light/10 mx-1.5" />

        {/* Headings */}
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={btnClasses(editor.isActive('heading', { level: 1 }))}
          title="Heading 1"
          type="button"
        >
          <Heading1 size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={btnClasses(editor.isActive('heading', { level: 2 }))}
          title="Heading 2"
          type="button"
        >
          <Heading2 size={16} />
        </button>

        <div className="h-5 w-px bg-gold-light/10 mx-1.5" />

        {/* Lists */}
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={btnClasses(editor.isActive('bulletList'))}
          title="Bullet List"
          type="button"
        >
          <List size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={btnClasses(editor.isActive('orderedList'))}
          title="Numbered List"
          type="button"
        >
          <ListOrdered size={16} />
        </button>

        <div className="h-5 w-px bg-gold-light/10 mx-1.5" />

        {/* Code & Quote */}
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={btnClasses(editor.isActive('codeBlock'))}
          title="Code Block"
          type="button"
        >
          <Code size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={btnClasses(editor.isActive('blockquote'))}
          title="Quote"
          type="button"
        >
          <Quote size={16} />
        </button>

        <div className="h-5 w-px bg-gold-light/10 mx-1.5" />

        {/* History */}
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-2 rounded-lg text-sand-light hover:text-gold-light hover:bg-gold-glass/5 disabled:opacity-25 transition"
          title="Undo"
          type="button"
        >
          <Undo size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-2 rounded-lg text-sand-light hover:text-gold-light hover:bg-gold-glass/5 disabled:opacity-25 transition"
          title="Redo"
          type="button"
        >
          <Redo size={16} />
        </button>
      </div>

      {/* Save and Share Actions */}
      <div className="flex items-center gap-3">
        {onShare && (
          <button
            onClick={onShare}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gold-light/20 text-xs font-serif uppercase tracking-widest text-gold-light hover:bg-gold-glass/10 transition-all duration-300 shadow-sm"
            type="button"
          >
            <Share2 size={12} />
            <span>Share</span>
          </button>
        )}

        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4.5 py-2 rounded-xl bg-luxury-gold-button font-serif tracking-widest text-xs uppercase transition-all duration-300 disabled:opacity-50"
          type="button"
        >
          <Save size={12} className={isSaving ? 'animate-pulse' : ''} />
          <span>{isSaving ? 'Saving...' : 'Save'}</span>
        </button>
      </div>
    </div>
  );
};

export default EditorToolbar;
