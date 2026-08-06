"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { generateId } from "@/lib/utils";

interface RichEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

async function uploadImage(file: File): Promise<string | null> {
  const compressed = await compressFile(file);
  const fileName = `${Date.now()}-${generateId()}.jpg`;
  const filePath = `uploads/${fileName}`;

  const { error } = await supabase.storage
    .from("post-images")
    .upload(filePath, compressed, { contentType: "image/jpeg" });

  if (error) {
    console.error("Upload error:", error);
    return null;
  }

  const { data } = supabase.storage.from("post-images").getPublicUrl(filePath);
  return data.publicUrl;
}

async function compressFile(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxWidth = 1200;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => resolve(blob!),
          "image/jpeg",
          0.75
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function ToolbarButton({
  onClick,
  active,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded text-sm transition-colors ${
        active
          ? "bg-primary/15 text-primary"
          : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-hover"
      }`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: any }) {
  if (!editor) return null;

  const addImage = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.click();

    input.onchange = async () => {
      const files = input.files;
      if (!files) return;

      for (let i = 0; i < files.length; i++) {
        const url = await uploadImage(files[i]);
        if (url) {
          editor.chain().focus().setImage({ src: url }).run();
        } else {
          alert("이미지 업로드에 실패했습니다. 다시 시도해주세요.");
        }
      }
    };
  }, [editor]);

  const addLink = useCallback(() => {
    const url = window.prompt("URL을 입력하세요");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  return (
    <div className="flex flex-wrap gap-0.5 p-2 border-b border-gray-200 dark:border-dark-border bg-[#f8f8f6] dark:bg-[#28282E] rounded-t-xl">
      {/* Headers */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="제목 1">
        <span className="font-bold text-xs">H1</span>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="제목 2">
        <span className="font-bold text-xs">H2</span>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="제목 3">
        <span className="font-bold text-xs">H3</span>
      </ToolbarButton>

      <div className="w-px h-6 bg-gray-200 dark:bg-dark-border mx-1 self-center" />

      {/* Text formatting */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="굵게">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="기울임">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="밑줄">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="취소선">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M10 19h4v-3h-4v3zM5 4v3h5v3h4V7h5V4H5zM3 14h18v-2H3v2z"/></svg>
      </ToolbarButton>

      <div className="w-px h-6 bg-gray-200 dark:bg-dark-border mx-1 self-center" />

      {/* Lists */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="목록">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="번호 목록">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"/></svg>
      </ToolbarButton>

      {/* Alignment */}
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="왼쪽 정렬">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z"/></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="가운데 정렬">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z"/></svg>
      </ToolbarButton>

      <div className="w-px h-6 bg-gray-200 dark:bg-dark-border mx-1 self-center" />

      {/* Link & Image */}
      <ToolbarButton onClick={addLink} active={editor.isActive("link")} title="링크">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>
      </ToolbarButton>
      <ToolbarButton onClick={addImage} title="이미지">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
      </ToolbarButton>
    </div>
  );
}

export default function RichEditor({ value, onChange, placeholder }: RichEditorProps) {
  const initialValue = useRef(value);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Image.configure({
        HTMLAttributes: { class: "max-w-full rounded-lg my-2" },
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-tag-board underline cursor-pointer" },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Placeholder.configure({
        placeholder: placeholder || "내용을 입력하세요",
      }),
    ],
    content: initialValue.current || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[300px] px-4 py-3 text-sm",
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer?.files?.length) {
          const files = event.dataTransfer.files;
          Array.from(files).forEach(async (file) => {
            if (file.type.startsWith("image/")) {
              const url = await uploadImage(file);
              if (url) {
                const { schema } = view.state;
                const image = schema.nodes.image.create({ src: url });
                const transaction = view.state.tr.replaceSelectionWith(image);
                view.dispatch(transaction);
              }
            }
          });
          return true;
        }
        return false;
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;

        for (let i = 0; i < items.length; i++) {
          if (items[i].type.startsWith("image/")) {
            event.preventDefault();
            const file = items[i].getAsFile();
            if (file) {
              uploadImage(file).then((url) => {
                if (url) {
                  const { schema } = view.state;
                  const image = schema.nodes.image.create({ src: url });
                  const transaction = view.state.tr.replaceSelectionWith(image);
                  view.dispatch(transaction);
                }
              });
            }
            return true;
          }
        }
        return false;
      },
    },
  });

  // 외부에서 value가 변경되었을 때 반영 (편집 모드 로드)
  useEffect(() => {
    if (editor && value !== initialValue.current && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
      initialValue.current = value;
    }
  }, [value, editor]);

  return (
    <div className="rich-editor border border-gray-200 dark:border-dark-border rounded-xl overflow-hidden bg-white dark:bg-dark-card">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
