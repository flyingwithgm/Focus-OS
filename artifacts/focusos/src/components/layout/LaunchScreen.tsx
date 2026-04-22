import React from 'react';
import { motion } from 'framer-motion';

export function LaunchScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#060915] text-[#0be7a4] overflow-hidden">
      {/* Optional subtle texture */}
      <div 
        className="absolute inset-0 opacity-20 bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: 'url(/texture.png)' }}
      />
      
      <div className="relative flex flex-col items-center justify-center w-full max-w-sm p-8 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="mb-6 relative"
        >
          <div className="absolute inset-0 mint-glow rounded-full blur-2xl opacity-40"></div>
          <img src="/icon-512.png" alt="FocusOS Logo" className="w-32 h-32 relative z-10 drop-shadow-xl" />
        </motion.div>
        
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-4xl font-bold tracking-tight text-white mb-2"
        >
          FocusOS
        </motion.h1>
        
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="text-[#93a4cb] font-medium tracking-wide uppercase text-sm mb-12"
        >
          Student Operating System
        </motion.p>
        
        <div className="w-full h-1 bg-[#111a35] rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ delay: 0.5, duration: 2, ease: "easeInOut" }}
            className="h-full bg-[#0be7a4] rounded-full mint-glow"
          />
        </div>
      </div>
    </div>
  );
}
