import React from "react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";

export default function PageTransition({ children }) {
  const location = useLocation();

  // Enter-only animation keyed on pathname. We intentionally avoid
  // AnimatePresence/exit animations: the exit phase delays unmounting and
  // races with Suspense fallback swaps and browser-extension DOM edits,
  // which throws "removeChild: The node to be removed is not a child of
  // this node" during React's commit-deletion phase.
  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}