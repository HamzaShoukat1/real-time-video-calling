"use client";

import { motion, AnimatePresence } from "motion/react";
import {
  Video,
  MessageCircle,
  Shield,
  ArrowRight,
  Loader2,
  Globe,
  SkipForward,
  PhoneOff,
  Clock,
  UserX,
  Users,
} from "lucide-react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import TextChatRoom from "./components/TextChatRoom";
import { io } from "socket.io-client";
import { useEffect, useState, useRef } from "react";

declare global {
  // Keep one browser socket across Next.js Fast Refresh module evaluations.
  var __vibesyncSocket: ReturnType<typeof io> | undefined;
}

type Gender = "Male" | "Female" | "Other";
type FilterGender = "All" | Gender;
type MatchPreferences = {
  isAdult: true;
  gender: Gender;
  filterGender: FilterGender;
  mode: "chat" | "video";
};
import VideoRoom from "./components/VideoRoom";

const socket =
  globalThis.__vibesyncSocket ??=
    io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000", {
      transports: ["websocket"],
    });

export default function Page() {
  const [status, setstatus] = useState("idle");
  const [roomId, setroomId] = useState("");
  const [reconnectCountdown, setReconnectCountdown] = useState(3);
  const [callDuration, setCallDuration] = useState(0);
  const [chatCount, setChatCount] = useState(0);
  const [lastCallDuration, setLastCallDuration] = useState<number | null>(null);
  const [preferences, setPreferences] = useState<MatchPreferences | null>(null);
  const [showEntryModal, setShowEntryModal] = useState(true);
  const [isAdult, setIsAdult] = useState(false);
  const [gender, setGender] = useState<Gender | "">("");
  const [filterGender, setFilterGender] = useState<FilterGender | "">("");
  const [mode, setMode] = useState<"chat" | "video">("video");
  const [matchedMode, setMatchedMode] = useState<"chat" | "video">("video");
  const [onlineCount, setOnlineCount] = useState(0);
  const callDurationRef = useRef(0);

  useEffect(() => {
    const onOnlineCount = (count: number) => setOnlineCount(count);
    const requestOnlineCount = () => socket.emit("get-online-count");

    socket.on("online-count", onOnlineCount);
    socket.on("connect", requestOnlineCount);
    if (socket.connected) requestOnlineCount();

    return () => {
      socket.off("online-count", onOnlineCount);
      socket.off("connect", requestOnlineCount);
    };
  }, []);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("match-preferences");
      if (saved) {
        const parsed = JSON.parse(saved) as MatchPreferences;
        if (
          parsed.isAdult === true &&
          ["Male", "Female", "Other"].includes(parsed.gender) &&
          ["All", "Male", "Female", "Other"].includes(parsed.filterGender) &&
          ["chat", "video"].includes(parsed.mode)
        ) {
          setPreferences(parsed);
          setIsAdult(true);
          setGender(parsed.gender);
          setFilterGender(parsed.filterGender);
          setMode(parsed.mode);
          setShowEntryModal(false);
          return;
        }
      }
    } catch {
      sessionStorage.removeItem("match-preferences");
    }
    setShowEntryModal(true);
  }, []);

  const emitStartCall = () => {
    if (preferences) socket.emit("start-call", preferences);
  };

  const savePreferences = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAdult || !gender || !filterGender) return;
    const nextPreferences: MatchPreferences = {
      isAdult: true,
      gender,
      filterGender,
      mode,
    };
    sessionStorage.setItem(
      "match-preferences",
      JSON.stringify(nextPreferences),
    );
    setPreferences(nextPreferences);
    setShowEntryModal(false);
    if (status === "waiting") socket.emit("start-call", nextPreferences);
  };

  useEffect(() => {
    callDurationRef.current = callDuration;
  }, [callDuration]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (status === "connected") {
      setCallDuration(0);
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status]);

  useEffect(() => {
    if (status !== "partner-left") return;

    setReconnectCountdown(3);
    const interval = setInterval(() => {
      setReconnectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setstatus("waiting");
          emitStartCall();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const StartAnonymousChat = () => {
    if (status === "waiting") return;
    emitStartCall();
    setstatus("waiting");
  };

  const handleNextPartner = () => {
    setLastCallDuration(callDurationRef.current);
    if (roomId) {
      socket.emit("next", { roomId });
    }
    setroomId("");
    setstatus("waiting");
    emitStartCall();
  };

  const handleEndCall = () => {
    setLastCallDuration(callDurationRef.current);
    if (roomId) {
      socket.emit("next", { roomId });
    }
    setroomId("");
    setstatus("idle");
  };

  const handleFindNow = () => {
    setstatus("waiting");
    emitStartCall();
  };

  const handleCancelReconnect = () => {
    setstatus("idle");
  };

  useEffect(() => {
    const onMatched = ({ roomId, mode }: { roomId: string; mode: "chat" | "video" }) => {
      setroomId(roomId);
      setMatchedMode(mode);
      setstatus("connected");
      setChatCount((prev) => prev + 1);
    };

    const onPartnerLeft = () => {
      setLastCallDuration(callDurationRef.current);
      setroomId("");
      setstatus("partner-left");
    };

    socket.on("matched", onMatched);
    socket.on("partner-left", onPartnerLeft);

    return () => {
      socket.off("matched", onMatched);
      socket.off("partner-left", onPartnerLeft);
    };
  }, []);

  const isConnected = status === "connected";

  return (
    <>
      <div className="fixed right-4 top-4 z-40 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowEntryModal(true)}
          className="rounded-full border border-white/15 bg-zinc-900/90 px-4 py-2 text-xs font-semibold text-zinc-200 shadow-lg backdrop-blur hover:bg-zinc-800"
        >
          Match preferences
        </button>
      </div>
      {showEntryModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="entry-title"
        >
          <form
            onSubmit={savePreferences}
            className="w-full max-w-md space-y-5 rounded-2xl border border-white/10 bg-zinc-900 p-6 text-white shadow-2xl"
          >
            <div>
              <h2 id="entry-title" className="text-2xl font-bold">
                Before you continue
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                Confirm your age and choose who you want to meet.
              </p>
            </div>
            <label className="flex cursor-pointer items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={isAdult}
                onChange={(event) => setIsAdult(event.target.checked)}
                className="h-4 w-4 accent-purple-500"
              />
              I am 18 years or older
            </label>
            <label className="block text-sm font-medium">
              My Gender
              <select
                required
                value={gender}
                onChange={(event) =>
                  setGender(event.target.value as Gender | "")
                }
                className="mt-2 w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-white"
              >
                <option value="" disabled>
                  Select your gender
                </option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </label>
            <label className="block text-sm font-medium">
              Filter / Match With
              <select
                required
                value={filterGender}
                onChange={(event) =>
                  setFilterGender(event.target.value as FilterGender | "")
                }
                className="mt-2 w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-white"
              >
                <option value="" disabled>
                  Select a match preference
                </option>
                <option>All</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </label>
            <fieldset className="space-y-2 text-sm">
              <legend className="font-medium">How do you want to connect?</legend>
              <div className="flex gap-3">
                {(["chat", "video"] as const).map((chatMode) => (
                  <label key={chatMode} className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-zinc-800 px-3 py-3 capitalize">
                    <input type="radio" name="mode" value={chatMode} checked={mode === chatMode} onChange={() => setMode(chatMode)} className="accent-purple-500" />
                    {chatMode === "chat" ? "Text chat only" : "Video call"}
                  </label>
                ))}
              </div>
              <p className="text-xs text-zinc-400">You’ll only be matched with people who chose the same chat type.</p>
            </fieldset>
            <button
              type="submit"
              disabled={!isAdult || !gender || !filterGender}
              className="w-full rounded-lg cursor-pointer bg-white px-4 py-3 font-bold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continue
            </button>
          </form>
        </div>
      )}
      <Navbar show={!isConnected} />
      <main
        className={`relative flex w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-black via-zinc-900 to-black text-white transition-all duration-500 ${
          isConnected
            ? "min-h-screen px-4 py-4"
            : "min-h-[calc(100vh-4rem)] px-6 py-20"
        }`}
      >
        {/* Top Ambient Purple Glow */}
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.45, 0.65, 0.45],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="pointer-events-none absolute -top-20 -left-20 z-0 h-[28rem] w-[28rem] rounded-full bg-purple-600/40 blur-[120px]"
        />

        {/* Bottom Ambient Blue Glow */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="pointer-events-none absolute -bottom-24 -right-20 z-0 h-[28rem] w-[28rem] rounded-full bg-blue-600/40 blur-[120px]"
        />

        {/* Animated State Switcher */}
        <AnimatePresence mode="wait">
          {status === "idle" && (
            <motion.div
              key="idle"
              initial="hidden"
              animate="visible"
              exit={{
                opacity: 0,
                y: -20,
                scale: 0.97,
                transition: { duration: 0.3 },
              }}
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.15,
                  },
                },
              }}
              className="relative z-10 flex max-w-3xl flex-col items-center text-center"
            >
              {/* Subtle Top Pill Badge */}
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
                }}
                className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-zinc-300 backdrop-blur-md"
              >
                <Shield className="h-3.5 w-3.5 text-emerald-400" />
                <span>100% Private & Encrypted Peer-to-Peer</span>
              </motion.div>

              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
                }}
                className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-100 shadow-[0_0_24px_-10px_rgba(52,211,153,0.7)]"
                aria-live="polite"
                aria-label={`${onlineCount} people online`}
                title="People currently connected"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </span>
                <Users className="h-4 w-4 text-emerald-300" />
                <span>{onlineCount} people online now</span>
              </motion.div>

              {/* Session Stats Pill (if previous calls took place) */}
              {chatCount > 0 && lastCallDuration !== null && (
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 12 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.4 },
                    },
                  }}
                  className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3.5 py-1 text-xs font-medium text-purple-200"
                >
                  <Clock className="h-3 w-3 text-purple-400" />
                  <span>Last chat: {formatDuration(lastCallDuration)}</span>
                  <span className="text-purple-400">•</span>
                  <span>
                    {chatCount} {chatCount === 1 ? "chat" : "chats"} completed
                  </span>
                </motion.div>
              )}

              {/* Main App Name */}
              <motion.h1
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
                  },
                }}
                className="bg-gradient-to-b from-white via-zinc-100 to-zinc-400 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent sm:text-7xl"
              >
                VibeSync
              </motion.h1>

              {/* Tagline / Description */}
              <motion.p
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
                  },
                }}
                className="mt-6 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-xl"
              >
                Anonymous video conversations with strangers worldwide.{" "}
                <span className="font-medium text-zinc-200">
                  No signup, no identity — just pure connection.
                </span>
              </motion.p>

              {/* Big White CTA Button */}
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
                  },
                }}
                className="mt-10"
              >
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={StartAnonymousChat}
                  className="group relative inline-flex cursor-pointer items-center gap-3 rounded-full bg-white px-8 py-4 text-base font-bold text-zinc-950 shadow-[0_0_40px_-10px_rgba(255,255,255,0.6)] transition-all hover:bg-zinc-100 hover:shadow-[0_0_55px_-8px_rgba(255,255,255,0.85)] sm:px-10 sm:py-5 sm:text-lg"
                >
                  {mode === "chat" ? <MessageCircle className="h-5 w-5 text-zinc-950" /> : <Video className="h-5 w-5 text-zinc-950 transition-transform duration-300 group-hover:scale-110" />}
                  <span>{mode === "chat" ? "Start Text Chat" : "Start Video Chat"}</span>
                  <ArrowRight className="h-5 w-5 text-zinc-700 transition-transform duration-300 group-hover:translate-x-1" />
                </motion.button>
              </motion.div>
            </motion.div>
          )}

          {status === "waiting" && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -20 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 flex flex-col items-center text-center"
            >
              {/* Pulsing Radar Rings + Center Spinner */}
              <div className="relative flex h-32 w-32 items-center justify-center">
                <motion.span
                  animate={{ scale: [1, 1.9], opacity: [0.55, 0] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                  className="absolute h-20 w-20 rounded-full border border-purple-400/50 bg-purple-500/10"
                />
                <motion.span
                  animate={{ scale: [1, 1.9], opacity: [0.55, 0] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeOut",
                    delay: 1,
                  }}
                  className="absolute h-20 w-20 rounded-full border border-blue-400/50 bg-blue-500/10"
                />

                {/* Glass Orb Loader */}
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-white/15 bg-white/5 shadow-[0_0_40px_rgba(168,85,247,0.3)] backdrop-blur-xl">
                  <Loader2 className="h-9 w-9 animate-spin text-white" />
                </div>
              </div>

              {/* Matching Heading */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mt-6 bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-2xl font-bold tracking-tight text-transparent sm:text-4xl"
              >
                Matching you with someone...
              </motion.h2>

              {/* Animated Subtext */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="mt-3 flex items-center gap-2 text-sm text-zinc-400 sm:text-base"
              >
                <Globe className="h-4 w-4 animate-pulse text-purple-400" />
                <span>Scanning global peer network</span>
                <span className="inline-flex w-6 text-left">
                  <motion.span
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                  >
                    .
                  </motion.span>
                  <motion.span
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                  >
                    .
                  </motion.span>
                  <motion.span
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                  >
                    .
                  </motion.span>
                </span>
              </motion.div>
            </motion.div>
          )}

          {status === "partner-left" && (
            <motion.div
              key="partner-left"
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: -20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 flex w-full max-w-md flex-col items-center text-center"
            >
              {/* Pulsing Disconnect Icon */}
              <div className="relative mb-6 flex h-24 w-24 items-center justify-center">
                <motion.span
                  animate={{ scale: [1, 1.45], opacity: [0.45, 0] }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                  className="absolute h-20 w-20 rounded-full border border-red-500/40 bg-red-500/10"
                />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 shadow-[0_0_35px_rgba(239,68,68,0.25)] backdrop-blur-xl">
                  <UserX className="h-8 w-8 text-red-400" />
                </div>
              </div>

              {/* Heading & Subtext */}
              <h2 className="bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-2xl font-bold tracking-tight text-transparent sm:text-3xl">
                Partner Disconnected
              </h2>
              <p className="mt-2 text-sm text-zinc-400">
                The other stranger has left or skipped to the next person.
              </p>

              {lastCallDuration !== null && lastCallDuration > 0 && (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
                  <Clock className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Call lasted {formatDuration(lastCallDuration)}</span>
                </div>
              )}

              {/* Reconnect Countdown Card */}
              <div className="mt-6 flex w-full flex-col gap-3 rounded-2xl border border-white/10 bg-zinc-900/70 p-4 shadow-xl backdrop-blur-xl">
                <div className="flex w-full items-center justify-between text-xs font-medium text-zinc-300">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-purple-500" />
                    </span>
                    <span>Finding next stranger</span>
                  </div>
                  <span className="font-mono text-purple-400 font-bold">
                    in {reconnectCountdown}s
                  </span>
                </div>

                {/* Animated Progress Bar */}
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    key={reconnectCountdown}
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: 1, ease: "linear" }}
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                  />
                </div>
              </div>

              {/* Action Controls */}
              <div className="mt-6 flex w-full items-center justify-center gap-3">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleCancelReconnect}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:bg-white/10"
                >
                  <PhoneOff className="h-4 w-4 text-zinc-400" />
                  <span>Stop</span>
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleFindNow}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-zinc-950 shadow-[0_0_25px_-5px_rgba(255,255,255,0.6)] transition-all hover:bg-zinc-100"
                >
                  <span>Find Now</span>
                  <ArrowRight className="h-4 w-4 text-zinc-700" />
                </motion.button>
              </div>
            </motion.div>
          )}

          {isConnected && roomId && (
            <motion.div
              key="connected"
              initial={{ opacity: 0, scale: 0.96, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -20 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 flex w-full max-w-6xl flex-col gap-4"
            >
              {/* Floating Top Status & Action Bar */}
              <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.2,
                  duration: 0.4,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-zinc-900/70 px-4 py-3 shadow-lg backdrop-blur-xl sm:px-6"
              >
                {/* Top-Left: Live Connected Indicator + Room Tag */}
                <div className="flex items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      Connected
                    </span>
                    <span className="hidden rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-xs text-zinc-400 sm:inline-block">
                      #{roomId.slice(0, 8)}
                    </span>
                  </div>
                </div>

                {/* Center / Stats: Live Timer, Chat Counter, Security Pill */}
                <div className="flex items-center gap-2 sm:gap-2.5">
                  {/* Live Call Duration Timer */}
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-xs font-mono font-semibold text-emerald-300 shadow-[0_0_15px_-3px_rgba(16,185,129,0.25)]">
                    <Clock className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{formatDuration(callDuration)}</span>
                  </div>

                  {/* Session Chat Counter */}
                  <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-zinc-300">
                    <Users className="h-3.5 w-3.5 text-purple-400" />
                    <span>Chat #{chatCount}</span>
                  </div>

                  {/* Direct P2P Pill */}
                  <div className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-zinc-400">
                    <Shield className="h-3.5 w-3.5 text-emerald-400" />
                    <span>P2P</span>
                  </div>
                </div>

                {/* Top-Right: Next & Leave Controls */}
                <div className="flex items-center gap-2.5">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={handleEndCall}
                    title="End Chat"
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-3.5 py-2 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20 sm:text-sm"
                  >
                    <PhoneOff className="h-4 w-4" />
                    <span className="hidden sm:inline">Stop</span>
                  </motion.button>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={handleNextPartner}
                    className="group inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-zinc-950 shadow-[0_0_25px_-5px_rgba(255,255,255,0.5)] transition-all hover:bg-zinc-100 hover:shadow-[0_0_30px_-3px_rgba(255,255,255,0.75)] sm:px-5 sm:text-sm"
                  >
                    <span>Next</span>
                    <SkipForward className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </motion.button>
                </div>
              </motion.div>

              {/* Animated VideoRoom Container */}
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: 0.1,
                  duration: 0.45,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="w-full overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/60 shadow-2xl backdrop-blur-md"
              >
                {matchedMode === "chat" ? (
                  <TextChatRoom key={roomId} socket={socket} roomId={roomId} onNext={handleNextPartner} onEnd={handleEndCall} />
                ) : (
                  <VideoRoom key={roomId} roomId={roomId} />
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      {!isConnected && <Footer />}
    </>
  );
}
