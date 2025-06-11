/**
 * Dockview theme configuration utilities
 * Makes it easier to use Dockview with our custom Shadcn theme
 */

// The class name used for our custom Shadcn-styled Dockview theme
export const DOCKVIEW_THEME_CLASS = 'dockview-theme-shadcn';
export const DOCKVIEW_GLASS_VARIANT_CLASS = 'dockview-glass-variant';

/**
 * Configuration for creating new Dockview instances with our theme
 */
export const dockviewConfig = {
  // Basic configuration 
  defaultConfig: {
    className: DOCKVIEW_THEME_CLASS,
    // Small gap between panels
    gap: 4, 
    // Show panel overlay relative to the group when dragging
    dndOverlayMounting: 'relative' as const,
    // Show entire group when dragging
    dndPanelOverlay: 'group' as const,
  },
  
  // Glass variant configuration
  glassConfig: {
    className: `${DOCKVIEW_THEME_CLASS} ${DOCKVIEW_GLASS_VARIANT_CLASS}`,
    gap: 4,
    dndOverlayMounting: 'relative' as const,
    dndPanelOverlay: 'group' as const,
  },
  
  /**
   * Get a configuration object for Dockview with custom overrides
   */
  getConfig: (overrides: Record<string, unknown> = {}, useGlass = false) => {
    return {
      ...(useGlass ? dockviewConfig.glassConfig : dockviewConfig.defaultConfig),
      ...overrides
    };
  }
};

/**
 * Default panel options to use when creating new panels
 */
export const defaultPanelOptions = {
  // Add a close button to panels by default
  hasCloseButton: true,
  // Allow panels to be moved
  isMovable: true,
  // Make panels closable
  isClosable: true,
};

/**
 * Get panel options with custom overrides
 */
export const getPanelOptions = (overrides: Record<string, unknown> = {}) => {
  return {
    ...defaultPanelOptions,
    ...overrides
  };
}; 