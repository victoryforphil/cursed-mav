import React, { useRef } from 'react';
import { DockviewApi, DockviewReact } from 'dockview';
import { WelcomePanel } from './panels/welcome-panel';
import { DataPanel } from './panels/data-panel';
import { SettingsPanel } from './panels/settings-panel';
import { dockviewConfig, getPanelOptions } from '@/lib/dockview-theme';

const DockDashboard: React.FC = () => {
  const api = useRef<DockviewApi | null>(null);

  const onReady = (event: { api: DockviewApi }) => {
    api.current = event.api;

    // Add initial panels with modern styling options
    api.current.addPanel({
      id: 'welcome',
      component: 'welcome',
      title: 'Welcome',
      ...getPanelOptions({
        icon: 'home' // Optional: add an icon if supported by your panel components
      })
    });

    api.current.addPanel({
      id: 'data',
      component: 'data',
      title: 'Data',
      ...getPanelOptions()
    });

    api.current.addPanel({
      id: 'settings',
      component: 'settings',
      title: 'Settings',
      ...getPanelOptions()
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
        {...dockviewConfig.getConfig({}, true)}
      />
    </div>
  );
};

export default DockDashboard; 