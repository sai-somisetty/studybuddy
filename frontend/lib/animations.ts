import { Variants } from "framer-motion";

export const spring = {
  type: "spring",
  stiffness: 400,
  damping: 28,
  mass: 0.8,
};

export const softSpring = {
  type: "spring",
  stiffness: 200,
  damping: 24,
  mass: 1,
};

export const pageVariants: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -20 },
};

export const cardVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    }
  }
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

export const pressable = {
  whileHover: { scale: 1.02 },
  whileTap:   { scale: 0.97 },
  transition: spring,
};

export const cardPressable = {
  whileHover: { scale: 1.01, y: -2 },
  whileTap:   { scale: 0.98 },
  transition: spring,
};

export const haptic = (type: "success" | "error" | "tap") => {
  if (typeof window === "undefined") return;
  if (!navigator.vibrate) return;
  const patterns = {
    success: [10, 40, 10],
    error:   [80],
    tap:     [8],
  };
  navigator.vibrate(patterns[type]);
};
