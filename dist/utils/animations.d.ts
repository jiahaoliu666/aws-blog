export declare const fadeIn: (direction: string, type: string, delay: number) => {
    hidden: {
        x: number;
        y: number;
        opacity: number;
    };
    show: {
        x: number;
        y: number;
        opacity: number;
        transition: {
            type: string;
            delay: number;
            duration: number;
            ease: string;
        };
    };
};
export declare const staggerContainer: {
    hidden: {};
    show: {
        transition: {
            staggerChildren: number;
            delayChildren: number;
        };
    };
};
export declare const slideIn: (direction: string, delay?: number) => {
    hidden: {
        x: string | number;
        y: string | number;
        opacity: number;
    };
    show: {
        x: number;
        y: number;
        opacity: number;
        transition: {
            type: string;
            damping: number;
            stiffness: number;
            delay: number;
            duration: number;
        };
    };
};
export declare const scaleUp: {
    hidden: {
        scale: number;
        opacity: number;
    };
    show: {
        scale: number;
        opacity: number;
        transition: {
            type: string;
            duration: number;
        };
    };
};
export declare const hoverCard: {
    rest: {
        scale: number;
        y: number;
        transition: {
            type: string;
            stiffness: number;
            damping: number;
        };
    };
    hover: {
        scale: number;
        y: number;
        transition: {
            type: string;
            stiffness: number;
            damping: number;
        };
    };
};
export declare const textVariant: (delay?: number) => {
    hidden: {
        y: number;
        opacity: number;
    };
    show: {
        y: number;
        opacity: number;
        transition: {
            type: string;
            duration: number;
            delay: number;
        };
    };
};
export declare const cardHoverEffect: {
    rest: {
        scale: number;
        y: number;
        transition: {
            type: string;
            stiffness: number;
            damping: number;
        };
    };
    hover: {
        scale: number;
        y: number;
        transition: {
            type: string;
            stiffness: number;
            damping: number;
        };
    };
};
export declare const containerAnimation: {
    hidden: {
        opacity: number;
    };
    show: {
        opacity: number;
        transition: {
            staggerChildren: number;
            delayChildren: number;
        };
    };
};
export declare const pulseAnimation: {
    scale: number[];
    transition: {
        duration: number;
        repeat: number;
        ease: string;
    };
};
export declare const slideInFromBottom: (delay?: number) => {
    hidden: {
        y: number;
        opacity: number;
    };
    show: {
        y: number;
        opacity: number;
        transition: {
            type: string;
            duration: number;
            delay: number;
            stiffness: number;
        };
    };
};
export declare const gradientAnimation: {
    animate: {
        background: string[];
        transition: {
            duration: number;
            repeat: number;
            repeatType: "reverse";
        };
    };
};
export declare const enhancedCardHover: {
    rest: {
        scale: number;
        y: number;
        boxShadow: string;
        transition: {
            type: string;
            stiffness: number;
            damping: number;
        };
    };
    hover: {
        scale: number;
        y: number;
        boxShadow: string;
        transition: {
            type: string;
            stiffness: number;
            damping: number;
        };
    };
};
export declare const smoothScaleUp: {
    initial: {
        scale: number;
        opacity: number;
    };
    animate: {
        scale: number;
        opacity: number;
        transition: {
            type: string;
            stiffness: number;
            damping: number;
        };
    };
};
export declare const buttonHoverEffect: {
    rest: {
        scale: number;
        transition: {
            type: string;
            stiffness: number;
            damping: number;
        };
    };
    hover: {
        scale: number;
        transition: {
            type: string;
            stiffness: number;
            damping: number;
        };
    };
    tap: {
        scale: number;
    };
};
export declare const smoothReveal: {
    hidden: {
        opacity: number;
        y: number;
        transition: {
            type: string;
            stiffness: number;
            damping: number;
        };
    };
    show: {
        opacity: number;
        y: number;
        transition: {
            type: string;
            stiffness: number;
            damping: number;
        };
    };
};
