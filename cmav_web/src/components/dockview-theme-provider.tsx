import React from 'react';
import { useTheme } from './theme-provider';
import { DOCKVIEW_THEME_CLASS } from '@/lib/dockview-theme';

// Import our custom CSS
import '@/styles/dockview-theme.css';

interface DockviewThemeProviderProps {
  children: React.ReactNode;
  glassEffect?: boolean; // Add option for glass effect
}

export const DockviewThemeProvider: React.FC<DockviewThemeProviderProps> = ({ 
  children,
  glassEffect = false // Default to false for backward compatibility
}) => {
  const { theme } = useTheme();
  
  return (
    <div className={`
      dockview-container 
      ${DOCKVIEW_THEME_CLASS} 
      ${theme === 'dark' ? 'dark-mode' : 'light-mode'}
      ${glassEffect ? 'dockview-glass-variant' : ''}
    `}>
      {children}
    </div>
  );
};

// Export just the class name for use with Dockview components
export const shadcnDockviewClassName = 'dockview-theme-shadcn'; 