import { useState, useEffect } from "react";
import { useNavigate, useLocation, Routes, Route, Navigate } from "react-router-dom";
import { useDisclosure } from "@mantine/hooks";
import { Notifications } from '@mantine/notifications';
import { IconList, IconHeartRateMonitor, IconTerminal2, Icon3dCubeSphere, IconMenu2, IconX, IconMap, IconRoute } from '@tabler/icons-react';
import { MantineProvider, Text, rem, Box, ActionIcon } from "@mantine/core";
import { AppShell, Burger, Group, NavLink } from "@mantine/core";

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import 'mantine-react-table/styles.css';
import "./App.css";

import Params from "./Params";
import Connection from "./Connection";
import RawLogs from "./RawLogs";
import ThreeDView from './ThreeDView';
import MapView from "./MapView";
import MissionPlanner from "./mission/MissionPlanner";
import 'mapbox-gl/dist/mapbox-gl.css';


function App() {
  const [opened, { toggle }] = useDisclosure();
  const [asideOpened, { toggle: toggleAside }] = useDisclosure();
  const navigate = useNavigate();
  const location = useLocation();

  // Load the last visited route from localStorage on mount
  useEffect(() => {
    const lastRoute = localStorage.getItem('lastRoute');
    if (lastRoute && location.pathname === '/map') {
      navigate(lastRoute);
    }
  }, []);

  // Save the current route to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('lastRoute', location.pathname);
  }, [location.pathname]);

  const isRouteActive = (path) => location.pathname === path;

  async function connect() {
    try {
      const onConnectionEvent = new Channel ();
      onConnectionEvent.onmessage = (message) => {
        console.log(`got connection event ${message}`);
        setConnectStatus(`Connection Update: ${message.data}`);
      };
      await invoke("connect_to_mav", {
        url,
        onEvent: onConnectionEvent,
      });
      console.log("Connected to MAV");
      setConnectStatus("Connected to MAV");
    } catch (err) {
      setConnectStatus(`Error: ${err}`);
    }
  };

  return (
    <MantineProvider forceColorScheme="dark">
      <Notifications />
      <AppShell
        header={{ height: 50 }}
        navbar={{
          width: 200,
          breakpoint: 'sm',
          collapsed: { mobile: !opened, desktop: !opened }
        }}
        aside={{
          width: 250,
          breakpoint: 'sm',
          collapsed: { mobile: !asideOpened, desktop: !asideOpened }
        }}
        padding="md"
        layout="alt"
      >
        <AppShell.Header>
          <Group h="100%" px="md" justify="space-between">
            <Group>
              <ActionIcon 
                variant="subtle" 
                onClick={toggle}
                aria-label={opened ? "Close navigation" : "Open navigation"}
                size="lg"
              >
                {opened ? (
                  <IconX style={{ width: rem(20), height: rem(20) }} />
                ) : (
                  <IconMenu2 style={{ width: rem(20), height: rem(20) }} />
                )}
              </ActionIcon>
              <Text>Cursed Mavlink</Text>
            </Group>
            <ActionIcon 
              variant="subtle" 
              onClick={toggleAside}
              aria-label={asideOpened ? "Close connection panel" : "Open connection panel"}
              size="lg"
            >
              {asideOpened ? (
                
                <IconX style={{ width: rem(20), height: rem(20) }} />
              ) : (
                <IconMenu2 style={{ width: rem(20), height: rem(20) }} />
              )}
            </ActionIcon>
          </Group>
        </AppShell.Header>
        
        <AppShell.Navbar p="md">
          <Box>
            <NavLink
              label="Parameters"
              leftSection={<IconList style={{ width: rem(14), height: rem(14) }} />}
              onClick={() => navigate('/params')}
              active={isRouteActive('/params')}
              variant="filled"
            />
            <NavLink
              label="Health"
              leftSection={<IconHeartRateMonitor style={{ width: rem(14), height: rem(14) }} />}
              onClick={() => navigate('/health')}
              active={isRouteActive('/health')}
              variant="filled"
            />
            <NavLink
              label="Raw Logs"
              leftSection={<IconTerminal2 style={{ width: rem(14), height: rem(14) }} />}
              onClick={() => navigate('/logs')}
              active={isRouteActive('/logs')}
              variant="filled"
            />
            <NavLink
              label="3D View"
              leftSection={<Icon3dCubeSphere style={{ width: rem(14), height: rem(14) }} />}
              onClick={() => navigate('/3d')}
              active={isRouteActive('/3d')}
              variant="filled"
            />
            <NavLink
              label="Map View"
              leftSection={<IconMap style={{ width: rem(14), height: rem(14) }} />}
              onClick={() => navigate('/map')}
              active={isRouteActive('/map')}
              variant="filled"
            />
            <NavLink
              label="Mission Planner"
              leftSection={<IconRoute style={{ width: rem(14), height: rem(14) }} />}
              onClick={() => navigate('/mission')}
              active={isRouteActive('/mission')}
              variant="filled"
            />
          </Box>
        </AppShell.Navbar>
        <AppShell.Aside p="md">
          <Connection />
        </AppShell.Aside>
        <AppShell.Main style={{ height: '100vh' }}>
          <Routes>
            <Route path="/params" element={<Params />} />
            <Route path="/health" element={<div>Health View</div>} />
            <Route path="/logs" element={<RawLogs />} />
            <Route path="/3d" element={<ThreeDView />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/mission" element={<MissionPlanner />} />
            <Route path="/" element={<Navigate to="/map" replace />} />
          </Routes>
        </AppShell.Main>
      </AppShell>
    </MantineProvider>
  );
}

export default App;
