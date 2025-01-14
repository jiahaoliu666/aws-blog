export const logger = {
    info: (message, ...args) => {
        console.log(message, ...args);
    },
    debug: (message, ...args) => {
        if (process.env.NODE_ENV !== 'production') {
            console.debug(message, ...args);
        }
    },
    error: (message, ...args) => {
        console.error(message, ...args);
    },
    warn: (message, ...args) => {
        console.warn(message, ...args);
    }
};
//# sourceMappingURL=logger.js.map