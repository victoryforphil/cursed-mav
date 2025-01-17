import React, { useState } from 'react';
import Map, { GeolocateControl, Marker, NavigationControl, Source, Layer } from 'react-map-gl';
import { Box, Button, Group, Paper, Stack, Text, NumberInput, Menu, Select, Timeline, ScrollArea, Collapse, Badge } from '@mantine/core';
import { IconTrash, IconArrowUp, IconArrowDown, IconCircleDot, IconClock, IconHome, IconSpeedboat, IconChevronDown, IconChevronRight, IconDownload, IconUpload, IconPlayerPlay, IconPlane, IconDrone, IconParachute, IconCircleDotted, IconArrowMerge } from '@tabler/icons-react';
import CommandSelector from './CommandSelector';
import mapboxgl from 'mapbox-gl';

// Command types with their parameters
const COMMAND_TYPES = {
  WAYPOINT: {
    name: 'Waypoint',
    defaultParams: {
      latitude: 0,
      longitude: 0,
      altitude: 50,
      delay: 0, // Delay in seconds at waypoint
      acceptRadius: 2, // Acceptance radius in meters
      passRadius: 0, // Pass radius in meters (0 to pass through waypoint)
      yawAngle: 0, // Desired yaw angle at waypoint
      terrainAlt: false, // Use terrain altitude
    },
    mavCmd: 16 // MAV_CMD_NAV_WAYPOINT
  },
  TAKEOFF: {
    name: 'Takeoff',
    defaultParams: {
      altitude: 50,
      minPitch: 15, // Minimum pitch during takeoff (degrees)
      yawAngle: 0, // Desired yaw angle during takeoff
      terrainAlt: false, // Use terrain altitude
    },
    mavCmd: 22 // MAV_CMD_NAV_TAKEOFF
  },
  LAND: {
    name: 'Land',
    defaultParams: {
      latitude: 0,
      longitude: 0,
      altitude: 0,
      abortAlt: 10, // Abort altitude (m)
      landSpeed: 0.5, // Landing speed (m/s)
      yawAngle: 0, // Desired yaw angle during landing
      precisionLanding: false, // Use precision landing if available
      terrainAlt: false, // Use terrain altitude
    },
    mavCmd: 21 // MAV_CMD_NAV_LAND
  },
  RTL: {
    name: 'Return to Launch',
    defaultParams: {
      altitude: 50, // Return altitude
      landSpeed: 0.5, // Landing speed (m/s)
      terrainAlt: false, // Use terrain altitude
      loiterTime: 0, // Time to loiter at home before landing (s)
    },
    mavCmd: 20 // MAV_CMD_NAV_RETURN_TO_LAUNCH
  },
  LOITER_TIME: {
    name: 'Loiter for Time',
    defaultParams: {
      time: 30, // Time to loiter in seconds
      radius: 50, // Radius in meters (positive = clockwise)
      latitude: 0,
      longitude: 0,
      altitude: 50,
      xtrack_location: 0, // 0 = center of loiter circle
      heading_required: 0, // 0 = no heading required
      terrainAlt: false, // Use terrain altitude
    },
    mavCmd: 19 // MAV_CMD_NAV_LOITER_TIME
  },
  LOITER_TURNS: {
    name: 'Circle for N Turns',
    defaultParams: {
      turns: 1, // Number of turns
      radius: 50, // Radius in meters (positive = clockwise)
      latitude: 0,
      longitude: 0,
      altitude: 50,
      xtrack_location: 0, // 0 = center of loiter circle
      heading_required: 0, // 0 = no heading required
      terrainAlt: false, // Use terrain altitude
    },
    mavCmd: 18 // MAV_CMD_NAV_LOITER_TURNS
  },
  SPLINE_WAYPOINT: {
    name: 'Spline Waypoint',
    defaultParams: {
      delay: 0, // Hold time at waypoint in seconds
      latitude: 0,
      longitude: 0,
      altitude: 50,
      next_lat: 0, // Next waypoint latitude for spline calculation
      next_lon: 0, // Next waypoint longitude for spline calculation
      next_alt: 0, // Next waypoint altitude for spline calculation
      terrainAlt: false, // Use terrain altitude
    },
    mavCmd: 82 // MAV_CMD_NAV_SPLINE_WAYPOINT
  },
  DO_CHANGE_SPEED: {
    name: 'Change Speed',
    defaultParams: {
      speed: 5, // Target speed in m/s
      speedType: 0, // 0=Airspeed, 1=Ground Speed
      throttle: -1, // Throttle (-1 indicates no change)
      relative: 0 // 0: absolute, 1: relative
    },
    mavCmd: 178 // MAV_CMD_DO_CHANGE_SPEED
  },
  DELAY: {
    name: 'Delay',
    defaultParams: {
      delay: 0, // Delay in seconds
      hour: 0, // Hour (24h format)
      minute: 0, // Minute
      second: 0 // Second
    },
    mavCmd: 112 // MAV_CMD_CONDITION_DELAY
  },
  WAIT_UNTIL: {
    name: 'Wait Until',
    defaultParams: {
      hour: 0, // Hour (24h format)
      minute: 0, // Minute
      second: 0, // Second
      timeOfDay: true // true = use time of day, false = use delay
    },
    mavCmd: 113 // MAV_CMD_CONDITION_DELAY
  },
  DO_SET_ROI: {
    name: 'Region of Interest',
    defaultParams: {
      latitude: 0,
      longitude: 0,
      altitude: 0,
      roiMode: 0, // 0=Location, 1=None, 2=Next waypoint, 3=Next waypoint except RTL
      terrainAlt: false, // Use terrain altitude
    },
    mavCmd: 201 // MAV_CMD_DO_SET_ROI
  },
  DO_SET_SERVO: {
    name: 'Set Servo',
    defaultParams: {
      servoNumber: 1, // Servo instance number
      pwm: 1500, // PWM value (microseconds)
    },
    mavCmd: 183 // MAV_CMD_DO_SET_SERVO
  },
  DO_REPEAT_SERVO: {
    name: 'Repeat Servo',
    defaultParams: {
      servoNumber: 1, // Servo instance number
      pwm: 1500, // PWM value (microseconds)
      repeatCount: 1, // Number of times to repeat
      delayBetween: 0, // Delay between repeats (seconds)
    },
    mavCmd: 184 // MAV_CMD_DO_REPEAT_SERVO
  },
  DO_DIGICAM_CONTROL: {
    name: 'Camera Control',
    defaultParams: {
      sessionControl: 1, // 0=stop, 1=start
      zoomLevel: 0, // Zoom level
      zoomType: 0, // 0=focus (aperture), 1=focal length
      focusLock: 0, // 0=unlock focus, 1=lock focus
      shutterCommand: 1, // 0=no trigger, 1=trigger
    },
    mavCmd: 203 // MAV_CMD_DO_DIGICAM_CONTROL
  },
  DO_MOUNT_CONTROL: {
    name: 'Mount Control',
    defaultParams: {
      pitch: 0, // Pitch angle (degrees)
      roll: 0, // Roll angle (degrees)
      yaw: 0, // Yaw angle (degrees)
      altitudeMode: 0, // 0=absolute, 1=relative
      latitude: 0, // If mode is absolute
      longitude: 0, // If mode is absolute
      altitude: 0, // If mode is absolute
    },
    mavCmd: 205 // MAV_CMD_DO_MOUNT_CONTROL
  }
};

function MissionPlanner() {
  const [viewState, setViewState] = useState({
    longitude: -122.4194,
    latitude: 37.7749,
    zoom: 18,
    pitch: 45,
    bearing: 0
  });

  const [waypoints, setWaypoints] = useState([]);
  const [selectedWaypoint, setSelectedWaypoint] = useState(null);
  const [defaultAltitude, setDefaultAltitude] = useState(50);
  const [currentCommandType, setCurrentCommandType] = useState('WAYPOINT');
  const [contextMenuPos, setContextMenuPos] = useState(null);
  const [expandedItems, setExpandedItems] = useState(new Set());

  const handleMapClick = (event) => {
    const { lng, lat } = event.lngLat;
    // Deselect when clicking on the map
    setSelectedWaypoint(null);
    setContextMenuPos(null);
    
    // Only add waypoint on left click
    if (event.originalEvent.button === 0) {
      const newWaypoint = {
        id: Date.now(),
        type: currentCommandType,
        parameters: {
          ...COMMAND_TYPES[currentCommandType].defaultParams,
          latitude: lat,
          longitude: lng,
          altitude: defaultAltitude,
        }
      };
      setWaypoints([...waypoints, newWaypoint]);
    }
  };

  const handleContextMenu = (event) => {
    event.preventDefault();
    const { lng, lat } = event.lngLat;
    const { pageX, pageY } = event.originalEvent;
    setContextMenuPos({ lng, lat, x: pageX, y: pageY });
  };

  const addCommand = (type, pos) => {
    const newCommand = {
      id: Date.now(),
      type,
      parameters: {
        ...COMMAND_TYPES[type].defaultParams,
        ...(type === 'WAYPOINT' || type === 'LAND' ? {
          latitude: pos.lat,
          longitude: pos.lng,
          altitude: defaultAltitude,
        } : {})
      }
    };
    setWaypoints([...waypoints, newCommand]);
    setSelectedWaypoint(newCommand);
    setContextMenuPos(null);
  };

  const deleteWaypoint = (id) => {
    setWaypoints(waypoints.filter(wp => wp.id !== id));
    if (selectedWaypoint?.id === id) {
      setSelectedWaypoint(null);
    }
  };

  const moveWaypoint = (id, direction) => {
    const index = waypoints.findIndex(wp => wp.id === id);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= waypoints.length) return;
    
    const newWaypoints = [...waypoints];
    [newWaypoints[index], newWaypoints[newIndex]] = [newWaypoints[newIndex], newWaypoints[index]];
    setWaypoints(newWaypoints);
  };

  const updateWaypointParameter = (waypointId, paramName, value) => {
    setWaypoints(waypoints.map(wp => 
      wp.id === waypointId 
        ? {
            ...wp,
            parameters: {
              ...wp.parameters,
              [paramName]: value
            }
          }
        : wp
    ));
  };

  const toggleExpanded = (id) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const getModelMatrix = (longitude, latitude, altitude) => {
    // Convert the marker's position to mercator coordinates
    const mercatorCoord = new mapboxgl.MercatorCoordinate(
      longitude,
      latitude,
      0
    );

    // Scale the altitude by the mercator coordinate scale to match map units
    const scale = mercatorCoord.meterInMercatorCoordinateUnits();
    
    return [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      mercatorCoord.x, mercatorCoord.y, altitude * scale, 1
    ];
  };

  // Add scale factor calculation based on zoom level
  const getAltitudeScale = (zoom) => {
    // At zoom level 18, 1 meter = ~4.366 pixels (1/0.229)
    const basePixelsPerMeter = 4.366;
    
    // Scale adjusts exponentially with zoom level difference
    // Each zoom level doubles/halves the scale
    return basePixelsPerMeter * Math.pow(2, zoom - 18);
  };

  // Function to generate line features for waypoints
  const getWaypointLines = () => {
    const features = [];
    for (let i = 0; i < waypoints.length - 1; i++) {
      const current = waypoints[i];
      const next = waypoints[i + 1];
      
      // Skip non-location commands
      if (!current.parameters?.latitude || !current.parameters?.longitude ||
          !next.parameters?.latitude || !next.parameters?.longitude) {
        continue;
      }

      // Skip certain command combinations
      if (current.type === 'RTL' || next.type === 'RTL' ||
          current.type === 'DELAY' || next.type === 'WAIT_UNTIL' ||
          current.type === 'DO_CHANGE_SPEED') {
        continue;
      }

      features.push({
        type: 'Feature',
        properties: {
          type: next.type === 'SPLINE_WAYPOINT' ? 'spline' : 'straight',
          startAlt: current.parameters.altitude || 0,
          endAlt: next.parameters.altitude || 0
        },
        geometry: {
          type: 'LineString',
          coordinates: [
            [current.parameters.longitude, current.parameters.latitude],
            [next.parameters.longitude, next.parameters.latitude]
          ]
        }
      });
    }
    return {
      type: 'FeatureCollection',
      features
    };
  };

  // Function to generate circle features for range-based commands
  const getRangeCircles = () => {
    const features = [];
    for (const waypoint of waypoints) {
      if (!waypoint.parameters?.latitude || !waypoint.parameters?.longitude) {
        continue;
      }

      // Add circles for loiter commands
      if ((waypoint.type === 'LOITER_TIME' || waypoint.type === 'LOITER_TURNS') && 
          waypoint.parameters.radius && waypoint.parameters.radius > 0) {
        // Create circle points
        const points = [];
        const steps = 64;
        const radius = waypoint.parameters.radius / 111300; // Convert meters to degrees (approximate)
        
        for (let i = 0; i <= steps; i++) {
          const angle = (i / steps) * 2 * Math.PI;
          points.push([
            waypoint.parameters.longitude + radius * Math.cos(angle),
            waypoint.parameters.latitude + radius * Math.sin(angle)
          ]);
        }

        features.push({
          type: 'Feature',
          properties: {
            type: waypoint.type,
            radius: waypoint.parameters.radius
          },
          geometry: {
            type: 'LineString',
            coordinates: points
          }
        });
      }
    }
    return {
      type: 'FeatureCollection',
      features
    };
  };

  // Function to generate 3D line features
  const get3DLines = () => {
    const features = [];
    for (let i = 0; i < waypoints.length - 1; i++) {
      const current = waypoints[i];
      const next = waypoints[i + 1];
      
      // Only create lines between waypoints that have coordinates
      if (current.parameters?.latitude != null && current.parameters?.longitude != null &&
          next.parameters?.latitude != null && next.parameters?.longitude != null) {
        features.push({
          type: 'Feature',
          properties: {
            type: next.type === 'SPLINE_WAYPOINT' ? 'spline' : 'straight',
            startAlt: current.parameters.altitude || 0,
            endAlt: next.parameters.altitude || 0
          },
          geometry: {
            type: 'LineString',
            coordinates: [
              [current.parameters.longitude, current.parameters.latitude],
              [next.parameters.longitude, next.parameters.latitude]
            ]
          }
        });
      }
    }
    return {
      type: 'FeatureCollection',
      features
    };
  };

  return (
    <Box style={{ height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Map Container */}
      <Box style={{ height: 'calc(100vh - 80px)', position: 'relative' }}>
        <Map
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          onClick={handleMapClick}
          onContextMenu={handleContextMenu}
          mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/victoryforphil/cm5xshpj600eg01slhyzb1atu"
          terrain={{ 
            source: 'mapbox-dem', 
            exaggeration: 1.5
          }}
        >
          {/* Add DEM source for terrain */}
          <Source
            id="mapbox-dem"
            type="raster-dem"
            url="mapbox://mapbox.mapbox-terrain-dem-v1"
            tileSize={512}
            maxzoom={14}
          />

          {/* Sky layer for better 3D visualization */}
          <Layer
            id="sky"
            type="sky"
            paint={{
              'sky-type': 'atmosphere',
              'sky-atmosphere-sun': [0.0, 90.0],
              'sky-atmosphere-sun-intensity': 15
            }}
          />

          {/* Range circles with 3D effect */}
          <Source id="range-circles" type="geojson" data={getRangeCircles()}>
            <Layer
              id="range-circles-fill"
              type="line"
              layout={{
                'line-join': 'round',
                'line-cap': 'round'
              }}
              paint={{
                'line-color': '#228be6',
                'line-width': 3,
                'line-opacity': 0.8,
                'line-dasharray': [2, 2]
              }}
            />
          </Source>

          {/* Ground reference lines (bright and glowing) */}
          <Source id="waypoint-lines" type="geojson" data={getWaypointLines()}>
            <Layer
              id="waypoint-connections-glow"
              type="line"
              layout={{
                'line-join': 'round',
                'line-cap': 'round',
                'visibility': 'visible'
              }}
              paint={{
                'line-color': '#ffffff',
                'line-width': 4,
                'line-blur': 3,
                'line-opacity': 0.4
              }}
            />
            <Layer
              id="waypoint-connections"
              type="line"
              layout={{
                'line-join': 'round',
                'line-cap': 'round',
                'visibility': 'visible'
              }}
              paint={{
                'line-color': '#ffffff',
                'line-width': 2,
                'line-dasharray': ['match', ['get', 'type'], 'spline', ['literal', [2, 2]], ['literal', [1, 0]]],
                'line-opacity': 0.8
              }}
            />
          </Source>

          {waypoints.map((waypoint, index) => (
            waypoint.parameters.latitude && waypoint.parameters.longitude ? (
              <Marker
                key={waypoint.id}
                longitude={waypoint.parameters.longitude}
                latitude={waypoint.parameters.latitude}
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  setSelectedWaypoint(selectedWaypoint?.id === waypoint.id ? null : waypoint);
                }}
              >
                <div style={{ 
                  position: 'relative',
                  transform: `translateY(-${waypoint.parameters.altitude * getAltitudeScale(viewState.zoom)}px)`,
                  transformOrigin: 'bottom center'
                }}>
                  {/* Vertical altitude line */}
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: '50%',
                    transform: 'translate(-50%, 100%)',
                    width: '2px',
                    height: `${waypoint.parameters.altitude * getAltitudeScale(viewState.zoom)}px`,
                    background: 'linear-gradient(to top, #228be6, transparent)',
                    opacity: 0.5,
                    pointerEvents: 'none'
                  }} />
                  
                  {/* Horizontal connection line to next waypoint */}
                  {index < waypoints.length - 1 && waypoints[index + 1].parameters?.latitude && (
                    <div style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      height: '2px',
                      background: '#228be6',
                      opacity: 0.8,
                      pointerEvents: 'none',
                      transformOrigin: 'left center',
                      transform: (() => {
                        const next = waypoints[index + 1];
                        const dx = next.parameters.longitude - waypoint.parameters.longitude;
                        const dy = next.parameters.latitude - waypoint.parameters.latitude;
                        const distance = Math.sqrt(dx * dx + dy * dy) * 111000; // Convert to meters (rough approximation)
                        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                        return `rotate(${angle}deg) scaleX(${distance * getAltitudeScale(viewState.zoom)})`;
                      })()
                    }} />
                  )}

                  {/* Marker icon */}
                  {waypoint.type === 'TAKEOFF' ? (
                    <IconPlane 
                      size={24} 
                      color={selectedWaypoint?.id === waypoint.id ? "#ff4444" : "#228be6"}
                      style={{
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                        transformOrigin: 'bottom center',
                        transform: 'rotate(-45deg) scale(1)'
                      }}
                    />
                  ) : waypoint.type === 'LAND' ? (
                    <IconParachute 
                      size={24} 
                      color={selectedWaypoint?.id === waypoint.id ? "#ff4444" : "#228be6"}
                      style={{
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                        transformOrigin: 'bottom center',
                        transform: 'scale(1)'
                      }}
                    />
                  ) : waypoint.type === 'RTL' ? (
                    <IconHome 
                      size={24} 
                      color={selectedWaypoint?.id === waypoint.id ? "#ff4444" : "#228be6"}
                      style={{
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                        transformOrigin: 'bottom center',
                        transform: 'scale(1)'
                      }}
                    />
                  ) : waypoint.type === 'LOITER_TIME' || waypoint.type === 'LOITER_TURNS' ? (
                    <IconCircleDotted 
                      size={24} 
                      color={selectedWaypoint?.id === waypoint.id ? "#ff4444" : "#228be6"}
                      style={{
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                        transformOrigin: 'bottom center',
                        transform: 'scale(1)'
                      }}
                    />
                  ) : waypoint.type === 'SPLINE_WAYPOINT' ? (
                    <IconArrowMerge 
                      size={24} 
                      color={selectedWaypoint?.id === waypoint.id ? "#ff4444" : "#228be6"}
                      style={{
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                        transformOrigin: 'bottom center',
                        transform: 'scale(1)'
                      }}
                    />
                  ) : (
                    <IconDrone 
                      size={24} 
                      color={selectedWaypoint?.id === waypoint.id ? "#ff4444" : "#228be6"}
                      style={{
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                        transformOrigin: 'bottom center',
                        transform: 'scale(1)'
                      }}
                    />
                  )}
                  <div style={{
                    position: 'absolute',
                    top: -32,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                    zindex: 1
                  }}>
                    {waypoint.parameters.altitude}m AGL
                  </div>

                  {/* Add horizontal disc for waypoints with radius */}
                  {(waypoint.type === 'LOITER_TIME' || waypoint.type === 'LOITER_TURNS' || waypoint.parameters.acceptRadius > 0) && (
                    <div style={{
                      position: 'absolute',
                      left: '50%',
                      width: `${(waypoint.parameters.radius || waypoint.parameters.acceptRadius) * 2 * getAltitudeScale(viewState.zoom)}px`,
                      height: `${(waypoint.parameters.radius || waypoint.parameters.acceptRadius) * 2 * getAltitudeScale(viewState.zoom)}px`,
                      transform: `translate(-50%, -50%) rotateX(${viewState.pitch}deg) rotateZ(${viewState.bearing}deg)`,
                      border: '2px solid #228be6',
                      borderRadius: '50%',
                      opacity: 0.3,
                      backgroundColor: '#228be6',
                      pointerEvents: 'none',
                      transformStyle: 'preserve-3d',
                      backfaceVisibility: 'hidden'
                    }} />
                  )}

                  {/* Add vertical altitude line */}
                  {(waypoint.type === 'LOITER_TIME' || waypoint.type === 'LOITER_TURNS' || waypoint.parameters.acceptRadius > 0) && (
                    <div style={{
                      position: 'absolute',
                      left: '50%',
                      width: `${(waypoint.parameters.radius || waypoint.parameters.acceptRadius) * 2 * getAltitudeScale(viewState.zoom)}px`,
                      height: `${(waypoint.parameters.radius || waypoint.parameters.acceptRadius) * 2 * getAltitudeScale(viewState.zoom)}px`,
                      transform: `translate(-50%, -50%) rotateX(${viewState.pitch}deg) rotateZ(${viewState.bearing}deg)`,
                      border: '2px solid #228be6',
                      borderRadius: '50%',
                      opacity: 0.3,
                      backgroundColor: '#228be6',
                      pointerEvents: 'none',
                      transformStyle: 'preserve-3d',
                      backfaceVisibility: 'hidden'
                    }} />
                  )}
                </div>
              </Marker>
            ) : null
          ))}
          <NavigationControl position="bottom-right" />
          <GeolocateControl position="bottom-right" />

          {/* Mission Controls - Inside Map */}
          <div style={{ 
            position: 'absolute',
            top: 20,
            left: 20,
            width: 280,
            maxHeight: 'calc(100vh - 120px)',
            zIndex: 1
          }}>
            <Paper 
              shadow="sm" 
              p="md" 
              style={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px'
              }}
            >
              <Stack>
                <Text size="xl" fw={700}>Mission Planner</Text>

                <Stack gap="xs">
                  <Select
                    size="xs"
                    label="Current Command Type"
                    value={currentCommandType}
                    onChange={setCurrentCommandType}
                    data={Object.entries(COMMAND_TYPES).map(([value, info]) => ({
                      value,
                      label: info.name
                    }))}
                    zIndex={2}
                  />
                  
                  <NumberInput
                    size="xs"
                    label="Default Altitude (m)"
                    value={defaultAltitude}
                    onChange={setDefaultAltitude}
                    min={0}
                    step={5}
                  />

                  <Text size="sm" c="dimmed">
                    Left click to add {COMMAND_TYPES[currentCommandType].name}, right click for command menu
                  </Text>
                </Stack>

                {/* Timeline View */}
                <ScrollArea h={400} mt="md">
                  <Timeline active={selectedWaypoint ? waypoints.findIndex(w => w.id === selectedWaypoint.id) : -1} 
                           bulletSize={24} 
                           lineWidth={2}
                           color="blue">
                    {waypoints.map((waypoint, index) => (
                      <Timeline.Item
                        key={waypoint.id}
                        title={
                          <Group justify="space-between" wrap="nowrap">
                            <Group gap="xs">
                              <Badge 
                                size="sm" 
                                variant="filled" 
                                color={selectedWaypoint?.id === waypoint.id ? "blue" : "gray"}
                              >
                                {index + 1}
                              </Badge>
                              <Text>{COMMAND_TYPES[waypoint.type].name}</Text>
                              {waypoint.parameters.latitude !== undefined && (
                                <Text size="xs" c="dimmed" style={{ display: expandedItems.has(waypoint.id) ? 'none' : 'block' }}>
                                  {waypoint.parameters.altitude}m
                                </Text>
                              )}
                            </Group>
                            <Group gap={4}>
                              <Button 
                                size="xs" 
                                variant="subtle"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpanded(waypoint.id);
                                }}
                                p={0}
                              >
                                {expandedItems.has(waypoint.id) ? (
                                  <IconChevronDown size={16} />
                                ) : (
                                  <IconChevronRight size={16} />
                                )}
                              </Button>
                              <Button 
                                size="xs" 
                                variant="subtle"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveWaypoint(waypoint.id, 'up');
                                }}
                                disabled={index === 0}
                                p={0}
                              >
                                <IconArrowUp size={16} />
                              </Button>
                              <Button 
                                size="xs" 
                                variant="subtle"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveWaypoint(waypoint.id, 'down');
                                }}
                                disabled={index === waypoints.length - 1}
                                p={0}
                              >
                                <IconArrowDown size={16} />
                              </Button>
                              <Button 
                                size="xs" 
                                color="red" 
                                variant="subtle"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteWaypoint(waypoint.id);
                                }}
                                p={0}
                              >
                                <IconTrash size={16} />
                              </Button>
                            </Group>
                          </Group>
                        }
                        bullet={
                          <div 
                            style={{ 
                              cursor: 'pointer',
                              opacity: selectedWaypoint?.id === waypoint.id ? 1 : 0.7 
                            }}
                            onClick={() => setSelectedWaypoint(waypoint)}
                          >
                            {waypoint.type === 'TAKEOFF' ? (
                              <IconPlane size={12} style={{ transform: 'rotate(-45deg)' }} />
                            ) : waypoint.type === 'LAND' ? (
                              <IconParachute size={12} />
                            ) : waypoint.type === 'RTL' ? (
                              <IconHome size={12} />
                            ) : waypoint.type === 'LOITER_TIME' || waypoint.type === 'LOITER_TURNS' ? (
                              <IconCircleDotted size={12} />
                            ) : waypoint.type === 'DELAY' || waypoint.type === 'WAIT_UNTIL' ? (
                              <IconClock size={12} />
                            ) : waypoint.type === 'DO_CHANGE_SPEED' ? (
                              <IconSpeedboat size={12} />
                            ) : waypoint.type === 'SPLINE_WAYPOINT' ? (
                              <IconArrowMerge size={12} />
                            ) : (
                              <IconDrone size={12} />
                            )}
                          </div>
                        }
                        lineVariant={waypoint.type === 'SPLINE_WAYPOINT' ? 'dashed' : 'solid'}
                      >
                        <Collapse in={expandedItems.has(waypoint.id)}>
                          <Stack gap="xs" mt="xs">
                            {/* Location info if available */}
                            {waypoint.parameters.latitude !== undefined && (
                              <Text size="sm" c="dimmed">
                                {`${waypoint.parameters.latitude.toFixed(6)}, ${waypoint.parameters.longitude.toFixed(6)} @ ${waypoint.parameters.altitude}m`}
                              </Text>
                            )}
                            
                            {/* Command specific info */}
                            {waypoint.type === 'LOITER_TURNS' && (
                              <Text size="sm" c="dimmed">
                                {`${waypoint.parameters.turns} turns @ ${waypoint.parameters.radius}m radius`}
                              </Text>
                            )}
                            {waypoint.type === 'DO_CHANGE_SPEED' && (
                              <Text size="sm" c="dimmed">
                                {`${waypoint.parameters.speed} m/s ${waypoint.parameters.speedType === 0 ? 'airspeed' : 'groundspeed'}`}
                              </Text>
                            )}

                            {/* Command Editor */}
                            <Box mt="sm">
                              <Stack gap="xs">
                                <CommandSelector 
                                  command={waypoint} 
                                  onUpdateParameter={updateWaypointParameter} 
                                />
                                {waypoint.parameters.latitude !== undefined && (
                                  <Stack gap="xs">
                                    <NumberInput
                                      label="Latitude"
                                      value={waypoint.parameters.latitude}
                                      onChange={(value) => updateWaypointParameter(waypoint.id, 'latitude', value)}
                                      precision={7}
                                      step={0.0001}
                                      size="xs"
                                    />
                                    <NumberInput
                                      label="Longitude"
                                      value={waypoint.parameters.longitude}
                                      onChange={(value) => updateWaypointParameter(waypoint.id, 'longitude', value)}
                                      precision={7}
                                      step={0.0001}
                                      size="xs"
                                    />
                                  </Stack>
                                )}
                              </Stack>
                            </Box>
                          </Stack>
                        </Collapse>
                      </Timeline.Item>
                    ))}
                  </Timeline>
                </ScrollArea>
              </Stack>
            </Paper>
          </div>
        </Map>

        {/* Context Menu */}
        {contextMenuPos && (
          <Menu 
            opened={true} 
            onClose={() => setContextMenuPos(null)} 
            position="bottom-start"
            zIndex={2}
          >
            <Menu.Target>
              <div style={{ 
                position: 'fixed', 
                left: contextMenuPos.x,
                top: contextMenuPos.y,
                width: 1,
                height: 1,
                pointerEvents: 'none'
              }} />
            </Menu.Target>
            <Menu.Dropdown>
              {Object.entries(COMMAND_TYPES).map(([type, info]) => (
                <Menu.Item
                  key={type}
                  onClick={() => addCommand(type, contextMenuPos)}
                >
                  {info.name}
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>
        )}
      </Box>

      {/* Mission Action Bar */}
      <Box
        style={{
          position: 'fixed',
          bottom: 10,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 500
        }}
      >
        <Paper 
          shadow="sm" 
          p="xs" 
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            whiteSpace: 'nowrap'
          }}
        >
          <Group gap="md">
            <Button size="sm" leftSection={<IconDownload size={16} />}>
              Download
            </Button>
            <Button size="sm" leftSection={<IconUpload size={16} />}>
              Upload
            </Button>
            <Button size="sm" color="green" leftSection={<IconPlayerPlay size={16} />}>
              Run Mission
            </Button>
          </Group>
        </Paper>
      </Box>
    </Box>
  );
}

export default MissionPlanner; 