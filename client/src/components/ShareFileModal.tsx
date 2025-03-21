import { useState, useEffect } from 'react';
import { X, Share2, UserPlus, Check, Loader2 } from 'lucide-react';
import { getDatabase, ref, set, get, query, orderByChild, equalTo } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { FileData, getUserByEmail } from '../lib/firebase';
import { auth } from '../main';

interface ShareFileModalProps {
  file: FileData;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareFileModal({ file, isOpen, onClose }: ShareFileModalProps) {
  const [email, setEmail] = useState('');
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [users, setUsers] = useState<Array<{ email: string }>>([]);
  const database = getDatabase();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersRef = ref(database, 'users');
        onValue(usersRef, (snapshot) => {
          if (snapshot.exists()) {
            const usersData: Array<{ email: string }> = [];
            snapshot.forEach((childSnapshot) => {
              const userData = childSnapshot.val();
              if (userData.email && userData.email !== auth.currentUser?.email) {
                usersData.push({ email: userData.email });
              }
            });
            setUsers(usersData);
          }
        });
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

  const handleUserSelect = (selectedEmail: string) => {
    if (selectedEmail) {
      setEmail(selectedEmail);
    }
  };

  useEffect(() => {
    const fetchCollaborators = async () => {
      if (!file || !auth.currentUser) return;

      try {
        const collaboratorsRef = ref(database, `collaborations/${file.id}/users`);
        const snapshot = await get(collaboratorsRef);

        if (snapshot.exists()) {
          const data = snapshot.val();
          // Filter out the current user
          const collaboratorEmails = Object.keys(data).filter(
            userEmail => userEmail !== auth.currentUser?.email
          );
          setCollaborators(collaboratorEmails);
        }
      } catch (err) {
        console.error('Error fetching collaborators:', err);
      }
    };

    if (isOpen) {
      fetchCollaborators();
    }
  }, [isOpen, file]);

  if (!isOpen) return null;

  const handleAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    if (!file || !auth.currentUser) {
      setError('You must be logged in to share files');
      return;
    }

    // Check if the email is the same as the current user
    if (email === auth.currentUser.email) {
      setError('You cannot share with yourself');
      return;
    }

    // Check if email is already in collaborators
    if (collaborators.includes(email)) {
      setError('This user is already a collaborator');
      return;
    }

    setIsSharing(true);
    setError(null);
    setSuccess(null);

    try {
      // Use the getUserByEmail helper function
      const user = await getUserByEmail(email);

      if (!user) {
        setError('User with this email not found. Please verify the email address.');
        setIsSharing(false);
        return;
      }

      const targetUserId = user.userId;

      if (!targetUserId) {
        setError('Could not find user ID');
        setIsSharing(false);
        return;
      }

      // Store collaboration info
      await set(ref(database, `collaborations/${file.id}/users/${email}`), {
        userId: targetUserId,
        addedAt: Date.now(),
        addedBy: auth.currentUser.email
      });

      // Also add the shared file to the target user's shared files
      await set(ref(database, `users/${targetUserId}/sharedFiles/${file.id}`), {
        fileId: file.id,
        sharedBy: auth.currentUser.email,
        sharedAt: Date.now(),
        ownerId: file.ownerUserId || auth.currentUser.uid
      });

      // Update collaborators list
      setCollaborators([...collaborators, email]);
      setEmail('');
      setSuccess('Collaborator added successfully');
    } catch (err) {
      console.error('Error adding collaborator:', err);
      setError('Failed to add collaborator. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleRemoveCollaborator = async (collaboratorEmail: string) => {
    if (!file || !auth.currentUser) return;

    try {
      // Find the userId for this email
      const usersRef = ref(database, 'users');
      const snapshot = await get(usersRef);

      let targetUserId = null;

      snapshot.forEach((childSnapshot) => {
        const userData = childSnapshot.val();
        if (userData.email === collaboratorEmail) {
          targetUserId = childSnapshot.key;
        }
      });

      if (!targetUserId) {
        setError('Could not find user to remove');
        return;
      }

      // Remove collaboration access
      await set(ref(database, `collaborations/${file.id}/users/${collaboratorEmail}`), null);

      // Remove from target user's shared files
      await set(ref(database, `users/${targetUserId}/sharedFiles/${file.id}`), null);

      // Update collaborators list
      setCollaborators(collaborators.filter(email => email !== collaboratorEmail));
      setSuccess('Collaborator removed successfully');
    } catch (err) {
      console.error('Error removing collaborator:', err);
      setError('Failed to remove collaborator. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center border-b border-gray-800 p-4">
          <div className="flex items-center">
            <Share2 className="h-5 w-5 text-blue-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-100">Share File</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-4">
            <p className="text-sm text-gray-300 mb-1">Sharing: <span className="text-blue-400">{file.name}</span></p>
            <p className="text-xs text-gray-500">Collaborators will be able to edit this file in real-time</p>
          </div>

          {error && (
            <div className="mb-4 p-2 bg-red-900 bg-opacity-20 border border-red-800 text-red-400 rounded text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-2 bg-green-900 bg-opacity-20 border border-green-800 text-green-400 rounded text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleAddCollaborator} className="mb-4">
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Add Collaborator
            </label>
            <div className="flex">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-grow bg-gray-800 border border-gray-700 rounded-l px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter email address"
              />
              <button
                type="submit"
                className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r flex items-center ${
                  isSharing ? 'opacity-75 cursor-not-allowed' : ''
                }`}
                disabled={isSharing}
              >
                {isSharing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
              </button>
            </div>
            {users.length > 0 && (
              <div className="mt-2 border rounded-md border-[#30363d] max-h-32 overflow-y-auto">
                {users.map((user, index) => (
                  <button
                    key={index}
                    className="w-full text-left px-3 py-2 hover:bg-[#30363d] text-sm"
                    onClick={() => handleUserSelect(user.email)}
                  >
                    {user.email}
                  </button>
                ))}
              </div>
            )}
          </form>

          {collaborators.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">Current Collaborators</h3>
              <ul className="space-y-2">
                {collaborators.map((collaboratorEmail) => (
                  <li 
                    key={collaboratorEmail}
                    className="flex justify-between items-center bg-gray-800 p-2 rounded text-sm"
                  >
                    <span className="text-gray-300">{collaboratorEmail}</span>
                    <button
                      onClick={() => handleRemoveCollaborator(collaboratorEmail)}
                      className="text-red-400 hover:text-red-300"
                      title="Remove collaborator"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex justify-end p-4 border-t border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 focus:outline-none"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}