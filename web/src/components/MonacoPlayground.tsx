"use client";

import React, { useRef } from "react";
import Editor, { OnMount } from "@monaco-editor/react";

interface MonacoPlaygroundProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  theme?: "vs-dark" | "light" | "vs";
  height?: string | number;
  fontSize?: number;
  readOnly?: boolean;
  showMinimap?: boolean;
  onMount?: OnMount;
}

export default function MonacoPlayground({
  value,
  onChange,
  language,
  theme = "light",
  height = "100%",
  fontSize = 14,
  readOnly = false,
  showMinimap = true,
  onMount: externalOnMount,
}: MonacoPlaygroundProps) {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Custom keybinding for Cmd+Enter / Ctrl+Enter
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      // Trigger execution via command if needed
    });

    if (externalOnMount) {
      externalOnMount(editor, monaco);
    }
  };

  // Map language string to Monaco language string
  const getMonacoLanguage = (lang: string): string => {
    const l = lang.toLowerCase();
    if (l === "c++" || l === "cpp") return "cpp";
    if (l === "js" || l === "javascript") return "javascript";
    if (l === "ts" || l === "typescript") return "typescript";
    if (l === "py" || l === "python") return "python";
    if (l === "java") return "java";
    if (l === "rust") return "rust";
    if (l === "go" || l === "golang") return "go";
    if (l === "sql") return "sql";
    if (l === "html") return "html";
    if (l === "css") return "css";
    if (l === "json") return "json";
    return l;
  };

  // Map theme to Monaco theme: "vs" for light, "vs-dark" for dark
  const getMonacoTheme = (th: string): string => {
    if (th === "vs-dark" || th === "dark") return "vs-dark";
    return "vs";
  };

  const isDark = getMonacoTheme(theme) === "vs-dark";

  return (
    <div
      className={`w-full h-full relative overflow-hidden rounded-b-xl border transition-colors ${
        isDark
          ? "bg-[#1e1e1e] border-zinc-800"
          : "bg-white border-zinc-200"
      }`}
    >
      <Editor
        height={height}
        language={getMonacoLanguage(language)}
        theme={getMonacoTheme(theme)}
        value={value}
        onChange={(val) => onChange(val || "")}
        onMount={handleEditorDidMount}
        options={{
          fontSize,
          minimap: { enabled: showMinimap },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          readOnly,
          lineNumbers: "on",
          renderWhitespace: "selection",
          wordWrap: "on",
          tabSize: 4,
          folding: true,
          cursorBlinking: "smooth",
          smoothScrolling: true,
          padding: { top: 12, bottom: 12 },
          fontFamily:
            "var(--font-geist-mono), 'Fira Code', 'Cascadia Code', Consolas, monospace",
          fontLigatures: true,
          suggest: {
            showKeywords: true,
            showSnippets: true,
          },
        }}
      />
    </div>
  );
}
