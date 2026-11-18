"use client";

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Video,
  Globe,
  ShieldCheck,
  Sparkles,
  Users,
  Crown,
  Settings,
  Bell,
} from 'lucide-react';

export default function Navbar({
  show,

}: { show: boolean }) {
  if (!show) {
    return null;
  }

  return (
    <motion.header

      className="sticky top-0 z-50 w-full border-b bg-black border-white/10  backdrop-blur-xl text-white"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Brand Logo & Name */}
        <motion.a
          href="/"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2.5 group focus:outline-none"
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 via-fuchsia-600 to-indigo-500 shadow-lg shadow-violet-500/25">
            <Video className="h-5 w-5 text-white" strokeWidth={2.3} />
            <motion.span
              animate={{ scale: [1, 1.25, 1] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
              className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-zinc-950 bg-emerald-400"
            />
          </div>
          <span className="bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-xl font-bold tracking-tight text-transparent">
            VibeSync
          </span>
        </motion.a>





      </div>
    </motion.header>
  );
}
