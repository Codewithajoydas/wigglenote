import Highlight from "@tiptap/extension-highlight";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import { useEditor } from "@tiptap/react";
import { DOMParser as ProseMirrorDOMParser } from "@tiptap/pm/model";
import StarterKit from "@tiptap/starter-kit";
import { markdownToHtml } from "../utils/Markdowntohtml";

/**
 * Heuristically decides whether a block of pasted plain text is markdown
 * source (as opposed to, say, a sentence that happens to contain a "-" or
 * an asterisk). Each pattern is weighted; a couple of low-signal matches
 * alone (e.g. a single "*emphasis*") won't trigger conversion, but any
 * strong structural marker (heading, table, task list, fenced code) will.
 */
function looksLikeMarkdown(text) {
  if (!text || !text.trim()) return false;

  const strongPatterns = [
    /^#{1,6}\s+.+/m, // headings
    /^\s*[-*+]\s+\[[ xX]\]\s+.+/m, // task list items
    /^```/m, // fenced code block
    // eslint-disable-next-line no-constant-binary-expression
    /^\s*\|.+\|\s*$/m && /^\s*\|[-:\s|]+\|\s*$/m, // markdown table
    /^>\s+.+/m, // blockquote
  ];

  const weakPatterns = [
    /^\s*[-*+]\s+.+/m, // bullet list
    /^\s*\d+\.\s+.+/m, // ordered list
    /\*\*[^*\n]+\*\*/, // bold
    /^-{3,}\s*$/m, // horizontal rule
  ];

  const strongHits = strongPatterns
    .filter(Boolean)
    .filter((p) => p.test(text)).length;
  if (strongHits > 0) return true;

  const weakHits = weakPatterns.filter((p) => p.test(text)).length;
  return weakHits >= 2;
}

export default function useTiptapEditor({ spellcheck = true } = {}) {
  const editor = useEditor({
    immediatelyRender: false,
    editorProps: {
      attributes: {
        spellcheck,
      },

      // Runs before Tiptap's default paste handling. Returning true tells
      // ProseMirror "handled, do nothing else"; returning false/undefined
      // falls through to the normal paste behavior.
      handlePaste: (view, event) => {
        const text = event.clipboardData?.getData("text/plain") || "";
        const html = event.clipboardData?.getData("text/html") || "";

        // If the clipboard already carries rich HTML (e.g. copied from a
        // browser or another rich editor), let Tiptap's default handling
        // take it — only plain-text markdown source needs conversion.
        if (html.trim()) return false;
        if (!looksLikeMarkdown(text)) return false;

        event.preventDefault();

        const parsedHtml = markdownToHtml(text);
        const dom = new window.DOMParser().parseFromString(
          parsedHtml,
          "text/html",
        );
        const slice = ProseMirrorDOMParser.fromSchema(
          view.state.schema,
        ).parseSlice(dom.body, { preserveWhitespace: true });

        view.dispatch(view.state.tr.replaceSelection(slice));
        return true;
      },
    },
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Image.configure({ inline: false }),
      Underline,
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
      HorizontalRule,
      TaskList,
      TaskItem.configure({ nested: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,

      Placeholder.configure({
        placeholder: ({ node }) =>
          node.type.name === "heading"
            ? "Untitled Note"
            : "Start writing your thoughts…",
      }),
    ],
    content: ``,
  });

  return editor;
}
