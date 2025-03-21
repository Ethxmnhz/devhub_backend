import { useEffect, useState, useRef } from "react";
import { auth, database } from "../main";
import { ref as dbRef, onValue, set, push } from "firebase/database";
import { Button } from "@/components/ui/button";
import { User } from "firebase/auth";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import CodeEditor from "@/components/CodeEditor";
import FileExplorer from "@/components/FileExplorer";
import Terminal from "@/components/Terminal";
import { useToast } from "@/hooks/use-toast";
import { Play, Loader2, Save, Plus, Folder, FileText } from "lucide-react";
import { executePythonCode } from "@/lib/pythonService";

// Define file data structure
export interface FileData {
  id: string;
  name: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export default function IDE() {
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [files, setFiles] = useState<FileData[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Fetch user's files on component mount
  useEffect(() => {
    if (!currentUser) return;

    const filesRef = dbRef(database, `users/${currentUser.uid}/files`);
    const unsubscribe = onValue(filesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const fileList = Object.entries(data).map(([id, file]) => ({
          id,
          ...file as Omit<FileData, 'id'>
        }));
        setFiles(fileList);
        
        // Select the first file if none is selected
        if (!selectedFile && fileList.length > 0) {
          setSelectedFile(fileList[0]);
        }
      } else {
        // Create a default file if user has no files
        createNewFile('main.py', 'print("Hello, DevHub!")');
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleSignOut = () => {
    auth.signOut();
  };

  const createNewFile = async (name: string, content = '') => {
    if (!currentUser) return;
    
    const newFile: Omit<FileData, 'id'> = {
      name,
      content,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    const filesRef = dbRef(database, `users/${currentUser.uid}/files`);
    const newFileRef = push(filesRef);
    await set(newFileRef, newFile);
    
    toast({
      title: "File Created",
      description: `${name} has been created successfully.`
    });
  };

  const handleFileContentChange = (content: string) => {
    if (!selectedFile) return;
    
    // Update local state
    setSelectedFile({
      ...selectedFile,
      content,
      updatedAt: Date.now()
    });
  };

  const saveFile = async () => {
    if (!selectedFile || !currentUser) return;
    
    setIsSaving(true);
    
    try {
      const fileRef = dbRef(database, `users/${currentUser.uid}/files/${selectedFile.id}`);
      await set(fileRef, {
        name: selectedFile.name,
        content: selectedFile.content,
        createdAt: selectedFile.createdAt,
        updatedAt: Date.now()
      });
      
      toast({
        title: "File Saved",
        description: `${selectedFile.name} has been saved successfully.`
      });
    } catch (error) {
      console.error("Error saving file:", error);
      toast({
        title: "Error",
        description: "Failed to save the file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateFile = () => {
    if (!newFileName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a file name.",
        variant: "destructive"
      });
      return;
    }
    
    // Add .py extension if not provided
    const fileName = newFileName.endsWith('.py') ? newFileName : `${newFileName}.py`;
    createNewFile(fileName);
    setNewFileName("");
    setIsCreatingFile(false);
  };

  const runCode = async () => {
    if (!selectedFile || isRunning) return;
    
    setIsRunning(true);
    setOutput("");
    
    try {
      const result = await executePythonCode(selectedFile.content);
      setOutput(result.output || result.error || "Code executed with no output.");
    } catch (error) {
      console.error("Error executing code:", error);
      setOutput("Error: Failed to execute code.");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#0d1117] text-[#c9d1d9] overflow-hidden">
      {/* Header */}
      <header className="flex justify-between items-center p-3 border-b border-[#30363d] bg-[#161b22]">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-[#58a6ff] mr-4">DevHub IDE</h1>
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              onClick={saveFile}
              disabled={isSaving || !selectedFile}
              className="bg-[#238636] hover:bg-[#2ea043] text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </>
              )}
            </Button>
            <Button 
              size="sm"
              onClick={runCode}
              disabled={isRunning || !selectedFile} 
              className="bg-[#1f6feb] hover:bg-[#388bfd] text-white"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run
                </>
              )}
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[#c9d1d9] hidden md:inline">
            {currentUser?.email || currentUser?.displayName}
          </span>
          <Button 
            onClick={handleSignOut}
            variant="outline" 
            size="sm"
            className="border-[#30363d] hover:bg-[#30363d] text-[#c9d1d9]"
          >
            Sign Out
          </Button>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* File Explorer */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="bg-[#0d1117]">
            <div className="h-full flex flex-col">
              <div className="flex justify-between items-center p-3 border-b border-[#30363d]">
                <h2 className="font-medium">Files</h2>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsCreatingFile(true)}
                  className="h-7 w-7 rounded-sm hover:bg-[#30363d]"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {/* File Creation Input */}
              {isCreatingFile && (
                <div className="p-2 border-b border-[#30363d]">
                  <div className="flex">
                    <input
                      type="text"
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      placeholder="filename.py"
                      className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-l-sm p-1 text-sm focus:outline-none focus:border-[#58a6ff]"
                    />
                    <Button 
                      onClick={handleCreateFile}
                      size="sm"
                      className="rounded-l-none bg-[#238636] hover:bg-[#2ea043]"
                    >
                      Create
                    </Button>
                  </div>
                </div>
              )}
              
              {/* File List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {files.map((file) => (
                  <div 
                    key={file.id}
                    onClick={() => setSelectedFile(file)}
                    className={`flex items-center p-2 cursor-pointer hover:bg-[#161b22] ${selectedFile?.id === file.id ? 'bg-[#161b22]' : ''}`}
                  >
                    <FileText className="h-4 w-4 mr-2 text-[#8b949e]" />
                    <span className="truncate">{file.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </ResizablePanel>
          
          <ResizableHandle className="w-[1px] bg-[#30363d]" />
          
          <ResizablePanel defaultSize={80}>
            <ResizablePanelGroup direction="vertical">
              {/* Code Editor */}
              <ResizablePanel defaultSize={70}>
                {selectedFile ? (
                  <CodeEditor
                    value={selectedFile.content}
                    onChange={handleFileContentChange}
                    language={selectedFile.name.endsWith('.py') ? 'python' : 'text'}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center bg-[#0d1117] text-[#8b949e]">
                    <p>Select a file or create a new one to start coding</p>
                  </div>
                )}
              </ResizablePanel>
              
              <ResizableHandle className="h-[1px] bg-[#30363d]" />
              
              {/* Terminal Output */}
              <ResizablePanel defaultSize={30}>
                <Terminal output={output} />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      
      {/* Status Bar */}
      <footer className="p-1 border-t border-[#30363d] bg-[#161b22] text-[#8b949e] text-xs flex justify-between">
        <div>
          {selectedFile ? (
            <span>Python | UTF-8 | Spaces: 4</span>
          ) : (
            <span>No file selected</span>
          )}
        </div>
        <div>DevHub IDE | {new Date().toLocaleTimeString()}</div>
      </footer>
    </div>
  );
}
