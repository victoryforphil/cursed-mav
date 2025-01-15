import { useEffect, useRef, useState } from "react";
import { Card, Text } from "@mantine/core";
import { Viewer, Entity, PointGraphics, EntityDescription, Scene, Globe, Camera } from "resium";
import { Cartesian3, Math as CesiumMath, Terrain, IonImageryProvider, Ion, ShadowMode, Color } from "cesium";
import { listen } from "@tauri-apps/api/event";
import { notifications } from "@mantine/notifications";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { IconDrone } from "@tabler/icons-react";

function ThreeDView() {
  const [position, setPosition] = useState(Cartesian3.fromDegrees(-122.4194, 37.7749, 0)); // San Francisco coordinates
  const [error, setError] = useState(null);
  const [terrain, setTerrain] = useState(null);
  const viewerRef = useRef(null);
  const lastPosition = useRef(null);
  const notificationId = useRef(null);
  const [viewerReady, setViewerReady] = useState(false);

  useEffect(() => {
    setTerrain(Terrain.fromWorldTerrain());
  }, []);

  useEffect(() => {
    let unlistenFn;
    const setupListener = async () => {
      try {
        console.log("Setting up MAVLink message listener for GPS data");
        unlistenFn = await listen("mavlink_message", (event) => {
          const message = event.payload.message;

          if (message.type === "GPS_RAW_INT") {
            const lat = message.lat / 1e7;
            const lon = message.lon / 1e7; 
            const alt = message.alt / 1000;

            const newPosition = Cartesian3.fromDegrees(lon, lat, alt);

            const haveOldPosition = !!lastPosition.current;
            const movedFar = true;

            if (movedFar) {
              console.log(`GPS data: Lat ${lat.toFixed(6)}°, Lon ${lon.toFixed(6)}°, Alt ${alt.toFixed(1)}m`);
              setPosition(newPosition);
              lastPosition.current = newPosition;


              if (!notificationId.current) {
                notificationId.current = notifications.show({
                  id: "gps-signal",
                  title: "GPS Signal Active", 
                  message: `Location: ${lat.toFixed(6)}°, ${lon.toFixed(6)}°`,
                  color: "green",
                  autoClose: false,
                  withBorder: true
                });
              } else {
                notifications.update({
                  id: "gps-signal",
                  message: `Location: ${lat.toFixed(6)}°, ${lon.toFixed(6)}°`
                });
              }
            }
          }
        });
      } catch (err) {
        setError(err.message);
        console.error("Error setting up MAVLink listener:", err);
      }
    };

    setupListener();

    return () => {
      if (unlistenFn) {
        unlistenFn();
      }
      if (notificationId.current) {
        notifications.hide("gps-signal");
      }
      if (viewerRef.current?.cesiumElement) {
        viewerRef.current.cesiumElement.destroy();
      }
    };
  }, [viewerReady]);

  if (error) {
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Text color="red">Error: {error}</Text>
      </Card>
    );
  }

  if (!terrain) {
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Text>Loading terrain...</Text>
      </Card>
    );
  } 

  const entity = (position) => {
    return (
      <Entity position={position} name="Vehicle">
        <PointGraphics pixelSize={15} color={Color.WHITE} />
        <EntityDescription>
          <h3>Vehicle Location</h3>
          <p>Current position in Cartesian coordinates</p>
        </EntityDescription>
      </Entity>
    )
  }
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Card.Section withBorder inheritPadding py="xs">
        <Text fw={500}>3D Visualization (With Terrain)</Text>
      </Card.Section>

      <div style={{ height: "100vh", width: "100vh" }}>
        <Viewer
          ref={viewerRef}
          style={{ width: "100%", height: "100vh" }}
          terrain={terrain}
  
          homeButton={true}
          shadows={true}
          resolutionScale={1.1}
          terrainShadows={ShadowMode.ENABLED}
           
          sceneModePicker={false}
          selectionIndicator={false}
          timeline={false}
          navigationHelpButton={false}
          selectedEntity={entity(position)}
          onReady={() => setViewerReady(true)}
        >   
        {entity(position)}
        </Viewer>
      </div>
    </Card>
  );
}

export default ThreeDView;