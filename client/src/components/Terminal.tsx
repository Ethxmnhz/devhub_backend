import { useEffect, useRef } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

interface TerminalProps {
  pythonOutput: string;
  executing: boolean;
}

export default function Terminal({ pythonOutput, executing }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const contentRef = useRef<string>('');

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current) return;

    // Create terminal instance
    xtermRef.current = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: '"Source Code Pro", monospace',
      theme: {
        background: '#0d1117',
        foreground: '#c9d1d9',
        black: '#484f58',
        red: '#ff7b72',
        green: '#7ee787',
        yellow: '#f2cc60',
        blue: '#79c0ff',
        magenta: '#d2a8ff',
        cyan: '#56d4dd',
        white: '#e6edf3',
        brightBlack: '#6e7681',
        brightRed: '#ffa198',
        brightGreen: '#a5d6a7',
        brightYellow: '#f7d58b',
        brightBlue: '#a5d6ff',
        brightMagenta: '#e2c5ff',
        brightCyan: '#b3f0ff',
        brightWhite: '#f8f8f2',
      },
    });

    // Create fit addon to resize terminal
    fitAddonRef.current = new FitAddon();
    xtermRef.current.loadAddon(fitAddonRef.current);

    // Open terminal in container
    xtermRef.current.open(terminalRef.current);
    
    // Initial resize
    if (fitAddonRef.current) {
      setTimeout(() => {
        fitAddonRef.current?.fit();
      }, 0);
    }

    // Initial prompt
    xtermRef.current.writeln('DevHub Terminal - Python Output:');
    xtermRef.current.writeln('');

    // Handle resize
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (xtermRef.current) {
        xtermRef.current.dispose();
      }
    };
  }, []);

  // Process and display output changes
  useEffect(() => {
    if (!xtermRef.current || pythonOutput === contentRef.current) return;

    // Store current content to avoid duplicate updates
    contentRef.current = pythonOutput;
    
    // Clear terminal and rewrite prompt with new content
    xtermRef.current.clear();
    xtermRef.current.writeln('DevHub Terminal - Python Output:');
    xtermRef.current.writeln('');
    
    if (pythonOutput) {
      xtermRef.current.writeln(pythonOutput);
    }
    
    // Add executing indicator if running
    if (executing) {
      xtermRef.current.write('\r\n> Executing code...');
    }
  }, [pythonOutput, executing]);

  // Handle terminal resize on container resize
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    });

    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }

    return () => {
      if (terminalRef.current) {
        resizeObserver.unobserve(terminalRef.current);
      }
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className="h-full w-full flex flex-col bg-[#0d1117] border border-gray-800 rounded-md overflow-hidden">
      <div className="p-2 bg-gray-900 border-b border-gray-800 flex items-center">
        <div className="flex space-x-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <span className="ml-2 text-xs text-gray-400">Output</span>
        {executing && (
          <div className="ml-auto flex items-center">
            <div className="animate-pulse w-2 h-2 bg-green-500 rounded-full mr-1.5"></div>
            <span className="text-xs text-gray-400">Running</span>
          </div>
        )}
      </div>
      <div ref={terminalRef} className="flex-1 overflow-hidden" />
    </div>
  );
}