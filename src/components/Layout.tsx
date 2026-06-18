import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  UserCircle,
  ShieldCheck,
  HelpCircle,
  Activity,
  LogOut,
  ShieldAlert,
  Heart,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { logOut } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useSession } from "../context/SessionContext";
import { DrinkIcon } from "./DrinkIcon";
import logoImage from "../../alcotrax.png";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { icon: Activity, label: "Analytics", path: "/" },
  { icon: LayoutDashboard, label: "Active Session", path: "/session" },
  { icon: Heart, label: "Feed", path: "/feed" },
  { icon: Users, label: "Friends", path: "/friends" },
  { icon: UserCircle, label: "Profile", path: "/profile" },
];

const footerItems = [
  { icon: ShieldCheck, label: "Safety Guide", path: "/safety" },
  { icon: HelpCircle, label: "Support", path: "/support" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { isAdmin, currentUser } = useAuth();
  const { bac, userProfile } = useSession();
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

  const handleLogout = async () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    try {
      await logOut();
      setShowLogoutConfirm(false);
    } catch (e) {
      console.error(e);
    }
  };

  const dynamicNavItems = isAdmin
    ? [...navItems, { icon: ShieldAlert, label: "Admin", path: "/admin" }]
    : navItems;

  const bgStyle = React.useMemo(() => {
    if (isNaN(bac) || bac <= 0.02) return "bg-[#0A0A0B]"; // Base dim
    if (bac <= 0.05) return "bg-[#10100c]"; // Slight warm shift
    if (bac <= 0.08) return "bg-[#140c0a]"; // Orange shift
    return "bg-[#140a0a]"; // Red/Danger shift
  }, [bac]);

  return (
    <div
      className={cn(
        "min-h-screen text-on-surface flex font-sans selection:bg-brand-primary selection:text-brand-on-primary transition-colors duration-1000",
        bgStyle,
      )}
    >
      {/* Desktop Navigation Rail */}
      <nav className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-20 bg-surface-container border-r border-white/5 z-40 items-center py-8">
        <img 
          src={logoImage} 
          alt="AlcoTrax" 
          className="w-14 h-14 object-contain mb-10"
        />

        <ul className="flex flex-col gap-8 flex-1">
          {dynamicNavItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "w-10 h-10 flex items-center justify-center rounded-xl transition-all",
                    isActive
                      ? "bg-brand-primary text-brand-on-primary"
                      : "text-white/40 hover:text-white hover:bg-white/5",
                  )
                }
                title={item.label}
              >
                <item.icon className="w-5 h-5" />
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="mt-auto flex flex-col gap-4">
          <button
            onClick={handleLogout}
            className="w-10 h-10 flex items-center justify-center text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
            title="Switch Account"
          >
            <LogOut className="w-5 h-5" />
          </button>
          <div className="h-px w-6 bg-white/10 mx-auto" />
          {footerItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className="w-10 h-10 flex items-center justify-center text-white/20 hover:text-white transition-colors"
              title={item.label}
            >
              <item.icon className="w-5 h-5" />
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-20 min-h-screen overflow-x-hidden pb-28 lg:pb-0">
        {/* Global/Main Header */}
        <header className="sticky top-0 lg:static z-30 bg-surface-dim/80 backdrop-blur-md border-b border-white/5 lg:border-none px-4 md:px-8 lg:px-10 py-4 w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <NavLink
              to="/"
              className="lg:hidden w-12 h-12 rounded-lg flex items-center justify-center shrink-0 overflow-hidden"
            >
              <img
                src={logoImage}
                alt="AlcoTrax"
                className="w-full h-full object-contain"
              />
            </NavLink>
            <div className="flex flex-col">
              <h1 className="text-2xl font-black font-display tracking-widest uppercase text-brand-primary">
                AlcoTrax
              </h1>
              <p className="hidden sm:block text-[10px] text-white/40 uppercase tracking-widest font-bold">
                Mindful consumption dashboard
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* User Avatar */}
            <NavLink
              to="/profile"
              className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-primary to-purple-500 border-2 border-white/10 flex items-center justify-center overflow-hidden hover:border-brand-primary/60 transition-colors"
              title="Profile"
            >
              {userProfile?.avatar ? (
                <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <UserCircle className="w-5 h-5 text-white/60" />
              )}
            </NavLink>
            <button
              onClick={handleLogout}
              className="text-red-400/60 hover:text-red-400 transition-colors"
              title="Switch Account"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="p-4 md:p-8 lg:p-10 lg:pt-4 max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Nav (Floating Bento Style) */}
      <nav className="lg:hidden fixed bottom-6 left-6 right-6 h-16 bg-surface-container/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-[2rem] z-40 flex items-center justify-around px-4">
        {dynamicNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1 transition-all p-2 rounded-xl",
                isActive ? "text-brand-primary" : "text-white/30",
              )
            }
          >
            <item.icon className="w-6 h-6 outline-none" />
          </NavLink>
        ))}
      </nav>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowLogoutConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface-container border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-black font-display mb-2">Switch Account?</h2>
              <p className="text-sm text-on-surface-variant mb-6">
                You'll be logged out of <span className="font-semibold text-white">{currentUser?.email || 'your account'}</span>. You can then sign in with a different account.
              </p>
              <p className="text-xs text-white/40 mb-6">
                All your local session data will be cleared to ensure a clean login experience.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 px-4 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 hover:border-red-500/50 transition-all font-semibold text-sm"
                >
                  Sign Out & Switch
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
