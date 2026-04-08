import React, { createContext, useContext, useState, useEffect } from "react";
import { setLoadingRef } from "./loadingRef";
import LoadingOverlay from "../components/LoadingOverlay";

const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);

    const showLoading = () => setIsLoading(true);
    const hideLoading = () => setIsLoading(false);

    // Registra as funções de loading no ref para serem acessíveis fora de componentes (ex: api.js)
    useEffect(() => {
        setLoadingRef({ showLoading, hideLoading });
    }, []);

    return (
        <LoadingContext.Provider value={{ isLoading, showLoading, hideLoading }}>
            <LoadingOverlay />
            {children}
        </LoadingContext.Provider>
    );
};

export const useLoading = () => {
    const context = useContext(LoadingContext);
    if (!context) {
        throw new Error("useLoading deve ser usado dentro de um LoadingProvider");
    }
    return context;
};
