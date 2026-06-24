import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const Loader: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Disable scrolling when loading
    document.body.style.overflow = 'hidden';

    const timer = setTimeout(() => {
      setIsVisible(false);
      document.body.style.overflow = '';
    }, 3200);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5, ease: 'easeOut' } }}
          className="fixed inset-0 w-full h-full bg-gradient-to-br from-[#F5FEFE] to-[#01406D] flex items-center justify-center z-[99999]"
        >
          <div className="relative w-full overflow-hidden flex items-center justify-center">
            <motion.img
              initial={{ x: '-100vw', opacity: 1 }}
              animate={{
                x: ['-100vw', '0vw', '0vw', '0vw', '100vw'],
                opacity: 1,
              }}
              transition={{
                duration: 3.2,
                times: [0, 0.3, 0.5, 0.7, 1],
                ease: 'easeInOut',
              }}
              src="/logo.png"
              alt="ShopYNG Logo"
              className="h-20 w-auto object-contain mix-blend-multiply filter contrast-110"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
