import React from 'react';
import { ModeToggle } from './mode-toggle';
import { Rocket, AlertCircle, BarChart3, Settings, Menu, Signal } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export const Header: React.FC = () => {
  return (
    <header className="border-b z-50 bg-background/95 backdrop-blur-sm h-16">
      <div className="container flex h-full items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Rocket className="h-6 w-6 text-primary" />
            <span className="absolute -top-1 -right-1">
              <Signal className="h-3 w-3 text-green-500 animate-pulse" />
            </span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-1">
              Cursed MAV
              <Badge variant="outline" className="text-xs font-normal ml-1">Alpha</Badge>
            </h1>
            <p className="text-xs text-muted-foreground -mt-1">Ground Control Station</p>
          </div>
        </div>
        
        <div className="hidden md:flex items-center space-x-1">
          <Button variant="ghost" size="sm" className="flex items-center gap-1 h-9">
            <BarChart3 className="h-4 w-4" />
            <span>Telemetry</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center gap-1 h-9">
            <AlertCircle className="h-4 w-4" />
            <span>Alerts</span>
            <Badge variant="secondary" className="ml-1 bg-primary/10 text-primary text-xs">3</Badge>
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center gap-1 h-9">
            <Settings className="h-4 w-4" />
            <span>Config</span>
          </Button>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-green-500"></span>
            Connected
          </div>
          <ModeToggle />
          <Button variant="outline" size="icon" className="md:hidden">
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}; 