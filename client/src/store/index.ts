import { create } from 'zustand';
import { FileData } from '@/lib/firebase';

interface EditorState {
  selectedFile: FileData | null;
  files: FileData[];
  currentPosition: { line: number; column: number };
  saveStatus: 'saved' | 'saving' | 'unsaved';
  running: boolean;
  output: string;
  
  // Actions
  setSelectedFile: (file: FileData | null) => void;
  setFiles: (files: FileData[]) => void;
  setPosition: (position: { line: number; column: number }) => void;
  setSaveStatus: (status: 'saved' | 'saving' | 'unsaved') => void;
  setRunning: (running: boolean) => void;
  setOutput: (output: string) => void;
  appendOutput: (output: string) => void;
  clearOutput: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  selectedFile: null,
  files: [],
  currentPosition: { line: 1, column: 1 },
  saveStatus: 'saved',
  running: false,
  output: '',
  
  // Actions
  setSelectedFile: (file) => set({ selectedFile: file }),
  setFiles: (files) => set({ files }),
  setPosition: (position) => set({ currentPosition: position }),
  setSaveStatus: (status) => set({ saveStatus: status }),
  setRunning: (running) => set({ running }),
  setOutput: (output) => set({ output }),
  appendOutput: (output) => set((state) => ({ output: state.output + output })),
  clearOutput: () => set({ output: '' }),
}));
