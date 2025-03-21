import { useState, useEffect } from 'react';
import { Plus, FolderPlus, Trash2, RefreshCw, Share2, Users } from 'lucide-react';
import { FileData, getUserFiles, deleteFile } from '../lib/firebase';
import { getFileIcon } from '../lib/utils';

interface FileExplorerProps {
  userId: string;
  onFileSelect: (file: FileData) => void;
  onCreateFileClick: () => void;
  selectedFileId: string | null;
}

export default function FileExplorer({ 
  userId, 
  onFileSelect, 
  onCreateFileClick, 
  selectedFileId 
}: FileExplorerProps) {
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load user files on component mount and when userId changes
  useEffect(() => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    // Set up the real-time listener for files
    getUserFiles(userId, (updatedFiles) => {
      setFiles(updatedFiles);
      setLoading(false);
    });
    
    // Clean up listener is handled internally in getUserFiles
    return () => {
      // Nothing to clean up here as the Firebase listeners are managed elsewhere
    };
  }, [userId]);
  
  // Handle file selection
  const handleFileClick = (file: FileData) => {
    onFileSelect(file);
  };
  
  // Handle file deletion
  const handleDeleteFile = async (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation(); // Prevent triggering file selection
    
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        await deleteFile(userId, fileId);
        // File list will be updated automatically by the Firebase listener
      } catch (error) {
        console.error('Error deleting file:', error);
        setError('Failed to delete file. Please try again.');
      }
    }
  };
  
  return (
    <div className="h-full flex flex-col bg-gray-900 border-r border-gray-800">
      <div className="p-3 flex justify-between items-center border-b border-gray-800">
        <h2 className="text-sm font-medium text-gray-200">Files</h2>
        <div className="flex space-x-1">
          <button 
            onClick={onCreateFileClick}
            className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            title="Create new file"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button 
            className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            title="Create new folder (coming soon)"
            disabled
          >
            <FolderPlus className="h-4 w-4 opacity-50" />
          </button>
          <button 
            className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors ml-1"
            onClick={() => setLoading(true)}
            title="Refresh files"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-1">
        {error && (
          <div className="p-2 text-xs text-red-400 bg-red-900 bg-opacity-20 rounded mb-2">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="flex flex-col space-y-2 p-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center">
                <div className="h-4 w-4 bg-gray-700 rounded mr-2"></div>
                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : files.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-xs">
            <p>No files yet.</p>
            <button 
              onClick={onCreateFileClick}
              className="mt-2 px-2 py-1 bg-blue-900 text-blue-100 rounded text-xs hover:bg-blue-800 transition-colors"
            >
              Create your first file
            </button>
          </div>
        ) : (
          <ul className="space-y-0.5">
            {files.map((file) => (
              <li 
                key={file.id}
                onClick={() => handleFileClick(file)}
                className={`
                  flex items-center justify-between p-1.5 text-xs rounded cursor-pointer
                  ${selectedFileId === file.id 
                    ? 'bg-blue-900 bg-opacity-40 text-blue-100' 
                    : 'hover:bg-gray-800 text-gray-300'}
                `}
              >
                <div className="flex items-center truncate">
                  <span className="mr-1.5">{getFileIcon(file.name)}</span>
                  <span className="truncate">{file.name}</span>
                  {file.isShared && (
                    <span className="ml-1.5 text-blue-400" title="Shared with you">
                      <Users className="h-3 w-3" />
                    </span>
                  )}
                  {file.ownerUserId !== userId && file.isShared && (
                    <span className="ml-0.5 text-xs text-blue-500">(shared)</span>
                  )}
                </div>
                <div className="flex items-center">
                  {file.ownerUserId === userId && (
                    <button
                      onClick={(e) => handleDeleteFile(e, file.id)}
                      className={`
                        p-1 rounded opacity-0 hover:opacity-100 hover:bg-red-800
                        ${selectedFileId === file.id ? 'opacity-100 text-gray-400' : ''}
                      `}
                      title="Delete file"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}