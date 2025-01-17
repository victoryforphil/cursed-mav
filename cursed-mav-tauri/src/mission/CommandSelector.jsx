import React from 'react';
import { Group } from '@mantine/core';
import WaypointCommand from './commands/WaypointCommand';
import TakeoffCommand from './commands/TakeoffCommand';
import LandCommand from './commands/LandCommand';
import RTLCommand from './commands/RTLCommand';
import LoiterTimeCommand from './commands/LoiterTimeCommand';
import LoiterTurnsCommand from './commands/LoiterTurnsCommand';
import SplineWaypointCommand from './commands/SplineWaypointCommand';
import ChangeSpeedCommand from './commands/ChangeSpeedCommand';

function CommandSelector({ command, onUpdateParameter }) {
  switch (command.type) {
    case 'WAYPOINT':
      return <WaypointCommand command={command} onUpdateParameter={onUpdateParameter} />;
    case 'TAKEOFF':
      return <TakeoffCommand command={command} onUpdateParameter={onUpdateParameter} />;
    case 'LAND':
      return <LandCommand command={command} onUpdateParameter={onUpdateParameter} />;
    case 'RTL':
      return <RTLCommand />;
    case 'LOITER_TIME':
      return <LoiterTimeCommand command={command} onUpdateParameter={onUpdateParameter} />;
    case 'LOITER_TURNS':
      return <LoiterTurnsCommand command={command} onUpdateParameter={onUpdateParameter} />;
    case 'SPLINE_WAYPOINT':
      return <SplineWaypointCommand command={command} onUpdateParameter={onUpdateParameter} />;
    case 'DO_CHANGE_SPEED':
      return <ChangeSpeedCommand command={command} onUpdateParameter={onUpdateParameter} />;
    default:
      return <div>Unknown command type: {command.type}</div>;
  }
}

export default CommandSelector; 