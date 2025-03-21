import { useRef, useEffect, useState } from "react";
import { Terminal as XTerminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TerminalProps {
  pythonOutput: string;
  executing: boolean;
}

export default function Terminal({ pythonOutput, executing }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [terminal, setTerminal] = useState<XTerminal | null>(null);

  // Initialize xterm
  useEffect(() => {
    if (!terminalRef.current) return;

    // Create and configure terminal
    const term = new XTerminal({
      theme: {
        background: "#010409",
        foreground: "#c9d1d9",
        cursor: "#c9d1d9",
        black: "#484f58",
        red: "#ff7b72",
        green: "#56d364",
        yellow: "#e3b341",
        blue: "#58a6ff",
        magenta: "#bc8cff",
        cyan: "#39c5cf",
        white: "#b1bac4",
        brightBlack: "#6e7681",
        brightRed: "#ffa198",
        brightGreen: "#7ee787",
        brightYellow: "#f2cc60",
        brightBlue: "#79c0ff",
        brightMagenta: "#d2a8ff",
        brightCyan: "#56d4dd",
        brightWhite: "#f0f6fc",
      },
      cursorBlink: true,
      fontFamily: "Source Code Pro, monospace",
      fontSize: 14,
      scrollback: 1000,
      convertEol: true,
    });

    // Add fit addon
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    // Open terminal and fit to container
    term.open(terminalRef.current);
    fitAddon.fit();

    // Welcome message
    term.writeln("\x1b[2m# DevHub Terminal\x1b[0m");
    term.writeln("\x1b[2m# Python execution environment ready\x1b[0m");
    term.writeln("");
    term.write("$ ");

    // Handle window resize
    const resizeHandler = () => {
      fitAddon.fit();
    };
    window.addEventListener("resize", resizeHandler);

    // Save reference
    setTerminal(term);

    // Cleanup
    return () => {
      window.removeEventListener("resize", resizeHandler);
      term.dispose();
    };
  }, []);

  // Handle Python output
  useEffect(() => {
    if (!terminal || !pythonOutput) return;

    if (executing) {
      // When execution starts, show command
      terminal.writeln("$ python");
    }

    // Write output with proper line handling
    const lines = pythonOutput.trim().split("\n");
    lines.forEach((line) => {
      terminal.writeln(line);
    });

    // Add new prompt when execution completes
    if (!executing && pythonOutput) {
      terminal.writeln("");
      terminal.write("$ ");
    }
  }, [pythonOutput, executing, terminal]);

  return (
    <div className="h-[30vh] border-t border-[#30363d] bg-[#010409] flex flex-col">
      <Tabs defaultValue="terminal" className="w-full">
        <TabsList className="bg-transparent border-b border-[#30363d] rounded-none h-9">
          <TabsTrigger 
            value="terminal" 
            className="data-[state=active]:bg-[#0d1117] data-[state=active]:text-[#58a6ff] data-[state=active]:border-b-2 data-[state=active]:border-[#58a6ff] rounded-none h-full px-4"
          >
            TERMINAL
          </TabsTrigger>
          <TabsTrigger 
            value="problems" 
            className="data-[state=active]:bg-[#0d1117] data-[state=active]:text-[#58a6ff] data-[state=active]:border-b-2 data-[state=active]:border-[#58a6ff] rounded-none h-full px-4"
          >
            PROBLEMS
          </TabsTrigger>
          <TabsTrigger 
            value="output" 
            className="data-[state=active]:bg-[#0d1117] data-[state=active]:text-[#58a6ff] data-[state=active]:border-b-2 data-[state=active]:border-[#58a6ff] rounded-none h-full px-4"
          >
            OUTPUT
          </TabsTrigger>
        </TabsList>
      </Tabs>
      
      <div ref={terminalRef} className="flex-1"></div>
    </div>
  );
}
