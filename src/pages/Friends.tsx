import React, { useState } from "react";
import { motion } from "motion/react";
import { useSession } from "../context/SessionContext";
import { useAuth } from "../context/AuthContext";
import { Friend } from "../types";
import { db } from "../firebase";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import {
  Users,
  Plus,
  Trash2,
  Flame,
  Loader,
} from "lucide-react";

export default function Friends() {
  const { friends, addFriend, removeFriend } = useSession();
  const { currentUser } = useAuth();
  const [friendInput, setFriendInput] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ uid: string; name: string; avatar?: string }>>([]);
  const [searchNotice, setSearchNotice] = useState<string>("");

  const getFriendCode = (userId: string) => userId.slice(0, 6).toUpperCase();

  const handleSearchUser = async (searchTerm: string) => {
    if (!searchTerm.trim() || !currentUser) {
      setSearchResults([]);
      setSearchNotice("");
      return;
    }

    setIsSearching(true);
    setSearchNotice("");
    try {
      const normalizedTerm = searchTerm.trim().toLowerCase();
      const currentUserId = currentUser.uid.toLowerCase();

      const maybeCode = searchTerm.trim().toUpperCase();
      const codePattern = /^[A-Z0-9]{6}$/;
      if (!codePattern.test(maybeCode)) {
        setSearchResults([]);
        setSearchNotice("Enter the 6-character code from the other person's Profile page.");
        return;
      }

      let codeDoc;
      try {
        codeDoc = await getDoc(doc(db, 'friendCodes', maybeCode));
      } catch (error: any) {
        if (error?.code !== 'permission-denied') {
          throw error;
        }
      }

      if (!codeDoc?.exists()) {
        const profilesSnap = await getDocs(collection(db, 'publicProfiles'));
        const fallback = profilesSnap.docs.find((docSnap) => {
          const userData = docSnap.data();
          const userId = String(userData.userId || docSnap.id || '').toUpperCase();
          return getFriendCode(userId) === maybeCode;
        });

        if (!fallback) {
          setSearchResults([]);
          setSearchNotice("No user found with that code.");
          return;
        }

        codeDoc = fallback;
      }

      const userData = codeDoc.data();
      const matchedUserId = String(userData.userId || codeDoc.id).toLowerCase();

      if (matchedUserId === currentUserId) {
        setSearchResults([]);
        setSearchNotice("That is your own code.");
        return;
      }

      const isAlreadyFriend = friends.some(f => f.userId === matchedUserId || f.userId === codeDoc.id);
      if (isAlreadyFriend) {
        setSearchResults([]);
        setSearchNotice("That user is already your friend.");
        return;
      }

      setSearchResults([{
        uid: String(userData.userId || codeDoc.id),
        name: userData.displayName || currentUser.displayName || 'User',
        avatar: userData.avatar,
      }]);
      setSearchNotice("");
      return;
    } catch (error: any) {
      // Ignore AbortError which can occur when rapid input changes cancel in-flight requests
      if (error && (error.name === 'AbortError' || error.code === 'aborted')) {
        // silence noisy aborts
        setSearchResults([]);
      } else {
        console.error('Error searching users:', error);
        setSearchNotice("No users found with that name.");
        setSearchResults([]);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddFriend = async (friend: { uid: string; name: string; avatar?: string }) => {
    try {
      const newFriend: Friend = {
        userId: friend.uid,
        name: friend.name,
        avatar: friend.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.uid}`,
        currentBac: 0,
        streak: 0,
        addedAt: Date.now(),
      };

      addFriend(newFriend);
      setFriendInput("");
      setShowAddForm(false);
      setSearchResults([]);
    } catch (error) {
      console.error('Error adding friend:', error);
    }
  };

  const handleRemoveFriend = (userId: string, friendName: string) => {
    const confirmed = window.confirm(`Remove ${friendName} from your friends?`);
    if (!confirmed) return;

    removeFriend(userId);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-32">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-8 h-8 text-brand-primary" />
              <h1 className="text-3xl font-black font-display tracking-tight text-on-surface">
                Friends
              </h1>
            </div>
            <p className="text-on-surface-variant font-medium">
              Connect with friends and see their progress. Celebrate milestones together.
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-brand-primary/20 text-brand-primary border border-brand-primary/40 rounded-xl hover:bg-brand-primary/30 transition-colors font-semibold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Friend
          </button>
        </div>
      </div>

      {/* Add Friend Form */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-container rounded-lg border border-white/5 p-6"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearchUser(friendInput);
            }}
            className="space-y-4"
          >
            <div>
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1 block mb-2">
                Search by Name or Code
              </label>
              <input
                type="text"
                placeholder="Enter friend's name or code"
                value={friendInput}
                onChange={(e) => {
                  setFriendInput(e.target.value);
                  handleSearchUser(e.target.value);
                }}
                className="w-full bg-surface-container border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-brand-primary transition-colors font-medium text-on-surface placeholder:text-white/30"
              />
            </div>

            {/* Search Results */}
            {isSearching && (
              <div className="flex items-center justify-center py-4 gap-2 text-white/60">
                <Loader className="w-4 h-4 animate-spin" />
                Searching...
              </div>
            )}

            {searchResults.length > 0 && !isSearching && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {searchResults.map((result) => (
                  <button
                    key={result.uid}
                    type="button"
                    onClick={() => handleAddFriend(result)}
                    className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors text-left"
                  >
                    <img
                      src={result.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${result.uid}`}
                      alt={result.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <div className="font-semibold text-on-surface">{result.name}</div>
                      <div className="text-xs text-white/40">{result.uid}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {friendInput && !isSearching && (searchNotice || searchResults.length === 0) && (
              <p className="text-sm text-white/40">{searchNotice || "No users found with that ID or name."}</p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setFriendInput("");
                  setSearchResults([]);
                }}
                className="px-6 py-3 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-colors font-semibold flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Friends Grid */}
      {friends.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {friends.map((friend) => (
            <motion.div
              key={friend.userId}
              whileHover={{ y: -4 }}
              className="bg-surface-container rounded-lg border border-white/5 p-6 group hover:border-brand-primary/40 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-brand-primary to-purple-500 border-2 border-white/10 flex-shrink-0 overflow-hidden">
                    <img src={friend.avatar} alt={friend.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="font-bold text-on-surface">{friend.name}</h3>
                    <p className="text-xs text-white/40">Added {new Date(friend.addedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Streak & BAC Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                  <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">
                    Streak
                  </div>
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span className="text-lg font-bold text-white">{friend.streak}</span>
                    <span className="text-xs text-white/40">days</span>
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                  <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">
                    Current BAC
                  </div>
                  <div className="text-lg font-bold text-white">
                    {friend.currentBac ? `${friend.currentBac.toFixed(2)}%` : "—"}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => handleRemoveFriend(friend.userId, friend.name)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors text-sm font-semibold"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove Friend
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white/5 rounded-xl border border-white/5 border-dashed">
          <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white/60 mb-2">No Friends Yet</h3>
          <p className="text-sm text-white/40 mb-6">Add friends to see their progress and celebrate milestones together.</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-6 py-3 bg-brand-primary text-black rounded-xl hover:bg-brand-primary/90 transition-colors font-semibold inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Your First Friend
          </button>
        </div>
      )}
    </div>
  );
}
