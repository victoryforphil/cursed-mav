import React, { useEffect, useRef, useState } from "react";
import Map, { GeolocateControl, Marker, NavigationControl } from "react-map-gl";
import { listen } from "@tauri-apps/api/event";
import { notifications } from "@mantine/notifications";
import { IconDrone, IconPlane } from "@tabler/icons-react";

/**
 * A React component that uses react-map-gl (Mapbox) to display a live-updating marker,
 * based on MAVLink GPS messages from Tauri. Similar to ThreeDView but in 2D.
 *
 * You may need a Mapbox token. By default, you can place it in your .env like:
 *   VITE_MAPBOX_TOKEN=<your mapbox token>
 * Then reference import.meta.env.VITE_MAPBOX_TOKEN below.
 *
 * Marker docs:
 *   https://visgl.github.io/react-map-gl/docs/api-reference/marker
 *
 * This component listens for GPS_RAW_INT messages. If the app is receiving MAVLink data,
 * the marker will jump to the GPS location. 
 */
function MapView() {
  // Default to San Francisco, similar to the 3DView example
  const [latitude, setLatitude] = useState(37.7749);
  const [longitude, setLongitude] = useState(-122.4194);
  const [altitude, setAltitude] = useState(0);
  const notificationId = useRef(null);
  const unlistenFn = useRef(null);

  const [viewState, setViewState] = useState({
    longitude: -122.4194,
    latitude: 37.7749,
    zoom: 18
    ,
    pitch: 70
    ,
    bearing: 0
  });

  useEffect(() => {
    const setupListener = async () => {
      try {
        unlistenFn.current = await listen("mavlink_message", (event) => {
          const { message } = event.payload;
          if (message.type === "GPS_RAW_INT") {
            const lat = message.lat / 1e7;
            const lon = message.lon / 1e7;
            const alt = message.alt / 1000;
            setLatitude(lat);
            setLongitude(lon);
            setAltitude(alt);
            setViewState(prev => ({
              ...prev,
              latitude: lat,
              longitude: lon
            }));

            // Show a persistent "GPS Signal Active" notification
            // or update the message if it's already being shown
            if (!notificationId.current) {
              notificationId.current = notifications.show({
                id: "gps-signal-2d-map",
                title: "GPS Signal Active (2D Map)",
                message: `Location: ${lat.toFixed(6)}, ${lon.toFixed(6)}`,
                color: "green",
                autoClose: false,
                withBorder: true,
              });
            } else {
              notifications.update({
                id: "gps-signal-2d-map",
                message: `Location: ${lat.toFixed(6)}, ${lon.toFixed(6)}`,
              });
            }
          }
        });
      } catch (error) {
        console.error("Error setting up MAVLink listener:", error);
      }
    };

    setupListener();

    // Unsubscribe when component unmounts
    return () => {
      if (unlistenFn.current) {
        unlistenFn.current();
      }
      if (notificationId.current) {
        notifications.hide("gps-signal-2d-map");
      }
    };
  }, []);

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
        style={{ width: "100%", height: "100vh" }}
        terrain={{
          source: "mapbox-raster-dem",
          exaggeration: 2
        }}
        lights={[{
          id: "ambient-light",
          type: "ambient",
          properties: {
            color: "#ffffff",
            intensity: 0.7
          }
        }]}
        mapStyle="mapbox://styles/victoryforphil/cm5xshpj600eg01slhyzb1atu"
      >
        <Marker longitude={longitude} latitude={latitude} anchor="bottom">
         <IconDrone />
         
        </Marker>
        <NavigationControl />
        <GeolocateControl />
      </Map>
    </div>
  );
}

export default MapView;