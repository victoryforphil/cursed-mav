import { useState, useEffect } from "react";
import { invoke, Channel } from "@tauri-apps/api/core";
import { Card, Text, Badge, Button, Group, Stack, TextInput, NumberInput } from "@mantine/core";
import { notifications } from '@mantine/notifications';
import { NativeSelect } from '@mantine/core';

function Connection() {
  const [connectStatus, setConnectStatus] = useState("");
  const [connectionType, setConnectionType] = useState("tcp");
  const [address, setAddress] = useState("0.0.0.0");
  const [port, setPort] = useState(8888);
  const [connectionTime, setConnectionTime] = useState(0);
  const [retries, setRetries] = useState(0);
  const [error, setError] = useState(null);
  const [connectionHistory, setConnectionHistory] = useState([]);

  // Load connection settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('mavlinkConnectionSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setConnectionType(settings.type || "tcp");
        setAddress(settings.address || "0.0.0.0");
        setPort(settings.port || 8888);
      }

      const savedHistory = localStorage.getItem('mavlinkConnectionHistory');
      if (savedHistory) {
        setConnectionHistory(JSON.parse(savedHistory));
      }
    } catch (err) {
      console.error('Error loading connection settings:', err);
    }
  }, []);

  // Save settings to localStorage when they change
  const saveSettings = () => {
    try {
      const settings = {
        type: connectionType,
        address: address,
        port: port
      };
      localStorage.setItem('mavlinkConnectionSettings', JSON.stringify(settings));

      // Add to history
      const newHistoryEntry = {
        type: connectionType,
        address: address,
        port: port,
        timestamp: new Date().toISOString()
      };

      const updatedHistory = [newHistoryEntry, ...connectionHistory].slice(0, 5); // Keep last 5
      setConnectionHistory(updatedHistory);
      localStorage.setItem('mavlinkConnectionHistory', JSON.stringify(updatedHistory));
    } catch (err) {
      console.error('Error saving settings:', err);
    }
  };

  const getConnectionString = () => {
    switch (connectionType) {
      case "serial":
        return `serial:${address}:${port}`;
      case "udp":
        return `udpin:${address}:${port}`;
      case "tcp":
        return `tcpout:${address}:${port}`;
      default:
        return `tcpout:${address}:${port}`;
    }
  };

  const getStatusColor = (status) => {
    if (status === "Connected") return "green";
    if (status === "Connecting") return "yellow";
    return "gray"; 
  };

  const loadHistoryEntry = (entry) => {
    setConnectionType(entry.type);
    setAddress(entry.address);
    setPort(entry.port);
  };

  async function connect() {
    try {
      setError(null);
      const onConnectionEvent = new Channel();
      onConnectionEvent.onmessage = (message) => {
        const data = message;
        
        if (data.event === "connected") {
          setConnectStatus("Connected");
          saveSettings();
          notifications.show({
            title: 'Connected',
            message: 'Successfully connected to MAVLink device',
            color: 'green',
            icon: '✓'
          });
        } else if (data.event === "connecting") {
          setConnectionTime(data.data.connection_time);
          setRetries(data.data.retries);
          setConnectStatus("Connecting");
        } else if (data.event === "failed") {
          setConnectStatus("Not Connected");
          setError(data.data.reason);
          notifications.show({
            title: 'Connection Failed',
            message: data.data.reason,
            color: 'red',
            icon: '✕'
          });
        } else if (data.event === "disconnected") {
          setConnectStatus("Not Connected");
          setError(data.data.reason);
          notifications.show({
            title: 'Disconnected',
            message: data.data.reason,
            color: 'orange'
          });
        }
      };

      await invoke("connect_to_mav", {
        url: getConnectionString(),
        onEvent: onConnectionEvent,
      });

    } catch (err) {
      setConnectStatus("Not Connected");
      setError(err.toString());
      notifications.show({
        title: 'Error',
        message: err.toString(),
        color: 'red',
        icon: '✕'
      });
    }
  }

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Card.Section withBorder inheritPadding py="xs">
        <Group justify="space-between">
          <Text fw={500}>MAVLink Connection</Text>
          <Badge color={getStatusColor(connectStatus)}>
            {connectStatus || "Not Connected"}
          </Badge>
        </Group>
      </Card.Section>

      <Stack mt="md" gap="sm">
        {connectStatus.includes("Connecting") && (
          <Group>
            <Badge variant="light">Time: {connectionTime}s</Badge>
            <Badge variant="light">Retries: {retries}</Badge>
          </Group>
        )}
        
        <NativeSelect
          label="Connection Type"
          data={[
            { value: 'tcp', label: 'TCP' },
            { value: 'udp', label: 'UDP' },
            { value: 'serial', label: 'Serial' }
          ]}
          value={connectionType}
          onChange={(event) => setConnectionType(event.currentTarget.value)}
        />

        <TextInput
          label={connectionType === 'serial' ? 'Port Path' : 'Address'}
          placeholder={connectionType === 'serial' ? '/dev/ttyUSB0' : '0.0.0.0'}
          value={address}
          onChange={(event) => setAddress(event.currentTarget.value)}
        />

        <NumberInput
          label={connectionType === 'serial' ? 'Baud Rate' : 'Port'}
          placeholder={connectionType === 'serial' ? '57600' : '8888'}
          value={port}
          onChange={(value) => setPort(value)}
        />

        <Button 
          onClick={connect}
          disabled={connectStatus === "Connected"}
          variant="light"
        >
          Connect
        </Button>

        {connectionHistory.length > 0 && (
          <>
            <Text size="sm" fw={500} mt="md">Recent Connections</Text>
            {connectionHistory.map((entry, index) => (
              <Card 
                key={index} 
                withBorder 
                padding="xs"
                style={{ cursor: 'pointer' }}
                onClick={() => loadHistoryEntry(entry)}
              >
                <Group>
                  <Badge>{entry.type.toUpperCase()}</Badge>
                  <Text size="sm">{entry.address}:{entry.port}</Text>
                  <Text size="xs" c="dimmed" ml="auto">
                    {new Date(entry.timestamp).toLocaleString()}
                  </Text>
                </Group>
              </Card>
            ))}
          </>
        )}
      </Stack>
    </Card>
  );
}

export default Connection;
