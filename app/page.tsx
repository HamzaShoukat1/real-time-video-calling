"use client";

import { motion, AnimatePresence } from "motion/react";
import {
  Video,
  Shield,
  ArrowRight,
  Loader2,
  Globe,
  SkipForward,
  PhoneOff,
} from "lucide-react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { io } from "socket.io-client";
import { useEffect, useState } from "react";
import VideoRoom from "./components/VideoRoom";

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000", {
  transports: ["websocket"],
});

export default function Page() {
  const [status, setstatus] = useState("idle");
  const [roomId, setroomId] = useState("");

  const StartAnonymousChat = () => {
    if (status === "waiting") return;
    socket.emit("start-call");
    setstatus("waiting");
  };

  const handleNextPartner = () => {
    if (roomId) {
      socket.emit("next", { roomId });
    }
    setroomId("");
    setstatus("waiting");
    socket.emit("start-call");
  };

  const handleEndCall = () => {
    if (roomId) {
      socket.emit("next", { roomId });
    }
    setroomId("");
    setstatus("idle");
  };

  useEffect(() => {
    const onMatched = ({ roomId }: { roomId: string }) => {
      setroomId(roomId);
      setstatus("connected");
    };

    const onPartnerLeft = () => {
      setroomId("");
      setstatus("idle");
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
      <Navbar show={!isConnected} />
      <main
        className={`relative flex w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-black via-zinc-900 to-black text-white transition-all duration-500 ${
          isConnected ? "min-h-screen px-4 py-4" : "min-h-[calc(100vh-4rem)] px-6 py-20"
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
              exit={{ opacity: 0, y: -20, scale: 0.97, transition: { duration: 0.3 } }}
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
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-zinc-300 backdrop-blur-md"
              >
                <Shield className="h-3.5 w-3.5 text-emerald-400" />
                <span>100% Private & Encrypted Peer-to-Peer</span>
              </motion.div>

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
                  <Video className="h-5 w-5 text-zinc-950 transition-transform duration-300 group-hover:scale-110" />
                  <span>Start Anonymous Chat</span>
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
                  transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
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
                transition={{ delay: 0.2, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-zinc-900/70 px-4 py-3 shadow-lg backdrop-blur-xl sm:px-6"
              >
                {/* Top-Left: Live Connected Indicator */}
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
                transition={{ delay: 0.1, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="w-full overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/60 shadow-2xl backdrop-blur-md"
              >
                <VideoRoom key={roomId} roomId={roomId} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      {!isConnected && <Footer />}
    </>
  );
}