import { Mark, mergeAttributes } from '@tiptap/core';

export const CommentMark = Mark.create({
  name: 'comment',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      commentId: {
        default: null,
        parseHTML: element => element.getAttribute('data-comment-id'),
        renderHTML: attributes => {
          if (!attributes.commentId) {
            return {};
          }

          return {
            'data-comment-id': attributes.commentId,
            class: 'bg-yellow-200/50 dark:bg-yellow-500/20 border-b-2 border-yellow-500 cursor-pointer transition-all duration-150 hover:bg-yellow-300/60 dark:hover:bg-yellow-500/40',
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-comment-id]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },
});
export default CommentMark;
