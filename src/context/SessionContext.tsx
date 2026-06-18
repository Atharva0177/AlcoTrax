import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { LoggedDrink, SessionSummary, UserProfile, MedicalInfo, CustomDrink, Badge, Friend, FeedItem } from '../types';
import { useAuth, handleFirestoreError, OperationType } from './AuthContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot, collection, query, orderBy, getDocs, addDoc, where, deleteDoc, limit, updateDoc } from 'firebase/firestore';

interface SessionContextType {
  // Session State
  drinks: LoggedDrink[];
  waterVolume: number;
  startTime: number | null;
  lastDrinkTimestamp: number | null;
  
  // Computed Stats
  bac: number;
  peakBac: number;
  totalCalories: number;
  soberTimeRemaining: number; // in minutes
  unprocessedUnits: number; // For Liver Processing Load
  
  // History
  lastSummary: SessionSummary | null;
  sessionHistory: SessionSummary[];
  recentDrinks: Omit<LoggedDrink, 'id' | 'timestamp' | 'calories' | 'timeSinceLastDrink'>[];
  
  // Profile & Medical Settings
  userProfile: UserProfile;
  medicalInfo: MedicalInfo;
  emergencyContact: { name: string; phone: string } | null;
  homeAddress: string;
  drinkLibrary: CustomDrink[];
  
  // Achievements & Social
  badges: Badge[];
  friends: Friend[];
  
  // Actions
  
    // Multi-user & Social Feed
    feedItems: FeedItem[];
    incomingFriendRequests: Array<{ userId: string; userName: string; userAvatar: string }>;
  
    // Actions
  addDrink: (name: string, abv: number, volume: number, iconUrl?: string, timestamp?: number) => void;
  addWater: () => void;
  startSession: () => void;
  endSession: () => void;
  resetSession: () => void;
  clearSummary: () => void;
  removeDrink: (id: string) => void;
  updateEmergencyContact: (name: string, phone: string) => void;
  updateHomeAddress: (address: string) => void;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  updateMedicalInfo: (info: Partial<MedicalInfo>) => void;
  addCustomDrink: (drink: Omit<CustomDrink, 'id'>) => void;
  removeCustomDrink: (id: string) => void;
  updateAvatar: (avatar: string) => void;
  addFriend: (friend: Friend) => void;
  removeFriend: (userId: string) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  
  // Session State - Persisted for Offline Mode
  const [drinks, setDrinks] = useState<LoggedDrink[]>(() => {
    const saved = localStorage.getItem('activeDrinks');
    return saved ? JSON.parse(saved) : [];
  });
  const [waterVolume, setWaterVolume] = useState(() => {
    const saved = localStorage.getItem('activeWaterVolume');
    return saved ? JSON.parse(saved) : 0;
  });
  const [startTime, setStartTime] = useState<number | null>(() => {
    const saved = localStorage.getItem('activeStartTime');
    return saved ? JSON.parse(saved) : null;
  });
  const [lastDrinkTimestamp, setLastDrinkTimestamp] = useState<number | null>(() => {
    const saved = localStorage.getItem('activeLastDrinkTimestamp');
    return saved ? JSON.parse(saved) : null;
  });

  // Profile & Medical Data
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('userProfile');
    // Default 70kg, Male, 30yo if not set
    return saved ? JSON.parse(saved) : { weight: 70, sex: 'M', age: 30 };
  });

  const [medicalInfo, setMedicalInfo] = useState<MedicalInfo>(() => {
    const saved = localStorage.getItem('medicalInfo');
    return saved ? JSON.parse(saved) : { bloodType: 'Not Set', allergies: [], emergencyContactName: '', emergencyContactPhone: '' };
  });

  const [drinkLibrary, setDrinkLibrary] = useState<CustomDrink[]>(() => {
    const saved = localStorage.getItem('drinkLibrary');
    return saved ? JSON.parse(saved) : [];
  });

  const [badges, setBadges] = useState<Badge[]>(() => {
    const saved = localStorage.getItem('badges');
    return saved ? JSON.parse(saved) : [];
  });

  const [friends, setFriends] = useState<Friend[]>(() => {
    const saved = localStorage.getItem('friends');
    return saved ? JSON.parse(saved) : [];
  });

  // Separate BAC data from friend state to prevent cascading re-subscriptions
  const [friendBacs, setFriendBacs] = useState<Record<string, number>>({});

  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [incomingFriendRequests, setIncomingFriendRequests] = useState<Array<{ userId: string; userName: string; userAvatar: string }>>([]);

  // Cross-tab communication channel
  const broadcastChannelRef = React.useRef<BroadcastChannel | null>(null);
  const friendFeedRef = React.useRef<FeedItem[]>([]);
  
  // Track listener subscriptions to prevent duplicates
  const unsubscribersRef = React.useRef<Record<string, () => void>>({
    profile: () => {},
    friends: () => {},
    feed: () => {},
    incoming: () => {},
    bac: () => {},
  });

  const [bac, setBac] = useState(() => {
    const saved = localStorage.getItem('activeBac');
    return saved ? JSON.parse(saved) : 0;
  });
  const [peakBac, setPeakBac] = useState(() => {
    const saved = localStorage.getItem('activePeakBac');
    return saved ? JSON.parse(saved) : 0;
  });
  const [lastSummary, setLastSummary] = useState<SessionSummary | null>(null);
  const [sessionHistory, setSessionHistory] = useState<SessionSummary[]>(() => {
    const saved = localStorage.getItem('sessionHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [emergencyContact, setEmergencyContact] = useState<{ name: string; phone: string } | null>(() => {
    const saved = localStorage.getItem('emergencyContact');
    return saved ? JSON.parse(saved) : { name: 'Alex (Emergency)', phone: '+1 555-0199' };
  });

  const [recentDrinks, setRecentDrinks] = useState<Omit<LoggedDrink, 'id' | 'timestamp' | 'calories' | 'timeSinceLastDrink'>[]>(() => {
    const saved = localStorage.getItem('recentDrinks');
    return saved ? JSON.parse(saved) : [];
  });

  const [homeAddress, setHomeAddress] = useState<string>(() => {
    return localStorage.getItem('homeAddress') || '';
  });

  const buildOwnFeed = useCallback(() => {
    if (!currentUser) return [] as FeedItem[];

    return sessionHistoryRef.current.map((session, index) => ({
      id: `self-${session.timestamp}-${index}`,
      userId: currentUser.uid,
      userName: userProfileRef.current.displayName || currentUser.displayName || 'You',
      userAvatar:
        userProfileRef.current.avatar || currentUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.uid}`,
      title: `Logged a session with ${session.drinkCount || 0} drinks - ${(session.totalUnits || 0).toFixed(1)} units`,
      time: new Date(session.timestamp).toLocaleDateString(),
      units: session.totalUnits || 0,
      duration: `${session.durationMins || 0}m`,
      peakBac: (session.peakBac || 0).toFixed(3),
      badges: [],
      kudos: 0,
      support: 0,
      timestamp: session.timestamp,
    }));
  }, [currentUser]);

  const stableScore = useCallback((seed: string, max: number) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
      hash = (hash * 31 + seed.charCodeAt(i)) | 0;
    }
    return Math.abs(hash) % max;
  }, []);

  // Fetch from Firestore
  useEffect(() => {
    if (!currentUser) return;
    
    // Fetch Profile
    const profileRef = doc(db, 'profiles', currentUser.uid);
    const unsubProfile = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserProfile({
          userId: currentUser.uid,
          displayName: data.displayName || currentUser.displayName || data.emergencyContactName,
          age: data.age,
          sex: data.sex as any,
          weight: data.weight,
          weeklyLimit: data.weeklyLimit,
          avatar: data.avatar
        });
        setMedicalInfo({
          bloodType: data.bloodType,
          allergies: data.allergies || [],
          emergencyContactName: data.emergencyContactName,
          emergencyContactPhone: data.emergencyContactPhone
        });
        setHomeAddress(data.homeAddress || '');
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `profiles/${currentUser.uid}`);
    });

    // Fetch Session History
    const historyQuery = query(
      collection(db, 'sessionHistory'), 
      where('userId', '==', currentUser.uid),
      orderBy('timestamp', 'desc')
    );
    getDocs(historyQuery).then((snapshot) => {
      const history: SessionSummary[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        history.push({
          totalUnits: data.totalUnits,
          peakBac: data.peakBac,
          durationMins: data.durationMins,
          drinkCount: data.drinkCount,
          totalCalories: data.totalCalories,
          waterVolume: data.waterVolume,
          timestamp: data.timestamp
        });
      });
      setSessionHistory(history);
    }).catch(err => {
      handleFirestoreError(err, OperationType.LIST, 'sessionHistory');
    });
    
    return () => {
      unsubProfile();
    };
  }, [currentUser]);

  // Fetch Friends from Firestore - optimized to prevent cascading updates
  useEffect(() => {
    if (!currentUser) return;

    const friendsQuery = query(
      collection(db, 'userFriends'),
      where('userId', '==', currentUser.uid),
      orderBy('addedAt', 'desc')
    );

    const unsubFriends = onSnapshot(
      friendsQuery,
      async (snapshot) => {
        // Build friend list using cached friend names, fetch profiles only if needed
        const friendsList: Friend[] = [];
        const profilesToFetch: string[] = [];
        
        snapshot.docs.forEach(docSnap => {
          const data = docSnap.data();
          friendsList.push({
            userId: data.friendUserId,
            name: data.name || 'User',  // Use stored name, fall back to 'User'
            avatar: data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.friendUserId}`,
            currentBac: friendBacs[data.friendUserId] || 0,  // Use cached BAC instead of stored
            streak: data.streak || 0,
            addedAt: data.addedAt,
          });
          profilesToFetch.push(data.friendUserId);
        });
        
        // Optionally fetch/update profiles in background (non-blocking)
        if (profilesToFetch.length > 0) {
          Promise.all(
            profilesToFetch.map(friendUserId => 
              getDoc(doc(db, 'publicProfiles', friendUserId))
                .then(snap => {
                  if (snap.exists()) {
                    const profileData = snap.data();
                    // Only update if displayName changed from default
                    setFriends(prev => prev.map(f => 
                      f.userId === friendUserId && !f.name.includes('User')
                        ? f
                        : f.userId === friendUserId
                        ? { ...f, name: profileData.displayName || f.name }
                        : f
                    ));
                  }
                })
                .catch(() => {}) // Silently fail for profile fetches
            )
          ).catch(() => {});
        }
        
        setFriends(friendsList);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'userFriends');
        // Fall back to localStorage
        const saved = localStorage.getItem('friends');
        if (saved) setFriends(JSON.parse(saved));
      }
    );

    unsubscribersRef.current.friends = unsubFriends;
    return () => {
      unsubFriends();
    };
  }, [currentUser, friendBacs]);

  // Sync profile data to Firestore
  useEffect(() => {
    let isMounted = true;

    if (currentUser && userProfile.weight && userProfile.age) {
      const data = {
        userId: currentUser.uid,
        displayName: userProfile.displayName || currentUser.displayName || '',
        weight: userProfile.weight,
        sex: userProfile.sex,
        age: userProfile.age,
        weeklyLimit: userProfile.weeklyLimit || 0,
        bloodType: medicalInfo.bloodType || '',
        allergies: medicalInfo.allergies || [],
        emergencyContactName: medicalInfo.emergencyContactName || emergencyContact?.name || '',
        emergencyContactPhone: medicalInfo.emergencyContactPhone || emergencyContact?.phone || '',
        homeAddress: homeAddress || ''
      };
    }
    
    localStorage.setItem('userProfile', JSON.stringify(userProfile));

    return () => {
      isMounted = false;
    };
  }, [currentUser, userProfile, medicalInfo, emergencyContact, homeAddress]);

  // Sync session state to offline storage
  useEffect(() => { localStorage.setItem('activeDrinks', JSON.stringify(drinks)); }, [drinks]);
  useEffect(() => { localStorage.setItem('activeWaterVolume', JSON.stringify(waterVolume)); }, [waterVolume]);
  useEffect(() => { localStorage.setItem('activeStartTime', JSON.stringify(startTime)); }, [startTime]);
  useEffect(() => { localStorage.setItem('activeLastDrinkTimestamp', JSON.stringify(lastDrinkTimestamp)); }, [lastDrinkTimestamp]);
  useEffect(() => { localStorage.setItem('activeBac', JSON.stringify(bac)); }, [bac]);
  useEffect(() => { localStorage.setItem('activePeakBac', JSON.stringify(peakBac)); }, [peakBac]);

  // Sync activeSession to cloud for admin panel
  useEffect(() => {
    let isMounted = true;
    
    if (currentUser) {
      const sessionRef = doc(db, 'activeSessions', currentUser.uid);
      if (drinks.length > 0) {
        setDoc(sessionRef, {
          drinksCount: drinks.length,
          userId: currentUser.uid,
          bac,
          peakBac,
          waterVolume,
          startTime,
          updatedAt: Date.now()
        }, { merge: true }).catch(err => {
          if (isMounted) {
            console.error("Failed to sync active session", err);
          }
        });
      } else {
        deleteDoc(sessionRef).catch(() => {});
      }
    }

    return () => {
      isMounted = false;
    };
  }, [drinks, waterVolume, bac, peakBac, startTime, currentUser]);

  // Sync profile data
  useEffect(() => { localStorage.setItem('userProfile', JSON.stringify(userProfile)); }, [userProfile]);
  useEffect(() => { localStorage.setItem('medicalInfo', JSON.stringify(medicalInfo)); }, [medicalInfo]);
  useEffect(() => { localStorage.setItem('drinkLibrary', JSON.stringify(drinkLibrary)); }, [drinkLibrary]);
  useEffect(() => { localStorage.setItem('friends', JSON.stringify(friends)); }, [friends]);

  useEffect(() => {
    if (emergencyContact) {
      localStorage.setItem('emergencyContact', JSON.stringify(emergencyContact));
    }
  }, [emergencyContact]);

  useEffect(() => {
    localStorage.setItem('homeAddress', homeAddress);
  }, [homeAddress]);

  useEffect(() => {
    localStorage.setItem('sessionHistory', JSON.stringify(sessionHistory));
  }, [sessionHistory]);

  useEffect(() => {
    localStorage.setItem('recentDrinks', JSON.stringify(recentDrinks));
  }, [recentDrinks]);

  // Cross-tab synchronization with BroadcastChannel
  useEffect(() => {
    // Initialize BroadcastChannel for cross-tab communication
    try {
      const channel = new BroadcastChannel('alcotrax-session');
      broadcastChannelRef.current = channel;

      // Listen for messages from other tabs
      channel.onmessage = (event) => {
        const { type, data } = event.data;
        switch (type) {
          case 'session-update':
            setDrinks(data.drinks);
            setBac(data.bac);
            setPeakBac(data.peakBac);
            setWaterVolume(data.waterVolume);
            setStartTime(data.startTime);
            break;
          case 'profile-update':
            setUserProfile(data);
            break;
          case 'friends-update':
            setFriends(data);
            break;
          default:
            break;
        }
      };

      return () => {
        channel.close();
      };
    } catch (err) {
      // BroadcastChannel not supported in this browser - graceful fallback
      console.log('BroadcastChannel not available, cross-tab sync disabled');
    }
  }, []);

  // Broadcast session updates to other tabs
  useEffect(() => {
    if (broadcastChannelRef.current && (drinks.length > 0 || waterVolume > 0)) {
      broadcastChannelRef.current.postMessage({
        type: 'session-update',
        data: { drinks, bac, peakBac, waterVolume, startTime },
      });
    }
  }, [drinks, bac, peakBac, waterVolume, startTime]);

  // Broadcast profile updates to other tabs
  useEffect(() => {
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: 'profile-update',
        data: userProfile,
      });
    }
  }, [userProfile]);

  // Broadcast friend updates to other tabs
  useEffect(() => {
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: 'friends-update',
        data: friends,
      });
    }
  }, [friends]);

  const calculateCalories = useCallback((drink: { volume: number, abv: number }) => {
    // Approx calculation: Alcohol calories + base carbs/mixer estimate
    const alcoholUnits = (drink.volume * drink.abv) / 1000;
    return Math.round(alcoholUnits * 100); 
  }, []);

  const totalCalories = useMemo(() => {
    const sum = drinks.reduce((acc, d) => acc + (d.calories || 0), 0);
    return isNaN(sum) ? 0 : sum;
  }, [drinks]);

  const soberTimeRemaining = useMemo(() => {
    if (!bac || bac <= 0 || isNaN(bac)) return 0;
    // metabolic rate: 0.015 per hour
    const mins = Math.round((bac / 0.015) * 60);
    return isNaN(mins) ? 0 : mins;
  }, [bac]);

  // Widmark Formula BAC Calculation
  const calculateBac = useCallback(() => {
    if (!startTime || drinks.length === 0) return 0;
    
    const now = Date.now();
    
    // Calculate total alcohol in grams (volume is in ml, density of ethanol is ~0.789 g/ml)
    let totalAlcoholGrams = 0;
    
    // Instead of total units upfront, we should properly account for consumption time, 
    // but simplified total absorption over time is fine for now.
    drinks.forEach(drink => {
      const g = (drink.volume * (drink.abv / 100)) * 0.789;
      totalAlcoholGrams += isNaN(g) ? 0 : g;
    });

    // Widmark ratio based on profile
    // M = 0.68, F = 0.55, O = average (0.615)
    let r = 0.68;
    if (userProfile.sex === 'F') r = 0.55;
    else if (userProfile.sex === 'O') r = 0.615;

    // Weight in grams
    const weightGrams = userProfile.weight * 1000;
    
    let rawBac = 0;
    if (weightGrams > 0) {
      // Widmark formula: BAC = [Alcohol (g) / (Weight (g) * r)] * 100
      rawBac = (totalAlcoholGrams / (weightGrams * r)) * 100;
    }
    
    const elapsedHours = (now - startTime) / (1000 * 60 * 60);
    // Average metabolic removal rate is around 0.015% per hour
    rawBac -= (elapsedHours * 0.015);

    const finalBac = Math.max(0, parseFloat(rawBac.toFixed(3)));
    return isNaN(finalBac) ? 0 : finalBac;
  }, [drinks, startTime, userProfile]);

  const unprocessedUnits = useMemo(() => {
    if (!startTime || drinks.length === 0) return 0;
    const totalUnits = drinks.reduce((acc, drink) => {
      return acc + (((drink.volume || 0) * (drink.abv || 0)) / 1000);
    }, 0);
    const elapsedHours = (Date.now() - startTime) / (1000 * 60 * 60);
    const unitsProcessed = elapsedHours; // ~1 unit/hr processing rate
    return Math.max(0, parseFloat((totalUnits - unitsProcessed).toFixed(2)));
  }, [drinks, startTime]);

  // Badge calculations based on achievements
  const calculatedBadges = useMemo(() => {
    const badgeList: Badge[] = [];
    const now = Date.now();
    const unlockedBadgeIds = new Set(badges.map(b => b.id));

    // First Session badge
    if (sessionHistory.length >= 1 && !unlockedBadgeIds.has('first_session')) {
      badgeList.push({
        id: 'first_session',
        name: 'First Session',
        description: 'Logged your first session',
        icon: 'Rocket',
        color: 'text-blue-400',
        unlockedAt: sessionHistory[sessionHistory.length - 1]?.timestamp || now,
      });
    }

    // 7-Day Streak badge
    if (sessionHistory.length >= 7 && !unlockedBadgeIds.has('seven_day_streak')) {
      badgeList.push({
        id: 'seven_day_streak',
        name: '7-Day Streak',
        description: 'Completed 7 sessions',
        icon: 'Zap',
        color: 'text-yellow-400',
        unlockedAt: now,
      });
    }

    // Met Weekly Limit badge
    const currentWeekStart = new Date();
    currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
    currentWeekStart.setHours(0, 0, 0, 0);

    const weeklyUnits = sessionHistory
      .filter((session) => new Date(session.timestamp).getTime() >= currentWeekStart.getTime())
      .reduce((total, session) => total + (session.totalUnits || 0), 0);

    if (weeklyUnits <= (userProfile.weeklyLimit || 14) && sessionHistory.length > 0 && !unlockedBadgeIds.has('weekly_limit')) {
      badgeList.push({
        id: 'weekly_limit',
        name: 'On Target',
        description: 'Stayed within weekly limit',
        icon: 'Target',
        color: 'text-green-400',
        unlockedAt: now,
      });
    }

    // High Readiness badge (readiness score > 80)
    const avgReadiness = sessionHistory.length > 0 
      ? sessionHistory.reduce((sum, s) => sum + (100 - (s.peakBac * 100)), 0) / sessionHistory.length
      : 0;
    if (avgReadiness > 80 && !unlockedBadgeIds.has('high_readiness')) {
      badgeList.push({
        id: 'high_readiness',
        name: 'Readiness Master',
        description: 'Achieved 80+ readiness score',
        icon: 'Heart',
        color: 'text-red-400',
        unlockedAt: now,
      });
    }

    // Hydration Champion badge (water > 1L in any session)
    if (sessionHistory.some(s => s.waterVolume > 1000) && !unlockedBadgeIds.has('hydration')) {
      badgeList.push({
        id: 'hydration',
        name: 'Hydration Champion',
        description: 'Drank over 1L of water in a session',
        icon: 'Droplet',
        color: 'text-cyan-400',
        unlockedAt: now,
      });
    }

    return badgeList;
  }, [sessionHistory, userProfile.weeklyLimit, badges]);

  useEffect(() => {
    const currentBac = calculateBac();
    setBac(currentBac);
    if (currentBac > peakBac) {
      setPeakBac(currentBac);
    }
  }, [calculateBac, peakBac, drinks]); // trigger on drink changes

  useEffect(() => {
    const interval = setInterval(() => {
      const currentBac = calculateBac();
      setBac(currentBac);
      if (currentBac > peakBac) {
        setPeakBac(currentBac);
      }
    }, 10000); // 10s is plenty for background
    
    return () => clearInterval(interval);
  }, [calculateBac, peakBac]);

  const addDrink = (name: string, abv: number, volume: number, iconUrl?: string, customTimestamp?: number) => {
    const defaultNow = Date.now();
    const now = customTimestamp || defaultNow;
    
    // If no session started yet, or custom timestamp is before the current start time, update start time
    if (!startTime || now < startTime) {
      setStartTime(now);
    }
    
    const timeSinceLastDrink = lastDrinkTimestamp ? now - lastDrinkTimestamp : undefined;
    
    const newDrink: LoggedDrink = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      abv,
      volume,
      timestamp: now,
      calories: calculateCalories({ volume, abv }),
      timeSinceLastDrink,
      iconUrl,
    };
    
    setDrinks(prev => {
      // Keep drinks sorted by timestamp when logging retroactively
      const updated = [...prev, newDrink];
      return updated.sort((a, b) => a.timestamp - b.timestamp);
    });
    
    // Only update lastDrinkTimestamp if this is the newest drink
    if (!lastDrinkTimestamp || now >= lastDrinkTimestamp) {
      setLastDrinkTimestamp(now);
    }

    setRecentDrinks(prev => {
      const filtered = prev.filter(d => d.name !== name || d.abv !== abv);
      return [{ name, abv, volume, iconUrl }, ...filtered].slice(0, 3);
    });
  };

  const addWater = () => {
    setWaterVolume(prev => prev + 250);
  };

  const removeDrink = (id: string) => {
    setDrinks(prev => {
      const updated = prev.filter(d => d.id !== id);
      return updated;
    });
  };

  const startSession = () => {
    if (!startTime) {
      setStartTime(Date.now());
    }
  };

  const endSession = () => {
    if (startTime) {
      const totalUnits = drinks.reduce((acc, drink) => {
        const units = ((drink.volume || 0) * (drink.abv || 0)) / 1000;
        return acc + (isNaN(units) ? 0 : units);
      }, 0);
      const durationMins = Math.floor((Date.now() - startTime) / 60000);
      
      const newSummary = {
        totalUnits: isNaN(totalUnits) ? 0 : totalUnits,
         peakBac: isNaN(peakBac) ? 0 : peakBac,
         durationMins: isNaN(durationMins) ? 0 : durationMins,
         drinkCount: drinks.length,
         totalCalories: isNaN(totalCalories) ? 0 : totalCalories,
         waterVolume: isNaN(waterVolume) ? 0 : waterVolume,
         timestamp: Date.now(),
         consumedDrinks: Object.values(drinks.reduce((acc, d) => {
           if (!acc[d.name]) {
             acc[d.name] = { name: d.name, count: 0 };
             if (d.iconUrl !== undefined) {
               acc[d.name].iconUrl = d.iconUrl;
             }
           }
           acc[d.name].count += 1;
           return acc;
         }, {} as Record<string, { name: string; iconUrl?: string; count: number }>))
       };

       setLastSummary(newSummary);
       setSessionHistory(prev => [newSummary, ...prev]);

       // Sync to Firestore
       if (currentUser) {
         try {
           const id = Math.random().toString(36).substr(2, 9);
           setDoc(doc(db, 'sessionHistory', id), {
             ...newSummary,
             userId: currentUser.uid
           });
         } catch(e) {
           console.error("Failed to sync history", e);
         }
       }
     }

     setDrinks([]);
     setWaterVolume(0);
     setStartTime(null);
     setLastDrinkTimestamp(null);
     setBac(0);
     setPeakBac(0);
   };

  const resetSession = endSession;

  const clearSummary = () => {
    setLastSummary(null);
  };

  const updateHomeAddress = (address: string) => setHomeAddress(address);

  const updateEmergencyContact = (name: string, phone: string) => {
    setEmergencyContact({ name, phone });
  };

  const updateUserProfile = (profile: Partial<UserProfile>) => {
    setUserProfile(prev => ({ ...prev, ...profile }));
  };

  const updateMedicalInfo = (info: Partial<MedicalInfo>) => {
    setMedicalInfo(prev => ({ ...prev, ...info }));
  };

  const addCustomDrink = (drink: Omit<CustomDrink, 'id'>) => {
    const newDrink = { ...drink, id: Math.random().toString(36).substr(2, 9) };
    setDrinkLibrary(prev => [...prev, newDrink]);
  };

  const removeCustomDrink = (id: string) => {
    setDrinkLibrary(prev => prev.filter(d => d.id !== id));
  };

  const updateAvatar = (avatar: string) => {
    setUserProfile(prev => ({ ...prev, avatar }));
  };

  const addFriend = (friend: Friend) => {
    setFriends(prev => {
      const existing = prev.find(f => f.userId === friend.userId);
      if (existing) {
        return prev.map(f => (f.userId === friend.userId ? friend : f));
      }
      return [...prev, friend];
    });

    if (currentUser) {
      const friendData = {
        userId: currentUser.uid,
        friendUserId: friend.userId,
        name: friend.name,
        avatar: friend.avatar,
        currentBac: friend.currentBac || 0,
        streak: friend.streak || 0,
        addedAt: friend.addedAt || Date.now(),
      };

      const friendCollection = collection(db, 'userFriends');
      const friendQuery = query(
        friendCollection,
        where('userId', '==', currentUser.uid),
        where('friendUserId', '==', friend.userId)
      );

      getDocs(friendQuery)
        .then((snapshot) => {
          if (snapshot.empty) {
            return addDoc(friendCollection, friendData);
          }

          return Promise.all(
            snapshot.docs.map((docSnap) => updateDoc(docSnap.ref, friendData))
          );
        })
        .catch((err) => {
          handleFirestoreError(err, OperationType.WRITE, 'userFriends');
        });
    }
  };

  const removeFriend = (userId: string) => {
    setFriends(prev => prev.filter(f => f.userId !== userId));

    // Remove from Firestore
    if (currentUser) {
      const friendRef = query(
        collection(db, 'userFriends'),
        where('userId', '==', currentUser.uid),
        where('friendUserId', '==', userId)
      );

      getDocs(friendRef).then(snapshot => {
        snapshot.forEach(doc => {
          deleteDoc(doc.ref).catch(err => {
            handleFirestoreError(err, OperationType.WRITE, 'userFriends');
          });
        });
      }).catch(err => {
        handleFirestoreError(err, OperationType.LIST, 'userFriends');
      });
    }
  };

  // Real-time friend activity feed - use ref to avoid re-subscription on friends/profile changes
  const friendsRef = React.useRef<Friend[]>([]);
  const sessionHistoryRef = React.useRef<SessionSummary[]>([]);
  const userProfileRef = React.useRef<UserProfile>({} as UserProfile);
  
  React.useEffect(() => {
    friendsRef.current = friends;
  }, [friends]);
  
  React.useEffect(() => {
    sessionHistoryRef.current = sessionHistory;
  }, [sessionHistory]);
  
  React.useEffect(() => {
    userProfileRef.current = userProfile;
  }, [userProfile]);

  useEffect(() => {
    if (!currentUser) {
      setFeedItems([]);
      return;
    }

    const ownFeed = buildOwnFeed();
    if (friendsRef.current.length === 0) {
      friendFeedRef.current = [];
      setFeedItems(ownFeed.sort((a, b) => b.timestamp - a.timestamp));
      return;
    }

    const friendIds = friendsRef.current.map((friend) => friend.userId);
    const feedQuery = query(
      collection(db, 'sessionHistory'),
      where('userId', 'in', friendIds.length > 0 ? friendIds : ['none']),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubFeed = onSnapshot(
      feedQuery,
      (snapshot) => {
        const friendFeed: FeedItem[] = snapshot.docs
          .map((docSnap) => {
            const data = docSnap.data();
            const friendData = friendsRef.current.find((friend) => friend.userId === data.userId);
            if (!friendData) return null;

            const engagementSeed = `${docSnap.id}:${data.userId}:${data.timestamp}`;

            return {
              id: docSnap.id,
              userId: data.userId,
              userName: friendData.name,
              userAvatar:
                friendData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.userId}`,
              title: `Completed session with ${data.drinkCount || 0} drinks - ${(data.totalUnits || 0).toFixed(1)} units`,
              time: new Date(data.timestamp).toLocaleDateString(),
              units: data.totalUnits || 0,
              duration: `${data.durationMins || 0}m`,
              peakBac: (data.peakBac || 0).toFixed(3),
              badges: [],
              kudos: stableScore(`${engagementSeed}:kudos`, 20),
              support: stableScore(`${engagementSeed}:support`, 10),
              timestamp: data.timestamp,
            };
          })
          .filter(Boolean) as FeedItem[];

        friendFeedRef.current = friendFeed;
        setFeedItems([...ownFeed, ...friendFeed].sort((a, b) => b.timestamp - a.timestamp));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'sessionHistory');
        friendFeedRef.current = [];
        setFeedItems(ownFeed.sort((a, b) => b.timestamp - a.timestamp));
      }
    );

    unsubscribersRef.current.feed = unsubFeed;
    return () => {
      unsubFeed();
    };
  }, [currentUser, friends, buildOwnFeed, stableScore]);

  // Keep the combined feed fresh when the current user's own history/profile changes.
  useEffect(() => {
    if (!currentUser) {
      setFeedItems([]);
      return;
    }

    const ownFeed = buildOwnFeed();
    setFeedItems([...ownFeed, ...friendFeedRef.current].sort((a, b) => b.timestamp - a.timestamp));
  }, [currentUser, sessionHistory, userProfile, buildOwnFeed]);

  // Listen for incoming friend requests (when someone adds you) - optimized to avoid cascading getDoc
  useEffect(() => {
    if (!currentUser) return;

    const incomingQuery = query(
      collection(db, 'userFriends'),
      where('friendUserId', '==', currentUser.uid)
    );

    const unsubIncoming = onSnapshot(
      incomingQuery,
      (snapshot) => {
        // Return quickly with basic info, fetch profiles in background if needed
        const requests = snapshot.docs.map(docSnap => {
          const data = docSnap.data();
          return {
            userId: data.userId,
            userName: data.name || 'User',  // Use stored name
            userAvatar: data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.userId}`,
          };
        });
        
        setIncomingFriendRequests(requests);
        
        // Optionally update names in background if profile data exists
        snapshot.docs.forEach(docSnap => {
          const data = docSnap.data();
          getDoc(doc(db, 'publicProfiles', data.userId))
            .then(profileSnap => {
              if (profileSnap.exists()) {
                const profileData = profileSnap.data();
                setIncomingFriendRequests(prev => prev.map(req =>
                  req.userId === data.userId
                    ? { ...req, userName: profileData.displayName || profileData.emergencyContactName || req.userName }
                    : req
                ));
              }
            })
            .catch(() => {}); // Silently fail for background profile fetches
        });
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'userFriends');
      }
    );

    unsubscribersRef.current.incoming = unsubIncoming;
    return () => {
      unsubIncoming();
    };
  }, [currentUser]);

  // Real-time friend BAC updates from activeSessions - use refs to avoid stale closures
  useEffect(() => {
    if (!currentUser || friendsRef.current.length === 0) return;

    // Setup listener for friend BAC updates
    const setupBacListener = () => {
      const friendIds = friendsRef.current.map((friend) => friend.userId);
      if (friendIds.length === 0) return null;
      
      const activeSessionsQuery = query(
        collection(db, 'activeSessions'),
        where('userId', 'in', friendIds)
      );

      return onSnapshot(
        activeSessionsQuery,
        (snapshot) => {
          // Update BAC separately, don't update entire friend object
          const bacUpdates: Record<string, number> = {};
          snapshot.docs.forEach(docSnap => {
            const sessionData = docSnap.data();
            bacUpdates[sessionData.userId] = sessionData.bac || 0;
          });
          
          // Update friend BACs in friend list state if needed
          if (Object.keys(bacUpdates).length > 0) {
            setFriendBacs(bacUpdates);
            setFriends(prev => prev.map(friend => ({
              ...friend,
              currentBac: bacUpdates[friend.userId] ?? friend.currentBac,
            })));
          }
        },
        () => {
          console.log('Active sessions sync not available');
        }
      );
    };

    const unsubActiveSessions = setupBacListener();
    if (unsubActiveSessions) {
      unsubscribersRef.current.bac = unsubActiveSessions;
    }
    
    return () => {
      if (unsubActiveSessions) {
        unsubActiveSessions();
      }
    };
  }, [currentUser]); // Only depend on currentUser, use friendsRef for friend IDs

  return (
    <SessionContext.Provider value={{ 
      drinks, 
      waterVolume, 
      startTime, 
      bac, 
      peakBac, 
      lastSummary, 
      sessionHistory,
      totalCalories,
      soberTimeRemaining,
      unprocessedUnits,
      lastDrinkTimestamp,
      emergencyContact,
      homeAddress,
      recentDrinks,
      userProfile,
      medicalInfo,
      drinkLibrary,
      badges: calculatedBadges,
      friends,
        feedItems,
        incomingFriendRequests,
      addDrink, 
      addWater, 
      startSession,
      endSession,
      resetSession,
      clearSummary,
      removeDrink,
      updateEmergencyContact,
      updateHomeAddress,
      updateUserProfile,
      updateMedicalInfo,
      addCustomDrink,
      removeCustomDrink,
      updateAvatar,
      addFriend,
      removeFriend
    }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used within a SessionProvider');
  return context;
};

