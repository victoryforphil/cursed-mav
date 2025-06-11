import React, { useEffect, useRef, useState } from "react";
import Map, { GeolocateControl, Marker, NavigationControl } from "react-map-gl";
import { listen } from "@tauri-apps/api/event";
import { notifications } from "@mantine/notifications";
import { IconDrone, IconPlane } from "@tabler/icons-react";
import useArdupilotValue from "./hooks/useArdupilotValue";

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

  const [viewState, setViewState] = useState({
    longitude: -122.4194,
    latitude: 37.7749,
    zoom: 18,
    pitch: 70,
    bearing: 0,
  });

  const apGPSValue = useArdupilotValue("GPS_RAW_INT");

  useEffect(() => {
    if (!apGPSValue) return;

    const lat = apGPSValue.lat / 1e7;
    const lon = apGPSValue.lon / 1e7;
    const alt = apGPSValue.alt / 1000;

    // only update if we have moved a little bit
    if (
      Math.abs(lat - latitude) > 0.00001 ||
      Math.abs(lon - longitude) > 0.00001
    ) {
      console.log("Updating GPS: ", lat, lon, alt);
      
      setLatitude(lat);
      setLongitude(lon);
      setAltitude(alt);
      setViewState((prev) => ({
        ...prev,
        latitude: lat,
        longitude: lon,
      }));
    }

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
  }, [apGPSValue]);

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
        style={{ width: "100%", height: "100vh" }}
        terrain={{
          source: "mapbox-raster-dem",
          exaggeration: 2,
        }}
        lights={[
          {
            id: "ambient-light",
            type: "ambient",
            properties: {
              color: "#ffffff",
              intensity: 0.7,
            },
          },
        ]}
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
