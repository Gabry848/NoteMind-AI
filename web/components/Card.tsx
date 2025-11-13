/**
 * Card component for content containers
 */
import React from "react";
import { motion } from "framer-motion";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  hover = false,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={hover ? { scale: 1.02, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" } : {}}
      className={`bg-white rounded-xl shadow-md p-6 ${className}`}
    >
      {children}
    </motion.div>
  );
};
