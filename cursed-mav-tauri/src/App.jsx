import { useState, useEffect } from "react";
import reactLogo from "./assets/react.svg";
import { invoke, Channel } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import "./App.css";
import '@mantine/dates/styles.css';
import 'mantine-react-table/styles.css';
import '@mantine/notifications/styles.css';
import "@mantine/core/styles.css";
import Params from "./Params";
import { useDisclosure } from "@mantine/hooks";

import { Notifications } from '@mantine/notifications';
import { IconList, IconHeartRateMonitor, IconTerminal2 } from '@tabler/icons-react';

import { MantineProvider, Text, rem, Box } from "@mantine/core";
import { AppShell, Burger, Group, NavLink } from "@mantine/core";
import Connection from "./Connection";
import RawLogs from "./RawLogs";

function App() {
  const [opened, { toggle }] = useDisclosure();
  const [currentView, setCurrentView] = useState('params');

  const renderMainContent = () => {
    switch (currentView) {
      case 'params':
        return <Params />;
      case 'health':
        return <div>Health View</div>;
      case 'logs':
        return <RawLogs />;
      default:
        return <Params />;
    }
  };

  return (
    <MantineProvider forceColorScheme="dark">
       <Notifications />
      <AppShell
        header={{ height: 60 }}
        navbar={{
          width: 300,
          breakpoint: "sm",
          collapsed: { mobile: !opened },
        }}
        aside={{
          width: 300,
          breakpoint: "sm",
          collapsed: { mobile: !opened },
        }}
        padding="md"
      >
        <AppShell.Header>
          <Group h="100%" px="md">
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
              aria-label="Toggle navigation"
            />
            <Text>Cursed Mavlink</Text>
          </Group>
        </AppShell.Header>
        
        <AppShell.Navbar p="md">
          <Box>
            <NavLink
              label="Parameters"
              leftSection={<IconList style={{ width: rem(14), height: rem(14) }} />}
              onClick={() => setCurrentView('params')}
              active={currentView === 'params'}
              variant="filled"
            />
            <NavLink
              label="Health"
              leftSection={<IconHeartRateMonitor style={{ width: rem(14), height: rem(14) }} />}
              onClick={() => setCurrentView('health')}
              active={currentView === 'health'}
              variant="filled"
            />
            <NavLink
              label="Raw Logs"
              leftSection={<IconTerminal2 style={{ width: rem(14), height: rem(14) }} />}
              onClick={() => setCurrentView('logs')}
              active={currentView === 'logs'}
              variant="filled"
            />
          </Box>
        </AppShell.Navbar>
        <AppShell.Aside p="md">
          
          <Connection />
         
        </AppShell.Aside>
        <AppShell.Main>
          {renderMainContent()}
        </AppShell.Main>
      </AppShell>
    </MantineProvider>
  );
}

export default App;
