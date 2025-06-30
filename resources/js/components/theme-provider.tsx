// resources/js/components/theme-provider.tsx

import { createContext, useContext, useEffect, useState } from "react";

// This is the type definition for the props that the ThemeProvider will accept.
type ThemeProviderProps = {
    children: React.ReactNode;
    defaultTheme?: string;
    storageKey?: string;
};

// This defines the state that will be available through the context.
type ThemeProviderState = {
    theme: string;
    setTheme: (theme: string) => void;
};

// Initial state for the context.
const initialState: ThemeProviderState = {
    theme: "system",
    setTheme: () => null,
};

// Create the React Context.
const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

// This is the main provider component.
export function ThemeProvider({
                                  children,
                                  defaultTheme = "system",
                                  storageKey = "vite-ui-theme",
                                  ...props
                              }: ThemeProviderProps) {
    const [theme, setTheme] = useState(
        () => localStorage.getItem(storageKey) || defaultTheme
    );

    useEffect(() => {
        const root = window.document.documentElement;

        root.classList.remove("light", "dark");

        if (theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
                .matches
                ? "dark"
                : "light";

            root.classList.add(systemTheme);
            return;
        }

        root.classList.add(theme);
    }, [theme]);

    const value = {
        theme,
        setTheme: (theme: string) => {
            localStorage.setItem(storageKey, theme);
            setTheme(theme);
        },
    };

    return (
        <ThemeProviderContext.Provider {...props} value={value}>
            {children}
        </ThemeProviderContext.Provider>
    );
}

// This is a custom hook that makes it easy to access the theme state from any component.
export const useTheme = () => {
    const context = useContext(ThemeProviderContext);

    if (context === undefined)
        throw new Error("useTheme must be used within a ThemeProvider");

    return context;
};
