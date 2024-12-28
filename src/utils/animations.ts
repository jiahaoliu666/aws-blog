export const fadeIn = (direction: string, type: string, delay: number) => ({
  hidden: {
    x: direction === 'left' ? 30 : direction === 'right' ? -30 : 0,
    y: direction === 'up' ? 30 : direction === 'down' ? -30 : 0,
    opacity: 0,
  },
  show: {
    x: 0,
    y: 0,
    opacity: 1,
    transition: {
      type,
      delay,
      duration: 0.5,
      ease: 'easeOut',
    },
  },
});

export const staggerContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export const slideIn = (direction: string, delay: number = 0) => ({
  hidden: {
    x: direction === 'left' ? '-100%' : direction === 'right' ? '100%' : 0,
    y: direction === 'up' ? '100%' : direction === 'down' ? '-100%' : 0,
    opacity: 0,
  },
  show: {
    x: 0,
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      damping: 20,
      stiffness: 100,
      delay,
      duration: 0.8,
    },
  },
});

export const scaleUp = {
  hidden: { scale: 0.8, opacity: 0 },
  show: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      duration: 0.5,
    },
  },
};

export const hoverCard = {
  rest: { 
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20
    }
  },
  hover: {
    scale: 1.02,
    y: -5,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20
    }
  }
};

export const textVariant = (delay: number = 0) => ({
  hidden: {
    y: 20,
    opacity: 0,
  },
  show: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      duration: 1.25,
      delay,
    },
  },
});

export const cardHoverEffect = {
  rest: {
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  },
  hover: {
    scale: 1.03,
    y: -5,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  }
};

export const containerAnimation = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3
    }
  }
};

export const pulseAnimation = {
  scale: [1, 1.05, 1],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut"
  }
};

export const slideInFromBottom = (delay: number = 0) => ({
  hidden: {
    y: 30,
    opacity: 0
  },
  show: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      duration: 1,
      delay,
      stiffness: 100
    }
  }
});

export const gradientAnimation = {
  animate: {
    background: [
      "linear-gradient(45deg, #3B82F6 0%, #60A5FA 50%, #93C5FD 100%)",
      "linear-gradient(45deg, #93C5FD 0%, #3B82F6 50%, #60A5FA 100%)",
      "linear-gradient(45deg, #60A5FA 0%, #93C5FD 50%, #3B82F6 100%)",
    ],
    transition: {
      duration: 10,
      repeat: Infinity,
      repeatType: "reverse" as const,
      ease: "linear"
    }
  }
};

export const enhancedCardHover = {
  rest: {
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 17
    }
  },
  hover: {
    scale: 1.02,
    y: -8,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 17
    }
  }
};

export const smoothScaleUp = {
  initial: { 
    scale: 0.95,
    opacity: 0 
  },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  }
};

export const buttonHoverEffect = {
  rest: {
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 30
    }
  },
  hover: {
    scale: 1.05,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 30
    }
  },
  tap: {
    scale: 0.95
  }
};

export const smoothReveal = {
  hidden: {
    opacity: 0,
    y: 20,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  }
};

export const pageTransition = {
  hidden: {
    opacity: 0,
    y: 20
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.43, 0.13, 0.23, 0.96]
    }
  },
  exit: {
    opacity: 0,
    y: 10,
    transition: {
      duration: 0.2,
      ease: [0.43, 0.13, 0.23, 0.96]
    }
  }
};

export const smoothScroll = {
  initial: { 
    opacity: 0,
    y: 30
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.6, -0.05, 0.01, 0.99]
    }
  }
}; 