import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider } from 'styled-components';
import { lightTheme, darkTheme } from '../styles/theme';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeModeProvider = ({ children }) => {
    const [themeMode, setThemeMode] = useState('light');

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            setThemeMode(savedTheme);
            document.body.setAttribute('data-theme', savedTheme);
        }
    }, []);

    const toggleTheme = () => {
        const nextTheme = themeMode === 'light' ? 'dark' : 'light';
        setThemeMode(nextTheme);
        localStorage.setItem('theme', nextTheme);
        document.body.setAttribute('data-theme', nextTheme);
    };

    return (
        <ThemeContext.Provider value={{ themeMode, toggleTheme }}>
            <ThemeProvider theme={themeMode === 'light' ? lightTheme : darkTheme}>
                {children}
            </ThemeProvider>
        </ThemeContext.Provider>
    );
};
