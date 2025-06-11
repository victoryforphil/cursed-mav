import React from 'react';

interface DockPanelProps {
  title: string;
  children?: React.ReactNode;
}

export const DockPanel: React.FC<DockPanelProps> = ({ title, children }) => {
  return (
    <div className="h-full w-full p-4 bg-background">
      <h2 className="text-lg font-semibold mb-4 text-foreground">{title}</h2>
      <div className="h-full">
        {children || (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <p>Panel content goes here</p>
          </div>
        )}
      </div>
    </div>
  );
}; 