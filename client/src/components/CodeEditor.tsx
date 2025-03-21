import { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';
import { useResizeObserver } from '../hooks/use-resize-observer';
import { debounce } from '../lib/utils';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  isShared?: boolean;
  fileOwner?: string;
}

export default function CodeEditor({ 
  value, 
  onChange, 
  language = 'python',
  isShared = false,
  fileOwner
}: CodeEditorProps) {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  // Initialize editor on mount
  useEffect(() => {
    if (!editorContainerRef.current) return;
    
    // Configure Monaco editor with dark theme
    monaco.editor.defineTheme('devhub-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955' },
        { token: 'keyword', foreground: '569CD6' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'function', foreground: 'DCDCAA' },
      ],
      colors: {
        'editor.background': '#0d1117',
        'editor.foreground': '#c9d1d9',
        'editorLineNumber.foreground': '#6e7681',
        'editorCursor.foreground': '#c9d1d9',
        'editor.selectionBackground': '#264f78',
        'editor.inactiveSelectionBackground': '#3a3d41',
        'editorIndentGuide.background': '#30363d',
        'editorIndentGuide.activeBackground': '#6e7681',
      },
    });

    // Create editor instance
    editorRef.current = monaco.editor.create(editorContainerRef.current, {
      value,
      language,
      theme: 'devhub-dark',
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      renderLineHighlight: 'all',
      fontFamily: '"Source Code Pro", monospace',
      fontSize: 14,
      tabSize: 4,
      insertSpaces: true,
      wordWrap: 'on',
      lineNumbers: 'on',
      glyphMargin: false,
      folding: true,
      lineDecorationsWidth: 7,
      lineNumbersMinChars: 3,
    });

    // Set up change event handler with debounce
    const debouncedOnChange = debounce((newValue: string) => {
      onChange(newValue);
    }, 1000);

    // Listen for content changes
    editorRef.current.onDidChangeModelContent(() => {
      const newValue = editorRef.current?.getValue() || '';
      debouncedOnChange(newValue);
    });

    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }
    };
  }, []);

  // Update value when prop changes
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.getValue()) {
      editorRef.current.setValue(value);
    }
  }, [value]);

  // Update language when it changes
  useEffect(() => {
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, language);
      }
    }
  }, [language]);

  // Create a resize observer to handle editor layout changes
  useResizeObserver(editorContainerRef, () => {
    if (editorRef.current) {
      editorRef.current.layout();
    }
  });

  return (
    <div className="h-full w-full flex flex-col">
      {isShared && (
        <div className="bg-[#1a237e] text-white text-xs py-1 px-3 flex items-center">
          <span className="inline-block w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></span>
          {fileOwner ? `Collaborating with ${fileOwner}'s file` : 'Collaboration Mode'}
        </div>
      )}
      <div ref={editorContainerRef} className="flex-1" />
    </div>
  );
}