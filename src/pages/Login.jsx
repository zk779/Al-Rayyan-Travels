import React, { useState, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Mail, Eye, EyeOff, Loader2, UserCheck, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import logo from "../assets/logo-dark.png";
import logoLight from "../assets/logo-light.png";
import Hero from "../assets/home/hero.jpg";
import { Sparkles } from "../../shadcn/components/ui/sparkles";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// FIXED: Memoizing the Sparkles component prevents it from re-rendering 
// when the parent's email/password state changes.
const StaticSparkles = memo(() => (
  <Sparkles
    key="login-sparkles-static"
    density={800}
    speed={1.2}
    size={1.2}
    direction="top"
    opacitySpeed={2}
    color="#32A7FF"
    className="absolute inset-x-0 bottom-0 h-full w-full"
  />
));

StaticSparkles.displayName = "StaticSparkles";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [savedProfile, setSavedProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const profile = localStorage.getItem("rememberedProfile");
    if (profile) {
      const parsed = JSON.parse(profile);
      setSavedProfile(parsed);
      setEmail(parsed.email);
      setRememberMe(true);
    }
  }, []);

  const handleClearProfile = () => {
    localStorage.removeItem("rememberedProfile");
    setSavedProfile(null);
    setEmail("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Invalid credentials");
      }

      if (rememberMe) {
        localStorage.setItem("rememberedProfile", JSON.stringify({
          email: data.user.email,
          name: data.user.name,
          lastLogin: new Date().toISOString()
        }));
      } else {
        localStorage.removeItem("rememberedProfile");
      }

      login({ token: data.token, user: data.user });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black bg-[radial-gradient(200%_120%_at_50%_10%,rgba(52,99,135,0)_55%,rgba(50,132,237,1)_100%)] text-white font-sans selection:bg-sky-500/30 overflow-x-hidden relative">
      <div className="fixed inset-0 -z-20 bg-[url('/images/auth-bg.jpg')] bg-cover bg-center opacity-20" />
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-[#0b1220]/40 via-[#0b1220] to-[#0b1220]" />
      
      {/* FIXED BACKGROUND: Sparkles now stay steady during typing */}
      <StaticSparkles />

      <div className="mx-auto flex min-h-screen max-w-[1400px] flex-col px-6 relative z-10">
        <header className="flex items-center py-8">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <Link to="/" className="flex items-center gap-4 group">
              <div className="relative">
                <div className="absolute inset-0 bg-sky-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                <div className="relative p-2.5 bg-white/5 rounded-xl border border-white/10 group-hover:border-sky-500/50 transition-all duration-500 backdrop-blur-md">
                  <img src={logo} alt="Logo" className="w-9 h-9 object-contain" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight leading-none uppercase">Al Rayyan</span>
                <span className="text-xs text-sky-400 font-bold tracking-[0.3em] mt-1">TRAVELS</span>
              </div>
            </Link>
          </motion.div>
        </header>

        <main className="relative grid flex-1 items-stretch gap-12 lg:grid-cols-2 pb-20 pt-4">
          
          <motion.div 
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden lg:block w-[400px] h-[600px] pointer-events-none z-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            transition={{ duration: 1.5 }}
          >
            <svg viewBox="0 0 260 620" className="w-full h-full rotate-[10deg]">
              <motion.path
                d="M210 10 C 140 70, 250 180, 160 250 C 80 320, 210 420, 90 500 C 10 560, 90 610, 40 610"
                stroke="white"
                strokeWidth="2"
                strokeDasharray="8 12"
                fill="transparent"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2.5, ease: "easeInOut" }}
              />
            </svg>
          </motion.div>

          {/* Left Hero Section: Synchronized height and larger image */}
          <motion.section 
            initial={{ opacity: 0, x: -30 }} 
            animate={{ opacity: 1, x: 0 }}
            className="relative z-10 flex flex-col"
          >
            <div className="inline-flex w-fit items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sky-400 text-[10px] font-black tracking-[0.2em] uppercase backdrop-blur-md">
              <ShieldCheck className="w-3 h-3" /> Secure Access Portal
            </div>
            
            <h1 className="text-6xl font-black leading-[1.05] mb-8 tracking-tighter">
              Manage your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">
                Global Travels.
              </span>
            </h1>

            {/* Container now fills vertical space */}
            <div className="relative group max-w-lg">
              <div className="relative rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl">
                  <img src={Hero} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b1220] via-transparent to-transparent opacity-60" />
                  <div className="absolute bottom-0 right-5 flex items-center gap-2 opacity-90">
                    <img src={logoLight} alt="" width={100} className="z-10" />
                  </div>
              </div>
            </div>
          </motion.section>

          {/* Right Login Card - Height synchronized with Left */}
          <motion.section 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10"
          >
            <div className="bg-[#111827]/60 border border-white/10 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden group/card">
              <div className="absolute -top-24 -right-10 w-64 h-64 bg-sky-500/20 blur-[100px]" />
              
              <div className="mb-10 relative">
                <h2 className="text-3xl font-bold tracking-tight">Welcome Back</h2>
                <p className="text-white/40 text-sm font-medium mt-2">Sign in to manage your bookings and clients.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6 relative">
                <AnimatePresence mode="wait">
                  {savedProfile ? (
                    <motion.div 
                      key="saved"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/10"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-sky-500 flex items-center justify-center text-white font-black shadow-lg shadow-sky-500/20">
                          {savedProfile.email[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold tracking-tight">{savedProfile.email}</p>
                          <p className="text-[10px] text-sky-400 uppercase tracking-widest font-black">Remembered Account</p>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={handleClearProfile}
                        className="text-[10px] font-black uppercase tracking-tighter text-white/20 hover:text-red-400 transition-colors"
                      >
                        Switch
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="new"
                      className="space-y-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <label className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Email Address</label>
                      <div className="relative group">
                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-sky-400 transition-colors" />
                        <input 
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="agent@alrayyan.com"
                          className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl pl-14 pr-4 text-sm outline-none focus:border-sky-500/50 transition-all"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2">
                  <div className="relative group">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-sky-400 transition-colors" />
                    <input 
                      type={showPass ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl pl-14 pr-14 text-sm outline-none focus:border-sky-500/50 transition-all"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 hover:text-sky-400 transition-colors"
                    >
                      {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 px-2">
                  <button
                    type="button"
                    onClick={() => setRememberMe(!rememberMe)}
                    className="flex items-center gap-3 text-xs font-bold transition-all group"
                  >
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${rememberMe ? 'bg-sky-500 border-sky-500 shadow-lg shadow-sky-500/30' : 'border-white/10 group-hover:border-white/30'}`}>
                      {rememberMe && <UserCheck className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span className={rememberMe ? 'text-white' : 'text-white/40 group-hover:text-white/60'}>Trust this device</span>
                  </button>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold"
                  >
                    {error}
                  </motion.div>
                )}

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={loading}
                  className="w-full h-16 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 rounded-2xl font-black text-sm tracking-widest uppercase shadow-xl shadow-sky-500/20 transition-all flex items-center justify-center gap-4"
                >
                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    "Authorize Session"
                  )}
                </motion.button>
              </form>

              <div className="mt-10 pt-6 border-t border-white/5">
                <Link to="/signup" className="block text-center text-sm font-black text-white/40 hover:text-sky-400 transition-colors uppercase tracking-widest">
                  Contact Admin for Access
                </Link>
              </div>
            </div>
          </motion.section>
        </main>
      </div>
    </div>
  );
}