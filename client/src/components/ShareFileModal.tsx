import { useState, useEffect } from "react";
import { X, Share2, UserPlus, Loader2 } from "lucide-react";
import { getDatabase, ref, set, get, onValue } from "firebase/database";
import { auth } from "../main";
import { FileData, getUserByEmail } from "../lib/firebase";

interface ShareFileModalProps {
  file: FileData;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareFileModal({ file, isOpen, onClose }: ShareFileModalProps) {
  const [email, setEmail] = useState("");
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [users, setUsers] = useState<Array<{ email: string; userId: string }>>([]);
  const database = getDatabase();

  // ✅ Fetch all users (except current user)
  useEffect(() => {
    if (!auth.currentUser) return;

    const usersRef = ref(database, "users");
    return onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const usersData: Array<{ email: string; userId: string }> = [];
        snapshot.forEach((childSnapshot) => {
          const userData = childSnapshot.val();
          if (userData.email && userData.userId !== auth.currentUser?.uid) {
            usersData.push({ email: userData.email, userId: userData.userId });
          }
        });
        setUsers(usersData);
      }
    });
  }, []);

  // ✅ Fetch existing collaborators
  useEffect(() => {
    if (!file || !auth.currentUser) return;

    const fetchCollaborators = async () => {
      try {
        const collaboratorsRef = ref(database, `collaborations/${file.id}/users`);
        const snapshot = await get(collaboratorsRef);
        if (snapshot.exists()) {
          setCollaborators(Object.values(snapshot.val()).map((collab: any) => collab.email));
        }
      } catch (err) {
        console.error("Error fetching collaborators:", err);
      }
    };

    if (isOpen) {
      fetchCollaborators();
    }
  }, [isOpen, file]);

  const handleUserSelect = (selectedEmail: string) => {
    setEmail(selectedEmail);
  };

  if (!isOpen) return null;

  // ✅ Add a collaborator
  const handleAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError("Please enter an email address");
      return;
    }

    if (!file || !auth.currentUser) {
      setError("You must be logged in to share files");
      return;
    }

    if (email === auth.currentUser.email) {
      setError("You cannot share with yourself");
      return;
    }

    if (collaborators.includes(email)) {
      setError("This user is already a collaborator");
      return;
    }

    setIsSharing(true);
    setError(null);
    setSuccess(null);

    try {
      const user = await getUserByEmail(email);
      if (!user) {
        setError("User with this email not found. Please verify the email address.");
        setIsSharing(false);
        return;
      }

      const targetUserId = user.userId;

      if (!targetUserId) {
        setError("Could not find user ID");
        setIsSharing(false);
        return;
      }

      // ✅ Use userId in the Firebase path instead of email
      await set(ref(database, `collaborations/${file.id}/users/${targetUserId}`), {
        email: email,  // Store email as a value
        userId: targetUserId,
        addedAt: Date.now(),
        addedBy: auth.currentUser.email,
      });

      // Also add the shared file to the target user's shared files
      await set(ref(database, `users/${targetUserId}/sharedFiles/${file.id}`), {
        fileId: file.id,
        sharedBy: auth.currentUser.email,
        sharedAt: Date.now(),
        ownerId: file.ownerUserId || auth.currentUser.uid,
      });

      // Update collaborators list
      setCollaborators([...collaborators, email]);
      setEmail("");
      setSuccess("Collaborator added successfully");
    } catch (err) {
      console.error("Error adding collaborator:", err);
      setError("Failed to add collaborator. Please try again.");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-gray-900/95 rounded-xl shadow-2xl w-full max-w-md border border-gray-800">
        <div className="flex justify-between items-center border-b border-gray-800/50 p-5 bg-gray-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Share2 className="h-5 w-5 text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-100">Share File</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-800/50 text-gray-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          <p className="text-sm text-gray-300 mb-2">Sharing: <span className="text-blue-400">{file.name}</span></p>
          <p className="text-xs text-gray-500">Collaborators will be able to edit this file in real-time.</p>

          {error && <div className="mb-4 p-2 bg-red-900 border border-red-800 text-red-400 rounded text-sm">{error}</div>}
          {success && <div className="mb-4 p-2 bg-green-900 border border-green-800 text-green-400 rounded text-sm">{success}</div>}

          <form onSubmit={handleAddCollaborator} className="mb-4">
            <label className="block text-gray-300 text-sm font-medium mb-2">Add Collaborator</label>
            <div className="flex">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-grow bg-gray-800 border border-gray-700 rounded-l px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Select or enter email"
              />
              <button type="submit" className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r flex items-center ${isSharing ? "opacity-75 cursor-not-allowed" : ""}`} disabled={isSharing}>
                {isSharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              </button>
            </div>

            {users.length > 0 && (
              <div className="mt-2 border rounded-md border-[#30363d] max-h-32 overflow-y-auto">
                {users.map((user, index) => (
                  <button key={index} className="w-full text-left px-3 py-2 hover:bg-[#30363d] text-sm" onClick={() => handleUserSelect(user.email)}>
                    {user.email}
                  </button>
                ))}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
