import React from 'react';
import { Stack, NumberInput } from '@mantine/core';

function LoiterTurnsCommand({ command, onUpdateParameter }) {
  return (
    <Stack gap="xs">
      <NumberInput
        label="Number of Turns"
        description="Complete circles to perform"
        value={command.parameters.turns}
        onChange={(value) => onUpdateParameter(command.id, 'turns', value)}
        min={0}
        precision={1}
        step={0.5}
        size="xs"
      />
      <NumberInput
        label="Radius (meters)"
        description="Circle radius"
        value={command.parameters.radius}
        onChange={(value) => onUpdateParameter(command.id, 'radius', value)}
        min={0}
        step={5}
        size="xs"
      />
      <NumberInput
        label="Altitude (meters)"
        description="Above ground level"
        value={command.parameters.altitude}
        onChange={(value) => onUpdateParameter(command.id, 'altitude', value)}
        min={0}
        step={5}
        size="xs"
      />
    </Stack>
  );
}

export default LoiterTurnsCommand; 