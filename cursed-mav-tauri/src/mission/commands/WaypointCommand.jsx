import React from 'react';
import { NumberInput, Text, Stack } from '@mantine/core';

function WaypointCommand({ command, onUpdateParameter }) {
  return (
    <Stack gap="xs">
      <Text size="sm" fw={500}>Waypoint Parameters</Text>
      <NumberInput
        size="xs"
        label="Altitude (m)"
        value={command.parameters.altitude}
        onChange={(value) => onUpdateParameter(command.id, 'altitude', value)}
        min={0}
        step={5}
      />
      
      <NumberInput
        size="xs"
        label="Delay (s)"
        value={command.parameters.delay}
        onChange={(value) => onUpdateParameter(command.id, 'delay', value)}
        min={0}
        step={1}
        description="Hold time at waypoint"
      />
      
      <NumberInput
        size="xs"
        label="Accept Radius (m)"
        value={command.parameters.acceptRadius}
        onChange={(value) => onUpdateParameter(command.id, 'acceptRadius', value)}
        min={0}
        step={0.1}
        description="Radius for accepting waypoint completion"
      />
      
      <NumberInput
        size="xs"
        label="Pass Radius (m)"
        value={command.parameters.passRadius}
        onChange={(value) => onUpdateParameter(command.id, 'passRadius', value)}
        min={0}
        step={0.1}
        description="Radius for passing the waypoint"
      />
      
      <NumberInput
        size="xs"
        label="Yaw Angle (deg)"
        value={command.parameters.yawAngle}
        onChange={(value) => onUpdateParameter(command.id, 'yawAngle', value)}
        min={-180}
        max={180}
        step={5}
        description="Desired yaw angle at waypoint"
      />
    </Stack>
  );
}

export default WaypointCommand; 