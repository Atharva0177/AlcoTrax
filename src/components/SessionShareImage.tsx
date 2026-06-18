import React, { useRef } from "react";
import { toPng } from "html-to-image";
import {
  Share2,
  Activity,
  Clock,
  Droplet,
  Flame,
  Wine,
  Calendar,
  Beer,
  GlassWater,
} from "lucide-react";
import { type SessionSummary } from "../types";
import logoImage from "../../alcotrax.png";

export default function SessionShareImage({
  summary,
}: {
  summary: SessionSummary;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const getDrinkIcon = (name: string, iconUrl?: string) => {
    if (iconUrl && iconUrl.startsWith("data:")) {
      return (
        <img
          src={iconUrl}
          alt={name}
          className="w-3 h-3 object-cover rounded-full"
        />
      );
    }
    const n = name.toLowerCase();
    if (n.includes("beer") || n.includes("seltzer") || n.includes("light"))
      return <Beer className="w-3 h-3 text-brand-primary" />;
    if (n.includes("wine")) return <Wine className="w-3 h-3 text-purple-400" />;
    if (n.includes("water"))
      return <Droplet className="w-3 h-3 text-blue-400" />;
    return <GlassWater className="w-3 h-3 text-orange-400" />;
  };

  const handleShare = async () => {
    if (!ref.current) return;
    try {
      const dataUrl = await toPng(ref.current, {
        cacheBust: true,
        pixelRatio: 2,
      });

      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "alcotrax-session.png", {
        type: "image/png",
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "AlcoTrax Session",
          text: "Check out my AlcoTrax session stats!",
        });
      } else {
        const link = document.createElement("a");
        link.download = "alcotrax-session.png";
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error("Error sharing image", err);
    }
  };

  const formattedDate = new Date(
    summary.timestamp || Date.now(),
  ).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <>
      <button
        onClick={handleShare}
        className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-primary text-brand-on-primary rounded-xl font-black uppercase tracking-widest text-[9px] hover:scale-105 active:scale-95 transition-all w-fit"
      >
        <Share2 className="w-3 h-3" />
        Share Session Stats
      </button>

      {/* Hidden element for screenshotting */}
      <div className="fixed -left-[9999px] top-0 pointer-events-none">
        <div
          ref={ref}
          className="w-[480px] h-[850px] bg-neutral-950 text-white flex flex-col relative overflow-hidden"
          style={{ fontFamily: '"Inter", sans-serif' }}
        >
          {/* Stunning CSS Mesh Gradient Background */}
          <div
            className="absolute inset-0 z-[1] opacity-60"
            style={{
              backgroundImage:
                "radial-gradient(circle at 10% 20%, rgba(212, 175, 55, 0.25) 0%, transparent 50%), radial-gradient(circle at 90% 80%, rgba(197, 160, 89, 0.2) 0%, transparent 60%), radial-gradient(circle at 50% 50%, rgba(100, 50, 150, 0.1) 0%, transparent 70%)",
            }}
          />

          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:40px_40px] z-[1] pointer-events-none" />

          {/* Top Header */}
          <div className="relative z-10 w-full p-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src={logoImage} 
                alt="AlcoTrax Logo" 
                className="w-24 h-24 object-contain"
              />
              <div className="flex flex-col">
                <span className="text-brand-primary font-bold tracking-[0.2em] text-[8px] uppercase mt-1">
                  Session Report
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-white/50 text-[10px] font-bold tracking-widest uppercase bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
              <Calendar className="w-3 h-3" />
              {formattedDate}
            </div>
          </div>

          {/* Decorative Mock Chart Graphic */}
          <svg
            className="absolute left-0 right-0 top-32 w-full h-48 opacity-30 pointer-events-none z-[2]"
            viewBox="0 0 480 200"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d4af37" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M-20,200 C80,180 140,80 240,100 C340,120 400,40 500,20 L500,200 Z"
              fill="url(#chartGrad)"
            />
            <path
              d="M-20,200 C80,180 140,80 240,100 C340,120 400,40 500,20"
              fill="none"
              stroke="#d4af37"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="400" cy="40" r="5" fill="#fff" />
            <circle
              cx="400"
              cy="40"
              r="14"
              fill="transparent"
              stroke="rgba(212,175,55,0.6)"
              strokeWidth="2"
            />
          </svg>

          {/* Floating Accents */}
          <div className="absolute top-[35%] left-[25%] w-3 h-3 rounded-full bg-brand-primary/30 z-[2] blur-[1px]" />
          <div className="absolute top-[45%] right-[15%] w-5 h-5 rounded-full bg-brand-primary/20 z-[2] blur-[2px]" />

          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neutral-950/50 to-neutral-950 z-[3] pointer-events-none" />

          {/* Main Stats Area */}
          <div className="relative z-10 flex-1 flex flex-col justify-end p-8 gap-6 pb-12 w-full">
            {/* Consumed Drinks */}
            {summary.consumedDrinks && summary.consumedDrinks.length > 0 && (
              <div className="w-full flex justify-center mb-0">
                <div className="max-w-full flex items-center justify-center gap-2 flex-wrap text-center">
                  {summary.consumedDrinks.map((drink, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-gradient-to-b from-white/10 to-white/5 border border-white/10 px-3 py-1.5 rounded-xl backdrop-blur-md shadow-lg shadow-black/20"
                    >
                      {drink.count > 1 && (
                        <span className="text-brand-primary font-black text-[11px] mr-1">
                          {drink.count}x
                        </span>
                      )}
                      {getDrinkIcon(drink.name, drink.iconUrl)}
                      <span className="text-white/90 font-bold text-[11px] tracking-wide whitespace-nowrap">
                        {drink.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hero Stats */}
            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden backdrop-blur-md">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/20 blur-[40px] rounded-full -mr-10 -mt-10 pointer-events-none" />
                <div className="flex items-center gap-2 mb-3 relative z-10">
                  <Activity className="w-5 h-5 text-brand-primary" />
                  <span className="text-white/60 font-bold text-xs tracking-widest uppercase">
                    Peak BAC
                  </span>
                </div>
                <div className="text-[52px] leading-none font-black tracking-tighter relative z-10 text-white">
                  {(summary.peakBac || 0).toFixed(3)}
                  <span className="text-2xl tracking-normal text-brand-primary font-bold ml-1">
                    %
                  </span>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden backdrop-blur-md">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-tertiary-container/20 blur-[40px] rounded-full -mr-10 -mt-10 pointer-events-none" />
                <div className="flex items-center gap-2 mb-3 relative z-10">
                  <Droplet className="w-5 h-5 text-brand-tertiary-container" />
                  <span className="text-white/60 font-bold text-xs tracking-widest uppercase">
                    Units
                  </span>
                </div>
                <div className="text-[52px] leading-none font-black tracking-tighter relative z-10 text-white">
                  {(summary.totalUnits || 0).toFixed(1)}
                  <span className="text-2xl tracking-normal text-brand-tertiary-container font-bold ml-1">
                    U
                  </span>
                </div>
              </div>
            </div>

            {/* Bento Grid Stats */}
            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-4 backdrop-blur-md">
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0 border border-purple-500/30">
                  <Wine className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <div className="text-white/50 text-[10px] font-bold tracking-widest uppercase mb-1">
                    Drinks
                  </div>
                  <div className="text-2xl font-black text-white leading-none">
                    {summary.drinkCount || 0}
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-4 backdrop-blur-md">
                <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0 border border-orange-500/30">
                  <Flame className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <div className="text-white/50 text-[10px] font-bold tracking-widest uppercase mb-1">
                    Calories
                  </div>
                  <div className="text-2xl font-black text-white leading-none">
                    {Math.round(summary.totalCalories || 0)}{" "}
                    <span className="text-sm font-bold text-white/50">
                      kcal
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-4 backdrop-blur-md">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 border border-blue-500/30">
                  <Droplet className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-white/50 text-[10px] font-bold tracking-widest uppercase mb-1">
                    Water
                  </div>
                  <div className="text-2xl font-black text-white leading-none">
                    {summary.waterVolume || 0}{" "}
                    <span className="text-sm font-bold text-white/50">ml</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-4 backdrop-blur-md">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 border border-green-500/30">
                  <Clock className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <div className="text-white/50 text-[10px] font-bold tracking-widest uppercase mb-1">
                    Duration
                  </div>
                  <div className="text-2xl font-black text-white leading-none">
                    {Math.floor((summary.durationMins || 0) / 60)}h{" "}
                    {(summary.durationMins || 0) % 60}m
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-6 border-t border-white/10 w-full flex items-center justify-center">
              <span className="text-white/30 text-[10px] font-black tracking-[0.3em] uppercase">
                Tracked on AlcoTrax
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
