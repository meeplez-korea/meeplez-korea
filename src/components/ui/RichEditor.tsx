"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
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
  const [selectedImg, setSelectedImg] = useState<HTMLImageElement | null>(null);
  const [imgMenuPos, setImgMenuPos] = useState<{ top: number; left: number } | null>(null);

  // 이미지 업로드 핸들러
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

  // 이미지 클릭 감지
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const editorEl = document.querySelector(".rich-editor .ql-editor");
      if (!editorEl) return;

      if (target.tagName === "IMG" && editorEl.contains(target)) {
        const img = target as HTMLImageElement;
        setSelectedImg(img);
        const rect = img.getBoundingClientRect();
        const editorRect = editorEl.getBoundingClientRect();
        setImgMenuPos({
          top: rect.top - editorRect.top + editorEl.scrollTop,
          left: rect.left - editorRect.left,
        });
        img.style.outline = "2px solid #7CB8A0";
      } else {
        if (selectedImg) {
          selectedImg.style.outline = "";
        }
        setSelectedImg(null);
        setImgMenuPos(null);
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [selectedImg]);

  const resizeImage = (widthPercent: number) => {
    if (!selectedImg) return;
    selectedImg.style.width = `${widthPercent}%`;
    selectedImg.style.height = "auto";
    // 에디터 내용 변경 반영
    const editor = quillRef.current?.getEditor?.();
    if (editor) {
      const html = editor.root.innerHTML;
      onChange(html);
    }
  };

  const setAspectRatio = (ratio: string) => {
    if (!selectedImg) return;
    const width = selectedImg.clientWidth;
    let height: number;
    switch (ratio) {
      case "1:1": height = width; break;
      case "4:3": height = width * 3 / 4; break;
      case "16:9": height = width * 9 / 16; break;
      default: selectedImg.style.height = "auto"; return;
    }
    selectedImg.style.height = `${height}px`;
    selectedImg.style.objectFit = "cover";
    const editor = quillRef.current?.getEditor?.();
    if (editor) onChange(editor.root.innerHTML);
  };

  const deleteImage = () => {
    if (!selectedImg) return;
    selectedImg.remove();
    setSelectedImg(null);
    setImgMenuPos(null);
    const editor = quillRef.current?.getEditor?.();
    if (editor) onChange(editor.root.innerHTML);
  };

  const modules = {
    toolbar: {
      container: TOOLBAR,
    },
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
    <div className="rich-editor relative">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={FORMATS}
        placeholder={placeholder}
      />

      {/* 이미지 편집 메뉴 */}
      {selectedImg && imgMenuPos && (
        <div
          className="absolute z-10 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg shadow-lg p-2 flex flex-wrap gap-1"
          style={{ top: imgMenuPos.top + 40, left: imgMenuPos.left }}
        >
          <span className="text-[10px] text-gray-400 w-full mb-0.5">크기</span>
          <button onClick={() => resizeImage(25)} className="px-2 py-1 text-[11px] bg-gray-100 dark:bg-dark-border rounded hover:bg-primary/20">25%</button>
          <button onClick={() => resizeImage(50)} className="px-2 py-1 text-[11px] bg-gray-100 dark:bg-dark-border rounded hover:bg-primary/20">50%</button>
          <button onClick={() => resizeImage(75)} className="px-2 py-1 text-[11px] bg-gray-100 dark:bg-dark-border rounded hover:bg-primary/20">75%</button>
          <button onClick={() => resizeImage(100)} className="px-2 py-1 text-[11px] bg-gray-100 dark:bg-dark-border rounded hover:bg-primary/20">100%</button>

          <span className="text-[10px] text-gray-400 w-full mt-1 mb-0.5">비율</span>
          <button onClick={() => setAspectRatio("원본")} className="px-2 py-1 text-[11px] bg-gray-100 dark:bg-dark-border rounded hover:bg-primary/20">원본</button>
          <button onClick={() => setAspectRatio("1:1")} className="px-2 py-1 text-[11px] bg-gray-100 dark:bg-dark-border rounded hover:bg-primary/20">1:1</button>
          <button onClick={() => setAspectRatio("4:3")} className="px-2 py-1 text-[11px] bg-gray-100 dark:bg-dark-border rounded hover:bg-primary/20">4:3</button>
          <button onClick={() => setAspectRatio("16:9")} className="px-2 py-1 text-[11px] bg-gray-100 dark:bg-dark-border rounded hover:bg-primary/20">16:9</button>

          <button onClick={deleteImage} className="w-full mt-1 px-2 py-1 text-[11px] text-danger bg-danger/10 rounded hover:bg-danger/20">삭제</button>
        </div>
      )}
    </div>
  );
}
