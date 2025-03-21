import { Code, Database, HardDrive } from "lucide-react";

interface StatusBarProps {
  language: string;
  position: { line: number; column: number };
  encoding: string;
  indentation: string;
  saveStatus: 'saved' | 'saving' | 'unsaved';
  connected: boolean;
}

export default function StatusBar({ 
  language = "Python", 
  position = { line: 1, column: 1 }, 
  encoding = "UTF-8", 
  indentation = "Spaces: 4",
  saveStatus = 'saved',
  connected = true
}: StatusBarProps) {
  return (
    <footer className="h-6 bg-[#161b22] border-t border-[#30363d] flex items-center px-3 text-xs text-[#8b949e]">
      <div className="mr-4 flex items-center">
        <Code className="h-3 w-3 mr-1" />
        {language}
      </div>
      <div className="mr-4">
        Line {position.line}, Col {position.column}
      </div>
      <div className="mr-4">{encoding}</div>
      <div className="mr-4">LF</div>
      <div className="mr-4">{indentation}</div>
      <div className="ml-auto flex items-center">
        <span className={`mr-3 flex items-center ${connected ? 'text-[#56d364]' : 'text-[#f85149]'}`}>
          <Database className="h-3 w-3 mr-1" />
          {connected ? 'Connected to Firebase' : 'Disconnected'}
        </span>
        <span className={`
          ${saveStatus === 'saved' ? 'text-[#56d364]' : ''}
          ${saveStatus === 'saving' ? 'text-[#e3b341]' : ''}
          ${saveStatus === 'unsaved' ? 'text-[#f85149]' : ''}
        `}>
          {saveStatus === 'saved' ? 'Saved' : saveStatus === 'saving' ? 'Saving...' : 'Unsaved'}
        </span>
      </div>
    </footer>
  );
}
