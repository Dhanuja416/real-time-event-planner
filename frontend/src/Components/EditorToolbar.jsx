import React from 'react';
import { 
  Bold, Italic, Heading1, Heading2, 
  List, ListOrdered, Code, Quote, Undo, Redo,
  Save, Share2
} from 'lucide-react';

const EditorToolbar = ({ editor, onSave, isSaving, onShare, theme }) => {
  if (!editor) return null;

  const btnClasses = (isActive) => `
    p-2 rounded-lg transition-colors duration-150 focus:outline-none
    ${isActive 
      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' 
      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
    }
  `;

  return (
    <div className="flex flex-wrap items-center justify-between p-2 gap-2 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 rounded-t-xl">
      {/* Text formatting group */}
      <div className="flex flex-wrap items-center gap-1">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={btnClasses(editor.isActive('bold'))}
          title="Bold"
          type="button"
        >
          <Bold size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={btnClasses(editor.isActive('italic'))}
          title="Italic"
          type="button"
        >
          <Italic size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={btnClasses(editor.isActive('strike'))}
          title="Strikethrough"
          type="button"
        >
          {/* Lucide Strike is usually represented as Strikethrough or Slash or we can render text */}
          <span className="font-sans line-through font-semibold text-sm px-0.5">S</span>
        </button>

        <div className="h-6 w-px bg-gray-200 dark:bg-gray-800 mx-1" />

        {/* Headings */}
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={btnClasses(editor.isActive('heading', { level: 1 }))}
          title="Heading 1"
          type="button"
        >
          <Heading1 size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={btnClasses(editor.isActive('heading', { level: 2 }))}
          title="Heading 2"
          type="button"
        >
          <Heading2 size={18} />
        </button>

        <div className="h-6 w-px bg-gray-200 dark:bg-gray-800 mx-1" />

        {/* Lists */}
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={btnClasses(editor.isActive('bulletList'))}
          title="Bullet List"
          type="button"
        >
          <List size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={btnClasses(editor.isActive('orderedList'))}
          title="Numbered List"
          type="button"
        >
          <ListOrdered size={18} />
        </button>

        <div className="h-6 w-px bg-gray-200 dark:bg-gray-800 mx-1" />

        {/* Code & Quote */}
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={btnClasses(editor.isActive('codeBlock'))}
          title="Code Block"
          type="button"
        >
          <Code size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={btnClasses(editor.isActive('blockquote'))}
          title="Quote"
          type="button"
        >
          <Quote size={18} />
        </button>

        <div className="h-6 w-px bg-gray-200 dark:bg-gray-800 mx-1" />

        {/* History */}
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-transparent"
          title="Undo"
          type="button"
        >
          <Undo size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-transparent"
          title="Redo"
          type="button"
        >
          <Redo size={18} />
        </button>
      </div>

      {/* Save and Share Actions */}
      <div className="flex items-center gap-2">
        {onShare && (
          <button
            onClick={onShare}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition duration-150"
            type="button"
          >
            <Share2 size={16} />
            <span>Share</span>
          </button>
        )}

        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold shadow-md shadow-blue-500/30 transition duration-150"
          type="button"
        >
          <Save size={16} className={isSaving ? 'animate-pulse' : ''} />
          <span>{isSaving ? 'Saving...' : 'Save'}</span>
        </button>
      </div>
    </div>
  );
};

export default EditorToolbar;
