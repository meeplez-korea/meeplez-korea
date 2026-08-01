"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo } from "react";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

interface RichEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichEditor({ value, onChange, placeholder }: RichEditorProps) {
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
    []
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
