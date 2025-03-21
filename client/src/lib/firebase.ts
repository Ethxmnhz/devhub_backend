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
  ownerUserId?: string; // User ID of the file owner
  isShared?: boolean; // Whether this file is shared with the current user
}

// Function to get a user's files
export const getUserFiles = (userId: string, callback: (files: FileData[]) => void) => {
  const filesRef = ref(database, `users/${userId}/files`);
  const sharedRef = ref(database, `users/${userId}/sharedFiles`);
  
  // First, get user's own files
  onValue(filesRef, async (snapshot) => {
    const data = snapshot.val();
    let files: FileData[] = [];
    
    if (data) {
      Object.keys(data).forEach((key) => {
        files.push({
          id: key,
          ...data[key],
          ownerUserId: userId // Ensure owner is set
        });
      });
    }
    
    // Then check for shared files
    const sharedSnapshot = await get(sharedRef);
    if (sharedSnapshot.exists()) {
      const sharedData = sharedSnapshot.val();
      
      // For each shared file, get the actual file data
      const sharedFilePromises = Object.entries(sharedData).map(async ([fileId, fileRef]) => {
        const { ownerId } = fileRef as any;
        if (!ownerId) return null;
        
        // Get the actual file from the owner's files
        const ownerFileRef = ref(database, `users/${ownerId}/files/${fileId}`);
        const fileSnapshot = await get(ownerFileRef);
        
        if (fileSnapshot.exists()) {
          const fileData = fileSnapshot.val();
          return {
            id: fileId,
            ...fileData,
            isShared: true,
            ownerUserId: ownerId
          };
        }
        return null;
      });
      
      // Wait for all shared file data to be fetched
      const sharedFiles = await Promise.all(sharedFilePromises);
      
      // Add shared files to the list
      files = [...files, ...sharedFiles.filter(Boolean) as FileData[]];
    }
    
    // Return all files
    callback(files);
  });
  
  // Return a function to unsubscribe
  return () => {
    // Nothing to unsubscribe from yet
  };
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
    createdAt: timestamp,
    ownerUserId: userId
  };
  
  await set(newFileRef, fileData);
  
  return {
    id: fileId,
    ...fileData
  };
};

// Function to update a file's content
export const updateFileContent = async (userId: string, fileId: string, content: string, ownerId?: string): Promise<void> => {
  // If ownerId is provided and different from userId, this is a shared file
  const actualOwnerId = ownerId || userId;
  const fileRef = ref(database, `users/${actualOwnerId}/files/${fileId}`);
  
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
    
    // If this is a shared file, also update collaboration status
    if (ownerId && ownerId !== userId) {
      // Add an edit record in the collaboration history
      const collaborationRef = ref(database, `collaborations/${fileId}/history`);
      const newEditRef = push(collaborationRef);
      await set(newEditRef, {
        userId,
        timestamp: Date.now(),
        action: 'edit'
      });
    }
  }
};

// Function to save file content in real-time (debounced)
let saveTimeout: NodeJS.Timeout | null = null;

export const saveFileContent = (userId: string, fileId: string, content: string, ownerId?: string): void => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  
  saveTimeout = setTimeout(() => {
    updateFileContent(userId, fileId, content, ownerId)
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

// Get user email by ID
export const getUserEmailById = async (userId: string): Promise<string | null> => {
  const usersRef = ref(database, 'users');
  const snapshot = await get(usersRef);
  
  if (snapshot.exists()) {
    let email = null;
    
    snapshot.forEach((childSnapshot) => {
      if (childSnapshot.key === userId) {
        const userData = childSnapshot.val();
        email = userData.email;
      }
    });
    
    return email;
  }
  
  return null;
};

// Function to check if a user exists by email
export const getUserByEmail = async (email: string): Promise<{ userId: string } | null> => {
  const usersRef = ref(database, 'users');
  const snapshot = await get(usersRef);
  
  if (snapshot.exists()) {
    let foundUser = null;
    
    snapshot.forEach((childSnapshot) => {
      const userData = childSnapshot.val();
      if (userData.email === email) {
        foundUser = {
          userId: childSnapshot.key as string,
          ...userData
        };
      }
    });
    
    return foundUser;
  }
  
  return null;
};
