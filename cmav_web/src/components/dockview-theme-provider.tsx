import React from 'react';

// Import our custom CSS
import '@/styles/dockview-theme.css';

interface DockviewThemeProviderProps {
  children: React.ReactNode;
}

export const DockviewThemeProvider: React.FC<DockviewThemeProviderProps> = ({ children }) => {
  return (
    <div className="dockview-theme-provider">
      {children}
    </div>
  );
};

// Export just the class name for use with Dockview components
export const shadcnDockviewClassName = 'dockview-theme-shadcn'; 