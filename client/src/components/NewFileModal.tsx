import { useState } from 'react';
import { createFile } from '../lib/firebase';
import { X } from 'lucide-react';

interface NewFileModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function NewFileModal({ userId, isOpen, onClose }: NewFileModalProps) {
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('py');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fileName.trim()) {
      setError('Please enter a file name');
      return;
    }

    try {
      setIsCreating(true);
      setError(null);

      // Generate file with default code template based on type
      let template = '';
      if (fileType === 'py') {
        template = '# Python file\n\ndef main():\n    print("Hello, world!")\n\nif __name__ == "__main__":\n    main()';
      } else if (fileType === 'js') {
        template = '// JavaScript file\n\nfunction main() {\n    console.log("Hello, world!");\n}\n\nmain();';
      } else if (fileType === 'html') {
        template = '<!DOCTYPE html>\n<html>\n<head>\n    <title>New Page</title>\n</head>\n<body>\n    <h1>Hello, world!</h1>\n</body>\n</html>';
      } else if (fileType === 'css') {
        template = '/* CSS file */\n\nbody {\n    font-family: Arial, sans-serif;\n    margin: 0;\n    padding: 20px;\n}';
      } else if (fileType === 'json') {
        template = '{\n    "name": "project",\n    "version": "1.0.0"\n}';
      }

      // Create file in Firebase
      await createFile(userId, `${fileName}.${fileType}`, template);
      
      // Reset form and close modal
      setFileName('');
      onClose();
    } catch (error) {
      console.error('Error creating file:', error);
      setError('Failed to create file. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center border-b border-gray-800 p-4">
          <h2 className="text-lg font-medium text-gray-100">Create New File</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleCreateFile} className="p-4">
          {error && (
            <div className="mb-4 p-2 bg-red-900 bg-opacity-20 border border-red-800 text-red-400 rounded text-sm">
              {error}
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-gray-300 text-sm font-medium mb-2">
              File Name
            </label>
            <div className="flex">
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="flex-grow bg-gray-800 border border-gray-700 rounded-l px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter file name"
                autoFocus
              />
              <div className="relative">
                <select
                  value={fileType}
                  onChange={(e) => setFileType(e.target.value)}
                  className="bg-gray-700 border border-gray-700 rounded-r px-3 py-2 text-gray-100 focus:outline-none"
                >
                  <option value="py">.py</option>
                  <option value="js">.js</option>
                  <option value="html">.html</option>
                  <option value="css">.css</option>
                  <option value="json">.json</option>
                  <option value="txt">.txt</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none ${
                isCreating ? 'opacity-75 cursor-not-allowed' : ''
              }`}
              disabled={isCreating}
            >
              {isCreating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}