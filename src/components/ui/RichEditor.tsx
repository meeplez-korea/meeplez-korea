"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
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

const TOOLBAR = [
  [{ header: [1, 2, 3, false] }],
  ["bold", "italic", "underline", "strike"],
  [{ color: [] }, { background: [] }],
  [{ size: ["small", false, "large", "huge"] }],
  [{ list: "ordered" }, { list: "bullet" }],
  [{ align: [] }],
  ["link", "image"],
  ["clean"],
];

const FORMATS = [
  "header", "bold", "italic", "underline", "strike",
  "color", "background", "size", "list", "align",
  "link", "image", "width", "height", "style",
];

export default function RichEditor({ value, onChange, placeholder }: RichEditorProps) {
  const quillRef = useRef<any>(null);
  const handlerAttached = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      import("react-quill-new").then((mod) => {
        const Quill = mod.default.Quill || (mod as any).Quill;
        if (Quill) {
          import("quill-image-resize").then((resize) => {
            const ResizeModule = resize.default || resize;
            if (!Quill.imports?.["modules/imageResize"]) {
              Quill.register("modules/imageResize", ResizeModule);
            }
          });
        }
      });
    }
  }, []);

  // 에디터 로드 후 이미지 핸들러 연결
  useEffect(() => {
    const interval = setInterval(() => {
      const editor = quillRef.current?.getEditor?.();
      if (editor && !handlerAttached.current) {
        const toolbar = editor.getModule("toolbar");
        if (toolbar) {
          toolbar.addHandler("image", () => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*";
            input.multiple = true;
            input.click();

            input.onchange = async () => {
              const files = input.files;
              if (!files) return;

              for (let i = 0; i < files.length; i++) {
                const range = editor.getSelection(true);
                const url = await uploadImage(files[i]);

                if (url) {
                  editor.insertEmbed(range.index, "image", url);
                  editor.setSelection(range.index + 1);
                } else {
                  alert("이미지 업로드에 실패했습니다. 다시 시도해주세요.");
                }
              }
            };
          });
          handlerAttached.current = true;
          clearInterval(interval);
        }
      }
    }, 200);

    return () => clearInterval(interval);
  }, []);

  const modules = {
    toolbar: {
      container: TOOLBAR,
    },
    imageResize: {},
    keyboard: {
      bindings: {
        "list autofill": {
          prefix: /^\s*?(1\.|-|\*)$/,
          handler: () => true,
        },
      },
    },
  };

  return (
    <div className="rich-editor">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={FORMATS}
        placeholder={placeholder}
      />
    </div>
  );
}
