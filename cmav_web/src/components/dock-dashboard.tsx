import React, { useRef } from 'react';
import { DockviewApi, DockviewReact } from 'dockview';
import { WelcomePanel } from './panels/welcome-panel';
import { DataPanel } from './panels/data-panel';
import { SettingsPanel } from './panels/settings-panel';
import { shadcnDockviewClassName } from './dockview-theme-provider';

const DockDashboard: React.FC = () => {
  const api = useRef<DockviewApi | null>(null);

  const onReady = (event: { api: DockviewApi }) => {
    api.current = event.api;

    // Add initial panels
    api.current.addPanel({
      id: 'welcome',
      component: 'welcome',
      title: 'Welcome'
    });

    api.current.addPanel({
      id: 'data',
      component: 'data',
      title: 'Data'
    });

    api.current.addPanel({
      id: 'settings',
      component: 'settings',
      title: 'Settings'
    });
  };

  const components = {
    welcome: WelcomePanel,
    data: DataPanel,
    settings: SettingsPanel,
  };

  return (
    <div className="absolute inset-0">
      <DockviewReact
        onReady={onReady}
        components={components}
        className={shadcnDockviewClassName}
      />
    </div>
  );
};

export default DockDashboard; 