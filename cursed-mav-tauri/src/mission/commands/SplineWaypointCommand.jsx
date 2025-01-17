import React from 'react';
import { Stack, NumberInput, Group } from '@mantine/core';

function SplineWaypointCommand({ command, onUpdateParameter }) {
  return (
    <Stack gap="xs">
      <Group grow>
        <NumberInput
          label="Delay (seconds)"
          description="Hold time at waypoint"
          value={command.parameters.delay}
          onChange={(value) => onUpdateParameter(command.id, 'delay', value)}
          min={0}
          step={1}
        />
        <NumberInput
          label="Altitude (meters)"
          description="Above ground level"
          value={command.parameters.altitude}
          onChange={(value) => onUpdateParameter(command.id, 'altitude', value)}
          min={0}
          step={5}
        />
      </Group>
    </Stack>
  );
}

export default SplineWaypointCommand; 