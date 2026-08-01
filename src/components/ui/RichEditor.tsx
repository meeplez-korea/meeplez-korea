"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useCallback } from "react";
import "react-quill-new/dist/quill.snow.css";
import { supabase } from "@/lib/supabase";
import { generateId } from "@/lib/utils";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false }) as any;

interface RichEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

async function uploadImage(file: File): Promise<string | null> {
  // 이미지 압축
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
      const img = new Image();
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

export default function RichEditor({ value, onChange, placeholder }: RichEditorProps) {
  const quillRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      import("react-quill-new").then((mod) => {
        const Quill = mod.default.Quill || (mod as any).Quill;
        if (Quill) {
          import("quill-resize-image").then((resize) => {
            const ResizeModule = resize.default || resize;
            if (!Quill.imports?.["modules/resize"]) {
              Quill.register("modules/resize", ResizeModule);
            }
          });
        }
      });
    }
  }, []);

  const imageHandler = useCallback(() => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.setAttribute("multiple", "true");
    input.click();

    input.onchange = async () => {
      const files = input.files;
      if (!files) return;

      const editor = quillRef.current?.getEditor();
      if (!editor) return;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const range = editor.getSelection(true);

        // 업로드 중 표시
        editor.insertText(range.index, "이미지 업로드 중...", { color: "#999" });

        const url = await uploadImage(file);

        // 업로드 중 텍스트 제거
        editor.deleteText(range.index, "이미지 업로드 중...".length);

        if (url) {
          editor.insertEmbed(range.index, "image", url);
          editor.setSelection(range.index + 1);
        } else {
          alert("이미지 업로드에 실패했습니다. 다시 시도해주세요.");
        }
      }
    };
  }, []);

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ color: [] }, { background: [] }],
          [{ size: ["small", false, "large", "huge"] }],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ align: [] }],
          ["link", "image"],
          ["clean"],
        ],
        handlers: {
          image: imageHandler,
        },
      },
      resize: {
        locale: {},
      },
      keyboard: {
        bindings: {
          "list autofill": {
            prefix: /^\s*?(1\.|-|\*)$/,
            handler: () => true,
          },
        },
      },
    }),
    [imageHandler]
  );

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "size",
    "list",
    "align",
    "link",
    "image",
    "width",
    "height",
    "style",
  ];

  return (
    <div className="rich-editor">
      <ReactQuill
        ref={quillRef as any}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
    </div>
  );
}
