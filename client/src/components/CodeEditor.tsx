import { useEffect, useRef, useState } from "react";
import * as monaco from "monaco-editor";
import { saveFileContent } from "@/lib/firebase";
import { getFileLanguage } from "@/lib/utils";

interface CodeEditorProps {
  userId: string;
  file: {
    id: string;
    name: string;
    content: string;
  } | null;
}

export default function CodeEditor({ userId, file }: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize Monaco Editor
  useEffect(() => {
    if (!editorRef.current) return;

    // Configure Monaco theme
    monaco.editor.defineTheme("devhub-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "#8b949e" },
        { token: "keyword", foreground: "#ff7b72" },
        { token: "string", foreground: "#a5d6ff" },
        { token: "identifier", foreground: "#c9d1d9" },
        { token: "type", foreground: "#ffa657" },
        { token: "number", foreground: "#79c0ff" },
      ],
      colors: {
        "editor.background": "#0d1117",
        "editor.foreground": "#c9d1d9",
        "editorLineNumber.foreground": "#6e7681",
        "editorLineNumber.activeForeground": "#c9d1d9",
        "editor.selectionBackground": "#3f4451",
        "editor.inactiveSelectionBackground": "#3a3d41",
        "editorCursor.foreground": "#c9d1d9",
        "editor.lineHighlightBackground": "#161b22",
        "editorIndentGuide.background": "#30363d",
        "editorIndentGuide.activeBackground": "#40464d",
      },
    });

    // Create editor instance
    const newEditor = monaco.editor.create(editorRef.current, {
      value: file?.content || "# Write your code here",
      language: "python",
      theme: "devhub-dark",
      automaticLayout: true,
      fontSize: 14,
      fontFamily: "'Source Code Pro', monospace",
      lineNumbers: "on",
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      renderLineHighlight: "all",
      renderIndentGuides: true,
      tabSize: 4,
      insertSpaces: true,
      wordWrap: "on",
      rulers: [],
    });

    setEditor(newEditor);

    // Cleanup on unmount
    return () => {
      newEditor.dispose();
    };
  }, []);

  // Update editor content when file changes
  useEffect(() => {
    if (editor && file) {
      // Only update if the model value is different
      const currentValue = editor.getValue();
      if (currentValue !== file.content) {
        editor.setValue(file.content);
      }

      // Update language
      const fileLanguage = getFileLanguage(file.name);
      monaco.editor.setModelLanguage(editor.getModel()!, fileLanguage);
    }
  }, [editor, file]);

  // Set up content change handler for auto-save
  useEffect(() => {
    if (!editor || !file) return;

    const changeModelListener = editor.onDidChangeModelContent(() => {
      const content = editor.getValue();
      setIsSaving(true);
      saveFileContent(userId, file.id, content);
      
      // Reset the saving state after a short delay
      setTimeout(() => {
        setIsSaving(false);
      }, 1500);
    });

    return () => {
      changeModelListener.dispose();
    };
  }, [editor, file, userId]);

  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0d1117] text-[#8b949e]">
        <div className="text-center">
          <p className="mb-2">No file selected</p>
          <p className="text-sm">Select a file from the explorer or create a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Tabs */}
      <div className="bg-[#010409] border-b border-[#30363d] flex h-9">
        <div className="flex items-center h-full px-3 border-r border-[#30363d] bg-[#0d1117] text-[#58a6ff]">
          <span className="text-sm whitespace-nowrap">{file.name}</span>
          {isSaving && (
            <div className="ml-2 h-2 w-2 rounded-full bg-[#e3b341]"></div>
          )}
        </div>
      </div>
      
      {/* Editor */}
      <div ref={editorRef} className="flex-1"></div>
    </div>
  );
}
