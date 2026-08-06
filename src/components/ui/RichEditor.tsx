"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useCallback } from "react";
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
  const resizeRegistered = useRef(false);
  const lastValueRef = useRef(value);
  const isInternalChange = useRef(false);

  // Quill 리사이즈 모듈 + 커스텀 Image 블롯 등록
  useEffect(() => {
    if (typeof window !== "undefined" && !resizeRegistered.current) {
      import("react-quill-new").then((mod) => {
        const Quill = mod.default.Quill || (mod as any).Quill;
        if (Quill) {
          // style 속성을 보존하는 커스텀 Image 블롯
          const BaseImage = Quill.import("formats/image") as any;
          class StyledImage extends (BaseImage as any) {
            static create(value: string) {
              const node = super.create(value);
              return node;
            }
            static formats(node: HTMLElement) {
              const formats: any = {};
              if (node.getAttribute("style")) formats.style = node.getAttribute("style");
              if (node.getAttribute("width")) formats.width = node.getAttribute("width");
              if (node.getAttribute("height")) formats.height = node.getAttribute("height");
              return formats;
            }
            format(name: string, value: any) {
              if (name === "style" || name === "width" || name === "height") {
                if (value) {
                  this.domNode.setAttribute(name, value);
                } else {
                  this.domNode.removeAttribute(name);
                }
              } else {
                super.format(name, value);
              }
            }
          }
          StyledImage.blotName = "image";
          StyledImage.tagName = "IMG";

          try {
            Quill.register(StyledImage, true);
          } catch (e) {}

          import("quill-resize-image").then((resize) => {
            const ResizeModule = resize.default || resize;
            try {
              Quill.register("modules/resize", ResizeModule);
            } catch (e) {}
            resizeRegistered.current = true;
          });
        }
      });
    }
  }, []);

  // 외부에서 value가 변경되었을 때만 에디터에 반영 (편집 모드 로드 등)
  useEffect(() => {
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    if (value !== lastValueRef.current) {
      lastValueRef.current = value;
      const editor = quillRef.current?.getEditor?.();
      if (editor) {
        const selection = editor.getSelection();
        editor.clipboard.dangerouslyPasteHTML(value);
        if (selection) {
          editor.setSelection(selection);
        }
      }
    }
  }, [value]);

  const handleChange = useCallback((content: string) => {
    lastValueRef.current = content;
    isInternalChange.current = true;
    onChange(content);
  }, [onChange]);

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

  const modules = {
    toolbar: {
      container: TOOLBAR,
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
  };

  return (
    <div className="rich-editor">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        defaultValue={value}
        onChange={handleChange}
        modules={modules}
        formats={FORMATS}
        placeholder={placeholder}
      />
    </div>
  );
}
