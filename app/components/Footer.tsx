'use client'

import { useEffect, useState } from 'react'

export default function Footer() {
  const [year, setYear] = useState<number | null>(null)

  useEffect(() => {
    setYear(new Date().getFullYear())
  }, [])

  return (
    <div className='relative z-10 text-center py-6 text-xs text-zinc-500 bg-black border-b border-white/10'>
      {year ?? '2026'} &copy; VibeSync. All rights reserved.
    </div>
  )
}
