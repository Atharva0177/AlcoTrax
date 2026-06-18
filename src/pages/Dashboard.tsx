import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Plus,
  Droplets,
  Beer,
  GlassWater,
  Wine,
  RefreshCw,
  X,
  Upload,
  Coffee,
  Mic,
  Music,
  Camera,
  Heart,
  ShieldCheck,
  Zap,
  Sparkles,
  Timer,
  MapPin,
  Map,
  Martini,
  Grape,
  Cherry,
  Flame,
  Rocket,
  Star,
  Crown,
  Trophy,
  PartyPopper,
  Ghost,
  Download,
  Play,
  Square,
  ChevronDown,
  Brain,
  Search,
} from "lucide-react";
import { useSession } from "../context/SessionContext";

import { DrinkIcon, PRESET_ICONS } from "../components/DrinkIcon";
import SessionShareImage from "../components/SessionShareImage";
import { getDrinkSuggestions } from "../services/AIService";

const LiveTimer = ({
  lastDrinkTimestamp,
}: {
  lastDrinkTimestamp: number | null;
}) => {
  const [time, setTime] = useState(0);

  React.useEffect(() => {
    if (!lastDrinkTimestamp) return;
    const interval = setInterval(() => {
      setTime(Date.now() - lastDrinkTimestamp);
    }, 1000);
    return () => clearInterval(interval);
  }, [lastDrinkTimestamp]);

  if (!lastDrinkTimestamp) return null;

  const mins = isNaN(Math.floor(time / 60000)) ? 0 : Math.floor(time / 60000);
  const secs = isNaN(Math.floor((time % 60000) / 1000))
    ? 0
    : Math.floor((time % 60000) / 1000);

  return (
    <div className="flex flex-col items-center">
      <div className="text-4xl font-semibold font-display tracking-tighter tabular-nums">
        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </div>
      <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mt-1">
        TIME SINCE LAST UNIT
      </div>
    </div>
  );
};

export default function Dashboard() {
  const {
    drinks,
    waterVolume,
    startTime,
    bac,
    lastSummary,
    sessionHistory,
    totalCalories,
    soberTimeRemaining,
    lastDrinkTimestamp,
    emergencyContact,
    homeAddress,
    drinkLibrary,
    userProfile,
    unprocessedUnits,
    addCustomDrink,
    addDrink,
    addWater,
    startSession,
    endSession,
    resetSession,
    clearSummary,
    removeDrink,
  } = useSession();
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [drinkToDelete, setDrinkToDelete] = useState<string | null>(null);
  const [customName, setCustomName] = useState("");
  const [customAbv, setCustomAbv] = useState("");
  const [customVolume, setCustomVolume] = useState("");
  const [customTime, setCustomTime] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedIcon, setSelectedIcon] = useState("Beer");
  const [customImage, setCustomImage] = useState<string | null>(null);

  const [librarySortKey, setLibrarySortKey] = useState<
    "name" | "abv" | "volume" | "costPerUnit"
  >("name");
  const [isIconDropdownOpen, setIsIconDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isDrinkLibraryDropdownOpen, setIsDrinkLibraryDropdownOpen] =
    useState(false);
  const [drinkSuggestion, setDrinkSuggestion] = useState<string | null>(null);

  const [drinkSearchTerm, setDrinkSearchTerm] = useState("");

  useEffect(() => {
    // Only get suggestions if BAC is elevated and user is actively drinking
    if (bac > 0.03 && drinks.length > 0) {
      // Debounce slightly by just running it once per current BAC/drink change
      const fetchSuggestion = async () => {
        const suggestion = await getDrinkSuggestions(
          bac,
          drinks,
          drinkLibrary,
          userProfile.goals,
        );
        setDrinkSuggestion(suggestion);
      };

      const timeoutHover = setTimeout(fetchSuggestion, 2000);
      return () => clearTimeout(timeoutHover);
    } else {
      setDrinkSuggestion(null);
    }
  }, [bac, drinks.length]);

  const sortedDrinkLibrary = useMemo(() => {
    let filtered = [...drinkLibrary];
    if (drinkSearchTerm) {
      const lowerQuery = drinkSearchTerm.toLowerCase();
      filtered = filtered.filter((d) =>
        d.name.toLowerCase().includes(lowerQuery),
      );
    }
    return filtered.sort((a, b) => {
      if (librarySortKey === "name") return a.name.localeCompare(b.name);
      if (librarySortKey === "abv") return b.abv - a.abv;
      if (librarySortKey === "volume") return b.volume - a.volume;
      if (librarySortKey === "costPerUnit")
        return b.costPerUnit - a.costPerUnit;
      return 0;
    });
  }, [drinkLibrary, librarySortKey, drinkSearchTerm]);

  const handleSafeRoute = () => {
    if (!homeAddress) {
      alert("Please set your home address in your profile first.");
      return;
    }

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const origin = `${latitude},${longitude}`;
          const destination = encodeURIComponent(homeAddress);
          const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=walking`;
          window.open(url, "_blank");
        },
        (error) => {
          console.error("Error getting location:", error);
          // Fallback to just destination if origin fails
          const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(homeAddress)}&travelmode=walking`;
          window.open(url, "_blank");
        },
      );
    } else {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(homeAddress)}&travelmode=walking`;
      window.open(url, "_blank");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomImage(reader.result as string);
        setSelectedIcon("custom");
      };
      reader.readAsDataURL(file);
    }
  };

  const sessionDuration = useMemo(() => {
    if (!startTime) return "Not started";
    const mins = Math.floor((Date.now() - startTime) / 60000);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  }, [startTime]);

  const dashOffset = useMemo(() => {
    // Max BAC scale for gauge is 0.15
    const safeBac = isNaN(bac) ? 0 : bac;
    const percentage = Math.min(safeBac / 0.15, 1);
    const offset = 276 * (1 - percentage);
    return isNaN(offset) ? 276 : offset;
  }, [bac]);

  const clarityIndex = useMemo(() => {
    let index = Math.max(0, 100 - bac * 800);
    if (waterVolume > 0) {
      index = Math.min(100, index + (waterVolume / 250) * 2);
    }
    return Math.round(index);
  }, [bac, waterVolume]);

  const metabolicState = useMemo(() => {
    if (bac <= 0.005) return "Resting";
    if (bac < 0.04) return "Active Processing";
    if (bac < 0.08) return "High Load";
    return "Overloaded";
  }, [bac]);

  const timeToSober = useMemo(() => {
    if (!bac || bac <= 0 || isNaN(bac)) return "0 HOURS";
    const hours = bac / 0.015;
    return `~ ${isNaN(hours) ? 0 : hours.toFixed(1)} HOURS`;
  }, [bac]);

  const sleepImpact = useMemo(() => {
    if (bac <= 0.01)
      return { decrease: 0, score: "A+", color: "text-brand-primary" };
    if (bac <= 0.03)
      return {
        decrease: 15,
        score: "B",
        color: "text-brand-tertiary-container",
      };
    if (bac <= 0.05)
      return { decrease: 30, score: "C", color: "text-brand-tertiary" };
    if (bac <= 0.08)
      return { decrease: 45, score: "D", color: "text-brand-error" };
    return { decrease: 60, score: "F", color: "text-red-500" };
  }, [bac]);

  const drinksToLog = [
    {
      name: "Beer (Bottle)",
      stats: "5% ABV • 550ml",
      description: "Standard lager or ale.",
      abv: 5,
      volume: 550,
      icon: Beer,
      color: "bg-brand-primary/10 text-brand-primary",
    },
    {
      name: "Beer (Pint)",
      stats: "4.5% ABV • 330ml",
      description: "A full draft pint.",
      abv: 4.5,
      volume: 330,
      icon: Beer,
      color: "bg-amber-500/10 text-amber-500",
    },
    {
      name: "Wine (Small)",
      stats: "12% ABV • 125ml",
      description: "A small pour of wine.",
      abv: 12,
      volume: 125,
      icon: Wine,
      color: "bg-indigo-500/10 text-indigo-400",
    },
    {
      name: "Wine (Large)",
      stats: "12% ABV • 250ml",
      description: "A generous glass of wine.",
      abv: 12,
      volume: 250,
      icon: Wine,
      color: "bg-rose-500/10 text-rose-400",
    },
    {
      name: "Single Spirit",
      stats: "40% ABV • 30ml",
      description: "Standard single measure.",
      abv: 40,
      volume: 30,
      icon: GlassWater,
      color: "bg-purple-500/10 text-purple-400",
    },
    {
      name: "Double Spirit",
      stats: "40% ABV • 60ml",
      description: "Double measure with mixer.",
      abv: 40,
      volume: 60,
      icon: GlassWater,
      color: "bg-fuchsia-500/10 text-fuchsia-400",
    },
    {
      name: "Hard Seltzer",
      stats: "4.5% ABV • 330ml",
      description: "Canned alcoholic seltzer.",
      abv: 4.5,
      volume: 330,
      icon: Beer,
      color: "bg-cyan-500/10 text-cyan-400",
    },
    {
      name: "Cocktail",
      stats: "15% ABV • 150ml",
      description: "Mixed spirit drink.",
      abv: 15,
      volume: 150,
      icon: Wine,
      color: "bg-pink-500/10 text-pink-400",
    },
    {
      name: "Shot",
      stats: "40% ABV • 44ml",
      description: "Neat spirit or liqueur.",
      abv: 40,
      volume: 44,
      icon: GlassWater,
      color: "bg-red-500/10 text-red-500",
    },
  ];

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const abv = parseFloat(customAbv);
    const volume = parseFloat(customVolume);

    if (!customName || isNaN(abv) || isNaN(volume)) {
      setFormError("Please fill in all fields correctly.");
      return;
    }

    if (abv <= 0 || abv > 100) {
      setFormError("ABV must be between 0.1% and 100%.");
      return;
    }

    if (volume <= 0) {
      setFormError("Volume must be a positive number.");
      return;
    }

    addDrink(customName, abv, volume, customImage || selectedIcon);

    setCustomName("");
    setCustomAbv("");
    setCustomVolume("");
    setCustomImage(null);
    setSelectedIcon("Beer");
    setShowCustomForm(false);
  };

  const pacingRate = useMemo(() => {
    if (!startTime || drinks.length < 2) return 0;
    const durationHrs = (Date.now() - startTime) / 3600000;
    return drinks.length / Math.max(durationHrs, 0.5); // Min 30m base
  }, [drinks.length, startTime]);

  const formatWater = (ml: number) => {
    if (ml >= 1000) return `${(ml / 1000).toFixed(1)}L`;
    return `${ml}ml`;
  };

  const needsWater = useMemo(() => {
    if (!startTime || waterVolume >= 250) return false;
    const sessionMins = (Date.now() - startTime) / 60000;
    return sessionMins > 45;
  }, [startTime, waterVolume]);

  const exportToCSV = () => {
    if (!sessionHistory.length) return;

    const headers = [
      "Timestamp",
      "Date",
      "Peak BAC",
      "Drink Count",
      "Total Units",
      "Duration (mins)",
      "Calories",
      "Water (ml)",
    ];
    const rows = sessionHistory.map((h) => [
      h.timestamp,
      new Date(h.timestamp).toLocaleString(),
      h.peakBac.toFixed(3),
      h.drinkCount,
      h.totalUnits.toFixed(1),
      h.durationMins,
      h.totalCalories,
      h.waterVolume,
    ]);

    const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `bac_session_history_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const mapsUrl = homeAddress
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(homeAddress)}&travelmode=walking`
    : null;

  const recommendation = useMemo(() => {
    const safeBac = isNaN(bac) ? 0 : bac;
    const pace = isNaN(pacingRate) ? 0 : pacingRate;
    const targetPace = userProfile.pacingRateLimit || 1.5;

    if (safeBac >= 0.08) {
      return {
        message: `You're at ${safeBac.toFixed(3)}% — Strict stop required. Switch to water immediately.`,
        type: "danger",
        action: "water",
      };
    }

    if (safeBac >= 0.05) {
      return {
        message: `You're at ${safeBac.toFixed(3)}% — Caution territory. A long water break will help you recover more safely.`,
        type: "caution",
        action: "water",
      };
    }

    if (pace > targetPace + 1.0) {
      return {
        message: `High pace detected (${pace.toFixed(1)} > ${targetPace.toFixed(1)} target). Strictly slow down with water to avoid a rapid BAC spike.`,
        type: "danger",
        action: "water",
      };
    }

    if (pace > targetPace + 0.4) {
      return {
        message: `Pace is aggressive (${pace.toFixed(1)}/hr). Moderating with a mocktail or seltzer will extend your optimal zone.`,
        type: "caution",
        action: "water",
      };
    }

    if (pace > targetPace) {
      return {
        message: `Pacing is slightly above your target (${targetPace.toFixed(1)}/hr). Consider a lower-ABV drink next.`,
        type: "pace",
        action: "light",
      };
    }

    if (safeBac < 0.02) {
      return {
        message:
          "Session starting. A standard beer or wine is a great way to ease in.",
        type: "neutral",
        action: "standard",
      };
    }

    return {
      message: `You're at ${safeBac.toFixed(3)}% and pacing well (${pace.toFixed(1)}/hr). A light beer keeps you in the optimal zone.`,
      type: "optimal",
      action: "light",
    };
  }, [bac, pacingRate, userProfile.pacingRateLimit]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 300, damping: 24 },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight font-display text-on-surface">
            Active Tracking
          </h1>
          <p className="text-white/40 text-sm mt-2">
            {!startTime
              ? "No session active"
              : `Started ${sessionDuration} ago • `}{" "}
            <span className="text-white font-bold">{drinks.length} DRINKS</span>{" "}
            LOGGED
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 md:gap-4 mt-2 md:mt-0">
          {!startTime ? (
            <button
              onClick={startSession}
              className="flex items-center gap-2 px-6 py-2 bg-brand-primary text-brand-on-primary rounded font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all  "
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Start Session
            </button>
          ) : (
            <button
              onClick={endSession}
              className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              End Session
            </button>
          )}

          <button
            onClick={resetSession}
            className="p-2 text-white/20 hover:text-white transition-colors"
            title="Reset Session"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 px-4 py-1.5 bg-brand-primary/10 rounded border border-brand-primary/20">
            <div className="w-2.5 h-2.5 rounded-full bg-brand-primary animate-pulse" />
            <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] font-display">
              Live Session
            </span>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {lastSummary && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-brand-primary rounded-lg p-4 sm:p-6 text-brand-on-primary relative group mb-8">
              <button
                onClick={clearSummary}
                className="absolute top-6 right-6 p-2 bg-brand-on-primary/10 rounded-full hover:bg-brand-on-primary/20 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 lg:gap-8">
                <div className="flex flex-col gap-4">
                  <div>
                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 opacity-50">
                      Last Session Summary
                    </h2>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-semibold font-display tracking-tighter">
                        {(lastSummary.totalUnits || 0).toFixed(1)}
                      </span>
                      <span className="text-xl font-bold uppercase tracking-widest opacity-50">
                        Units
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={exportToCSV}
                      className="flex items-center gap-2 px-4 py-2 bg-surface-dim text-brand-primary rounded-xl font-black uppercase tracking-widest text-[9px] hover:scale-105 active:scale-95 transition-all w-fit"
                    >
                      <Download className="w-3 h-3" />
                      Export Full History (CSV)
                    </button>
                    <SessionShareImage summary={lastSummary} />
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    {
                      label: "Peak BAC",
                      value: `${(lastSummary.peakBac || 0).toFixed(3)}%`,
                    },
                    { label: "Drinks", value: lastSummary.drinkCount || 0 },
                    {
                      label: "Duration",
                      value: `${Math.floor((lastSummary.durationMins || 0) / 60)}h ${(lastSummary.durationMins || 0) % 60}m`,
                    },
                    {
                      label: "Hydration",
                      value: formatWater(lastSummary.waterVolume || 0),
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="p-4 bg-surface-dim/5 rounded-2xl border border-black/5"
                    >
                      <div className="text-[8px] font-black uppercase tracking-[0.1em] mb-1 opacity-40">
                        {stat.label}
                      </div>
                      <div className="font-bold font-display">{stat.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <div className="space-y-4 mb-8">
        {pacingRate > (userProfile.pacingRateLimit || 1.5) + 0.4 &&
          drinks.length >= 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-brand-secondary p-4 rounded-lg text-brand-on-primary flex items-center justify-between border border-black/5 "
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-brand-on-primary/10 rounded-xl">
                  <Timer className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <span className="font-black font-display uppercase tracking-widest text-[10px]">
                    Speed Alert:{" "}
                    {(isNaN(pacingRate) ? 0 : pacingRate).toFixed(1)} vs{" "}
                    {userProfile.pacingRateLimit?.toFixed(1) || "1.5"} Drinks/HR
                    Target
                  </span>
                  <p className="text-[12px] font-medium opacity-80 mt-1 max-w-[280px] sm:max-w-md">
                    Your current pace significantly exceeds your goal. Consider
                    skipping the next round and shifting to hydration.
                  </p>
                </div>
              </div>
              <div className="hidden sm:block px-4 py-2 bg-surface-dim text-white rounded text-[10px] font-black uppercase tracking-widest shrink-0 shadow-lg">
                Slow Down
              </div>
            </motion.div>
          )}

        {needsWater && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-brand-tertiary p-4 rounded-lg text-brand-on-primary flex items-center justify-between border border-black/5"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-brand-on-primary/10 rounded-xl">
                <Droplets className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <span className="font-black font-display uppercase tracking-widest text-[10px]">
                  Hydration Phase
                </span>
                <p className="text-[12px] font-medium opacity-60">
                  Session active for 45m+. Adding 250ml of water is vital right
                  now.
                </p>
              </div>
            </div>
            <button
              onClick={addWater}
              className="px-6 py-2 bg-surface-dim text-white rounded text-[10px] font-black uppercase tracking-widest"
            >
              +250ml
            </button>
          </motion.div>
        )}
      </div>

      {/* Bento Layout Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-12 gap-4"
      >
        {/* BAC Status Card (Large Bento) */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-6 bg-surface-container rounded-lg border border-white/5 p-6 lg:p-8 transition-all hover:border-white/10 relative overflow-hidden flex flex-col group"
        >
          <div className="w-full flex justify-between items-start sm:items-center gap-4 z-20 mb-6">
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary font-display max-w-[50%]">
              Real-time BAC Index
            </div>

            <div className="flex gap-2">
              <div
                className={cn(
                  "px-4 py-2 backdrop-blur-xl rounded-full text-[10px] font-black uppercase tracking-widest border  transition-all duration-700",
                  bac < 0.05
                    ? "bg-brand-primary/20 text-brand-primary border-brand-primary/30 "
                    : bac < 0.08
                      ? "bg-brand-tertiary-container/20 text-brand-tertiary-container border-orange-500/30 "
                      : "bg-brand-error/20 text-brand-error border-red-500/30 ",
                )}
              >
                {bac < 0.05
                  ? "Safety Zone"
                  : bac < 0.08
                    ? "Caution"
                    : "High Risk"}
              </div>
            </div>
          </div>

          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-transparent pointer-events-none z-0" />

          <div className="flex-1 w-full flex flex-col items-center justify-center z-10 py-4 lg:py-6">
            {/* Circular Gauge */}
            <div className="relative w-64 h-64 flex items-center justify-center">
              <svg
                className="w-full h-full -rotate-90 transform"
                viewBox="0 0 100 100"
              >
                <defs>
                  <linearGradient
                    id="gaugeGradient"
                    x1="100%"
                    y1="0%"
                    x2="0%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor="#57f1db" />
                    <stop offset="50%" stopColor="#ffad3a" />
                    <stop offset="100%" stopColor="#ffb4ab" />
                  </linearGradient>
                  <filter id="gaugeGlow">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feComposite
                      in="SourceGraphic"
                      in2="blur"
                      operator="over"
                    />
                  </filter>
                </defs>
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                {/* Caution Marker (0.05 BAC = 33.3% = 120deg) */}
                <g transform="rotate(120 50 50)">
                  <line
                    x1="90"
                    y1="50"
                    x2="98"
                    y2="50"
                    stroke="#ffad3a"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </g>
                {/* High Risk Marker (0.08 BAC = 53.3% = 192deg) */}
                <g transform="rotate(192 50 50)">
                  <line
                    x1="90"
                    y1="50"
                    x2="98"
                    y2="50"
                    stroke="#ffb4ab"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </g>
                <motion.circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="url(#gaugeGradient)"
                  strokeWidth="6"
                  strokeDasharray="276"
                  strokeLinecap="round"
                  initial={{ strokeDashoffset: 276 }}
                  animate={{ strokeDashoffset: dashOffset }}
                  transition={{ type: "spring", damping: 25, stiffness: 60 }}
                  filter="url(#gaugeGlow)"
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-5xl font-bold font-display text-on-surface tracking-tighter">
                  {(isNaN(bac) ? 0 : bac).toFixed(3)}
                  <span className="text-xl text-white/30 ml-1">%</span>
                </div>
                <div
                  className={cn(
                    "text-[11px] font-black uppercase tracking-[0.4em] font-display mt-4 transition-colors duration-700",
                    bac < 0.05
                      ? "text-brand-primary"
                      : bac < 0.08
                        ? "text-brand-tertiary-container"
                        : "text-brand-error",
                  )}
                >
                  {bac < 0.02
                    ? "Status: Clear"
                    : bac < 0.05
                      ? "Status: Optimal"
                      : bac < 0.08
                        ? "Status: Buzzed"
                        : "Status: Impaired"}
                </div>
              </div>
            </div>

            {/* BAC Level Legend */}
            <div className="flex flex-wrap justify-center bg-surface-container rounded-full px-4 py-2 gap-2 sm:gap-3 mt-6 z-10 border border-white/5 backdrop-blur-md">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-brand-primary"></span>
                <span className="text-[9px] uppercase tracking-widest font-black text-white/50 border-r border-white/10 pr-3">
                  Safe
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-brand-tertiary-container"></span>
                <span className="text-[9px] uppercase tracking-widest font-black text-white/50 border-r border-white/10 pr-3">
                  Caution
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-brand-error"></span>
                <span className="text-[9px] uppercase tracking-widest font-black text-white/50">
                  Risk
                </span>
              </div>
            </div>

            {/* Pacing Indicator */}
            <div className="w-full max-w-sm mt-6 pt-6 border-t border-white/5 z-10 flex flex-col gap-2 relative">
              <div className="flex justify-between items-end">
                <div className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40 font-display">
                  Drink Pacing
                </div>
                <div
                  className={cn(
                    "text-[10px] font-black uppercase tracking-widest font-display",
                    pacingRate > (userProfile.pacingRateLimit || 1.5) + 0.5
                      ? "text-brand-error"
                      : pacingRate > (userProfile.pacingRateLimit || 1.5)
                        ? "text-brand-tertiary-container"
                        : "text-white/60",
                  )}
                >
                  {(isNaN(pacingRate) ? 0 : pacingRate).toFixed(1)} / hr
                </div>
              </div>

              <div className="relative h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className={cn(
                    "absolute top-0 left-0 h-full rounded-full transition-colors duration-500",
                    pacingRate > (userProfile.pacingRateLimit || 1.5) + 0.5
                      ? "bg-brand-error shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                      : pacingRate > (userProfile.pacingRateLimit || 1.5)
                        ? "bg-brand-tertiary-container"
                        : "bg-white/20",
                  )}
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.min((pacingRate / Math.max(3, (userProfile.pacingRateLimit || 1.5) * 2)) * 100, 100)}%`,
                  }}
                  transition={{ type: "spring", stiffness: 50 }}
                />
                {/* Recommended marker */}
                <div
                  className="absolute top-0 bottom-0 w-[1px] bg-white/40 z-10"
                  style={{
                    left: `${Math.min(((userProfile.pacingRateLimit || 1.5) / Math.max(3, (userProfile.pacingRateLimit || 1.5) * 2)) * 100, 100)}%`,
                  }}
                />
              </div>

              <AnimatePresence>
                {pacingRate > (userProfile.pacingRateLimit || 1.5) && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className={cn(
                      "text-[8px] font-bold mt-1 text-right transition-opacity duration-300 uppercase tracking-widest",
                      pacingRate > (userProfile.pacingRateLimit || 1.5) + 0.5
                        ? "text-brand-error/80"
                        : "text-brand-tertiary-container/80",
                    )}
                  >
                    {pacingRate > (userProfile.pacingRateLimit || 1.5) + 0.5
                      ? "pace too fast. hydrate."
                      : "above recommended pace."}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full max-w-sm mt-6 pt-6 border-t border-white/5 z-10">
              <div className="text-center group">
                <LiveTimer lastDrinkTimestamp={lastDrinkTimestamp} />
              </div>

              <div className="text-center group">
                <div className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20 mb-2 font-display">
                  Time to 0.00%
                </div>
                <div className="text-xl font-semibold text-on-surface font-display group-hover:text-brand-primary transition-colors">
                  {soberTimeRemaining > 0 ? (
                    <>
                      {Math.floor(soberTimeRemaining / 60)}h{" "}
                      {soberTimeRemaining % 60}m
                    </>
                  ) : (
                    "NOW"
                  )}
                </div>
              </div>

              <div className="text-center pt-4 border-t border-white/5">
                <div className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20 mb-1 font-display">
                  Clarity Index
                </div>
                <div
                  className={`text-sm font-bold font-display ${clarityIndex < 50 ? "text-brand-error" : clarityIndex < 80 ? "text-brand-tertiary-container" : "text-brand-primary"}`}
                >
                  {clarityIndex}%
                </div>
              </div>

              <div className="text-center pt-4 border-t border-white/5">
                <div className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20 mb-1 font-display">
                  Metabolic State
                </div>
                <div className="text-sm font-bold text-on-surface font-display">
                  {metabolicState}
                </div>
              </div>
            </div>

            <div className="w-full max-w-sm mt-6 z-10">
              <button
                onClick={addWater}
                className="w-full group rounded-2xl bg-surface-container border border-brand-primary/20 hover:border-brand-primary/40 transition-all flex flex-col overflow-hidden relative active:scale-[0.98] min-h-[100px]"
              >
                {/* Liquid Background */}
                <div
                  className="absolute bottom-0 left-0 right-[-100%] h-full bg-brand-primary/15 transition-all duration-1000 ease-in-out z-0 flex items-start"
                  style={{
                    transform: `translateY(${100 - Math.min(100, Math.max(0, ((waterVolume || 0) / 2000) * 100))}%)`,
                  }}
                >
                  {/* Wave SVG elements - rendering multiple for parallax effect */}
                  <div className="absolute top-[-10px] left-0 w-[200%] h-4 flex animate-wave">
                    <svg
                      viewBox="0 0 1000 20"
                      preserveAspectRatio="none"
                      className="h-full w-[50%] fill-brand-primary/20"
                    >
                      <path d="M0,10 C150,20 350,0 500,10 C650,20 850,0 1000,10 L1000,20 L0,20 Z" />
                    </svg>
                    <svg
                      viewBox="0 0 1000 20"
                      preserveAspectRatio="none"
                      className="h-full w-[50%] fill-brand-primary/20"
                    >
                      <path d="M0,10 C150,20 350,0 500,10 C650,20 850,0 1000,10 L1000,20 L0,20 Z" />
                    </svg>
                  </div>
                  <div className="absolute top-[-15px] left-0 w-[200%] h-6 flex animate-wave-slow">
                    <svg
                      viewBox="0 0 1000 20"
                      preserveAspectRatio="none"
                      className="h-full w-[50%] fill-brand-primary/10"
                    >
                      <path d="M0,10 C200,0 300,20 500,10 C700,0 800,20 1000,10 L1000,20 L0,20 Z" />
                    </svg>
                    <svg
                      viewBox="0 0 1000 20"
                      preserveAspectRatio="none"
                      className="h-full w-[50%] fill-brand-primary/10"
                    >
                      <path d="M0,10 C200,0 300,20 500,10 C700,0 800,20 1000,10 L1000,20 L0,20 Z" />
                    </svg>
                  </div>
                  <div className="w-full h-full bg-brand-primary/10 absolute top-0 left-0" />
                </div>

                <div className="relative z-10 flex items-center p-5 w-full h-full gap-4 text-left">
                  <div className="p-3 rounded-xl bg-brand-primary/20 text-brand-primary">
                    <Droplets className="w-5 h-5 fill-current" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold font-display text-sm text-brand-on-primary uppercase tracking-tight flex items-center justify-between">
                      <span className="text-white">Hydration</span>
                      <span className="text-brand-primary">
                        {Math.min(
                          100,
                          Math.max(0, ((waterVolume || 0) / 2000) * 100),
                        ).toFixed(0)}
                        %
                      </span>
                    </div>
                    <div className="text-[10px] text-white/50 mt-1 font-bold">
                      {formatWater(waterVolume || 0)} / 2000ml
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:bg-brand-primary hover:text-brand-on-primary flex items-center justify-center text-white transition-colors">
                    <Plus className="w-4 h-4" />
                  </div>
                </div>
              </button>
            </div>

            {/* Safe Route Home Activation Section */}
            <AnimatePresence>
              {bac >= 0.05 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="w-full max-w-sm mt-6 z-10 overflow-hidden"
                >
                  {mapsUrl ? (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-red-500 active:scale-[0.98] transition-all  "
                    >
                      <MapPin className="w-4 h-4" />
                      Active Safe Route Home
                    </a>
                  ) : (
                    <Link
                      to="/profile"
                      className="w-full py-4 bg-white/5 text-white/40 border border-white/10 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-white/10 hover:text-white transition-all "
                    >
                      <Map className="w-4 h-4" />
                      Configure Home for Safe Route
                    </Link>
                  )}
                  <p className="text-[8px] text-center mt-3 text-white/20 font-bold uppercase tracking-widest">
                    {mapsUrl
                      ? "Route calculated via optimized walking paths"
                      : "Set address to enable one-tap navigation"}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Quick Add Grid (Vertical Bento) */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-6 flex flex-col bg-surface-container rounded-lg border border-white/5 p-6 transition-all hover:border-white/10"
        >
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 font-display">
                Log Consumption
              </h2>
              {showCustomForm && (
                <button
                  onClick={() => setShowCustomForm(false)}
                  className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-3 h-3 text-white/40" />
                </button>
              )}
            </div>

            <div className="overflow-y-auto pr-2 custom-scrollbar relative flex flex-col">
              <AnimatePresence mode="wait">
                {!showCustomForm ? (
                  <motion.div
                    key="presets"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex flex-col space-y-3"
                  >
                    {/* Search Bar */}
                    <div className="relative mb-4 z-20">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input
                        type="text"
                        placeholder="Search standard and saved drinks..."
                        value={drinkSearchTerm}
                        onChange={(e) => setDrinkSearchTerm(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-on-surface placeholder:text-white/20 focus:outline-none focus:border-brand-primary/50 transition-colors"
                      />
                      {drinkSearchTerm && (
                        <button
                          onClick={() => setDrinkSearchTerm("")}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 text-white/40"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Saved Drink Library */}
                    {sortedDrinkLibrary && sortedDrinkLibrary.length > 0 && (
                      <div className="pb-4 mb-4 border-b border-white/5">
                        <div className="flex items-center justify-between mb-3 relative z-20">
                          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary font-display flex items-center gap-2">
                            <Star className="w-3 h-3" /> Saved Drinks
                          </h3>
                          <div className="relative">
                            <button
                              onClick={() =>
                                setIsSortDropdownOpen(!isSortDropdownOpen)
                              }
                              className="bg-surface-container border border-white/10 rounded px-3 py-1.5 text-[9px] text-white/50 hover:text-white hover:border-white/20 focus:outline-none focus:border-brand-primary uppercase tracking-widest font-black transition-all flex items-center gap-1"
                            >
                              Sort: {librarySortKey}{" "}
                              <ChevronDown className="w-3 h-3 ml-1" />
                            </button>
                            <AnimatePresence>
                              {isSortDropdownOpen && (
                                <motion.div
                                  initial={{ opacity: 0, y: -5, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: -5, scale: 0.95 }}
                                  className="absolute right-0 top-full mt-2 w-32 bg-surface-container border border-white/10 rounded-xl shadow-2xl py-2 z-50"
                                >
                                  {["name", "abv", "volume", "costPerUnit"].map(
                                    (key) => (
                                      <button
                                        key={key}
                                        onClick={() => {
                                          setLibrarySortKey(key as any);
                                          setIsSortDropdownOpen(false);
                                        }}
                                        className={cn(
                                          "w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors",
                                          librarySortKey === key
                                            ? "text-brand-primary bg-brand-primary/10"
                                            : "text-white/50 hover:text-white hover:bg-white/5",
                                        )}
                                      >
                                        {key === "costPerUnit" ? "Cost" : key}
                                      </button>
                                    ),
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        <div className="relative z-10">
                          <button
                            onClick={() =>
                              setIsDrinkLibraryDropdownOpen(
                                !isDrinkLibraryDropdownOpen,
                              )
                            }
                            className={cn(
                              "w-full flex items-center justify-between p-4 rounded-xl border transition-all",
                              isDrinkLibraryDropdownOpen
                                ? "bg-brand-primary/10 border-brand-primary/30 text-brand-primary"
                                : "bg-white/[0.02] border-white/5 hover:border-white/20 text-white/70",
                            )}
                          >
                            <span className="text-xs font-bold uppercase tracking-widest">
                              Select a saved drink...
                            </span>
                            <motion.div
                              animate={{
                                rotate: isDrinkLibraryDropdownOpen ? 180 : 0,
                              }}
                            >
                              <ChevronDown className="w-4 h-4" />
                            </motion.div>
                          </button>

                          <AnimatePresence>
                            {isDrinkLibraryDropdownOpen && (
                              <motion.div
                                initial={{ opacity: 0, y: -10, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: "auto" }}
                                exit={{ opacity: 0, y: -10, height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="space-y-2 pt-3">
                                  {sortedDrinkLibrary.map((drink) => (
                                    <button
                                      key={`lib-${drink.id}`}
                                      onClick={() => {
                                        addDrink(
                                          drink.name,
                                          drink.abv,
                                          drink.volume,
                                          drink.icon,
                                        );
                                        setIsDrinkLibraryDropdownOpen(false);
                                      }}
                                      className="w-full group p-3 rounded-lg bg-white/5 border border-white/5 hover:border-brand-primary/40 hover:bg-brand-primary/5 hover:scale-[1.01] transition-all flex items-center gap-4 text-left"
                                    >
                                      <div className="p-2 rounded-lg bg-surface-dim text-white/50 group-hover:bg-brand-primary/20 group-hover:text-brand-primary transition-all">
                                        <DrinkIcon
                                          iconUrl={drink.icon}
                                          className="w-4 h-4"
                                        />
                                      </div>
                                      <div className="flex-1">
                                        <div className="font-bold text-[11px] text-on-surface uppercase tracking-tight truncate">
                                          {drink.name}
                                        </div>
                                        <div className="text-[9px] text-white/40 mt-0.5">
                                          {drink.abv}% ABV • {drink.volume}ml •
                                          ${drink.costPerUnit}/ea
                                        </div>
                                      </div>
                                      <div className="w-6 h-6 rounded-full flex items-center justify-center bg-white/5 text-white/30 group-hover:bg-brand-primary group-hover:text-brand-on-primary transition-all">
                                        <Plus className="w-3 h-3" />
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    )}

                    <div className="pb-4 mb-4 relative z-10 flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 font-display flex items-center gap-2">
                          Standard Drinks
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {drinksToLog
                          .filter(
                            (d) =>
                              !drinkSearchTerm ||
                              d.name
                                .toLowerCase()
                                .includes(drinkSearchTerm.toLowerCase()),
                          )
                          .map((drink) => (
                            <button
                              key={drink.name}
                              onClick={() => {
                                addDrink(drink.name, drink.abv, drink.volume);
                              }}
                              className="w-full group p-3 rounded-lg bg-white/5 border border-white/5 hover:border-brand-primary/40 hover:bg-brand-primary/5 hover:scale-[1.01] transition-all flex items-center gap-4 text-left"
                            >
                              <div
                                className={cn(
                                  "p-2 rounded-lg transition-all",
                                  drink.color,
                                )}
                              >
                                <drink.icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1">
                                <div className="font-bold text-[11px] text-on-surface uppercase tracking-tight">
                                  {drink.name}
                                </div>
                                <div className="text-[9px] text-white/40 mt-0.5">
                                  {drink.stats}
                                </div>
                                {drink.description && (
                                  <div className="text-[9px] text-white/30 mt-1 italic">
                                    {drink.description}
                                  </div>
                                )}
                              </div>
                              <div className="w-6 h-6 shrink-0 rounded-full flex items-center justify-center bg-white/5 text-white/30 group-hover:bg-brand-primary group-hover:text-brand-on-primary transition-all">
                                <Plus className="w-3 h-3" />
                              </div>
                            </button>
                          ))}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.form
                    key="custom-form"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    onSubmit={(e) => {
                      e.preventDefault();
                      setFormError(null);
                      const abv = parseFloat(customAbv);
                      const volume = parseFloat(customVolume);
                      const cost = parseFloat(
                        (
                          document.getElementById(
                            "customCost",
                          ) as HTMLInputElement
                        ).value || "0",
                      );
                      const saveToLibrary = (
                        document.getElementById(
                          "saveLibrary",
                        ) as HTMLInputElement
                      ).checked;

                      if (!customName || isNaN(abv) || isNaN(volume)) {
                        setFormError("Please fill in all fields correctly.");
                        return;
                      }

                      let customTimestamp: number | undefined = undefined;
                      if (customTime) {
                        const parsedTime = new Date(customTime).getTime();
                        if (!isNaN(parsedTime)) {
                          customTimestamp = parsedTime;
                        }
                      }

                      if (saveToLibrary) {
                        addCustomDrink({
                          name: customName,
                          abv,
                          volume,
                          icon: customImage || selectedIcon,
                          costPerUnit: cost,
                        });
                      }

                      addDrink(
                        customName,
                        abv,
                        volume,
                        customImage || selectedIcon,
                        customTimestamp,
                      );

                      setCustomName("");
                      setCustomAbv("");
                      setCustomVolume("");
                      setCustomTime("");
                      setCustomImage(null);
                      setSelectedIcon("Beer");
                      setShowCustomForm(false);
                    }}
                    className="space-y-4"
                  >
                    {formError && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="bg-brand-error/10 border border-red-500/20 rounded-xl p-3 text-[10px] font-bold text-brand-error uppercase tracking-widest"
                      >
                        {formError}
                      </motion.div>
                    )}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-white/20 uppercase tracking-widest px-2">
                        Drink Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Gin Tonic"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-on-surface placeholder:text-white/10 focus:outline-none focus:border-brand-primary/50 transition-colors"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-white/20 uppercase tracking-widest px-2">
                          ABV (%)
                        </label>
                        <input
                          type="number"
                          required
                          step="0.1"
                          min="0.1"
                          max="100"
                          placeholder="e.g. 14"
                          value={customAbv}
                          onChange={(e) => setCustomAbv(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-on-surface placeholder:text-white/10 focus:outline-none focus:border-brand-primary/50 transition-colors"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-white/20 uppercase tracking-widest px-2">
                          Vol (ml)
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="e.g. 250"
                          value={customVolume}
                          onChange={(e) => setCustomVolume(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-on-surface placeholder:text-white/10 focus:outline-none focus:border-brand-primary/50 transition-colors"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-white/20 uppercase tracking-widest px-2">
                        Cost Per Drink ($)
                      </label>
                      <input
                        type="number"
                        id="customCost"
                        step="0.01"
                        min="0"
                        placeholder="e.g. 8.50"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-on-surface placeholder:text-white/10 focus:outline-none focus:border-brand-primary/50 transition-colors"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-white/20 uppercase tracking-widest px-2">
                        Consumed At (Optional)
                      </label>
                      <input
                        type="datetime-local"
                        value={customTime}
                        onChange={(e) => setCustomTime(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-on-surface focus:outline-none focus:border-brand-primary/50 transition-colors"
                      />
                      <p className="text-[9px] text-white/30 px-2 mt-1 font-medium">
                        Leave blank for current time. Use this to back-date
                        manual entries.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-white/20 uppercase tracking-widest px-2">
                        Choose Icon or Upload Image
                      </label>

                      <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4">
                        <div className="relative mb-4">
                          <button
                            type="button"
                            onClick={() =>
                              setIsIconDropdownOpen(!isIconDropdownOpen)
                            }
                            className={cn(
                              "w-full flex items-center justify-between p-4 rounded-xl border transition-all",
                              isIconDropdownOpen
                                ? "bg-white/10 border-white/20"
                                : !customImage
                                  ? "bg-brand-primary/10 border-brand-primary/40 text-brand-primary"
                                  : "bg-white/5 border-white/10 text-white/40 hover:border-white/20",
                            )}
                          >
                            <div className="flex items-center gap-3">
                              {(() => {
                                const activeItem = PRESET_ICONS.find(
                                  (i) => i.id === selectedIcon,
                                );
                                const Icon = activeItem?.icon || Beer;
                                return <Icon className="w-5 h-5" />;
                              })()}
                              <span className="text-sm font-semibold text-white/80">
                                {selectedIcon}
                              </span>
                            </div>
                            <motion.div
                              animate={{ rotate: isIconDropdownOpen ? 180 : 0 }}
                              className="text-white/40"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </motion.div>
                          </button>

                          <AnimatePresence>
                            {isIconDropdownOpen && (
                              <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="absolute top-full left-0 right-0 mt-2 p-2 bg-surface-container border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50 grid grid-cols-4 gap-2"
                              >
                                {PRESET_ICONS.map((item) => (
                                  <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedIcon(item.id);
                                      setCustomImage(null);
                                      setIsIconDropdownOpen(false);
                                    }}
                                    className={cn(
                                      "flex flex-col items-center justify-center p-3 rounded-lg border transition-all group",
                                      selectedIcon === item.id && !customImage
                                        ? "bg-brand-primary/10 border-brand-primary/40 text-brand-primary"
                                        : "bg-white/5 border-transparent text-white/50 hover:bg-white/10 hover:text-white",
                                    )}
                                  >
                                    <item.icon className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">
                                      {item.id}
                                    </span>
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                          <label
                            className={cn(
                              "flex-1 h-14 rounded-xl border-2 border-dashed transition-all flex items-center justify-center gap-2 cursor-pointer group",
                              customImage
                                ? "bg-brand-primary/5 border-brand-primary/20 text-brand-primary"
                                : "bg-white/5 border-white/10 text-white/30 hover:border-white/20",
                            )}
                          >
                            <Upload className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-widest">
                              {customImage
                                ? "Change Image"
                                : "Upload Custom Icon"}
                            </span>
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={handleImageUpload}
                            />
                          </label>

                          {customImage && (
                            <div className="w-14 h-14 rounded-xl border border-brand-primary/40 bg-brand-primary/10 p-1 shrink-0 overflow-hidden relative group">
                              <img
                                src={customImage}
                                alt="Preview"
                                className="w-full h-full object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomImage(null);
                                  setSelectedIcon("Beer");
                                }}
                                className="absolute inset-0 bg-surface-dim/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-4 h-4 text-white" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4">
                      <input
                        type="checkbox"
                        id="saveLibrary"
                        className="w-4 h-4 rounded border-white/20 bg-transparent text-brand-primary focus:ring-brand-primary"
                        defaultChecked
                      />
                      <label
                        htmlFor="saveLibrary"
                        className="text-xs font-medium text-white/80 cursor-pointer"
                      >
                        Save to my Drink Library for future sessions
                      </label>
                    </div>

                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCustomName("");
                          setCustomAbv("");
                          setCustomVolume("");
                          setCustomTime("");
                          setFormError(null);
                          setCustomImage(null);
                          setSelectedIcon("Beer");
                          const costInput = document.getElementById(
                            "customCost",
                          ) as HTMLInputElement;
                          if (costInput) costInput.value = "";
                        }}
                        className="w-1/3 py-5 bg-white/5 border border-white/10 text-white/50 rounded-lg font-black uppercase tracking-[0.2em] text-[10px] hover:bg-white/10 hover:text-white active:scale-[0.98] transition-all font-display"
                      >
                        Clear Form
                      </button>
                      <button
                        type="submit"
                        className="w-2/3 py-5 bg-brand-primary text-brand-on-primary rounded-lg font-black uppercase tracking-[0.2em] text-[10px] hover:brightness-110 active:scale-[0.98] transition-all font-display"
                      >
                        Log Custom Drink
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>

            {!showCustomForm && (
              <button
                onClick={() => setShowCustomForm(true)}
                className="mt-6 w-full py-4 bg-white/5 text-white/40 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-white/10 hover:text-white transition-all font-display border border-white/5"
              >
                Log Custom Entry
              </button>
            )}
          </div>
        </motion.div>

        {/* AI Drink Suggestion */}
        <AnimatePresence>
          {drinkSuggestion && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, overflow: "hidden" }}
              className="lg:col-span-12 bg-brand-primary/10 rounded-lg border border-brand-primary/20 p-6 flex flex-col md:flex-row items-center gap-4 sm:gap-6"
              style={{ boxShadow: "0 0 20px rgba(45, 212, 191, 0.05)" }}
            >
              <div className="p-4 bg-surface-dim rounded-2xl text-brand-primary shrink-0 relative">
                <Brain className="w-8 h-8" />
                <div className="absolute top-0 right-0 w-3 h-3 bg-brand-primary rounded-full animate-ping" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary mb-2 font-display">
                  Live AI Coaching
                </h3>
                <p className="text-brand-primary/90 text-sm md:text-base font-semibold leading-relaxed">
                  {drinkSuggestion}
                </p>
              </div>
              <button
                onClick={() => addWater()} // Quick action
                className="px-6 py-3 bg-brand-primary text-brand-on-primary rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-brand-primary/90 transition-colors shrink-0 flex items-center gap-2"
              >
                <GlassWater className="w-4 h-4" /> Drink Water
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Drive Safe Lockout / Critical Alert */}
        {bac >= 0.05 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-12 bg-brand-error rounded-lg p-4 sm:p-6 lg:p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group "
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="p-6 bg-surface-dim text-brand-error rounded-lg relative z-10 shrink-0">
              <AlertTriangle className="w-12 h-12 fill-current" />
            </div>
            <div className="flex-1 relative z-10 text-center md:text-left">
              <h3 className="text-2xl font-semibold text-white font-display tracking-tight leading-tight">
                Drive Safe Lockout Active
              </h3>
              <p className="text-white/90 text-lg mt-2 max-w-2xl font-medium">
                Your BAC ({(isNaN(bac) ? 0 : bac).toFixed(3)}%) is above the
                legal driving limit. Transport options have been prioritized.
              </p>
              <div className="flex flex-wrap gap-3 mt-6">
                <a
                  href="uber://?action=setPickup"
                  className="px-6 py-3 bg-white text-red-600 rounded-lg font-black uppercase tracking-widest text-[10px] hover:bg-white/90 transition-colors font-display flex items-center gap-2"
                >
                  Call Uber
                </a>
                <a
                  href="lyft://ride?id=lyft"
                  className="px-6 py-3 bg-white text-red-600 rounded-lg font-black uppercase tracking-widest text-[10px] hover:bg-white/90 transition-colors font-display flex items-center gap-2"
                >
                  Call Lyft
                </a>
                <button
                  onClick={handleSafeRoute}
                  className="px-6 py-3 bg-white text-red-600 rounded-lg font-black uppercase tracking-widest text-[10px] hover:bg-white/90 transition-colors font-display"
                >
                  Safe Route Home
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Emergency Contact Ping */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-12 bg-surface-container rounded-lg border border-white/5 p-8 transition-all hover:border-white/10 group flex flex-col md:flex-row items-center gap-8 min-h-[120px]"
        >
          <div className="w-16 h-16 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
            <Heart className="w-8 h-8 fill-current" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl font-semibold font-display tracking-tight text-on-surface">
              Emergency Ping
            </h3>
            <p className="text-white/40 mt-1 max-w-md text-sm">
              Location auto-sent to{" "}
              <span className="text-white font-bold">
                {emergencyContact?.name || "Alex (Emergency)"}
              </span>{" "}
              if no activity is detected for 20 mins.
            </p>
          </div>
          <Link
            to="/profile"
            className="px-6 py-3 bg-white/5 border border-white/10 text-white/60 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white/10 hover:text-white transition-all font-display"
          >
            Configure
          </Link>
        </motion.div>

        {/* Sleep Impact Score */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-3 bg-surface-container rounded-lg border border-white/5 p-8 transition-all hover:border-white/10 group flex flex-col justify-between min-h-[220px]"
        >
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-6 font-display">
              Sleep Analysis
            </div>
            <p className="text-white/60 text-base font-medium leading-normal">
              Based on current metabolic trajectory, your deep sleep efficiency
              will decrease by{" "}
              <span className={sleepImpact.color}>
                ~{sleepImpact.decrease}%
              </span>{" "}
              tonight.
            </p>
          </div>
          <div className="flex items-end justify-between mt-4">
            <div
              className={cn(
                "text-3xl font-semibold font-display",
                sleepImpact.color,
              )}
            >
              {sleepImpact.score}
            </div>
            <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
              Impact Score
            </div>
          </div>
        </motion.div>

        {/* AI Drink Recommender */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-3 bg-brand-primary p-8 rounded-lg text-brand-on-primary relative overflow-hidden group flex flex-col justify-between min-h-[220px]"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform">
            <Sparkles className="w-16 h-16" />
          </div>
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface-dim text-brand-primary rounded text-[10px] font-black uppercase tracking-widest">
              <Sparkles className="w-3 h-3" />
              AI Drink Recommender
            </div>
            <div>
              <p className="text-lg font-semibold font-display tracking-tight leading-tight">
                {recommendation.message}
              </p>
            </div>
          </div>
          <div className="relative z-10 mt-4">
            {recommendation.action === "water" ? (
              <button
                onClick={addWater}
                className="w-full py-4 bg-surface-dim text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform font-display"
              >
                <Droplets className="w-4 h-4" />
                Log Hydration
              </button>
            ) : (
              <button
                onClick={() =>
                  addDrink(
                    recommendation.action === "light"
                      ? "Light Beer"
                      : "Standard Drink",
                    recommendation.action === "light" ? 4.2 : 5,
                    330,
                  )
                }
                className="w-full py-4 bg-surface-dim text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform font-display"
              >
                <Beer className="w-4 h-4" />
                Log Recommended
              </button>
            )}
            <p className="text-[8px] text-center mt-3 font-black uppercase tracking-widest opacity-30">
              Suggestions based on real-time neuro-metabolic modeling
            </p>
          </div>
        </motion.div>

        {/* Liver Processing Load Meter */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-3 bg-surface-container rounded-lg border border-white/5 p-8 flex flex-col items-center justify-center text-center transition-all hover:border-white/10 relative overflow-hidden min-h-[220px]"
        >
          <div className="text-[10px] font-black text-brand-tertiary-container uppercase tracking-[0.3em] font-display mb-6">
            Liver Engine Load
          </div>

          <div className="relative w-32 h-16 overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 rounded-full border-[12px] border-white/5" />
            <motion.div
              className="absolute top-0 left-0 w-32 h-32 rounded-full border-[12px] border-transparent border-b-brand-tertiary-container border-r-brand-tertiary-container"
              style={{ rotate: 45 }}
              animate={{
                rotate: 45 + Math.min((unprocessedUnits / 5) * 180, 180),
              }}
              transition={{ type: "spring", damping: 30, stiffness: 50 }}
            />
          </div>

          <div className="-mt-8 z-10 flex flex-col items-center">
            <div className="text-3xl font-semibold font-display tracking-tighter text-on-surface">
              {unprocessedUnits}{" "}
              <span className="text-sm text-white/50">Units</span>
            </div>
            <div className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-1">
              Pending Processing
            </div>
          </div>
        </motion.div>

        {/* Calorie Stats Card */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-3 bg-white/[0.02] border border-white/5 rounded-lg p-8 flex flex-col items-center justify-center text-center hover:border-white/10 transition-all min-h-[220px]"
        >
          <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mb-6">
            <Zap className="w-8 h-8" />
          </div>
          <div className="text-4xl font-semibold font-display tracking-tighter text-on-surface">
            {totalCalories || 0}
          </div>
          <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mt-2 font-display">
            EST. KCAL
          </div>
          <div className="mt-6 px-4 py-2 bg-white/5 rounded text-[9px] font-bold text-white/40 border border-white/5">
            ~ {Math.round((totalCalories || 0) / 100)} Workouts to Clear
          </div>
        </motion.div>
        {/* Recent Session Logs */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-12 bg-surface-container rounded-lg border border-white/5 p-8"
        >
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-8 font-display">
            Session Timeline
          </h2>
          {drinks.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center opacity-20">
              <Beer className="w-12 h-12 mb-4" />
              <p className="text-sm font-black uppercase tracking-widest">
                No drinks logged yet
              </p>
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3"
            >
              <AnimatePresence mode="popLayout">
                {[...drinks].reverse().map((drink, index) => {
                  const now = Date.now();
                  const minutesAgo = (now - drink.timestamp) / 60000;
                  const opacityClass =
                    index === 0
                      ? "opacity-100"
                      : minutesAgo < 60
                        ? "opacity-90"
                        : minutesAgo < 120
                          ? "opacity-75"
                          : "opacity-50 hover:opacity-100";
                  const borderClass =
                    index === 0
                      ? "border-brand-primary/30 shadow-[0_0_15px_rgba(45,212,191,0.1)] ring-1 ring-brand-primary/10"
                      : "border-white/5";

                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
                      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                      exit={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 25,
                      }}
                      key={drink.id}
                      className={cn(
                        "relative p-5 rounded-lg bg-white/[0.02] flex items-center gap-4 group overflow-hidden transition-all duration-500",
                        borderClass,
                        opacityClass,
                      )}
                    >
                      <div
                        className={cn(
                          "w-12 h-12 rounded-2xl border flex items-center justify-center overflow-hidden shrink-0",
                          index === 0
                            ? "bg-brand-primary/10 border-brand-primary/20 text-brand-primary"
                            : "bg-white/[0.05] border-white/5",
                        )}
                      >
                        <DrinkIcon
                          iconUrl={drink.iconUrl}
                          className="w-6 h-6"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold font-display text-sm text-on-surface truncate">
                            {drink.name}
                          </div>
                          {index === 0 && (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-brand-primary/20 text-brand-primary animate-pulse">
                              Latest
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-white/40 mt-0.5 font-bold flex items-center gap-2 flex-wrap">
                          <span>
                            {drink.abv}% • {drink.volume}ml
                          </span>
                          <span className="w-1 h-1 rounded-full bg-white/20" />
                          <span>{Math.round(drink.calories || 0)} kcal</span>
                          <span className="w-1 h-1 rounded-full bg-white/20" />
                          <span>
                            {new Date(drink.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {drink.timeSinceLastDrink && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-white/20" />
                              <span className="text-brand-primary font-black underline decoration-white/10 decoration-wavy underline-offset-2">
                                +{Math.floor(drink.timeSinceLastDrink / 60000)}m
                                Interval
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => setDrinkToDelete(drink.id)}
                        className="absolute top-3 right-3 p-2 text-white/20 hover:text-brand-error hover:bg-brand-error/10 rounded-full opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                        title="Remove drink"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <AnimatePresence>
                        {drinkToDelete === drink.id && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-surface-container/95 backdrop-blur-md flex flex-col items-center justify-center gap-3 z-10"
                          >
                            <p className="text-[10px] font-black text-white uppercase tracking-widest">
                              Remove drink?
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeDrink(drink.id);
                                  setDrinkToDelete(null);
                                }}
                                className="px-4 py-1.5 bg-brand-error text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors"
                              >
                                Remove
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDrinkToDelete(null);
                                }}
                                className="px-4 py-1.5 border border-brand-primary text-brand-primary rounded text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary/10 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
