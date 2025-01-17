import React from 'react';
import { Text, Stack } from '@mantine/core';

function RTLCommand() {
  return (
    <Stack gap="xs">
      <Text size="sm" c="dimmed">
        Vehicle will return to launch location and land. No parameters required.
      </Text>
    </Stack>
  );
}

export default RTLCommand; 