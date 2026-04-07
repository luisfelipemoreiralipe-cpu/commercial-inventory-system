let setLoadingGlobal = null;

export const setLoadingRef = (fn) => {
    setLoadingGlobal = fn;
};

export const getLoadingRef = () => setLoadingGlobal;