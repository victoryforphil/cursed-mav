import React from 'react';
import { Stack, NumberInput, Group } from '@mantine/core';

function LoiterTimeCommand({ command, onUpdateParameter }) {
  return (
    <Stack gap="xs">
      <Group grow>
        <NumberInput
          label="Time (seconds)"
          description="How long to loiter"
          value={command.parameters.time}
          onChange={(value) => onUpdateParameter(command.id, 'time', value)}
          min={0}
          step={5}
        />
        <NumberInput
          label="Radius (meters)"
          description="0 = hold position"
          value={command.parameters.radius}
          onChange={(value) => onUpdateParameter(command.id, 'radius', value)}
          step={1}
        />
      </Group>
      <Group grow>
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

export default LoiterTimeCommand; 