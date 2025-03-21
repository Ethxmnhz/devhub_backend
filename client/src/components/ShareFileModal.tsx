import { useState, useEffect } from 'react';
import { X, Share2, UserPlus, Check, Loader2 } from 'lucide-react';
import { getDatabase, ref, set, get, query, orderByChild, equalTo, onValue } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { FileData, getUserByEmail } from '../lib/firebase';
import { auth } from '../main';

interface ShareFileModalProps {
  file: FileData;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareFileModal({ file, isOpen, onClose }: ShareFileModalProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [users, setUsers] = useState<Array<{ email: string }>>([]);
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const database = getDatabase();

  useEffect(() => {
    if (!auth.currentUser) return;

    const fetchUsers = () => {
      const usersRef = ref(database, 'users');
      return onValue(usersRef, (snapshot) => {
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
      }, (error) => {
        console.error('Error fetching users:', error);
      });
    };

    const unsubscribe = fetchUsers();
    return () => unsubscribe();
  }, [auth.currentUser]);

  useEffect(() => {
    const fetchCollaborators = async () => {
      if (!file || !auth.currentUser) return;

      try {
        const collaboratorsRef = ref(database, `collaborations/${file.id}/users`);
        const snapshot = await get(collaboratorsRef);

        if (snapshot.exists()) {
          const data = snapshot.val();
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

  const handleUserSelect = (selectedEmail: string) => {
    setEmail(selectedEmail);
  };

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

    if (email === auth.currentUser.email) {
      setError('You cannot share with yourself');
      return;
    }

    if (collaborators.includes(email)) {
      setError('This user is already a collaborator');
      return;
    }

    setIsSharing(true);
    setError(null);
    setSuccess(null);

    try {
      const targetUser = await getUserByEmail(email);
      if (!targetUser) {
        setError('User not found');
        setIsSharing(false);
        return;
      }

      const collaborationRef = ref(database, `collaborations/${file.id}/users/${email}`);
      await set(collaborationRef, true);

      setSuccess('File shared successfully');
      setEmail('');
      setCollaborators([...collaborators, email]);
    } catch (err) {
      console.error('Error sharing file:', err);
      setError('Failed to share file');
    } finally {
      setIsSharing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-[#1c2333] rounded-lg shadow-lg w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-200">Share File</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-400">
              <X className="h-5 w-5" />
            </button>
          </div>

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
              <div className="mt-2 border rounded-md border-gray-700 max-h-32 overflow-y-auto">
                {users.map((user, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleUserSelect(user.email)}
                    className={`w-full text-left px-3 py-2 hover:bg-gray-800 text-sm ${
                      collaborators.includes(user.email) ? 'text-gray-500' : 'text-gray-300'
                    }`}
                  >
                    {user.email}
                    {collaborators.includes(user.email) && (
                      <span className="ml-2 text-gray-500">(Already shared)</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </form>

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          {success && <p className="text-green-500 text-sm mt-2">{success}</p>}

          {collaborators.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Current Collaborators</h3>
              <div className="space-y-2">
                {collaborators.map((collaborator, index) => (
                  <div key={index} className="flex items-center text-sm text-gray-400">
                    <Share2 className="h-4 w-4 mr-2" />
                    {collaborator}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}