// src/utils/extractDateFromInfo.ts  
export const extractDateFromInfo = (info) => {
    if (!info)
        return null;
    const dateMatch = info.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
    if (dateMatch) {
        const year = parseInt(dateMatch[1], 10);
        const month = parseInt(dateMatch[2], 10) - 1;
        const day = parseInt(dateMatch[3], 10);
        return new Date(year, month, day);
    }
    return null;
};
//# sourceMappingURL=extractDateFromInfo.js.map