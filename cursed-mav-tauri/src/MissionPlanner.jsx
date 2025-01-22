import React, { useState } from 'react';
import Map, { GeolocateControl, Marker, NavigationControl } from 'react-map-gl';
import { Box, Button, Group, Paper, Stack, Text, TextInput } from '@mantine/core';
import { IconMapPin } from '@tabler/icons-react';

function MissionPlanner() {
  const [viewState, setViewState] = useState({
    longitude: -122.4194,
    latitude: 37.7749,
    zoom: 18,
    pitch: 0,
    bearing: 0
  });

  const [waypoints, setWaypoints] = useState([]);

  const handleMapClick = (event) => {
    const { lng, lat } = event.lngLat;
    setWaypoints([
      ...waypoints,
      {
        id: Date.now(),
        longitude: lng,
        latitude: lat,
        altitude: 50 // Default altitude in meters
      }
    ]);
  };

  return (
    <Box style={{ display: 'flex', height: '100vh' }}>
      {/* Map Container */}
      <Box style={{ flex: 1, position: 'relative' }}>
        <Map
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          onClick={handleMapClick}
          mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/victoryforphil/cm5xshpj600eg01slhyzb1atu"
        >
          {waypoints.map((waypoint, index) => (
            <Marker
              key={waypoint.id}
              longitude={waypoint.longitude}
              latitude={waypoint.latitude}
            >
              <IconMapPin size={24} color="#228be6" />
            </Marker>
          ))}
          <NavigationControl />
          <GeolocateControl />
        </Map>
      </Box>

      {/* Sidebar */}
      <Paper shadow="sm" p="md" style={{ width: 300 }}>
        <Stack>
          <Text size="xl" fw={700}>Mission Planner</Text>
          
          <Text c="dimmed" size="sm">
            Click on the map to add waypoints
          </Text>

          {waypoints.map((waypoint, index) => (
            <Paper key={waypoint.id} withBorder p="xs">
              <Group justify="space-between">
                <div>
                  <Text fw={500}>Waypoint {index + 1}</Text>
                  <Text size="xs" c="dimmed">
                    {waypoint.latitude.toFixed(6)}, {waypoint.longitude.toFixed(6)}
                  </Text>
                </div>
                <Text size="sm">{waypoint.altitude}m</Text>
              </Group>
            </Paper>
          ))}

          {waypoints.length > 0 && (
            <Button>
              Upload Mission
            </Button>
          )}
        </Stack>
      </Paper>
    </Box>
  );
}

export default MissionPlanner; 