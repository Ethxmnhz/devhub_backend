import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { FileData, getCurrentUser } from "@/lib/firebase";
import { useEditorStore } from "@/store/index";
import { executePythonCode } from "@/lib/pythonService";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import FileExplorer from "@/components/FileExplorer";
import CodeEditor from "@/components/CodeEditor";
import Terminal from "@/components/Terminal";
import StatusBar from "@/components/StatusBar";
import Navbar from "@/components/Navbar";
import NewFileModal from "@/components/NewFileModal";

export default function IDE() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState(getCurrentUser());
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const { 
    selectedFile, setSelectedFile,
    saveStatus, setSaveStatus,
    running, setRunning,
    output, setOutput, clearOutput,
  } = useEditorStore();
  
  // Set up auth check
  useEffect(() => {
    if (!user) {
      setLocation("/login");
    }
  }, [user, setLocation]);

  // Handle file selection
  const handleFileSelect = (file: FileData) => {
    if (file.type === 'file') {
      setSelectedFile(file);
    }
  };

  // Handle running Python code
  const handleRunCode = async () => {
    if (!selectedFile || running) return;
    
    setRunning(true);
    clearOutput();
    
    try {
      const result = await executePythonCode(selectedFile.content);
      
      if (result.success) {
        setOutput(result.output);
      } else {
        setOutput(result.error || 'An unknown error occurred.');
      }
    } catch (error) {
      console.error('Error executing code:', error);
      setOutput('Error: Failed to execute code. Please try again.');
    } finally {
      setRunning(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-[#0d1117] text-[#c9d1d9]">
      <Navbar 
        user={user} 
        onRunCode={handleRunCode}
        isRunning={running}
      />
      
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="bg-[#010409]">
          <FileExplorer 
            userId={user.uid}
            onFileSelect={handleFileSelect}
            onCreateFileClick={() => setShowNewFileModal(true)}
            selectedFileId={selectedFile?.id || null}
          />
        </ResizablePanel>
        
        <ResizableHandle className="w-[1px] bg-[#30363d]" />
        
        <ResizablePanel defaultSize={80} className="flex flex-col">
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={70} className="flex flex-col">
              <CodeEditor 
                userId={user.uid}
                file={selectedFile}
              />
            </ResizablePanel>
            
            <ResizableHandle className="h-[1px] bg-[#30363d]" />
            
            <ResizablePanel defaultSize={30}>
              <Terminal 
                pythonOutput={output}
                executing={running}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
      
      <StatusBar 
        language={selectedFile?.name.split('.').pop()?.toUpperCase() || "Python"}
        position={{ line: 1, column: 1 }}
        encoding="UTF-8"
        indentation="Spaces: 4"
        saveStatus={saveStatus}
        connected={true}
      />
      
      <NewFileModal 
        userId={user.uid}
        isOpen={showNewFileModal}
        onClose={() => setShowNewFileModal(false)}
      />
    </div>
  );
}
