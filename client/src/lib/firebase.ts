import { auth, database } from "../main";
import { ref, set, onValue, child, push, get } from "firebase/database";
import { User } from "firebase/auth";

// File type definition
export interface FileData {
  id: string;
  name: string;
  content: string;
  path: string;
  type: 'file' | 'folder';
  lastModified: number;
  createdAt: number;
}

// Function to get a user's files
export const getUserFiles = (userId: string, callback: (files: FileData[]) => void) => {
  const filesRef = ref(database, `users/${userId}/files`);
  
  onValue(filesRef, (snapshot) => {
    const data = snapshot.val();
    const files: FileData[] = [];
    
    if (data) {
      Object.keys(data).forEach((key) => {
        files.push({
          id: key,
          ...data[key]
        });
      });
    }
    
    callback(files);
  });
};

// Function to create a new file
export const createFile = async (
  userId: string, 
  fileName: string, 
  content: string = '', 
  path: string = '/',
  type: 'file' | 'folder' = 'file'
): Promise<FileData> => {
  const filesRef = ref(database, `users/${userId}/files`);
  const newFileRef = push(filesRef);
  const fileId = newFileRef.key as string;
  
  const timestamp = Date.now();
  
  const fileData: Omit<FileData, 'id'> = {
    name: fileName,
    content,
    path,
    type,
    lastModified: timestamp,
    createdAt: timestamp
  };
  
  await set(newFileRef, fileData);
  
  return {
    id: fileId,
    ...fileData
  };
};

// Function to update a file's content
export const updateFileContent = async (userId: string, fileId: string, content: string): Promise<void> => {
  const fileRef = ref(database, `users/${userId}/files/${fileId}`);
  
  // Get current file data
  const snapshot = await get(fileRef);
  const fileData = snapshot.val();
  
  if (fileData) {
    // Update content and lastModified timestamp
    await set(fileRef, {
      ...fileData,
      content,
      lastModified: Date.now()
    });
  }
};

// Function to save file content in real-time (debounced)
let saveTimeout: NodeJS.Timeout | null = null;

export const saveFileContent = (userId: string, fileId: string, content: string): void => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  
  saveTimeout = setTimeout(() => {
    updateFileContent(userId, fileId, content)
      .catch(error => console.error('Error saving file:', error));
  }, 1000); // Save every second
};

// Function to get a specific file
export const getFile = async (userId: string, fileId: string): Promise<FileData | null> => {
  const fileRef = ref(database, `users/${userId}/files/${fileId}`);
  
  const snapshot = await get(fileRef);
  const fileData = snapshot.val();
  
  if (fileData) {
    return {
      id: fileId,
      ...fileData
    };
  }
  
  return null;
};

// Function to delete a file
export const deleteFile = async (userId: string, fileId: string): Promise<void> => {
  const fileRef = ref(database, `users/${userId}/files/${fileId}`);
  await set(fileRef, null);
};

// Get current user
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};
