import React from 'react';
import { Stack, NumberInput, Text } from '@mantine/core';

function TakeoffCommand({ command, onUpdateParameter }) {
  return (
    <Stack gap="xs">
      <Text size="sm" fw={500}>Takeoff Parameters</Text>
      
      <NumberInput
        size="xs"
        label="Minimum Pitch (deg)"
        value={command.parameters.minPitch}
        onChange={(value) => onUpdateParameter(command.id, 'minPitch', value)}
        min={0}
        max={90}
        step={5}
        description="Minimum pitch angle during takeoff"
      />
      
      <NumberInput
        size="xs"
        label="Yaw Angle (deg)"
        value={command.parameters.yawAngle}
        onChange={(value) => onUpdateParameter(command.id, 'yawAngle', value)}
        min={-180}
        max={180}
        step={5}
        description="Desired yaw angle during takeoff"
      />
      
      <NumberInput
        size="xs"
        label="Target Altitude (m)"
        value={command.parameters.altitude}
        onChange={(value) => onUpdateParameter(command.id, 'altitude', value)}
        min={0}
        step={5}
        description="Target altitude after takeoff"
      />
    </Stack>
  );
}

export default TakeoffCommand; 