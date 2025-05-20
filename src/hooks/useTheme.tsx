
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('trizzaone_theme') as Theme;
    return savedTheme || 'dark'; // Default to dark mode
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove the previous theme class and add the new one
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    
    // Save the theme preference to localStorage
    localStorage.setItem('trizzaone_theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
