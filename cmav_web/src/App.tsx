import './App.css'
import { ThemeProvider } from './components/theme-provider'
import DockDashboard from './components/dock-dashboard'
import { Header } from './components/header'
import { DockviewThemeProvider } from './components/dockview-theme-provider'

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <DockviewThemeProvider>
        <div className="h-screen flex flex-col overflow-hidden">
          <Header />
          <div className="flex-1 relative overflow-hidden">
            <DockDashboard />
          </div>
        </div>
      </DockviewThemeProvider>
    </ThemeProvider>
  )
}

export default App
