import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FeedItem } from "../types";
import { useSession } from "../context/SessionContext";
import {
  Heart,
  MessageSquare,
  Share2,
  Zap,
  Target,
  Star,
  Filter,
  ChevronDown,
} from "lucide-react";

type FeedCardItem = FeedItem & { isRequest?: boolean };

const FeedCard = React.memo(function FeedCard({ item }: { item: FeedCardItem }) {
  const [isLiked, setIsLiked] = useState(false);
  const [localKudos, setLocalKudos] = useState(item.kudos);
  const [showComments, setShowComments] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLocalKudos(isLiked ? Math.max(0, localKudos - 1) : localKudos + 1);
  };

  const handleShare = async () => {
    const text = `${item.userName} ${item.title}. Peak BAC: ${item.peakBac}%`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Alcotrax Session',
          text: text,
        });
      } else {
        await navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
      }
    } catch (err) {
      console.log('Share failed:', err);
    }
  };

  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-surface-container/95 rounded-2xl border border-white/10 p-5 sm:p-6 shadow-lg shadow-black/20 hover:border-brand-primary/50 transition-colors"
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-brand-primary to-purple-500 border-2 border-white/10 flex-shrink-0 overflow-hidden">
          <img src={item.userAvatar} alt={item.userName} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white text-base sm:text-lg leading-tight">{item.userName}</h3>
          <p className="text-xs text-white/50">{item.time}</p>
        </div>
      </div>

      <h4 className="text-sm sm:text-base font-semibold text-white mb-4 leading-snug">{item.title}</h4>

      {item.badges.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {item.badges.map((badge) => {
            const IconMap: Record<string, React.ReactNode> = {
              Target: <Target className="w-3 h-3" />,
              Heart: <Heart className="w-3 h-3" />,
              Rocket: <Zap className="w-3 h-3" />,
            };

            return (
              <div
                key={badge.id}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/8 border border-white/10 text-xs font-semibold ${badge.color}`}
              >
                {IconMap[badge.icon] || <Star className="w-3 h-3" />}
                {badge.name}
              </div>
            );
          })}
        </div>
      )}

      {!item.isRequest && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3 mb-6 bg-white/5 rounded-xl p-3 sm:p-4 border border-white/5">
          <div className="text-center">
            <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Units</div>
            <div className="text-lg font-bold text-white">{item.units}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Duration</div>
            <div className="text-xs font-semibold text-white/80">{item.duration}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Peak BAC</div>
            <div className="text-lg font-bold text-white">{item.peakBac}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Readiness</div>
            <div className="text-lg font-bold text-green-400">
              {Number.isFinite(parseFloat(item.peakBac)) ? Math.round(100 - parseFloat(item.peakBac) * 100) : 0}%
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <div className="flex items-center gap-4 text-xs text-white/50">
          {!item.isRequest && (
            <>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleLike}
                className={`flex items-center gap-2 transition-all ${
                  isLiked
                    ? 'text-brand-primary'
                    : 'hover:text-brand-primary'
                }`}
              >
                <Heart
                  className={`w-4 h-4 transition-all ${
                    isLiked ? 'fill-brand-primary' : 'group-hover:fill-brand-primary'
                  }`}
                />
                <span>{localKudos}</span>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowComments(!showComments)}
                className="flex items-center gap-2 hover:text-brand-primary transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{item.support}</span>
              </motion.button>
            </>
          )}
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleShare}
          className="p-2 rounded-lg bg-white/5 text-white/50 hover:bg-white/10 hover:text-brand-primary transition-colors"
          title="Share this session"
        >
          <Share2 className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && !item.isRequest && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-white/5 space-y-3"
          >
            <div className="text-xs font-bold text-white/40 uppercase tracking-widest">
              Comments ({item.support})
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-xs text-white/60 text-center">
              Comments coming soon! Be the first to celebrate this session.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export default function Feed() {
  const [filterType, setFilterType] = useState<"all" | "friends" | "badges" | "milestones">("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { feedItems, incomingFriendRequests } = useSession();

  const filteredFeed = feedItems.filter((item) => {
    if (filterType === "badges") return item.badges.length > 0;
    if (filterType === "milestones") return item.units >= 5 || item.kudos > 20;
    return true;
  });

  const incomingRequests: FeedCardItem[] = incomingFriendRequests.map((req) => ({
    id: `request-${req.userId}`,
    userId: req.userId,
    userName: req.userName,
    userAvatar: req.userAvatar,
    title: "wants to add you as a friend 👋",
    time: "Just now",
    units: 0,
    duration: "-",
    peakBac: "0",
    badges: [],
    kudos: 0,
    support: 0,
    timestamp: Date.now(),
    isRequest: true,
  }));

  const allItems: FeedCardItem[] = [...incomingRequests, ...filteredFeed];

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-32">
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md py-4 border-b border-white/5 -mx-4 px-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black font-display tracking-tight text-on-surface">Activity Feed</h1>
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="p-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-brand-primary transition-colors flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              <ChevronDown className="w-3 h-3" />
            </button>

            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-surface-container border border-white/10 rounded-lg shadow-lg z-20">
                {[
                  { value: "all", label: "All Activity" },
                  { value: "friends", label: "Friends Only" },
                  { value: "badges", label: "Badges Unlocked" },
                  { value: "milestones", label: "Milestones" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setFilterType(option.value as any);
                      setIsFilterOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                      filterType === option.value
                        ? "bg-brand-primary/20 text-brand-primary border-l-2 border-brand-primary"
                        : "text-white/60 hover:bg-white/5"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {allItems.length > 0 ? (
          allItems.map((item) => <FeedCard key={item.id} item={item} />)
        ) : (
          <div className="text-center py-16 bg-white/5 rounded-xl border border-white/5 border-dashed">
            <MessageSquare className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white/60 mb-2">No Activity</h3>
            <p className="text-sm text-white/40">
              {filterType !== "all"
                ? "No matching activity. Try a different filter."
                : "Add friends to see their activity in your feed!"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
