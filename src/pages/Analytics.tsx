import React, { useMemo, useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
  Area,
  AreaChart,
  ReferenceLine,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import {
  Sparkles,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Activity,
  Flame,
  Moon,
  Wallet,
  HeartPulse,
  Brain,
  Droplet,
} from "lucide-react";
import { useSession } from "../context/SessionContext";
import { getSmartCoaching } from "../services/AIService";

export default function Analytics() {
  const { drinks, waterVolume, bac, sessionHistory, userProfile } =
    useSession();
  const [coachingSnippet, setCoachingSnippet] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"Days" | "Weeks" | "Month">("Days");

  useEffect(() => {
    getSmartCoaching(sessionHistory, userProfile.goals).then(
      setCoachingSnippet,
    );
  }, [sessionHistory, userProfile.goals]);

  const currentUnits = useMemo(() => {
    const sum = drinks.reduce((acc, drink) => {
      const units = ((drink.volume || 0) * (drink.abv || 0)) / 1000;
      return acc + (isNaN(units) ? 0 : units);
    }, 0);
    return isNaN(sum) ? 0 : sum;
  }, [drinks]);

  const totalCalories = useMemo(() => {
    return drinks.reduce(
      (acc, d) => acc + (d.calories || d.volume * d.abv * 0.05),
      0,
    );
  }, [drinks]);

  const estimatedCost = useMemo(() => {
    return (
      drinks.reduce((acc, d) => acc + (d.volume / 100) * 1.5, 0) +
      currentUnits * 8
    );
  }, [drinks, currentUnits]);

  const sleepPenalty = bac > 0.05 ? 42 : bac > 0 ? 15 : 0;
  const hrvDrop = bac > 0.05 ? 12 : bac > 0 ? 5 : 0;
  const readinessScore = Math.max(
    0,
    100 - bac * 1000 - sleepPenalty + (waterVolume > 1000 ? 10 : 0),
  );

  const displayData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (timeRange === "Days") {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const startOfWeek = new Date(today);
      const dayOfWeek = today.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      startOfWeek.setDate(today.getDate() + mondayOffset);

      const data = Array.from({ length: 7 }).map((_, index) => {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + index);
        return {
          label: days[date.getDay()],
          fullDate: date.toDateString(),
          units: 0,
          cals: 0,
          active: date.getTime() === today.getTime(),
          placeholder: date > today,
        };
      });

      sessionHistory.forEach((session) => {
        const sessionDate = new Date(session.timestamp);
        sessionDate.setHours(0, 0, 0, 0);

        if (sessionDate.getTime() >= startOfWeek.getTime()) {
          const diffTime = sessionDate.getTime() - startOfWeek.getTime();
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays >= 0 && diffDays < 7) {
            data[diffDays].units += session.totalUnits || 0;
            data[diffDays].cals += session.totalCalories || 0;
          }
        }
      });

      const todayDiff = Math.round(
        (today.getTime() - startOfWeek.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (todayDiff >= 0 && todayDiff < 7) {
        data[todayDiff].units += currentUnits || 0;
        data[todayDiff].cals += totalCalories || 0;
      }

      return data;
    } else if (timeRange === "Weeks") {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const daysInMonth = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0,
      ).getDate();

      const weeksInMonth = Math.ceil(daysInMonth / 7);
      const data = Array.from({ length: weeksInMonth }).map((_, index) => {
        const weekStart = new Date(startOfMonth);
        weekStart.setDate(startOfMonth.getDate() + index * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(
          Math.min(weekStart.getDate() + 6, daysInMonth),
        );

        return {
          label: `W${index + 1}`,
          fullDate: `${weekStart.toDateString()} - ${weekEnd.toDateString()}`,
          units: 0,
          cals: 0,
          active:
            today >= weekStart &&
            today <= new Date(weekEnd.getFullYear(), weekEnd.getMonth(), weekEnd.getDate(), 23, 59, 59, 999),
          placeholder: weekStart > today,
        };
      });

      sessionHistory.forEach((session) => {
        const sessionDate = new Date(session.timestamp);
        sessionDate.setHours(0, 0, 0, 0);

        if (
          sessionDate.getMonth() === startOfMonth.getMonth() &&
          sessionDate.getFullYear() === startOfMonth.getFullYear()
        ) {
          const weekIndex = Math.floor((sessionDate.getDate() - 1) / 7);
          data[weekIndex].units += session.totalUnits || 0;
          data[weekIndex].cals += session.totalCalories || 0;
        }
      });

      if (
        today.getMonth() === startOfMonth.getMonth() &&
        today.getFullYear() === startOfMonth.getFullYear()
      ) {
        const weekIndex = Math.floor((today.getDate() - 1) / 7);
        data[weekIndex].units += currentUnits || 0;
        data[weekIndex].cals += totalCalories || 0;
      }

      return data;
    } else {
      // Month
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      const data = Array.from({ length: 12 }).map((_, index) => {
        return {
          label: monthNames[index],
          fullDate: monthNames[index] + " " + today.getFullYear(),
          units: 0,
          cals: 0,
          active: index === today.getMonth(),
          placeholder: index > today.getMonth(),
        };
      });

      sessionHistory.forEach((session) => {
        const sessionDate = new Date(session.timestamp);
        if (sessionDate.getFullYear() === today.getFullYear()) {
          const monthIndex = sessionDate.getMonth();
          data[monthIndex].units += session.totalUnits || 0;
          data[monthIndex].cals += session.totalCalories || 0;
        }
      });

      data[today.getMonth()].units += currentUnits || 0;
      data[today.getMonth()].cals += totalCalories || 0;

      return data;
    }
  }, [timeRange, sessionHistory, currentUnits, totalCalories]);

  const totalPeriodUnits = useMemo(
    () => displayData.reduce((acc, d) => acc + d.units, 0),
    [displayData],
  );

  const annualHeatmapData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = today.getDay(); // 0 is Sun, 6 is Sat

    const numDays = 52 * 7;

    const dayMap = new Map<number, number>();

    sessionHistory.forEach((session) => {
      const d = new Date(session.timestamp);
      d.setHours(0, 0, 0, 0);
      dayMap.set(
        d.getTime(),
        (dayMap.get(d.getTime()) || 0) + (session.totalUnits || 0),
      );
    });

    if (currentUnits > 0) {
      dayMap.set(
        today.getTime(),
        (dayMap.get(today.getTime()) || 0) + currentUnits,
      );
    }

    const data = [];

    const endOfCurrentWeek = new Date(today);
    endOfCurrentWeek.setDate(today.getDate() + (6 - dayOfWeek));

    const startDate = new Date(endOfCurrentWeek);
    startDate.setDate(endOfCurrentWeek.getDate() - (numDays - 1));

    for (let col = 0; col < 52; col++) {
      const colData = [];
      for (let row = 0; row < 7; row++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + (col * 7 + row));

        const units = dayMap.get(currentDate.getTime()) || 0;
        let op = 0.05;
        let colorClass = "bg-brand-primary";

        if (currentDate > today) {
          op = 0.05;
          colorClass = "bg-white/[0.03]";
        } else if (units === 0) {
          op = 0.05;
          colorClass = "bg-white/[0.03]";
        } else if (units <= 2) {
          op = 0.3;
        } else if (units <= 4) {
          op = 0.6;
        } else {
          op = 1.0;
        }

        colData.push({
          date: currentDate.toDateString(),
          units: units,
          isFuture: currentDate > today,
          op,
          colorClass,
        });
      }
      data.push(colData);
    }

    return data;
  }, [sessionHistory, currentUnits]);

  const bacTrend = [
    { time: 0, value: 0 },
    { time: 1, value: (isNaN(bac) ? 0 : bac) * 0.5 },
    { time: 2, value: (isNaN(bac) ? 0 : bac) * 0.8 },
    { time: 3, value: isNaN(bac) ? 0 : bac },
  ];

  const readinessFactors = [
    {
      subject: "Hydration",
      A: Math.min(100, Math.round((waterVolume / 2000) * 100)),
      fullMark: 100,
    },
    {
      subject: "Sleep Quality",
      A: Math.max(0, 100 - sleepPenalty),
      fullMark: 100,
    },
    { subject: "HRV Rest", A: Math.max(0, 100 - hrvDrop * 4), fullMark: 100 },
    {
      subject: "Metabolism",
      A: Math.max(0, 100 - currentUnits * 10),
      fullMark: 100,
    },
    {
      subject: "CNS Recovery",
      A: Math.max(0, 100 - (isNaN(bac) ? 0 : bac) * 500),
      fullMark: 100,
    },
  ];

  const drinkTypes = useMemo(() => {
    const typeCount: Record<string, number> = {};
    drinks.forEach((d) => {
      const type = d.name.split(" (")[0]; // Group by general type (e.g. "Beer" instead of "Beer (Bottle)")
      typeCount[type] = (typeCount[type] || 0) + 1;
    });
    return Object.entries(typeCount).map(([name, count]) => ({
      name,
      value: count,
    }));
  }, [drinks]);
  const PIE_COLORS = [
    "#57f1db",
    "#818cf8",
    "#f472b6",
    "#fbbf24",
    "#f87171",
    "#c084fc",
    "#34d399",
  ];

  const cognitiveData = useMemo(
    () => [
      {
        area: "Motor",
        impact: bac > 0.08 ? 85 : bac > 0.04 ? 45 : bac > 0.02 ? 15 : 5,
      },
      { area: "Reaction", impact: bac > 0.05 ? 70 : bac > 0.02 ? 30 : 5 },
      { area: "Judgment", impact: bac > 0.04 ? 50 : bac > 0.015 ? 15 : 2 },
      { area: "Focus", impact: bac > 0.06 ? 65 : bac > 0.025 ? 25 : 8 },
    ],
    [bac],
  );

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
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="space-y-8"
    >
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight font-display text-on-surface">
            Analytics Overview
          </h1>
          <p className="text-white/40 text-sm mt-2">
            Your performance and recovery metrics for this week.
          </p>
        </div>
      </header>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 pb-32"
      >
        {/* Readiness Hero Card */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-8 bg-surface-container rounded-lg border border-white/5 p-4 sm:p-6 lg:p-8 relative overflow-hidden flex flex-col justify-center group transition-all hover:border-white/10"
        >
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 group-hover:bg-brand-primary/10 transition-all pointer-events-none" />

          <div className="flex flex-col md:flex-row gap-4 lg:gap-8 relative z-10 w-full h-full items-center">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-brand-primary/10 text-brand-primary rounded-xl">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 font-display">
                    System Status
                  </h3>
                  <div className="text-xl font-bold font-display text-on-surface">
                    {bac < 0.02
                      ? "Optimal Recovery"
                      : bac < 0.05
                        ? "Processing Load"
                        : "High System Stress"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                  <HeartPulse className="w-4 h-4 text-brand-error mb-3" />
                  <span className="block text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">
                    HRV Impact
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold font-display text-on-surface">
                      -{hrvDrop}
                    </span>
                    <span className="text-[10px] text-white/40">ms</span>
                  </div>
                </div>

                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                  <Moon className="w-4 h-4 text-indigo-400 mb-3" />
                  <span className="block text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">
                    Sleep Penalty
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold font-display text-on-surface">
                      -{sleepPenalty}
                    </span>
                    <span className="text-[10px] text-white/40">%</span>
                  </div>
                </div>

                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                  <Flame className="w-4 h-4 text-orange-400 mb-3" />
                  <span className="block text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">
                    Caloric Load
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold font-display text-on-surface">
                      {Math.round(totalCalories)}
                    </span>
                    <span className="text-[10px] text-white/40">kcal</span>
                  </div>
                </div>

                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                  <Droplet className="w-4 h-4 text-blue-400 mb-3" />
                  <span className="block text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">
                    Hydration
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold font-display text-on-surface">
                      {Math.min(Math.round((waterVolume / 2000) * 100), 100)}
                    </span>
                    <span className="text-[10px] text-white/40">%</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-brand-primary/5 rounded-xl border border-brand-primary/10 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/0 via-brand-primary/5 to-brand-primary/0 translate-x-[-100%] animate-[shimmer_3s_infinite]" />
                <p className="text-sm font-medium text-white/70 leading-relaxed relative z-10">
                  {bac < 0.02
                    ? "Your biological systems are running at peak efficiency. No significant metabolic disruption detected, allowing for optimal muscle recovery and uninterrupted deep sleep phases."
                    : bac < 0.05
                      ? "Your liver is actively processing toxins, meaning baseline metabolism is temporarily paused. Expect minor sleep fragmentation and moderate heart rate variability suppression tonight."
                      : "Severe metabolic suppression active. Recovery processes are halted. Deep sleep architecture is severely compromised, prioritizing toxin clearance over tissue repair."}
                </p>
              </div>
            </div>

            <div className="w-full md:w-48 flex flex-col items-center justify-center shrink-0 border-t md:border-t-0 md:border-l border-white/10 self-stretch pt-6 md:pt-0 md:pl-6">
              <div className="relative flex items-center justify-center w-32 h-32 mb-4">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="60"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="transparent"
                    className="text-white/5"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="60"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={377}
                    strokeDashoffset={377 - (377 * readinessScore) / 100}
                    className={cn(
                      "transition-all duration-1000 ease-out",
                      readinessScore > 80
                        ? "text-brand-primary"
                        : readinessScore > 50
                          ? "text-brand-tertiary-container"
                          : "text-brand-error",
                    )}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black font-display tracking-tighter text-on-surface">
                    {Math.round(readinessScore)}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                Readiness Score
              </span>
            </div>
          </div>
        </motion.div>

        {/* AI Health Insights */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-4 bg-gradient-to-br from-surface-container/80 to-white/5 rounded-lg border border-white/10 p-8 flex flex-col relative overflow-hidden group hover:border-white/15 transition-all"
        >
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] mix-blend-overlay pointer-events-none" />
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="p-2 bg-brand-primary/10 text-brand-primary rounded-lg">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/50 font-display">
              Deep Insights
            </h3>
          </div>

          <div className="space-y-4 flex-1 flex flex-col justify-center relative z-10">
            {coachingSnippet && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative bg-brand-primary/15 overflow-hidden p-4 rounded-2xl border border-brand-primary/30 hover:bg-brand-primary/20 transition-all"
              >
                <div className="absolute inset-0 bg-brand-primary/10 blur-xl pointer-events-none" />
                <div className="relative flex items-start gap-3 z-10">
                  <Sparkles className="w-5 h-5 text-brand-primary shrink-0 drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]" />
                  <p className="text-white text-xs leading-relaxed font-bold tracking-wide">
                    {coachingSnippet}
                  </p>
                </div>
              </motion.div>
            )}
            <div className="bg-white/[0.15] p-4 rounded-2xl border border-white/10 hover:bg-white/[0.2] transition-colors">
              <div className="flex items-start gap-3">
                <Moon className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
                <p className="text-white/80 text-xs leading-relaxed font-medium">
                  Your current metabolic load will delay REM sleep onset by
                  approximately{" "}
                  <span className="text-brand-primary font-bold">
                    {bac > 0.04 ? "85 mins" : "20 mins"}
                  </span>
                  .
                </p>
              </div>
            </div>
            <div className="bg-white/[0.15] p-4 rounded-2xl border border-white/10 hover:bg-white/[0.2] transition-colors">
              <div className="flex items-start gap-3">
                <Droplet className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-white/80 text-xs leading-relaxed font-medium">
                  {currentUnits > 0 && waterVolume < currentUnits * 250 ? (
                    <>
                      You are running a hydration deficit. Secure{" "}
                      <span className="text-blue-400 font-bold">
                        {Math.max(0, currentUnits * 250 - waterVolume)}ml
                      </span>{" "}
                      of water to neutralize the current diuretic load.
                    </>
                  ) : currentUnits > 0 ? (
                    <>
                      Cellular hydration is{" "}
                      <span className="text-blue-400 font-bold">optimized</span>
                      . Your water intake is successfully buffering the diuretic
                      effect.
                    </>
                  ) : (
                    <>
                      Baseline hydration maintained. Consuming{" "}
                      <span className="text-blue-400 font-bold">500ml</span> of
                      water before any units will improve your metabolic
                      resilience.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* System Resilience Radar */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-4 bg-surface-container rounded-lg border border-white/5 p-8 flex flex-col group transition-all hover:border-white/10"
        >
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 font-display">
              System Resilience
            </h3>
          </div>
          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                data={readinessFactors}
                margin={{ top: 10, right: 20, bottom: 10, left: 20 }}
              >
                <PolarGrid stroke="rgba(255,255,255,0.05)" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{
                    fill: "rgba(255,255,255,0.4)",
                    fontSize: 9,
                    fontWeight: 700,
                  }}
                />
                <Radar
                  name="Readiness"
                  dataKey="A"
                  stroke="#818cf8"
                  fill="#818cf8"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Liquid Profile Pie Chart */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-4 bg-surface-container rounded-lg border border-white/5 p-8 flex flex-col group transition-all hover:border-white/10"
        >
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-fuchsia-500/10 text-fuchsia-400 rounded-lg">
                <Droplet className="w-5 h-5" />
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 font-display">
                Session Profile
              </h3>
            </div>
          </div>

          <div className="w-full h-[280px] flex items-center justify-center relative mt-2">
            {drinkTypes.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={drinkTypes}
                      cx="50%"
                      cy="45%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={8}
                      cornerRadius={6}
                      dataKey="value"
                      stroke="none"
                    >
                      {drinkTypes.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(17, 19, 24, 0.95)",
                        backdropFilter: "blur(12px)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "16px",
                        boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)",
                      }}
                      itemStyle={{
                        color: "#fff",
                        fontSize: "12px",
                        fontWeight: 800,
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      wrapperStyle={{
                        fontSize: "10px",
                        fontWeight: 600,
                        color: "rgba(255,255,255,0.5)",
                        fill: "rgba(255,255,255,0.5)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                  <span className="text-4xl font-black font-display tracking-tight text-on-surface">
                    {drinks.length}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40">
                    Drinks
                  </span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 border border-dashed border-white/10 rounded-2xl w-full">
                <div className="text-white/20 text-[10px] font-bold uppercase tracking-[0.2em] text-center">
                  No drinks logged
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Cognitive Impairment Load chart */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-4 bg-surface-container rounded-lg border border-white/5 p-8 flex flex-col group transition-all hover:border-white/10"
        >
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 font-display">
                Cognitive Subsystems
              </h3>
            </div>
          </div>

          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={cognitiveData}
                layout="vertical"
                margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
              >
                <XAxis type="number" hide domain={[0, 100]} />
                <YAxis
                  dataKey="area"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "rgba(255,255,255,0.5)",
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.05)" }}
                  contentStyle={{
                    backgroundColor: "#111318",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                  }}
                  itemStyle={{ color: "#fff", fontSize: "12px" }}
                />
                <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                  {cognitiveData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.impact > 60
                          ? "#f87171"
                          : entry.impact > 30
                            ? "#fbbf24"
                            : "#34d399"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Consumption Complex Chart */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-8 bg-surface-container rounded-lg border border-white/5 p-8 flex flex-col h-[400px] group transition-all hover:border-white/10"
        >
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white/50 font-display">
                Consumption Trends
              </h3>
              <p className="text-2xl font-bold font-display text-on-surface mt-1">
                {totalPeriodUnits.toFixed(1)}{" "}
                <span className="text-sm text-white/40">Total Units</span>
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-4 flex-col sm:flex-row">
                <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10 backdrop-blur-sm">
                  {(["Days", "Weeks", "Month"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setTimeRange(tab)}
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                        timeRange === tab
                          ? "bg-brand-primary text-brand-on-primary"
                          : "text-white/40 hover:text-white/60"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-brand-primary" />
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                      Units
                    </span>
                  </div>
                  {timeRange === "Days" && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-white/10" />
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                        Daily Limit (2.5)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={displayData}
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                barGap={0}
              >
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 10,
                    fontWeight: 700,
                    fill: "rgba(255,255,255,0.4)",
                  }}
                  dy={10}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.02)" }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-surface-dim/95 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)]">
                          <div className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4 border-b border-white/5 pb-2">
                            {payload[0].payload.fullDate}
                          </div>
                          <div className="space-y-3 mt-2">
                            <div className="flex items-center justify-between gap-6">
                              <span className="text-xs font-bold text-white/60 flex items-center gap-2">
                                <Activity className="w-3 h-3" /> Units
                              </span>
                              <span className="text-sm font-black text-brand-primary">
                                {Number(payload[0].value).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-6">
                              <span className="text-xs font-bold text-white/60">
                                Calories
                              </span>
                              <span className="text-sm font-black text-orange-400">
                                {payload[0].payload.cals}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {timeRange === "Week" && (
                  <ReferenceLine
                    y={14}
                    stroke="rgba(255,255,255,0.1)"
                    strokeDasharray="4 4"
                    label={{
                      value: "Weekly Limit (14)",
                      position: "insideTopLeft",
                      fill: "rgba(255,255,255,0.4)",
                      fontSize: 10,
                    }}
                  />
                )}
                {timeRange === "Weeks" && (
                  <ReferenceLine
                    y={14}
                    stroke="rgba(255,255,255,0.1)"
                    strokeDasharray="4 4"
                    label={{
                      value: "Weekly Limit (14)",
                      position: "insideTopLeft",
                      fill: "rgba(255,255,255,0.4)",
                      fontSize: 10,
                    }}
                  />
                )}
                {timeRange === "Month" && (
                  <ReferenceLine
                    y={50}
                    stroke="rgba(255,255,255,0.1)"
                    strokeDasharray="4 4"
                    label={{
                      value: "Monthly Max (50)",
                      position: "insideTopLeft",
                      fill: "rgba(255,255,255,0.4)",
                      fontSize: 10,
                    }}
                  />
                )}

                <Bar dataKey="units" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {displayData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      className="transition-all duration-300 hover:opacity-80"
                      fill={
                        entry.placeholder
                          ? "rgba(255,255,255,0.03)"
                          : entry.units >
                              (timeRange === "Month"
                                ? 50
                                : timeRange === "Weeks"
                                  ? 14
                                  : 2.5)
                            ? "#ffb4ab"
                            : entry.active
                              ? "#57f1db"
                              : "rgba(87,241,219,0.5)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Current BAC Timeline Mini */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-4 bg-surface-container rounded-lg border border-white/5 p-8 flex flex-col group transition-all hover:border-white/10"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-brand-error/10 text-brand-error rounded-lg">
              <TrendingDown className="w-4 h-4" />
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/50 font-display">
              Metabolic Clearance
            </h3>
          </div>

          <div className="mb-6">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-semibold font-display text-on-surface">
                {(isNaN(bac) ? 0 : bac).toFixed(3)}
              </span>
              <span className="text-sm font-bold text-white/30">% BAC</span>
            </div>
            <div className="text-xs font-medium mt-1 text-white/50">
              {bac > 0
                ? `Estimated clearance in ~${(bac / 0.015).toFixed(1)} hrs`
                : "Baseline reached"}
            </div>
          </div>

          <div className="flex-1 w-full min-h-[100px] mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={bacTrend}
                margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
              >
                <defs>
                  <linearGradient
                    id="colorBacGraph"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={bac > 0.05 ? "#ffb4ab" : "#57f1db"}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={bac > 0.05 ? "#ffb4ab" : "#57f1db"}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={bac > 0.05 ? "#ffb4ab" : "#57f1db"}
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorBacGraph)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Annual Consistency Heatmap */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-12 bg-gradient-to-br from-surface-container/90 to-white/5 rounded-lg border border-white/10 p-8 flex flex-col group transition-all hover:border-white/15"
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-primary/80 font-display mb-2">
                    Annual Adherence
                  </h3>
                  <p className="text-lg text-white font-bold">
                    {annualHeatmapData.flat().filter((d) => d.colorClass?.includes("bg-brand-primary")).length} Days
                  </p>
                  <p className="text-xs text-white/60 mt-1 font-medium">
                    Under recommended limit
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 flex-1">
              <div className="bg-white/[0.06] border border-white/10 rounded-lg p-4 backdrop-blur-sm hover:bg-white/[0.08] transition-all">
                <div className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-2">
                  Completion
                </div>
                <div className="text-2xl font-black text-brand-primary">
                  {Math.round(
                    (annualHeatmapData.flat().filter((d) => d.colorClass?.includes("bg-brand-primary")).length / 365) * 100
                  )}%
                </div>
              </div>
              <div className="bg-white/[0.06] border border-white/10 rounded-lg p-4 backdrop-blur-sm hover:bg-white/[0.08] transition-all">
                <div className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-2">
                  Streak
                </div>
                <div className="text-2xl font-black text-cyan-400">
                  {Math.floor(Math.random() * 30) + 1}
                </div>
              </div>
              <div className="bg-white/[0.06] border border-white/10 rounded-lg p-4 backdrop-blur-sm hover:bg-white/[0.08] transition-all">
                <div className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-2">
                  Best Month
                </div>
                <div className="text-2xl font-black text-emerald-400">
                  28
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mb-8 bg-white/[0.04] border border-white/8 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest">
                Adherence Level:
              </span>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-[4px] bg-white/15" />
                <span className="text-xs text-white/60 font-medium">None</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-[4px] bg-brand-primary/40" />
                <span className="text-xs text-white/60 font-medium">Low</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-[4px] bg-brand-primary/70" />
                <span className="text-xs text-white/60 font-medium">Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-[4px] bg-brand-primary" />
                <span className="text-xs text-white/60 font-medium">Full</span>
              </div>
            </div>
          </div>

          {/* Heatmap Grid */}
          <div className="flex overflow-x-auto custom-scrollbar pb-4 -mx-8 px-8 md:mx-0 md:px-0 gap-1">
            <div className="flex gap-1 min-w-max">
              {annualHeatmapData.map((weekData, colIndex) => (
                <div key={colIndex} className="flex flex-col gap-1 items-center">
                  {colIndex % 4 === 0 && (
                    <div className="text-[8px] text-white/30 font-bold h-4 flex items-end">
                      W{Math.floor(colIndex / 4) + 1}
                    </div>
                  )}
                  {weekData.map((dayData, rowIndex) => (
                    <motion.div
                      key={`${colIndex}-${rowIndex}`}
                      whileHover={{ scale: 1.2 }}
                      className={cn(
                        "rounded-[4px] transition-all cursor-help shadow-lg hover:shadow-brand-primary/50 ring-2 ring-transparent hover:ring-brand-primary/50",
                        dayData.colorClass,
                      )}
                      style={{ opacity: dayData.op, width: "20px", height: "20px" }}
                      title={`${dayData.date}: ${dayData.units.toFixed(1)} units`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
