import React from 'react'
import { motion } from 'framer-motion'
import { Save, ExternalLink } from 'lucide-react'

export const AiImageCard = ({ imageUrl, prompt, onSave }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 overflow-hidden rounded-xl border border-white/20 bg-black/40 shadow-xl"
    >
      <div className="relative aspect-video group">
        <img
          src={imageUrl}
          alt={prompt}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

        <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg bg-black/50 hover:bg-black/70 text-white backdrop-blur-md transition-colors"
            title="Open full size"
          >
            <ExternalLink size={16} />
          </a>
          <button
            onClick={onSave}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold backdrop-blur-md transition-colors"
          >
            <Save size={14} />
            <span>Save to Note</span>
          </button>
        </div>
      </div>
      <div className="p-3">
        <p className="text-xs text-gray-400 line-clamp-2 italic">"{prompt}"</p>
      </div>
    </motion.div>
  )
}
