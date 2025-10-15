import React, { createContext, useContext } from 'react';
import { useAppSelector, useAppDispatch } from '@/src/store/hooks';
import { toggleTheme } from '@/src/store/slices/themeSlice';

interface ThemeColors {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  primary: string;
  success: string;
  danger: string;
  warning: string;
  border: string;
  inputBackground: string;
}

interface ThemeContextType {
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const lightTheme: ThemeColors = {
  background: '#F8F9FA',
  card: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#6B7280',
  primary: '#3B82F6',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  border: '#E5E7EB',
  inputBackground: '#F9FAFB',
};

const darkTheme: ThemeColors = {
  background: '#0F172A',
  card: '#1E293B',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  primary: '#60A5FA',
  success: '#34D399',
  danger: '#F87171',
  warning: '#FBBF24',
  border: '#334155',
  inputBackground: '#1E293B',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isDark = useAppSelector((state) => state.theme.isDark);
  const dispatch = useAppDispatch();

  const handleToggleTheme = () => {
    dispatch(toggleTheme());
  };

  const colors = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggleTheme: handleToggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
