import React from 'react';

export const WelcomePanel: React.FC = () => {
  return (
    <div className="h-full p-6 bg-background">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold mb-4 text-foreground">Welcome to Dock Dashboard</h1>
        <p className="text-muted-foreground mb-6">
          This is a basic dock/panel based dashboard built with Dockview, React, and Tailwind CSS.
        </p>
        
        <div className="grid gap-4">
          <div className="p-4 border rounded-lg bg-card">
            <h3 className="font-semibold mb-2 text-card-foreground">Features</h3>
            <ul className="list-disc list-inside space-y-1 text-card-foreground">
              <li>Draggable and resizable panels</li>
              <li>Dockable interface</li>
              <li>Dark/Light theme support</li>
              <li>Responsive design</li>
            </ul>
          </div>
          
          <div className="p-4 border rounded-lg bg-card">
            <h3 className="font-semibold mb-2 text-card-foreground">Getting Started</h3>
            <p className="text-card-foreground">
              Try dragging the panel tabs around to rearrange the layout. You can also resize panels by dragging the borders.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}; 