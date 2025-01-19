import React from 'react';
import { Stack, NumberInput, Select } from '@mantine/core';

const SPEED_TYPES = [
  { value: '0', label: 'Ground Speed' },
  { value: '2', label: 'Climb Speed' },
  { value: '3', label: 'Descent Speed' }
];

function ChangeSpeedCommand({ command, onUpdateParameter }) {
  return (
    <Stack gap="xs">
      <Select
        size="xs"
        label="Speed Type"
        description="Type of speed to change"
        value={command.parameters.speedType.toString()}
        onChange={(value) => onUpdateParameter(command.id, 'speedType', parseInt(value))}
        data={SPEED_TYPES}
      />
      <NumberInput
        size="xs"
        label="Speed (m/s)"
        description="Target speed"
        value={command.parameters.speed}
        onChange={(value) => onUpdateParameter(command.id, 'speed', value)}
        min={0}
        step={0.5}
        precision={1}
      />
    </Stack>
  );
}

export default ChangeSpeedCommand; 