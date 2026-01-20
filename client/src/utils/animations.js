// Framer Motion animation variants for consistent animations across the app

// Button press animation - scales down slightly for tactile feedback
export const buttonPress = {
  rest: { scale: 1 },
  pressed: { scale: 0.96 },
  hover: { scale: 1.02 }
};

// Ripple effect for primary actions
export const rippleEffect = {
  initial: { scale: 0, opacity: 0.5 },
  animate: {
    scale: 2,
    opacity: 0,
    transition: { duration: 0.6, ease: 'easeOut' }
  }
};

// Slide in from bottom
export const slideIn = {
  initial: { y: 20, opacity: 0 },
  animate: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  exit: {
    y: -20,
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

// Fade in/out
export const fadeIn = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.3 }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

// Skeleton pulse animation
export const skeletonPulse = {
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: 'easeInOut'
    }
  }
};

// Scale in animation
export const scaleIn = {
  initial: { scale: 0.9, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.2, ease: 'easeOut' }
  },
  exit: {
    scale: 0.9,
    opacity: 0,
    transition: { duration: 0.15 }
  }
};

// Stagger children animation
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// List item animation
export const listItem = {
  initial: { x: -20, opacity: 0 },
  animate: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.3 }
  }
};
