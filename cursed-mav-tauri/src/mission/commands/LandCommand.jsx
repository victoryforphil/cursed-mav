import React from 'react';
import { Stack, NumberInput, Text, Switch } from '@mantine/core';

function LandCommand({ command, onUpdateParameter }) {
  return (
    <Stack gap="xs">
      <Text size="sm" fw={500}>Land Parameters</Text>
      
      <NumberInput
        size="xs"
        label="Abort Altitude (m)"
        value={command.parameters.abortAlt}
        onChange={(value) => onUpdateParameter(command.id, 'abortAlt', value)}
        min={0}
        step={1}
        description="Altitude to abort landing and return home"
      />
      
      <NumberInput
        size="xs"
        label="Landing Speed (m/s)"
        value={command.parameters.landSpeed}
        onChange={(value) => onUpdateParameter(command.id, 'landSpeed', value)}
        min={0.1}
        max={5}
        step={0.1}
        description="Descent speed during landing"
      />
      
      <NumberInput
        size="xs"
        label="Yaw Angle (deg)"
        value={command.parameters.yawAngle}
        onChange={(value) => onUpdateParameter(command.id, 'yawAngle', value)}
        min={-180}
        max={180}
        step={5}
        description="Desired yaw angle during landing"
      />

      <Switch
        size="xs"
        label="Precision Landing"
        checked={command.parameters.precisionLanding}
        onChange={(event) => onUpdateParameter(command.id, 'precisionLanding', event.currentTarget.checked)}
        description="Use precision landing if available"
      />
    </Stack>
  );
}

export default LandCommand; 