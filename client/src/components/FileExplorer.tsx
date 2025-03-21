import { useState, useEffect } from "react";
import { FileData, getUserFiles, createFile, deleteFile } from "../lib/firebase";
import { 
  Folder, 
  FileCode, 
  FileText, 
  FilePlus, 
  FolderPlus, 
  RefreshCw, 
  MoreVertical, 
  Trash2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { getFileIcon } from "@/lib/utils";

interface FileExplorerProps {
  userId: string;
  onFileSelect: (file: FileData) => void;
  onCreateFileClick: () => void;
  selectedFileId: string | null;
}

export default function FileExplorer({ userId, onFileSelect, onCreateFileClick, selectedFileId }: FileExplorerProps) {
  const [files, setFiles] = useState<FileData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Get user files
  useEffect(() => {
    if (!userId) return;

    setIsLoading(true);
    const fetchFiles = () => {
      getUserFiles(userId, (fetchedFiles) => {
        setFiles(fetchedFiles);
        setIsLoading(false);
      });
    };

    fetchFiles();
  }, [userId]);

  // Handle file click
  const handleFileClick = (file: FileData) => {
    if (file.type === 'file') {
      onFileSelect(file);
    }
  };

  // Handle file refresh
  const handleRefresh = () => {
    setIsLoading(true);
    getUserFiles(userId, (fetchedFiles) => {
      setFiles(fetchedFiles);
      setIsLoading(false);
    });
  };

  // Handle new folder
  const handleNewFolder = async () => {
    try {
      const folderName = prompt('Enter folder name:');
      if (!folderName) return;
      
      await createFile(userId, folderName, '', '/', 'folder');
      toast({
        title: "Folder Created",
        description: `Folder '${folderName}' has been created.`
      });
    } catch (error) {
      console.error('Error creating folder:', error);
      toast({
        title: "Error",
        description: "Failed to create folder. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle file deletion
  const handleDeleteFile = async (fileId: string, fileName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      if (confirm(`Are you sure you want to delete '${fileName}'?`)) {
        await deleteFile(userId, fileId);
        toast({
          title: "File Deleted",
          description: `'${fileName}' has been deleted.`
        });
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Error",
        description: "Failed to delete file. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <aside className="bg-[#010409] border-r border-[#30363d] w-56 flex flex-col h-full">
      <div className="p-3 border-b border-[#30363d] flex justify-between items-center">
        <h2 className="font-medium text-sm text-[#c9d1d9]">EXPLORER</h2>
        <div className="flex space-x-1.5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#161b22]"
                  onClick={onCreateFileClick}
                >
                  <FilePlus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>New File</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#161b22]"
                  onClick={handleNewFolder}
                >
                  <FolderPlus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>New Folder</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#161b22]"
                  onClick={handleRefresh}
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refresh</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#58a6ff]"></div>
          </div>
        ) : files.length === 0 ? (
          <div className="p-4 text-center text-sm text-[#8b949e]">
            <p>No files found.</p>
            <p className="mt-2">Click the + icon to create a file.</p>
          </div>
        ) : (
          <ul className="py-2 px-1 text-sm">
            {files
              .sort((a, b) => {
                // Sort folders first, then files
                if (a.type === 'folder' && b.type === 'file') return -1;
                if (a.type === 'file' && b.type === 'folder') return 1;
                return a.name.localeCompare(b.name);
              })
              .map((file) => (
                <li
                  key={file.id}
                  className={`flex items-center px-2 py-1 rounded group cursor-pointer
                    ${selectedFileId === file.id ? 'bg-[rgba(88,166,255,0.1)] text-[#58a6ff]' : 'hover:bg-[rgba(88,166,255,0.05)]'}`}
                  onClick={() => handleFileClick(file)}
                >
                  {getFileIcon(file.name, file.type)}
                  <span className={selectedFileId === file.id ? 'text-[#58a6ff]' : 'text-[#c9d1d9]'}>
                    {file.name}
                  </span>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 ml-auto opacity-0 group-hover:opacity-100 text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#161b22]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#161b22] border-[#30363d] text-[#c9d1d9]">
                      <DropdownMenuItem 
                        className="flex items-center gap-2 text-[#f85149] focus:text-[#f85149] focus:bg-[#0d1117]"
                        onClick={(e: any) => handleDeleteFile(file.id, file.name, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
