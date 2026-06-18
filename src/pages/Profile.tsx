import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useSession } from "../context/SessionContext";
import { useAuth } from "../context/AuthContext";
import { updateProfile } from "firebase/auth";
import { auth } from "../firebase";
import { db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import {
  Shield,
  Phone,
  AlertTriangle,
  Save,
  CheckCircle2,
  HeartPulse,
  Activity,
  User,
  Star,
  Trash2,
  ChevronDown,
  Mail,
  Edit2,
  Check,
  X,
  Calendar,
  Clock,
  Droplet,
  Trophy,
  Award,
  Target,
  Brain,
  Zap,
  Flame,
  GitCommit,
  Copy,
} from "lucide-react";

// Icon mapping for badge icons
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Trophy,
  Award,
  Target,
  Brain,
  Zap,
  Flame,
  Check,
  Star,
  Heart: HeartPulse,
  Activity,
  GitCommit,
};
import { DrinkIcon } from "../components/DrinkIcon";
import SessionShareImage from "../components/SessionShareImage";
import { cn } from "../lib/utils";

const FRIEND_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateFriendCode() {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += FRIEND_CODE_CHARS.charAt(Math.floor(Math.random() * FRIEND_CODE_CHARS.length));
  }
  return code;
}

const DrinkCard = ({
  drink,
  onRemove,
}: {
  drink: any;
  onRemove: (id: string) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const units = (drink.volume * drink.abv) / 1000;
  const calories = Math.round(units * 100);

  return (
    <div
      className="w-full group p-4 rounded-lg bg-white/5 border border-white/10 hover:border-brand-primary/40 transition-all duration-300 cursor-pointer overflow-hidden"
      onClick={() => setIsExpanded(!isExpanded)}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl transition-all duration-300 bg-brand-primary/10 text-brand-primary group-hover:scale-110">
            <DrinkIcon iconUrl={drink.icon} className="w-6 h-6" />
          </div>
          <div>
            <div className="font-semibold font-display text-sm text-on-surface uppercase tracking-tight">
              {drink.name}
            </div>
            <div className="text-[10px] text-white/40 mt-1 font-bold">
              {drink.abv}% ABV • {drink.volume}ml • ${drink.costPerUnit}/ea
            </div>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(drink.id);
          }}
          className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all hover:scale-110 shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: "auto", opacity: 1, marginTop: 16 }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            className="border-t border-white/5 pt-4 grid grid-cols-3 gap-4"
          >
            <div>
              <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                Units
              </div>
              <div className="text-sm font-semibold mt-1 text-white/80">
                {units.toFixed(1)} u
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                Calories
              </div>
              <div className="text-sm font-semibold mt-1 text-white/80">
                ~{calories} kcal
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                Cost
              </div>
              <div className="text-sm font-semibold mt-1 text-white/80">
                ${drink.costPerUnit.toFixed(2)}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function Profile() {
  const { currentUser } = useAuth();
  const {
    emergencyContact,
    updateEmergencyContact,
    homeAddress,
    updateHomeAddress,
    userProfile,
    updateUserProfile,
    medicalInfo,
    updateMedicalInfo,
    drinkLibrary,
    removeCustomDrink,
    sessionHistory,
    badges,
    updateAvatar,
  } = useSession();

  const [name, setName] = useState(emergencyContact?.name || "");
  const [phone, setPhone] = useState(emergencyContact?.phone || "");
  const [address, setAddress] = useState(homeAddress || "");

  const [weight, setWeight] = useState(userProfile.weight || 70);
  const [sex, setSex] = useState<"M" | "F" | "O">(userProfile.sex || "M");
  const [age, setAge] = useState(userProfile.age || 30);
  const [weeklyLimit, setWeeklyLimit] = useState(userProfile.weeklyLimit || 14);
  const [pacingRateLimit, setPacingRateLimit] = useState(
    userProfile.pacingRateLimit || 1.5,
  );
  const [goals, setGoals] = useState(userProfile.goals || "");

  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState(
    currentUser?.displayName || "",
  );
  const [isSavingDisplayName, setIsSavingDisplayName] = useState(false);

  const [bloodType, setBloodType] = useState(medicalInfo.bloodType || "");
  const [allergies, setAllergies] = useState(
    medicalInfo.allergies.join(", ") || "",
  );

  React.useEffect(() => {
    setWeight(userProfile.weight || 70);
    setSex(userProfile.sex || "M");
    setAge(userProfile.age || 30);
    setWeeklyLimit(userProfile.weeklyLimit || 14);
    setPacingRateLimit(userProfile.pacingRateLimit || 1.5);
    setGoals(userProfile.goals || "");
    setAvatar(userProfile.avatar || "");
  }, [userProfile]);

  React.useEffect(() => {
    setBloodType(medicalInfo.bloodType || "");
    setAllergies(medicalInfo.allergies?.join(", ") || "");
  }, [medicalInfo]);

  React.useEffect(() => {
    if (emergencyContact) {
      setName(emergencyContact.name || "");
      setPhone(emergencyContact.phone || "");
    }
  }, [emergencyContact]);

  React.useEffect(() => {
    setAddress(homeAddress || "");
  }, [homeAddress]);

  const [isSaved, setIsSaved] = useState(false);
  const [librarySortKey, setLibrarySortKey] = useState<
    "name" | "abv" | "volume" | "costPerUnit"
  >("name");
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [avatar, setAvatar] = useState(userProfile.avatar || "");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [copiedFriendCode, setCopiedFriendCode] = useState(false);
  const [publishStatus, setPublishStatus] = useState<'idle' | 'publishing' | 'published' | 'error'>('idle');
  const localFriendCode = React.useMemo(() => {
    if (!currentUser) return null;
    return currentUser.uid.slice(0, 6).toUpperCase();
  }, [currentUser]);

  const sortedDrinkLibrary = React.useMemo(() => {
    return [...drinkLibrary].sort((a, b) => {
      if (librarySortKey === "name") return a.name.localeCompare(b.name);
      if (librarySortKey === "abv") return b.abv - a.abv;
      if (librarySortKey === "volume") return b.volume - a.volume;
      if (librarySortKey === "costPerUnit")
        return b.costPerUnit - a.costPerUnit;
      return 0;
    });
  }, [drinkLibrary, librarySortKey]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateEmergencyContact(name, phone);
    updateHomeAddress(address);
    updateUserProfile({
      weight: Number(weight),
      sex: sex as "M" | "F" | "O",
      age: Number(age),
      weeklyLimit: Number(weeklyLimit),
      pacingRateLimit: Number(pacingRateLimit),
      goals,
    });
    updateMedicalInfo({
      bloodType,
      allergies: allergies
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      emergencyContactName: name,
      emergencyContactPhone: phone,
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handlePublishProfile = async () => {
    if (!auth.currentUser) return;
    setPublishStatus('publishing');
    const uid = auth.currentUser.uid;
    const code = localFriendCode || uid.slice(0, 6).toUpperCase();
    const profileRef = doc(db, 'publicProfiles', uid);
    const codeRef = doc(db, 'friendCodes', code);
    const payload = {
      userId: uid,
      displayName: auth.currentUser.displayName || displayNameInput || '',
      avatar: auth.currentUser.photoURL || avatar || '',
      updatedAt: Date.now(),
      searchKey: uid.toLowerCase(),
      friendCode: code,
    };
    try {
      await setDoc(profileRef, payload, { merge: true });
      await setDoc(codeRef, { userId: uid, friendCode: code, updatedAt: Date.now() }, { merge: true });
      setPublishStatus('published');
      setTimeout(() => setPublishStatus('idle'), 2500);
    } catch (err) {
      console.error('Failed to publish profile', err);
      setPublishStatus('error');
      setTimeout(() => setPublishStatus('idle'), 3000);
    }
  };

  const handleSaveDisplayName = async () => {
    if (!auth.currentUser) return;
    setIsSavingDisplayName(true);
    try {
      await updateProfile(auth.currentUser, { displayName: displayNameInput });
      // Only update the publicProfiles index here. Writing to the full `profiles` document
      // requires the complete profile shape (weight, sex, age, etc.) per security rules.
      await setDoc(
        doc(db, "publicProfiles", auth.currentUser.uid),
        {
          userId: auth.currentUser.uid,
          displayName: displayNameInput,
          avatar: auth.currentUser.photoURL || avatar || "",
          updatedAt: Date.now(),
          searchKey: auth.currentUser.uid.toLowerCase(),
          friendCode: localFriendCode || auth.currentUser.uid.slice(0, 6).toUpperCase(),
        },
        { merge: true }
      );
      setIsEditingDisplayName(false);
      // We don't need to reload, just update the displayName for this session,
      // it will persist in Firebase for the next load. We'll update the state optimistically if needed.
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingDisplayName(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingAvatar(true);
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setAvatar(base64);
        updateAvatar(base64);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Failed to upload avatar:", err);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCopyFriendCode = () => {
    if (localFriendCode) {
      navigator.clipboard.writeText(localFriendCode);
      setCopiedFriendCode(true);
      setTimeout(() => setCopiedFriendCode(false), 2000);
    }
  };

  const currentWeekStart = new Date();
  currentWeekStart.setDate(
    currentWeekStart.getDate() - currentWeekStart.getDay(),
  );
  currentWeekStart.setHours(0, 0, 0, 0);

  const weeklyUnits = sessionHistory
    ? sessionHistory
        .filter(
          (session) =>
            new Date(session.timestamp).getTime() >= currentWeekStart.getTime(),
        )
        .reduce((total, session) => total + (session.totalUnits || 0), 0)
    : 0;

  const weeklyProgressPercentage =
    weeklyLimit > 0 ? Math.min(100, (weeklyUnits / weeklyLimit) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-32">
      <div className="flex flex-col md:flex-row md:items-center gap-4 sm:gap-6 mb-12">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-500 to-red-500 border-4 border-white/10 shrink-0 flex items-center justify-center shadow-2xl relative overflow-hidden">
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-8 h-8 text-white relative z-10" />
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            disabled={isUploadingAvatar}
            className="hidden"
            id="avatar-input-top"
          />
          <label
            htmlFor="avatar-input-top"
            className="absolute bottom-0 right-0 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/50 hover:text-brand-primary transition-colors cursor-pointer border border-white/20 hover:border-brand-primary/40"
            title="Change avatar"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </label>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            {isEditingDisplayName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={displayNameInput}
                  onChange={(e) => setDisplayNameInput(e.target.value)}
                  className="bg-surface-dim border border-white/20 rounded-lg px-3 py-1 font-black font-display tracking-tight text-xl focus:outline-none focus:border-brand-primary"
                  placeholder="Your Name"
                  disabled={isSavingDisplayName}
                />
                <button
                  onClick={handleSaveDisplayName}
                  disabled={isSavingDisplayName}
                  className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                >
                  <Check className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    setIsEditingDisplayName(false);
                    setDisplayNameInput(currentUser?.displayName || "");
                  }}
                  disabled={isSavingDisplayName}
                  className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-black font-display tracking-tight text-on-surface">
                  {auth.currentUser?.displayName ||
                    currentUser?.displayName ||
                    "User Profile"}
                </h1>
                <button
                  onClick={() => setIsEditingDisplayName(true)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-brand-primary transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
          <p className="text-on-surface-variant font-medium mb-3">
            Manage your physiology, identity, and safety settings.
          </p>
          {currentUser && (
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl w-fit">
                <Mail className="w-4 h-4 text-brand-primary" />
                <span className="text-sm font-bold text-white/80">
                  {currentUser.email}
                </span>
              </div>
              <button
                onClick={handleCopyFriendCode}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:border-brand-primary/40 transition-colors group"
                title="Click to copy your friend code"
              >
                <span className="text-xs font-bold text-white/40 uppercase">Code:</span>
                <span className="text-sm font-mono text-white/80 group-hover:text-brand-primary transition-colors">
                  {localFriendCode || '—'}
                </span>
                <Copy className={`w-4 h-4 transition-all ${copiedFriendCode ? 'text-green-400' : 'text-white/40 group-hover:text-brand-primary'}`} />
              </button>
              <button
                onClick={handlePublishProfile}
                disabled={publishStatus === 'publishing'}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:border-brand-primary/40 transition-colors"
                title="Publish your public profile so friends can find you"
              >
                {publishStatus === 'publishing' ? (
                  <>Publishing...</>
                ) : publishStatus === 'published' ? (
                  <>Published</>
                ) : publishStatus === 'error' ? (
                  <>Publish failed</>
                ) : (
                  <>Publish profile</>
                )}
              </button>
              {copiedFriendCode && (
                <motion.span
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-xs font-bold text-green-400"
                >
                  ✓ Copied to clipboard
                </motion.span>
              )}
              <div className="w-full text-xs text-white/40 -mt-2 ml-1">
                Code ready
              </div>
              <div className="text-xs text-white/40">
                Joined:{" "}
                {currentUser.metadata.creationTime
                  ? new Date(
                      currentUser.metadata.creationTime,
                    ).toLocaleDateString()
                  : "Recently"}
              </div>
            </div>
          )}
        </div>
      </div>



      {/* Achievements Badges Section */}
      {badges.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-container rounded-lg border border-white/5 p-4 sm:p-6 lg:p-8 relative overflow-hidden"
        >
          <div className="flex items-center gap-3 mb-8">
            <Star className="w-6 h-6 text-brand-primary" />
            <h2 className="text-2xl font-bold font-display">Achievements</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 relative z-10">
            {badges.map((badge) => {
              const IconComponent = ICON_MAP[badge.icon] || Check;
              return (
                <motion.div
                  key={badge.id}
                  whileHover={{ scale: 1.05 }}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg bg-white/5 border border-white/10 hover:border-brand-primary/40 transition-colors"
                >
                  <div className={`w-12 h-12 rounded-full bg-white/5 flex items-center justify-center ${badge.color}`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-center">{badge.name}</h3>
                  <p className="text-[10px] text-white/40 text-center">{badge.description}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Physiological Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-container rounded-lg border border-white/5 p-4 sm:p-6 lg:p-8 relative overflow-hidden"
        >
          <div className="flex items-center gap-3 mb-8">
            <Activity className="w-6 h-6 text-brand-primary" />
            <h2 className="text-2xl font-bold font-display">
              Physiological Profile
            </h2>
          </div>

          <p className="text-sm text-white/50 mb-6">
            This data is stored securely and used exclusively to calculate
            accurate BAC processing limits (Widmark Formula) and metabolic
            resistance.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">
                Weight (kg)
              </label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full bg-surface-container border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-brand-primary transition-colors font-medium text-on-surface"
                required
                min="1"
                step="0.1"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">
                Biological Sex
              </label>
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value as "M" | "F" | "O")}
                className="w-full bg-surface-container border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-brand-primary transition-colors font-medium text-on-surface appearance-none"
                required
              >
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other / Standardized</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">
                Age
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full bg-surface-container border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-brand-primary transition-colors font-medium text-on-surface"
                required
                min="1"
                step="1"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest">
                  Weekly Limit (Units)
                </label>
                <div className="text-[10px] font-bold uppercase tracking-widest text-brand-primary">
                  {weeklyUnits.toFixed(1)} / {weeklyLimit} Used
                </div>
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={weeklyLimit}
                  onChange={(e) => setWeeklyLimit(Number(e.target.value))}
                  className="w-full bg-surface-container border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-brand-primary transition-colors font-medium text-on-surface pb-[22px]"
                  required
                  min="0"
                  step="0.1"
                />
                <div className="absolute bottom-2 left-5 right-5 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${weeklyProgressPercentage}%` }}
                    className={cn(
                      "h-full rounded-full transition-colors duration-500",
                      weeklyProgressPercentage >= 100
                        ? "bg-red-500"
                        : weeklyProgressPercentage >= 80
                          ? "bg-orange-500"
                          : "bg-brand-primary",
                    )}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">
                Pacing Target (Drinks/Hr)
              </label>
              <input
                type="number"
                value={pacingRateLimit}
                onChange={(e) => setPacingRateLimit(Number(e.target.value))}
                className="w-full bg-surface-container border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-brand-primary transition-colors font-medium text-on-surface"
                required
                min="0.1"
                step="0.1"
              />
            </div>
            <div className="space-y-2 col-span-1 md:col-span-2 lg:col-span-4">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">
                Personal Goals
              </label>
              <textarea
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                placeholder="e.g. I want to limit my weekend drinking, hydrate more frequently..."
                className="w-full bg-surface-container border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-brand-primary transition-colors font-medium text-on-surface min-h-[100px] resize-y"
              />
            </div>
          </div>
        </motion.div>

        {/* Medical Info Card for First Responders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface-container rounded-lg border border-red-500/20 p-8 relative overflow-hidden"
        >
          <div className="flex items-center gap-3 mb-8 text-red-400">
            <HeartPulse className="w-6 h-6" />
            <h2 className="text-2xl font-bold font-display">
              Medical ID (First Responders)
            </h2>
          </div>
          <p className="text-sm text-white/50 mb-6">
            Designed to be accessible from the lock-screen or emergency mode.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">
                Blood Type
              </label>
              <input
                type="text"
                value={bloodType}
                onChange={(e) => setBloodType(e.target.value)}
                placeholder="e.g. O-, A+"
                className="w-full bg-surface-container border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-red-500 transition-colors font-medium text-on-surface"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">
                Allergies (comma separated)
              </label>
              <input
                type="text"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="e.g. Penicillin, Peanuts"
                className="w-full bg-surface-container border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-red-500 transition-colors font-medium text-on-surface"
              />
            </div>
          </div>
        </motion.div>

        {/* Safety Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface-container rounded-lg border border-white/5 p-8 relative overflow-hidden"
        >
          <div className="flex items-center gap-3 mb-8">
            <Shield className="w-6 h-6 text-brand-primary" />
            <h2 className="text-2xl font-bold font-display">
              Safety Configuration
            </h2>
          </div>

          <div className="space-y-8 relative z-10">
            <div className="space-y-6 p-4 sm:p-6 bg-white/5 rounded-lg border border-white/5">
              <div className="flex items-center gap-2 mb-2 text-brand-primary">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Emergency Contact Ping
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex (Friend)"
                    className="w-full bg-surface-container border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-brand-primary transition-colors font-medium text-on-surface"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full bg-surface-container border border-white/10 rounded-2xl pl-12 pr-5 py-4 focus:outline-none focus:border-brand-primary transition-colors font-medium text-on-surface"
                      required
                      pattern="^\+?[\d\s\-\(\)]+$"
                      title="Please enter a valid phone number (e.g., +1 555-555-5555)"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">
                  Home Address (for Safe Routes)
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 123 Main St, New York, NY"
                  className="w-full bg-surface-container border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-brand-primary transition-colors font-medium text-on-surface"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-center gap-6 justify-between pt-6 mt-6 border-t border-white/5">
              <div className="flex items-center gap-2 text-white/20 text-[10px] text-center sm:text-left">
                <Shield className="w-4 h-4 shrink-0" />
                Secure end-to-end encryption active
              </div>

              <motion.button
                type="submit"
                disabled={isSaved}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto justify-center px-8 py-4 bg-brand-primary text-brand-on-primary rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
              >
                {isSaved ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Saved Successfully
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Update Profile & Safety
                  </>
                )}
              </motion.button>
            </div>
          </div>
          <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
            <Shield className="w-64 h-64" />
          </div>
        </motion.div>
      </form>

      {/* Previous Sessions Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-surface-container rounded-lg border border-white/5 p-4 sm:p-8 relative overflow-hidden"
      >
        <div className="flex items-center gap-3 mb-8">
          <Calendar className="w-6 h-6 text-brand-primary" />
          <h2 className="text-2xl font-bold font-display">Previous Sessions</h2>
        </div>

        {sessionHistory && sessionHistory.length > 0 ? (
          <div className="space-y-4 relative z-10">
            {sessionHistory.slice(0, 10).map((session, idx) => (
              <div
                key={idx}
                className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 transition-colors hover:bg-white/[0.07]"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">
                        {new Date(
                          session.timestamp || Date.now(),
                        ).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                      <div className="text-xs text-white/50 mt-1 font-bold">
                        {new Date(
                          session.timestamp || Date.now(),
                        ).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                  <SessionShareImage summary={session} />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-black/20 p-4 rounded-xl border border-white/5">
                  <div>
                    <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1 flex items-center gap-1.5">
                      <Activity className="w-3 h-3 text-brand-primary" />
                      Peak BAC
                    </div>
                    <div className="text-lg font-black text-white">
                      {(session.peakBac || 0).toFixed(3)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1 flex items-center gap-1.5">
                      <Droplet className="w-3 h-3 text-brand-tertiary-container" />
                      Units
                    </div>
                    <div className="text-lg font-black text-white">
                      {(session.totalUnits || 0).toFixed(1)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-green-400" />
                      Duration
                    </div>
                    <div className="text-lg font-black text-white">
                      {Math.floor((session.durationMins || 0) / 60)}h{" "}
                      {(session.durationMins || 0) % 60}m
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1 flex items-center gap-1.5">
                      <Activity className="w-3 h-3 text-orange-400" />
                      Calories
                    </div>
                    <div className="text-lg font-black text-white">
                      {Math.round(session.totalCalories || 0)}
                    </div>
                  </div>
                </div>

                {session.consumedDrinks &&
                  session.consumedDrinks.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-3">
                        Drinks Configured
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {session.consumedDrinks.map((drink, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-xs font-bold text-white/80"
                          >
                            {drink.count > 1 && (
                              <span className="text-brand-primary">
                                {drink.count}x
                              </span>
                            )}
                            {drink.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 relative z-10 bg-white/5 rounded-xl border border-white/5 border-dashed">
            <Calendar className="w-8 h-8 text-white/20 mx-auto mb-4" />
            <p className="text-sm font-medium text-white/40">
              No sessions recorded yet.
            </p>
            <p className="text-xs text-white/30 mt-2">
              Complete a session to see it logged here.
            </p>
          </div>
        )}
      </motion.div>

      {/* Drink Library Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-surface-container rounded-lg border border-white/5 p-8 relative overflow-hidden"
      >
        <div className="flex items-center gap-3 mb-8">
          <Star className="w-6 h-6 text-brand-primary" />
          <h2 className="text-2xl font-bold font-display">
            Saved Drink Library
          </h2>
        </div>

        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-white/50">
            Manage your saved custom drinks.
          </p>
          <div className="relative z-50">
            <button
              type="button"
              onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
              className="bg-surface-container border border-white/10 rounded-lg px-4 py-2 text-xs font-bold text-white/50 hover:text-white hover:border-brand-primary focus:outline-none uppercase tracking-widest transition-all flex items-center gap-2"
            >
              Sort: {librarySortKey === "costPerUnit" ? "Cost" : librarySortKey}{" "}
              <ChevronDown className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {isSortDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -5, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-40 bg-surface-container border border-white/10 rounded-xl shadow-2xl py-2"
                >
                  {["name", "abv", "volume", "costPerUnit"].map((key) => (
                    <button
                      key={key}
                      onClick={() => {
                        setLibrarySortKey(key as any);
                        setIsSortDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors",
                        librarySortKey === key
                          ? "text-brand-primary bg-brand-primary/10"
                          : "text-white/50 hover:text-white hover:bg-white/5",
                      )}
                    >
                      Sort by {key === "costPerUnit" ? "Cost" : key}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {drinkLibrary && drinkLibrary.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
            {sortedDrinkLibrary.map((drink) => (
              <DrinkCard
                key={`profile-lib-${drink.id}`}
                drink={drink}
                onRemove={removeCustomDrink}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 relative z-10 bg-white/5 rounded-xl border border-white/5 border-dashed">
            <Star className="w-8 h-8 text-white/20 mx-auto mb-4" />
            <p className="text-sm font-medium text-white/40">
              Your drink library is empty.
            </p>
            <p className="text-xs text-white/30 mt-2">
              Save custom drinks from your dashboard to reuse them later.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
