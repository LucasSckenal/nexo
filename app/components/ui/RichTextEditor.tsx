"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Code,
  Quote,
  Heading1,
  Heading2,
} from "lucide-react";
import { useEffect } from "react";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  const btnClass = (isActive: boolean) =>
    `p-1.5 rounded-lg transition-colors ${
      isActive
        ? "bg-indigo-500/20 text-indigo-400"
        : "text-textMuted hover:bg-bgSurfaceActive hover:text-textPrimary"
    }`;

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-borderSubtle bg-bgGlass">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={btnClass(editor.isActive("heading", { level: 1 }))}
        title="Título 1"
      >
        <Heading1 size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={btnClass(editor.isActive("heading", { level: 2 }))}
        title="Título 2"
      >
        <Heading2 size={16} />
      </button>

      <div className="w-px h-4 bg-borderSubtle mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={btnClass(editor.isActive("bold"))}
        title="Negrito"
      >
        <Bold size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={btnClass(editor.isActive("italic"))}
        title="Itálico"
      >
        <Italic size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={btnClass(editor.isActive("strike"))}
        title="Rasurado"
      >
        <Strikethrough size={16} />
      </button>

      <div className="w-px h-4 bg-borderSubtle mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={btnClass(editor.isActive("bulletList"))}
        title="Lista com marcas"
      >
        <List size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={btnClass(editor.isActive("orderedList"))}
        title="Lista numerada"
      >
        <ListOrdered size={16} />
      </button>

      <div className="w-px h-4 bg-borderSubtle mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={btnClass(editor.isActive("codeBlock"))}
        title="Bloco de código"
      >
        <Code size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={btnClass(editor.isActive("blockquote"))}
        title="Citação"
      >
        <Quote size={16} />
      </button>
    </div>
  );
};

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Escreve aqui...",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    content: content,
    immediatelyRender: false, // Resolve o erro de Hydration (SSR)
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        // Resolve o problema de margens gigantes
        class:
          "prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[150px] p-4 text-textSecondary prose-p:m-0 prose-headings:m-0 prose-ul:m-0",
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    // w-full adicionado aqui para evitar que o modal estique
    <div className="w-full flex flex-col border border-borderSubtle bg-bgSurface rounded-2xl overflow-hidden focus-within:border-indigo-500/50 transition-colors">
      <MenuBar editor={editor} />
      <EditorContent
        editor={editor}
        className="custom-scrollbar overflow-y-auto max-h-[400px]"
      />
    </div>
  );
}
