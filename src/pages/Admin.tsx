import React, { useCallback, useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Users, Activity, HeartPulse, Trash2, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';

export default function AdminPage() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!isAdmin) return;

    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const profilesSnap = await getDocs(collection(db, 'profiles'));
      const sessionsSnap = await getDocs(collection(db, 'activeSessions'));

      setUsers(usersSnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })));
      setProfiles(profilesSnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })));
      setSessions(sessionsSnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })));
    } catch (e) {
      console.error('Admin fetch error', e);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteUser = async (userId: string) => {
    const user = users.find(entry => entry.id === userId);
    const confirmed = window.confirm(
      `Delete ${user?.email || 'this user'} and all associated app data? This cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingUserId(userId);

    try {
      const batch = writeBatch(db);

      // Delete from /users/{userId}
      console.log(`[Delete] Deleting /users/${userId}`);
      batch.delete(doc(db, 'users', userId));

      // Delete from /profiles/{userId}
      console.log(`[Delete] Deleting /profiles/${userId}`);
      batch.delete(doc(db, 'profiles', userId));

      // Delete from /publicProfiles/{userId}
      console.log(`[Delete] Deleting /publicProfiles/${userId}`);
      batch.delete(doc(db, 'publicProfiles', userId));

      // Delete from /friendCodes/{userId}
      console.log(`[Delete] Deleting /friendCodes/${userId}`);
      batch.delete(doc(db, 'friendCodes', userId));

      // Delete from /activeSessions/{userId}
      console.log(`[Delete] Deleting /activeSessions/${userId}`);
      batch.delete(doc(db, 'activeSessions', userId));

      // Delete from /sessionHistory/{userId}
      console.log(`[Delete] Deleting /sessionHistory/${userId}`);
      batch.delete(doc(db, 'sessionHistory', userId));

      // Delete from /userFriends - find all documents where userId is involved
      console.log(`[Delete] Querying /userFriends for related friendships`);
      const userFriendsSnap = await getDocs(collection(db, 'userFriends'));
      console.log(`[Delete] Found ${userFriendsSnap.docs.length} total friendship documents`);
      
      let deletedCount = 0;
      userFriendsSnap.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (data.userId === userId || data.friendUserId === userId) {
          console.log(`[Delete] Deleting /userFriends/${docSnap.id}`);
          batch.delete(docSnap.ref);
          deletedCount++;
        }
      });
      console.log(`[Delete] Marked ${deletedCount} friendship documents for deletion`);

      // Commit all deletions
      console.log(`[Delete] Committing batch deletion for user ${userId}`);
      await batch.commit();
      console.log(`[Delete] Successfully deleted user ${userId} and all data`);
      
      await fetchData();
      alert(`User ${user?.email || userId} and all associated data have been deleted.`);
    } catch (error: any) {
      console.error('Failed to delete user data', error);
      const errorMessage = error?.message || 'Unknown error';
      const errorCode = error?.code || 'UNKNOWN';
      alert(`Failed to delete user data.\nError: ${errorCode}\nMessage: ${errorMessage}\n\nCheck console for details.`);
    } finally {
      setDeletingUserId(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-black text-white mb-2">Access Denied</h2>
        <p className="text-white/50">You do not have permission to view this page.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center text-white/50 mt-10 w-full h-full">Loading Admin Dashboard...</div>;
  }

  // --- Process Analytics Data ---
  const usersByDate = users.reduce((acc, user) => {
    const d = new Date(user.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  let cumulative = 0;
  // Fallback if no dates (mock slightly if 1 day)
  const sortedDates = Object.keys(usersByDate).sort((a,b) => new Date(a).getTime() - new Date(b).getTime());
  
  if (sortedDates.length === 1) {
    // Add fake past dates just for visualization if there's only 1 day of data
    let d = new Date(sortedDates[0]);
    d.setDate(d.getDate() - 1);
    usersByDate[d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })] = 0;
    d.setDate(d.getDate() - 1);
    usersByDate[d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })] = 0;
  }

  const growthData = Object.keys(usersByDate)
    .sort((a,b) => new Date(a).getTime() - new Date(b).getTime())
    .map(date => {
      cumulative += usersByDate[date];
      return { date, newUsers: usersByDate[date], totalUsers: cumulative };
    });

  const profilePieData = [
    { name: 'Profile Set', value: profiles.length },
    { name: 'No Profile', value: Math.max(0, users.length - profiles.length) }
  ];

  const PIE_COLORS = ['#d4af37', '#333333'];

  // ---------------------------------

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32">
      <div className="flex items-center gap-4 sm:gap-6 mb-12">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-600 to-orange-600 border-4 border-white/10 shrink-0 flex items-center justify-center shadow-2xl">
          <ShieldAlert className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black font-display tracking-tight text-white mb-2">Admin Dashboard</h1>
          <p className="text-white/50 font-medium">System overview and user management.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-container rounded-[2rem] p-4 sm:p-6 border border-white/5 flex flex-col items-center justify-center"
        >
          <Users className="w-8 h-8 text-brand-primary mb-4" />
          <div className="text-4xl font-black text-white mb-1">{users.length}</div>
          <div className="text-xs font-bold uppercase tracking-widest text-white/40">Registered Users</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface-container rounded-[2rem] p-6 border border-white/5 flex flex-col items-center justify-center"
        >
          <Activity className="w-8 h-8 text-purple-400 mb-4" />
          <div className="text-4xl font-black text-white mb-1">{sessions.length}</div>
          <div className="text-xs font-bold uppercase tracking-widest text-white/40">Active Sessions</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface-container rounded-[2rem] p-6 border border-white/5 flex flex-col items-center justify-center"
        >
          <div className="w-8 h-8 flex items-center justify-center mb-4 text-green-400">
             <HeartPulse className="w-8 h-8" />
          </div>
          <div className="text-4xl font-black text-white mb-1">{profiles.length}</div>
          <div className="text-xs font-bold uppercase tracking-widest text-white/40">Completed Profiles</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-surface-container rounded-[2rem] p-6 border border-white/5 flex flex-col items-center justify-center"
        >
          <div className="w-8 h-8 flex items-center justify-center mb-4 text-blue-400">
             <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="text-4xl font-black text-white mb-1">100%</div>
          <div className="text-xs font-bold uppercase tracking-widest text-white/40">System Uptime</div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface-container rounded-[2rem] p-6 border border-white/5 h-[350px] flex flex-col">
          <h2 className="text-lg font-black uppercase tracking-widest text-white/80 mb-6 px-2">User Growth</h2>
          <div className="flex-1 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={growthData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                 <defs>
                   <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#d4af37" stopOpacity={0.8}/>
                     <stop offset="95%" stopColor="#d4af37" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <XAxis dataKey="date" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                 <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                 <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                 <RechartsTooltip 
                   contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                   itemStyle={{ color: '#d4af37', fontWeight: 'bold' }}
                 />
                 <Area type="monotone" dataKey="totalUsers" stroke="#d4af37" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
               </AreaChart>
             </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface-container rounded-[2rem] p-6 border border-white/5 h-[350px] flex flex-col items-center">
          <h2 className="text-lg font-black uppercase tracking-widest text-white/80 w-full mb-2">Profile Health</h2>
          <div className="flex-1 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={profilePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {profilePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                   contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                   itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                 />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex w-full items-center justify-around mt-4">
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-brand-primary"></div>
                <div className="text-xs font-bold text-white/70">Completed</div>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-white/10"></div>
                <div className="text-xs font-bold text-white/70">Incomplete</div>
             </div>
          </div>
        </div>
      </div>

      <div className="bg-surface-container rounded-[2rem] p-6 border border-white/5">
        <h2 className="text-lg font-black uppercase tracking-widest text-white/80 mb-6 px-4">User Details</h2>
        <div className="space-y-4">
          {users.map((user, i) => {
            const profile = profiles.find(p => p.id === user.id);
            const activeSession = sessions.find(s => s.id === user.id);
            
            return (
              <div key={user.id} className="bg-white/5 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="text-white font-bold mb-1">{user.email}</div>
                  <div className="text-xs text-white/40 flex gap-4">
                    <span>Joined: {new Date(user.createdAt || Date.now()).toLocaleDateString()}</span>
                    <span>ID: {user.id.substring(0, 8)}...</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    {profile ? (
                      <span className="px-3 py-1 bg-green-500/20 text-green-400 text-[10px] font-black uppercase tracking-widest rounded-lg h-fit">Profile Set</span>
                    ) : (
                      <span className="px-3 py-1 bg-white/10 text-white/40 text-[10px] font-black uppercase tracking-widest rounded-lg h-fit">No Profile</span>
                    )}

                    {activeSession && activeSession.drinksCount > 0 ? (
                      <span className="px-3 py-1 bg-brand-primary/20 text-brand-primary text-[10px] font-black uppercase tracking-widest rounded-lg shadow-[0_0_15px_rgba(33,150,243,0.3)] h-fit">Active Session</span>
                    ) : (
                      <span className="px-3 py-1 bg-white/10 text-white/40 text-[10px] font-black uppercase tracking-widest rounded-lg h-fit">Inactive</span>
                    )}
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteUser(user.id)}
                  disabled={deletingUserId === user.id}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-300 transition-colors hover:bg-red-500/20 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletingUserId === user.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Delete User
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
