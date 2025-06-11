import React from 'react';

export const SettingsPanel: React.FC = () => {
  return (
    <div className="h-full p-6 bg-background">
      <h2 className="text-xl font-semibold mb-6 text-foreground">Settings</h2>
      
      <div className="space-y-6">
        <div className="p-4 border rounded-lg bg-card">
          <h3 className="font-semibold mb-4 text-card-foreground">General</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="auto-save" className="text-sm font-medium text-card-foreground">
                Auto-save
              </label>
              <input id="auto-save" type="checkbox" defaultChecked className="rounded" />
            </div>
            <div className="flex items-center justify-between">
              <label htmlFor="notifications" className="text-sm font-medium text-card-foreground">
                Notifications
              </label>
              <input id="notifications" type="checkbox" defaultChecked className="rounded" />
            </div>
          </div>
        </div>
        
        <div className="p-4 border rounded-lg bg-card">
          <h3 className="font-semibold mb-4 text-card-foreground">Appearance</h3>
          <div className="space-y-3">
            <div>
              <label htmlFor="panel-layout" className="text-sm font-medium text-card-foreground block mb-2">
                Panel Layout
              </label>
              <select id="panel-layout" className="w-full p-2 border rounded bg-background">
                <option>Default</option>
                <option>Compact</option>
                <option>Spacious</option>
              </select>
            </div>
            <div>
              <label htmlFor="font-size" className="text-sm font-medium text-card-foreground block mb-2">
                Font Size
              </label>
              <select id="font-size" className="w-full p-2 border rounded bg-background">
                <option>Small</option>
                <option>Medium</option>
                <option>Large</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="p-4 border rounded-lg bg-card">
          <h3 className="font-semibold mb-4 text-card-foreground">Advanced</h3>
          <div className="space-y-3">
            <button className="w-full p-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
              Reset to Defaults
            </button>
            <button className="w-full p-2 border border-destructive text-destructive rounded hover:bg-destructive hover:text-destructive-foreground">
              Clear All Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 