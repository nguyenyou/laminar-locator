/**
 * Scala Source Locator
 *
 * This module provides visual overlay functionality for Scala source code navigation.
 * When Alt key is pressed, it highlights DOM elements that have source path information
 * and allows clicking to open the corresponding source file in the configured IDE.
 *
 * Architecture: Class-based design with clear separation of concerns
 * - LocatorState: State management with observer pattern
 * - StyleManager: CSS custom properties and styling
 * - OverlayManager: Overlay creation and positioning
 * - TooltipManager: Tooltip functionality
 * - KeyboardNavigator: Keyboard navigation logic
 * - EventManager: Event listener management
 * - LocatorSystem: Main orchestrator class
 */

(function() {
  'use strict';

  // ============================================================================
  // UICOMPONENT LOCATOR PROPERTY CONSTANTS
  // ============================================================================

  /**
   * UIComponent Locator Property Constants
   *
   * Centralized definition of all UIComponent locator property names.
   * This provides a single point of maintenance when property names need to be updated.
   */
  const LOCATOR_PROPERTIES = {
    /** Source path property for UIComponent elements */
    SCALA_SOURCE_PATH: '__scalasourcepath',

    /** Filename property for UIComponent elements */
    SCALA_FILENAME: '__scalafilename',

    /** Source line property for UIComponent elements */
    SCALA_SOURCE_LINE: '__scalasourceline'
  };

  /**
   * Helper functions for UIComponent property access
   */
  const PropertyAccessor = {
    /**
     * Check if element has the source path property
     * @param {Element} element - Element to check
     * @returns {boolean} True if element has source path property
     */
    hasSourcePath(element) {
      return Object.hasOwn(element, LOCATOR_PROPERTIES.SCALA_SOURCE_PATH);
    },

    /**
     * Get source path from element
     * @param {Element} element - Element to get source path from
     * @returns {string|undefined} Source path or undefined
     */
    getSourcePath(element) {
      return element[LOCATOR_PROPERTIES.SCALA_SOURCE_PATH];
    },

    /**
     * Get filename from element
     * @param {Element} element - Element to get filename from
     * @returns {string|undefined} Filename or undefined
     */
    getFilename(element) {
      return element[LOCATOR_PROPERTIES.SCALA_FILENAME];
    },

    /**
     * Get source line from element
     * @param {Element} element - Element to get source line from
     * @returns {string|undefined} Source line or undefined
     */
    getSourceLine(element) {
      return element[LOCATOR_PROPERTIES.SCALA_SOURCE_LINE];
    },

    /**
     * Check if element has all required locator properties
     * @param {Element} element - Element to validate
     * @returns {boolean} True if element has all required properties
     */
    hasAllProperties(element) {
      return this.getSourcePath(element) &&
             this.getFilename(element) &&
             this.getSourceLine(element);
    }
  };

  // ============================================================================
  // CSS CUSTOM PROPERTIES INJECTION
  // ============================================================================

  /**
   * Inject CSS custom properties for locator styling
   */
  function injectLocatorCSSVariables() {
    // Check if styles are already injected
    if (document.getElementById('locator-css-variables')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'locator-css-variables';
    style.textContent = `
      :root {
        /* Locator Colors - Primary Theme (Blue) */
        --locator-primary-color: #007bff;
        --locator-primary-bg-light: rgba(0, 123, 255, 0.12);
        --locator-primary-bg-medium: rgba(0, 123, 255, 0.18);
        --locator-primary-shadow-light: rgba(0, 123, 255, 0.25);
        --locator-primary-shadow-medium: rgba(0, 123, 255, 0.35);



        /* Locator Colors - Neutral */
        --locator-white: white;
        --locator-white-semi: rgba(255, 255, 255, 0.6);
        --locator-white-medium: rgba(255, 255, 255, 0.7);
        --locator-white-strong: rgba(255, 255, 255, 0.85);
        --locator-white-border: rgba(255, 255, 255, 0.25);
        --locator-gray-light: #ccc;
        --locator-gray-medium: #888;
        --locator-black-overlay: rgba(0, 0, 0, 0.92);
        --locator-black-overlay-strong: rgba(20, 20, 20, 0.95);
        --locator-black-shadow-light: rgba(0, 0, 0, 0.1);
        --locator-black-shadow-medium: rgba(0, 0, 0, 0.15);
        --locator-black-shadow-strong: rgba(0, 0, 0, 0.2);
        --locator-black-shadow-heavy: rgba(0, 0, 0, 0.3);
        --locator-black-shadow-max: rgba(0, 0, 0, 0.4);
        --locator-black-shadow-ultra: rgba(0, 0, 0, 0.5);

        /* Locator Spacing */
        --locator-element-offset: 6px;
        --locator-tooltip-margin: 10px;
        --locator-tooltip-padding: 10px 14px;
        --locator-tooltip-padding-large: 12px 16px;
        --locator-tooltip-translate-offset: 4px;
        --locator-parent-tooltip-margin: 4px;
        --locator-parent-tooltip-margin-bottom: 8px;
        --locator-parent-tooltip-min-width: 200px;

        /* Locator Border Radius */
        --locator-border-radius: 6px;
        --locator-border-radius-large: 8px;

        /* Locator Z-Index */
        --locator-overlay-z-index: 9999;
        --locator-tooltip-z-index: 10000;
        --locator-parent-tooltip-z-index: 10001;

        /* Locator Typography */
        --locator-font-size: 12px;
        --locator-font-size-small: 11px;
        --locator-font-family: ui-monospace, 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
        --locator-line-height: 1.4;

        /* Locator Borders */
        --locator-border-width: 2px;
        --locator-border-width-thick: 3px;
        --locator-border-width-thin: 1px;

        /* Locator Effects */
        --locator-backdrop-blur: blur(8px);
        --locator-scale-hover: 1.02;
        --locator-scale-normal: 1;
        --locator-scale-entrance: 0.95;

        /* Locator Animations */
        --locator-transition-fast: 0.1s;
        --locator-transition-normal: 0.15s;
        --locator-transition-slow: 0.2s;
        --locator-transition-ultra-slow: 0.25s;
        --locator-easing-smooth: cubic-bezier(0.25, 0.46, 0.45, 0.94);
        --locator-easing-out: ease-out;

        /* Locator Box Shadows */
        --locator-shadow-overlay: 0 0 0 1px var(--locator-white-semi), 0 4px 16px var(--locator-primary-shadow-light), 0 2px 8px var(--locator-black-shadow-light);
        --locator-shadow-overlay-hover: 0 0 0 1px var(--locator-white-medium), 0 6px 20px var(--locator-primary-shadow-medium), 0 3px 12px var(--locator-black-shadow-medium);
        --locator-shadow-tooltip: 0 4px 20px var(--locator-black-shadow-max), 0 2px 8px var(--locator-black-shadow-strong);
        --locator-shadow-parent-tooltip: 0 8px 32px var(--locator-black-shadow-heavy);

        /* Locator Performance */
        --locator-throttle-delay: 50;
        --locator-debounce-delay: 100;

        /* Component Tree View - Simplified Clean Style */
        --tree-panel-width: 300px;
        --tree-panel-max-height: 70vh;
        --tree-panel-min-height: 200px;
        --tree-panel-bg: #ffffff;
        --tree-panel-border: 1px solid #e1e4e8;
        --tree-panel-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        --tree-panel-border-radius: 6px;
        --tree-panel-z-index: 10001;

        /* Simple Header Styling */
        --tree-header-height: 40px;
        --tree-header-bg: #f6f8fa;
        --tree-header-border-bottom: 1px solid #e1e4e8;
        --tree-header-padding: 0 16px;

        /* Simple Close Button */
        --tree-close-button-size: 24px;
        --tree-close-button-hover-bg: rgba(0, 0, 0, 0.06);
        --tree-close-button-border-radius: 3px;

        /* Simple Scrollbar */
        --tree-scrollbar-width: 6px;
        --tree-scrollbar-track-bg: #f6f8fa;
        --tree-scrollbar-thumb-bg: #d1d5da;
        --tree-scrollbar-thumb-hover-bg: #c6cbd1;
        --tree-scrollbar-border-radius: 3px;
      }
    `;

    document.head.appendChild(style);
  }

  // Inject CSS variables immediately when script loads
  injectLocatorCSSVariables();

  // ============================================================================
  // CONSTANTS AND CONFIGURATION
  // ============================================================================

  const PREFER_IDE_KEY = "locator_prefer_ide_protocol";
  const PREFER_IDE_PROTOCOL = window.localStorage.getItem(PREFER_IDE_KEY) || "idea";
  const PARENT_TOOLTIP_COUNT_KEY = "locator_parent_tooltip_count";
  const DEFAULT_PARENT_COUNT = 5;
  const MAX_PARENT_COUNT = 5;
  const EDITOR_PROTOCOL = {
    "idea": "idea://open?file=",
    "vscode": "vscode://file/",
    "cursor": "cursor://file/",
    "windsurf": "windsurf://file/",
  };

  // Performance constants
  const MOUSEMOVE_THROTTLE_DELAY = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--locator-throttle-delay')) || 50; // ms
  const DEBOUNCE_DELAY = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--locator-debounce-delay')) || 100; // ms for debouncing rapid state changes

  /**
   * State management class with observer pattern for reactive updates
   */
  class LocatorState {
    constructor() {
      // Core state
      this.altPressed = false;
      this.shiftPressed = false;
      this.currentTargetElement = null;
      this.lastTargetElement = null;
      this.currentMousePosition = { clientX: 0, clientY: 0 };

      // Tooltip state
      this.parentTooltipVisible = false;
      this.parentTooltipTimeout = null;
      this.parentTooltipToggled = false;

      // Keyboard navigation state
      this.keyboardNavigationActive = false;
      this.keyboardSelectedElement = null;

      // Observer pattern for state changes
      this.observers = new Set();
    }

    /**
     * Subscribe to state changes
     * @param {Function} callback - Function to call on state changes
     * @returns {Function} Unsubscribe function
     */
    subscribe(callback) {
      this.observers.add(callback);
      return () => this.observers.delete(callback);
    }

    /**
     * Notify all observers of state changes
     * @param {string} type - Type of change
     * @param {*} data - Change data
     */
    notify(type, data) {
      this.observers.forEach(callback => {
        try {
          callback(type, data);
        } catch (error) {
          console.error('Error in state observer:', error);
        }
      });
    }

    /**
     * Reset all state to initial values
     */
    reset() {
      this.altPressed = false;
      this.shiftPressed = false;
      this.currentTargetElement = null;
      this.lastTargetElement = null;
      this.currentMousePosition = { clientX: 0, clientY: 0 };
      this.parentTooltipVisible = false;
      this.parentTooltipToggled = false;
      this.keyboardNavigationActive = false;
      this.keyboardSelectedElement = null;

      if (this.parentTooltipTimeout) {
        clearTimeout(this.parentTooltipTimeout);
        this.parentTooltipTimeout = null;
      }

      this.resetCursor();
      this.notify('reset', {});
    }

    /**
     * Set keyboard navigation mode and update visual state
     */
    setKeyboardNavigationActive(active) {
      this.keyboardNavigationActive = active;

      if (!active) {
        this.keyboardSelectedElement = null;
      }


    }

    /**
     * Set the currently selected element for keyboard navigation
     */
    setKeyboardSelectedElement(element) {
      const previousElement = this.keyboardSelectedElement;
      this.keyboardSelectedElement = element;

      if (element) {
        this.keyboardNavigationActive = true;
      }

      if (previousElement !== element) {
        this.notify('keyboardSelectionChanged', { element, previousElement });
      }
    }

    /**
     * Update current mouse position
     */
    updateMousePosition(clientX, clientY) {
      this.currentMousePosition.clientX = clientX;
      this.currentMousePosition.clientY = clientY;
      this.notify('mousePositionChanged', { clientX, clientY });
    }

    /**
     * Set Alt key pressed state and update cursor
     */
    setAltPressed(pressed) {
      const wasPressed = this.altPressed;
      this.altPressed = pressed;
      document.body.style.cursor = pressed ? "crosshair" : "";

      if (wasPressed !== pressed) {
        this.notify('altKeyChanged', { pressed });
      }
    }

    /**
     * Set Shift key pressed state
     */
    setShiftPressed(pressed) {
      const wasPressed = this.shiftPressed;
      this.shiftPressed = pressed;

      if (wasPressed !== pressed) {
        this.notify('shiftKeyChanged', { pressed });
      }
    }

    /**
     * Reset cursor to default
     */
    resetCursor() {
      document.body.style.cursor = "";
    }

    /**
     * Set current target element
     */
    setCurrentTargetElement(element) {
      const previousElement = this.currentTargetElement;
      this.currentTargetElement = element;

      if (previousElement !== element) {
        this.notify('targetElementChanged', { element, previousElement });
      }
    }

    /**
     * Set parent tooltip visibility
     */
    setParentTooltipVisible(visible) {
      const wasVisible = this.parentTooltipVisible;
      this.parentTooltipVisible = visible;

      if (wasVisible !== visible) {
        this.notify('parentTooltipVisibilityChanged', { visible });
      }
    }
  }

  /**
   * Style management class for CSS custom properties and styling configurations
   */
  class StyleManager {
    constructor(componentType = 'default') {
      this.componentType = componentType;
      this.cache = new Map();
    }

    /**
     * Get CSS custom property value with caching
     * @param {string} propertyName - CSS custom property name (without --)
     * @returns {string} Property value
     */
    getCSSProperty(propertyName) {
      const fullName = `--locator-${propertyName}`;

      if (this.cache.has(fullName)) {
        return this.cache.get(fullName);
      }

      const value = getComputedStyle(document.documentElement).getPropertyValue(fullName);
      this.cache.set(fullName, value);
      return value;
    }

    /**
     * Get overlay styles for unified styling approach
     * @param {string} state - 'normal', 'hover', or 'active'
     * @returns {Object} Style object
     */
    getOverlayStyles(state = 'normal') {
      const baseStyles = {
        position: "fixed",
        pointerEvents: "auto",
        display: "block",
        boxSizing: "border-box",
        cursor: "pointer",
        willChange: "transform, box-shadow",
      };

      return {
        ...baseStyles,
        backgroundColor: (state === 'hover' || state === 'active')
          ? this.getCSSProperty('primary-bg-medium')
          : this.getCSSProperty('primary-bg-light'),
        border: `${this.getCSSProperty('border-width')} solid ${this.getCSSProperty('primary-color')}`,
        borderRadius: this.getCSSProperty('border-radius'),
        boxShadow: (state === 'hover' || state === 'active')
          ? this.getCSSProperty('shadow-overlay-hover')
          : this.getCSSProperty('shadow-overlay'),
        zIndex: this.getCSSProperty('overlay-z-index'),
        transition: `all ${this.getCSSProperty('transition-normal')} ${this.getCSSProperty('easing-smooth')}`,
        transform: (state === 'hover' || state === 'active')
          ? `scale(${this.getCSSProperty('scale-hover')})`
          : 'scale(var(--locator-scale-normal))',
      };
    }

    /**
     * Get tooltip styles for unified styling approach
     * @returns {Object} Style object
     */
    getTooltipStyles() {
      const baseStyles = {
        position: "fixed",
        pointerEvents: "none",
        color: this.getCSSProperty('white'),
        padding: this.getCSSProperty('tooltip-padding'),
        borderRadius: this.getCSSProperty('border-radius'),
        fontSize: this.getCSSProperty('font-size'),
        fontFamily: this.getCSSProperty('font-family'),
        whiteSpace: "nowrap",
        zIndex: this.getCSSProperty('tooltip-z-index'),
        display: "block",
        boxSizing: "border-box",
        transition: `all ${this.getCSSProperty('transition-slow')} ${this.getCSSProperty('easing-smooth')}`,
        backdropFilter: this.getCSSProperty('backdrop-blur'),
        lineHeight: this.getCSSProperty('line-height'),
        willChange: "transform, opacity",
        opacity: "1",
        transform: "translateY(0)",
      };

      return {
        ...baseStyles,
        backgroundColor: this.getCSSProperty('black-overlay'),
        border: `${this.getCSSProperty('border-width-thin')} solid ${this.getCSSProperty('white-border')}`,
        boxShadow: this.getCSSProperty('shadow-tooltip'),
      };
    }

    /**
     * Clear style cache (useful when CSS properties change)
     */
    clearCache() {
      this.cache.clear();
    }
  }

  /**
   * Overlay management class responsible for overlay creation, positioning, and visual effects
   */
  class OverlayManager {
    constructor(state) {
      this.state = state;
      this.styleManager = new StyleManager('overlay');
      this.element = null;
      this.isVisible = false;

      // Subscribe to state changes
      this.unsubscribe = this.state.subscribe((type, data) => {
        this.handleStateChange(type, data);
      });
    }

    /**
     * Handle state changes
     * @param {string} type - Change type
     * @param {*} data - Change data
     */
    handleStateChange(type, data) {
      switch (type) {
        case 'reset':
          this.hide();
          break;

        case 'targetElementChanged':
          if (data.element) {
            this.show(data.element);
          } else {
            this.hide();
          }
          break;
      }
    }

    /**
     * Create overlay element if it doesn't exist
     * @returns {HTMLDivElement} Overlay element
     */
    createElement() {
      if (this.element) {
        return this.element;
      }

      const div = document.createElement("div");
      div.id = "locator-overlay";

      // Apply base styles
      const baseStyles = this.styleManager.getOverlayStyles('normal');
      Object.assign(div.style, baseStyles);
      div.style.display = "none";

      // Add event listeners
      this.addEventListeners(div);

      document.body.appendChild(div);
      this.element = div;
      return div;
    }

    /**
     * Add event listeners to overlay element
     * @param {HTMLDivElement} element - Overlay element
     */
    addEventListeners(element) {
      element.addEventListener("mouseenter", () => {
        this.applyHoverState();
      });

      element.addEventListener("mouseleave", () => {
        this.removeHoverState();
      });

      element.addEventListener("click", (event) => {
        this.handleClick(event);
      });
    }

    /**
     * Show overlay for target element
     * @param {Element} targetElement - Element to highlight
     */
    show(targetElement) {
      if (!targetElement) {
        this.hide();
        return;
      }

      // Validate required properties
      if (!PropertyAccessor.hasAllProperties(targetElement)) {
        this.hide();
        return;
      }

      this.createElement();

      // Calculate and apply position
      const targetRect = targetElement.getBoundingClientRect();
      const position = this.calculatePosition(targetRect);
      this.applyPosition(position);

      // Apply base styling
      const styles = this.styleManager.getOverlayStyles('normal');
      Object.assign(this.element.style, styles);

      this.isVisible = true;
    }

    /**
     * Hide overlay with smooth animation
     */
    hide() {
      if (!this.element || !this.isVisible) {
        return;
      }

      const transitionDuration = this.styleManager.getCSSProperty('transition-normal') || '0.15s';
      this.element.style.transition = `opacity ${transitionDuration} ${this.styleManager.getCSSProperty('easing-out')}, transform ${transitionDuration} ${this.styleManager.getCSSProperty('easing-out')}`;
      this.element.style.opacity = "0";
      this.element.style.transform = `scale(${this.styleManager.getCSSProperty('scale-entrance')})`;

      const timeoutMs = parseFloat(transitionDuration) * 1000;
      setTimeout(() => {
        if (this.element) {
          this.element.style.display = "none";
          this.element.style.opacity = "1";
          this.element.style.transform = 'scale(var(--locator-scale-normal))';
          this.element.style.transition = `all ${this.styleManager.getCSSProperty('transition-normal')} ${this.styleManager.getCSSProperty('easing-smooth')}`;
        }
      }, timeoutMs);

      this.isVisible = false;
    }

    /**
     * Calculate overlay position with bounds checking
     * @param {DOMRect} targetRect - Target element bounds
     * @returns {Object} Position object
     */
    calculatePosition(targetRect) {
      const offset = parseInt(this.styleManager.getCSSProperty('element-offset')) || 6;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const left = targetRect.left - offset;
      const top = targetRect.top - offset;
      const width = targetRect.width + offset * 2;
      const height = targetRect.height + offset * 2;

      // Ensure overlay stays within viewport bounds
      const adjustedLeft = Math.max(0, Math.min(left, viewportWidth - width));
      const adjustedTop = Math.max(0, Math.min(top, viewportHeight - height));
      const adjustedWidth = Math.min(width, viewportWidth - adjustedLeft);
      const adjustedHeight = Math.min(height, viewportHeight - adjustedTop);

      return {
        left: adjustedLeft,
        top: adjustedTop,
        width: adjustedWidth,
        height: adjustedHeight,
      };
    }

    /**
     * Apply position to overlay element
     * @param {Object} position - Position object
     */
    applyPosition(position) {
      if (!this.element) return;

      Object.assign(this.element.style, {
        left: `${position.left}px`,
        top: `${position.top}px`,
        width: `${position.width}px`,
        height: `${position.height}px`,
        display: "block",
      });
    }

    /**
     * Apply hover/active state styling
     */
    applyHoverState() {
      if (!this.element) return;

      const styles = this.styleManager.getOverlayStyles('hover');
      Object.assign(this.element.style, {
        backgroundColor: styles.backgroundColor,
        boxShadow: styles.boxShadow,
        transform: styles.transform,
      });
    }

    /**
     * Remove hover/active state styling
     */
    removeHoverState() {
      if (!this.element) return;

      const styles = this.styleManager.getOverlayStyles('normal');
      Object.assign(this.element.style, {
        backgroundColor: styles.backgroundColor,
        boxShadow: styles.boxShadow,
        transform: styles.transform,
      });
    }

    /**
     * Apply active state (for keyboard navigation)
     */
    applyActiveState() {
      this.applyHoverState();
    }

    /**
     * Remove active state (for keyboard navigation)
     */
    removeActiveState() {
      this.removeHoverState();
    }

    /**
     * Handle overlay click events
     * @param {Event} event - Click event
     */
    handleClick(event) {
      event.preventDefault();
      event.stopPropagation();

      try {
        const targetElement = this.state.currentTargetElement;

        if (targetElement && PropertyAccessor.hasSourcePath(targetElement)) {
          const sourcePath = PropertyAccessor.getSourcePath(targetElement);
          const sourceLine = PropertyAccessor.getSourceLine(targetElement);

          openFileAtSourcePath(sourcePath, sourceLine);
          this.state.reset();
        } else {
          console.warn("No source path found for the clicked element");
        }
      } catch (error) {
        console.error("Error handling overlay click:", error);
      }
    }

    /**
     * Cleanup resources
     */
    destroy() {
      if (this.unsubscribe) {
        this.unsubscribe();
      }

      if (this.element) {
        this.element.remove();
        this.element = null;
      }

      this.isVisible = false;
    }
  }

  /**
   * Tooltip management class for main tooltip and parent tooltip functionality
   */
  class TooltipManager {
    constructor(state) {
      this.state = state;
      this.styleManager = new StyleManager('tooltip');
      this.mainTooltip = null;
      this.parentTooltip = null;
      this.isMainVisible = false;
      this.isParentVisible = false;

      // Subscribe to state changes
      this.unsubscribe = this.state.subscribe((type, data) => {
        this.handleStateChange(type, data);
      });
    }

    /**
     * Handle state changes
     * @param {string} type - Change type
     * @param {*} data - Change data
     */
    handleStateChange(type, data) {
      switch (type) {
        case 'reset':
          this.hideMain();
          this.hideParent();
          break;
        case 'targetElementChanged':
          if (data.element) {
            this.showMain(data.element);
          } else {
            this.hideMain();
            this.hideParent();
          }
          break;

        case 'parentTooltipVisibilityChanged':
          if (data.visible) {
            this.showParentForCurrentElement();
          } else {
            this.hideParent();
          }
          break;
      }
    }

    /**
     * Get clean component name derived from filename
     * @param {string} filename - Component filename
     * @returns {string} Clean component name
     */
    getComponentDisplayName(filename) {
      if (!filename) return 'Unknown';
      // Extract clean component name from filename only
      return filename.replace(/\.(scala|js|ts)$/, '');
    }

    /**
     * Create main tooltip element
     * @returns {HTMLDivElement} Tooltip element
     */
    createMainElement() {
      if (this.mainTooltip) {
        return this.mainTooltip;
      }

      const tooltip = document.createElement("div");
      tooltip.id = "locator-tooltip";

      // Apply base styles
      const styles = this.styleManager.getTooltipStyles();
      Object.assign(tooltip.style, styles);
      tooltip.style.display = "none";
      tooltip.style.opacity = "0";
      tooltip.style.transform = `translateY(${this.styleManager.getCSSProperty('tooltip-translate-offset')})`;

      document.body.appendChild(tooltip);
      this.mainTooltip = tooltip;
      return tooltip;
    }

    /**
     * Create parent tooltip element
     * @returns {HTMLDivElement} Parent tooltip element
     */
    createParentElement() {
      if (this.parentTooltip) {
        return this.parentTooltip;
      }

      const tooltip = document.createElement("div");
      tooltip.id = "locator-parent-tooltip";

      // Apply base styles
      Object.assign(tooltip.style, {
        position: "fixed",
        pointerEvents: "none",
        backgroundColor: this.styleManager.getCSSProperty('black-overlay'),
        color: this.styleManager.getCSSProperty('white'),
        padding: this.styleManager.getCSSProperty('tooltip-padding-large'),
        borderRadius: this.styleManager.getCSSProperty('border-radius'),
        fontSize: this.styleManager.getCSSProperty('font-size'),
        fontFamily: this.styleManager.getCSSProperty('font-family'),
        border: `${this.styleManager.getCSSProperty('border-width-thin')} solid ${this.styleManager.getCSSProperty('white-border')}`,
        boxShadow: this.styleManager.getCSSProperty('shadow-parent-tooltip'),
        whiteSpace: "nowrap",
        zIndex: this.styleManager.getCSSProperty('parent-tooltip-z-index'),
        display: "none",
        boxSizing: "border-box",
        transition: `all ${this.styleManager.getCSSProperty('transition-fast')} ${this.styleManager.getCSSProperty('easing-out')}`,
        minWidth: this.styleManager.getCSSProperty('parent-tooltip-min-width'),
      });

      document.body.appendChild(tooltip);
      this.parentTooltip = tooltip;
      return tooltip;
    }

    /**
     * Show main tooltip for target element
     * @param {Element} targetElement - Target element
     */
    showMain(targetElement) {
      if (!targetElement) {
        this.hideMain();
        return;
      }

      const scalafilename = PropertyAccessor.getFilename(targetElement);

      if (!scalafilename) {
        this.hideMain();
        return;
      }

      this.createMainElement();

      // Build tooltip content using clean component name only
      const componentName = this.getComponentDisplayName(scalafilename);

      // Update content and styles
      this.mainTooltip.textContent = componentName;
      const styles = this.styleManager.getTooltipStyles();
      Object.assign(this.mainTooltip.style, styles);

      // Position tooltip
      this.positionMainTooltip();

      // Show with animation
      this.animateMainIn();
      this.isMainVisible = true;
    }

    /**
     * Hide main tooltip
     */
    hideMain() {
      if (!this.mainTooltip || !this.isMainVisible) {
        return;
      }

      // Fade out animation
      this.mainTooltip.style.opacity = "0";
      this.mainTooltip.style.transform = `translateY(${this.styleManager.getCSSProperty('tooltip-translate-offset')})`;

      const transitionDuration = this.styleManager.getCSSProperty('transition-normal') || '0.15s';
      const timeoutMs = parseFloat(transitionDuration) * 1000;

      setTimeout(() => {
        if (this.mainTooltip) {
          this.mainTooltip.style.display = "none";
        }
      }, timeoutMs);

      this.isMainVisible = false;
    }



    /**
     * Position main tooltip relative to overlay
     */
    positionMainTooltip() {
      if (!this.mainTooltip || !this.state.currentTargetElement) return;

      // Make visible to measure dimensions
      this.mainTooltip.style.display = "block";
      const tooltipRect = this.mainTooltip.getBoundingClientRect();

      // Get target element position
      const targetRect = this.state.currentTargetElement.getBoundingClientRect();
      const offset = parseInt(this.styleManager.getCSSProperty('element-offset')) || 6;

      // Create overlay rect for positioning
      const overlayRect = {
        left: targetRect.left - offset,
        top: targetRect.top - offset,
        right: targetRect.right + offset,
        bottom: targetRect.bottom + offset,
        width: targetRect.width + offset * 2,
        height: targetRect.height + offset * 2,
      };

      // Calculate position
      const position = this.calculateTooltipPosition(overlayRect, tooltipRect.width, tooltipRect.height);

      // Apply position
      Object.assign(this.mainTooltip.style, {
        left: `${position.left}px`,
        top: `${position.top}px`,
      });
    }

    /**
     * Calculate optimal tooltip position
     * @param {Object} overlayRect - Overlay rectangle
     * @param {number} tooltipWidth - Tooltip width
     * @param {number} tooltipHeight - Tooltip height
     * @returns {Object} Position object
     */
    calculateTooltipPosition(overlayRect, tooltipWidth, tooltipHeight) {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const margin = parseInt(this.styleManager.getCSSProperty('tooltip-margin')) || 10;

      // Position strategies in order of preference
      const strategies = [
        // Bottom center
        {
          left: overlayRect.left + overlayRect.width / 2 - tooltipWidth / 2,
          top: overlayRect.bottom + margin,
        },
        // Top center
        {
          left: overlayRect.left + overlayRect.width / 2 - tooltipWidth / 2,
          top: overlayRect.top - tooltipHeight - margin,
        },
        // Right center
        {
          left: overlayRect.right + margin,
          top: overlayRect.top + overlayRect.height / 2 - tooltipHeight / 2,
        },
        // Left center
        {
          left: overlayRect.left - tooltipWidth - margin,
          top: overlayRect.top + overlayRect.height / 2 - tooltipHeight / 2,
        },
      ];

      // Find first strategy that fits
      for (const position of strategies) {
        if (this.isPositionWithinViewport(position, tooltipWidth, tooltipHeight, margin)) {
          return position;
        }
      }

      // Fallback position
      return {
        left: Math.max(margin, Math.min(
          overlayRect.left + overlayRect.width / 2 - tooltipWidth / 2,
          viewportWidth - tooltipWidth - margin
        )),
        top: Math.max(margin, Math.min(
          overlayRect.bottom + margin,
          viewportHeight - tooltipHeight - margin
        )),
      };
    }

    /**
     * Check if position fits within viewport
     * @param {Object} position - Position object
     * @param {number} width - Element width
     * @param {number} height - Element height
     * @param {number} margin - Margin from edges
     * @returns {boolean} True if fits
     */
    isPositionWithinViewport(position, width, height, margin) {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      return (
        position.left >= margin &&
        position.top >= margin &&
        position.left + width <= viewportWidth - margin &&
        position.top + height <= viewportHeight - margin
      );
    }

    /**
     * Animate main tooltip entrance
     */
    animateMainIn() {
      if (!this.mainTooltip) return;

      // Start with entrance state
      this.mainTooltip.style.opacity = "0";
      this.mainTooltip.style.transform = `translateY(${this.styleManager.getCSSProperty('tooltip-translate-offset')})`;

      // Animate to visible state
      requestAnimationFrame(() => {
        this.mainTooltip.style.opacity = "1";
        this.mainTooltip.style.transform = "translateY(0)";
      });
    }

    /**
     * Show parent tooltip for current element
     */
    showParentForCurrentElement() {
      if (!this.state.currentTargetElement || !this.isMainVisible) {
        return;
      }

      const parentCount = getParentTooltipCount();
      if (parentCount === 0) return;

      const parents = findParentComponents(this.state.currentTargetElement, parentCount);
      if (parents.length === 0) return;

      this.createParentElement();

      // Create content
      const content = this.createParentTooltipContent(parents);
      this.parentTooltip.innerHTML = content;

      // Position relative to main tooltip
      this.positionParentTooltip();

      // Show
      this.parentTooltip.style.display = "block";
      this.isParentVisible = true;
    }

    /**
     * Hide parent tooltip
     */
    hideParent() {
      if (this.parentTooltip) {
        this.parentTooltip.style.display = "none";
      }
      this.isParentVisible = false;
    }

    /**
     * Create parent tooltip content
     * @param {Array} parents - Parent component information
     * @returns {string} HTML content
     */
    createParentTooltipContent(parents) {
      const items = parents.map((parent, index) => {
        const indent = "  ".repeat(parent.level - 1);
        const connector = index === 0 ? "└─ " : "├─ ";
        const componentName = this.getComponentDisplayName(parent.filename);
        return `<div style="margin: ${this.styleManager.getCSSProperty('parent-tooltip-margin')} 0; font-family: ${this.styleManager.getCSSProperty('font-family')};">
          <span style="color: ${this.styleManager.getCSSProperty('gray-medium')};">${indent}${connector}</span>
          <span style="color: ${this.styleManager.getCSSProperty('white')};">${componentName}</span>
        </div>`;
      });

      return `
        <div style="color: ${this.styleManager.getCSSProperty('gray-light')}; font-size: ${this.styleManager.getCSSProperty('font-size-small')}; margin-bottom: ${this.styleManager.getCSSProperty('parent-tooltip-margin-bottom')};">Parent Components:</div>
        ${items.join("")}
      `;
    }

    /**
     * Position parent tooltip relative to main tooltip
     */
    positionParentTooltip() {
      if (!this.parentTooltip || !this.mainTooltip) return;

      const mainRect = this.mainTooltip.getBoundingClientRect();
      const parentRect = this.parentTooltip.getBoundingClientRect();

      const position = this.calculateParentTooltipPosition(mainRect, parentRect.width, parentRect.height);

      Object.assign(this.parentTooltip.style, {
        left: `${position.left}px`,
        top: `${position.top}px`,
      });
    }

    /**
     * Calculate parent tooltip position
     * @param {DOMRect} mainRect - Main tooltip bounds
     * @param {number} parentWidth - Parent tooltip width
     * @param {number} parentHeight - Parent tooltip height
     * @returns {Object} Position object
     */
    calculateParentTooltipPosition(mainRect, parentWidth, parentHeight) {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const margin = parseInt(this.styleManager.getCSSProperty('tooltip-margin')) || 8;

      // Position strategies
      const positions = [
        // Right of main tooltip
        { left: mainRect.right + margin, top: mainRect.top },
        // Left of main tooltip
        { left: mainRect.left - parentWidth - margin, top: mainRect.top },
        // Below main tooltip
        { left: mainRect.left, top: mainRect.bottom + margin },
        // Above main tooltip
        { left: mainRect.left, top: mainRect.top - parentHeight - margin },
      ];

      // Find first position that fits
      for (const pos of positions) {
        if (pos.left >= 0 && pos.top >= 0 &&
            pos.left + parentWidth <= viewportWidth &&
            pos.top + parentHeight <= viewportHeight) {
          return pos;
        }
      }

      // Fallback
      return {
        left: Math.max(0, Math.min(mainRect.right + margin, viewportWidth - parentWidth)),
        top: Math.max(0, Math.min(mainRect.top, viewportHeight - parentHeight)),
      };
    }

    /**
     * Cleanup resources
     */
    destroy() {
      if (this.unsubscribe) {
        this.unsubscribe();
      }

      if (this.mainTooltip) {
        this.mainTooltip.remove();
        this.mainTooltip = null;
      }

      if (this.parentTooltip) {
        this.parentTooltip.remove();
        this.parentTooltip = null;
      }

      this.isMainVisible = false;
      this.isParentVisible = false;
    }
  }

  /**
   * Keyboard navigation class for component tree traversal and navigation logic
   */
  class KeyboardNavigator {
    constructor(state, overlayManager) {
      this.state = state;
      this.overlayManager = overlayManager;

      // Subscribe to state changes
      this.unsubscribe = this.state.subscribe((type, data) => {
        this.handleStateChange(type, data);
      });
    }

    /**
     * Handle state changes
     * @param {string} type - Change type
     * @param {*} data - Change data
     */
    handleStateChange(type, data) {
      switch (type) {
        case 'reset':
          // Navigation state is already reset in LocatorState
          break;
        case 'keyboardSelectionChanged':
          if (data.element) {
            this.updateSelection(data.element);
          }
          break;
      }
    }

    /**
     * Handle keyboard navigation in a specific direction
     * @param {string} direction - 'up', 'down', 'left', 'right'
     */
    navigate(direction) {
      let targetElement = null;
      const currentElement = this.state.keyboardSelectedElement || this.state.currentTargetElement;

      if (!currentElement) {
        // No current element, start with first top-level component
        const topLevel = this.findTopLevelComponents();
        if (topLevel.length > 0) {
          targetElement = topLevel[0];
        } else {
          return;
        }
      } else {
        switch (direction) {
          case 'up':
            targetElement = this.navigateToParent(currentElement);
            break;
          case 'down':
            targetElement = this.navigateToFirstChild(currentElement);
            break;
          case 'left':
            targetElement = this.navigateToPreviousSibling(currentElement);
            break;
          case 'right':
            targetElement = this.navigateToNextSibling(currentElement);
            break;
        }
      }

      if (targetElement) {
        this.state.setKeyboardSelectedElement(targetElement);
        this.state.setCurrentTargetElement(targetElement);

        // Apply visual feedback
        this.applyActiveState();

        // Remove active state after brief feedback
        setTimeout(() => {
          this.removeActiveState();
        }, 200);
      }
    }

    /**
     * Handle Enter key to open selected component file
     */
    openSelectedFile() {
      const targetElement = this.state.keyboardSelectedElement || this.state.currentTargetElement;

      if (!targetElement) {
        return;
      }

      const scalasourcepath = PropertyAccessor.getSourcePath(targetElement);
      const scalasourceline = PropertyAccessor.getSourceLine(targetElement);

      if (!scalasourcepath) {
        return;
      }

      try {
        openFileAtSourcePath(scalasourcepath, scalasourceline);
        this.state.reset();
      } catch (error) {
        console.error("Error opening file from keyboard navigation:", error);
      }
    }

    /**
     * Update selection and overlay position
     * @param {Element} element - Selected element
     */
    updateSelection(element) {
      this.state.setCurrentTargetElement(element);
    }

    /**
     * Apply active state visual feedback
     */
    applyActiveState() {
      if (this.overlayManager) {
        this.overlayManager.applyActiveState();
      }
    }

    /**
     * Remove active state visual feedback
     */
    removeActiveState() {
      if (this.overlayManager) {
        this.overlayManager.removeActiveState();
      }
    }

    /**
     * Navigate to parent component (with cycling)
     * @param {Element} currentElement - Current element
     * @returns {Element|null} Parent component or deepest if at root
     */
    navigateToParent(currentElement) {
      if (!currentElement) return null;

      const parent = this.findParentComponent(currentElement);
      if (parent) {
        return parent;
      } else {
        // At root level, cycle to the deepest component
        return this.findDeepestComponent();
      }
    }

    /**
     * Navigate to first child component (with cycling)
     * @param {Element} currentElement - Current element
     * @returns {Element|null} First child or first component if no children
     */
    navigateToFirstChild(currentElement) {
      if (!currentElement) return null;

      const children = this.findChildComponents(currentElement);
      if (children.length > 0) {
        return children[0];
      } else {
        // No children, cycle to first component
        return this.findFirstComponent();
      }
    }

    /**
     * Navigate to next sibling (with cycling)
     * @param {Element} currentElement - Current element
     * @returns {Element|null} Next sibling
     */
    navigateToNextSibling(currentElement) {
      if (!currentElement) return null;
      const allSiblings = this.getAllSiblingsIncludingCurrent(currentElement);
      return this.getNextSibling(currentElement, allSiblings);
    }

    /**
     * Navigate to previous sibling (with cycling)
     * @param {Element} currentElement - Current element
     * @returns {Element|null} Previous sibling
     */
    navigateToPreviousSibling(currentElement) {
      if (!currentElement) return null;
      const allSiblings = this.getAllSiblingsIncludingCurrent(currentElement);
      return this.getPreviousSibling(currentElement, allSiblings);
    }

    /**
     * Find immediate parent component
     * @param {Element} currentElement - Current element
     * @returns {Element|null} Parent component
     */
    findParentComponent(currentElement) {
      let element = currentElement.parentElement;

      while (element && element !== document.body) {
        if (PropertyAccessor.hasSourcePath(element)) {
          return element;
        }
        element = element.parentElement;
      }

      return null;
    }

    /**
     * Find direct child components
     * @param {Element} currentElement - Current element
     * @returns {Array} Child components
     */
    findChildComponents(currentElement) {
      const children = [];
      const walker = document.createTreeWalker(
        currentElement,
        NodeFilter.SHOW_ELEMENT,
        {
          acceptNode: function(node) {
            if (node === currentElement) {
              return NodeFilter.FILTER_SKIP;
            }

            if (PropertyAccessor.hasSourcePath(node)) {
              return NodeFilter.FILTER_ACCEPT;
            }

            return NodeFilter.FILTER_SKIP;
          }
        }
      );

      let node;
      while (node = walker.nextNode()) {
        // Only include direct children
        let ancestor = node.parentElement;
        let isDirectChild = true;

        while (ancestor && ancestor !== currentElement) {
          if (PropertyAccessor.hasSourcePath(ancestor)) {
            isDirectChild = false;
            break;
          }
          ancestor = ancestor.parentElement;
        }

        if (isDirectChild) {
          children.push(node);
        }
      }

      return children;
    }

    /**
     * Find all sibling components including current
     * @param {Element} currentElement - Current element
     * @returns {Array} All siblings including current
     */
    getAllSiblingsIncludingCurrent(currentElement) {
      const parent = this.findParentComponent(currentElement);
      if (!parent) {
        return this.findTopLevelComponents();
      }

      return this.findChildComponents(parent);
    }

    /**
     * Find all top-level components
     * @returns {Array} Top-level components
     */
    findTopLevelComponents() {
      const topLevel = [];
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_ELEMENT,
        {
          acceptNode: function(node) {
            if (PropertyAccessor.hasSourcePath(node)) {
              // Check if has parent with source path
              let parent = node.parentElement;
              while (parent && parent !== document.body) {
                if (PropertyAccessor.hasSourcePath(parent)) {
                  return NodeFilter.FILTER_REJECT;
                }
                parent = parent.parentElement;
              }
              return NodeFilter.FILTER_ACCEPT;
            }
            return NodeFilter.FILTER_SKIP;
          }
        }
      );

      let node;
      while (node = walker.nextNode()) {
        topLevel.push(node);
      }

      return topLevel;
    }

    /**
     * Get all components in depth-first order
     * @returns {Array} All components
     */
    getAllComponentsInOrder() {
      const components = [];

      const traverseDepthFirst = (element) => {
        if (PropertyAccessor.hasSourcePath(element)) {
          components.push(element);
        }

        const children = this.findChildComponents(element);
        for (const child of children) {
          traverseDepthFirst(child);
        }
      };

      const topLevel = this.findTopLevelComponents();
      for (const component of topLevel) {
        traverseDepthFirst(component);
      }

      return components;
    }

    /**
     * Find deepest component in tree
     * @returns {Element|null} Deepest component
     */
    findDeepestComponent() {
      const allComponents = this.getAllComponentsInOrder();
      return allComponents.length > 0 ? allComponents[allComponents.length - 1] : null;
    }

    /**
     * Find first component in tree
     * @returns {Element|null} First component
     */
    findFirstComponent() {
      const allComponents = this.getAllComponentsInOrder();
      return allComponents.length > 0 ? allComponents[0] : null;
    }

    /**
     * Get next sibling with cycling
     * @param {Element} currentElement - Current element
     * @param {Array} siblings - Sibling elements
     * @returns {Element|null} Next sibling
     */
    getNextSibling(currentElement, siblings) {
      if (siblings.length === 0) return null;

      const currentIndex = siblings.indexOf(currentElement);
      if (currentIndex === -1) return siblings[0];

      return siblings[(currentIndex + 1) % siblings.length];
    }

    /**
     * Get previous sibling with cycling
     * @param {Element} currentElement - Current element
     * @param {Array} siblings - Sibling elements
     * @returns {Element|null} Previous sibling
     */
    getPreviousSibling(currentElement, siblings) {
      if (siblings.length === 0) return null;

      const currentIndex = siblings.indexOf(currentElement);
      if (currentIndex === -1) return siblings[siblings.length - 1];

      return siblings[(currentIndex - 1 + siblings.length) % siblings.length];
    }

    /**
     * Cleanup resources
     */
    destroy() {
      if (this.unsubscribe) {
        this.unsubscribe();
      }
    }
  }

  /**
   * Event management class for centralized event listener management and cleanup
   */
  class EventManager {
    constructor(locatorSystem) {
      this.locatorSystem = locatorSystem;
      this.listeners = new Map();
      this.throttledHandlers = new Map();
      this.debouncedHandlers = new Map();

      this.initializeEventListeners();
    }

    /**
     * Initialize all event listeners with performance optimizations
     */
    initializeEventListeners() {
      // Keyboard event listeners
      this.addListener(window, "keydown", this.handleKeyDown.bind(this));
      this.addListener(window, "keyup", this.handleKeyUp.bind(this));

      // Window focus management
      this.addListener(window, "blur", this.handleWindowBlur.bind(this));

      // Mouse movement with optimized throttling
      const optimizedMouseMove = this.createThrottledHandler(
        this.handleMouseMove.bind(this),
        MOUSEMOVE_THROTTLE_DELAY
      );
      this.addListener(window, "mousemove", optimizedMouseMove);

      // Scroll handling
      this.addListener(window, "scroll", () => {
        if (this.locatorSystem.state.altPressed) {
          this.locatorSystem.overlay.hide();
        }
      }, { passive: true });

      // Resize handling
      const debouncedResize = this.createDebouncedHandler(() => {
        if (this.locatorSystem.state.currentTargetElement && this.locatorSystem.state.altPressed) {
          this.locatorSystem.state.setCurrentTargetElement(this.locatorSystem.state.currentTargetElement);
        }
      }, DEBOUNCE_DELAY);
      this.addListener(window, "resize", debouncedResize, { passive: true });
    }

    /**
     * Add event listener with cleanup tracking
     * @param {EventTarget} target - Event target
     * @param {string} type - Event type
     * @param {Function} handler - Event handler
     * @param {Object} options - Event options
     */
    addListener(target, type, handler, options = {}) {
      target.addEventListener(type, handler, options);

      const key = `${target.constructor.name}-${type}`;
      if (!this.listeners.has(key)) {
        this.listeners.set(key, []);
      }
      this.listeners.get(key).push({ target, type, handler, options });
    }

    /**
     * Create throttled handler with caching
     * @param {Function} handler - Original handler
     * @param {number} delay - Throttle delay
     * @returns {Function} Throttled handler
     */
    createThrottledHandler(handler, delay) {
      const key = `${handler.name}-${delay}`;
      if (this.throttledHandlers.has(key)) {
        return this.throttledHandlers.get(key);
      }

      const throttledHandler = throttle(handler, delay);
      this.throttledHandlers.set(key, throttledHandler);
      return throttledHandler;
    }

    /**
     * Create debounced handler with caching
     * @param {Function} handler - Original handler
     * @param {number} delay - Debounce delay
     * @returns {Function} Debounced handler
     */
    createDebouncedHandler(handler, delay) {
      const key = `${handler.name}-${delay}`;
      if (this.debouncedHandlers.has(key)) {
        return this.debouncedHandlers.get(key);
      }

      const debouncedHandler = debounce(handler, delay);
      this.debouncedHandlers.set(key, debouncedHandler);
      return debouncedHandler;
    }

    /**
     * Handle keydown events
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyDown(event) {
      // Handle Alt + Arrow key combinations for keyboard navigation
      if (event.altKey && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
        switch (event.key) {
          case "ArrowUp":
            event.preventDefault();
            this.locatorSystem.keyboard.navigate('up');
            return;
          case "ArrowDown":
            event.preventDefault();
            this.locatorSystem.keyboard.navigate('down');
            return;
          case "ArrowLeft":
            event.preventDefault();
            this.locatorSystem.keyboard.navigate('left');
            return;
          case "ArrowRight":
            event.preventDefault();
            this.locatorSystem.keyboard.navigate('right');
            return;
        }
      }

      // Handle Enter key for opening selected component
      if (event.key === "Enter" && this.locatorSystem.state.altPressed &&
          this.locatorSystem.state.keyboardNavigationActive) {
        event.preventDefault();
        this.locatorSystem.keyboard.openSelectedFile();
        return;
      }

      if (event.key === "Alt" && !this.locatorSystem.state.altPressed) {
        // Alt key pressed - trigger overlay at current mouse position
        this.locatorSystem.state.setAltPressed(true);

        // Create synthetic mouse event with current position
        const syntheticMouseEvent = {
          clientX: this.locatorSystem.state.currentMousePosition.clientX,
          clientY: this.locatorSystem.state.currentMousePosition.clientY
        };



        // Immediately render overlay
        this.renderLocatorOverlay(syntheticMouseEvent);

        // Force overlay to show even if target element hasn't changed
        const targetElement = this.getTargetElementAtPosition(syntheticMouseEvent);
        if (targetElement) {
          this.locatorSystem.overlay.show(targetElement);
        }

        // Check for auto-show parent tooltip
        setTimeout(() => {
          this.checkAutoShowParentTooltip();
        }, 25);
      } else if (event.key === "Shift" && !this.locatorSystem.state.shiftPressed) {
        // Shift key pressed
        this.locatorSystem.state.setShiftPressed(true);

        if (this.locatorSystem.state.altPressed) {
          // Both Alt and Shift held - handle parent tooltip
          if (this.locatorSystem.state.currentTargetElement &&
              this.locatorSystem.tooltip.isMainVisible) {
            if (this.locatorSystem.state.parentTooltipVisible) {
              this.toggleParentTooltip();
            } else {
              setTimeout(() => {
                this.checkAutoShowParentTooltip();
              }, 25);
            }
          }
        }
      }
    }

    /**
     * Handle keyup events
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyUp(event) {
      if (event.key === "Alt") {
        this.locatorSystem.state.setAltPressed(false);
        this.locatorSystem.state.setKeyboardNavigationActive(false);
        this.locatorSystem.overlay.hide();
        this.locatorSystem.tooltip.hideParent();
        this.locatorSystem.state.parentTooltipToggled = false;
      } else if (event.key === "Shift") {
        this.locatorSystem.state.setShiftPressed(false);
        this.checkAutoHideParentTooltip();
      }
    }

    /**
     * Handle window blur events
     */
    handleWindowBlur() {
      this.locatorSystem.state.reset();
    }

    /**
     * Handle mouse move events
     * @param {MouseEvent} event - Mouse event
     */
    handleMouseMove(event) {
      // Always update mouse position
      this.locatorSystem.state.updateMousePosition(event.clientX, event.clientY);

      if (this.locatorSystem.state.altPressed) {
        // Switch to mouse mode if in keyboard mode
        if (this.locatorSystem.state.keyboardNavigationActive) {
          this.locatorSystem.state.setKeyboardNavigationActive(false);
        }

        // Use RAF throttling for smooth updates
        rafThrottle(() => {
          this.renderLocatorOverlay(event);

          // Force re-render if switching from keyboard mode
          if (wasKeyboardMode && this.locatorSystem.state.currentTargetElement) {
            this.locatorSystem.state.setCurrentTargetElement(this.locatorSystem.state.currentTargetElement);
          }
        })();

        // Debounce parent tooltip check
        this.createDebouncedHandler(() => {
          this.checkAutoShowParentTooltip();
        }, DEBOUNCE_DELAY)();
      } else {
        this.locatorSystem.overlay.hide();
        this.locatorSystem.tooltip.hideParent();
      }
    }

    /**
     * Render locator overlay based on mouse position
     * @param {MouseEvent|null} mouseEvent - Mouse event
     */
    renderLocatorOverlay(mouseEvent) {
      if (!mouseEvent) {
        this.locatorSystem.overlay.hide();
        return;
      }

      const targetElement = this.getTargetElementAtPosition(mouseEvent);
      this.locatorSystem.state.setCurrentTargetElement(targetElement);
    }

    /**
     * Get target element at mouse position
     * @param {MouseEvent} mouseEvent - Mouse event
     * @returns {Element|null} Target element
     */
    getTargetElementAtPosition(mouseEvent) {
      const elementsAtPoint = document.elementsFromPoint(
        mouseEvent.clientX,
        mouseEvent.clientY
      );

      for (const element of elementsAtPoint) {
        const locatorElement = findLocatorElement(element);
        if (locatorElement) {
          return locatorElement;
        }
      }

      return null;
    }

    /**
     * Check if parent tooltip should be auto-shown
     */
    checkAutoShowParentTooltip() {
      if (!this.locatorSystem.state.altPressed || !this.locatorSystem.state.shiftPressed) return;
      if (!this.locatorSystem.state.currentTargetElement) return;
      if (!this.locatorSystem.tooltip.isMainVisible) return;

      const parentCount = getParentTooltipCount();
      if (parentCount === 0) return;

      const parents = findParentComponents(this.locatorSystem.state.currentTargetElement, parentCount);
      if (parents.length > 0) {
        this.locatorSystem.state.setParentTooltipVisible(true);
      }
    }

    /**
     * Check if parent tooltip should be auto-hidden
     */
    checkAutoHideParentTooltip() {
      if (this.locatorSystem.state.parentTooltipToggled) return;

      if ((!this.locatorSystem.state.altPressed || !this.locatorSystem.state.shiftPressed) &&
          this.locatorSystem.state.parentTooltipVisible) {
        this.locatorSystem.state.setParentTooltipVisible(false);
      }
    }

    /**
     * Toggle parent tooltip visibility
     */
    toggleParentTooltip() {
      if (!this.locatorSystem.state.altPressed || !this.locatorSystem.state.currentTargetElement) return;
      if (!this.locatorSystem.tooltip.isMainVisible) return;

      const parentCount = getParentTooltipCount();
      if (parentCount === 0) return;

      if (this.locatorSystem.state.parentTooltipVisible) {
        this.locatorSystem.state.setParentTooltipVisible(false);
        this.locatorSystem.state.parentTooltipToggled = false;
      } else {
        const parents = findParentComponents(this.locatorSystem.state.currentTargetElement, parentCount);
        if (parents.length > 0) {
          this.locatorSystem.state.setParentTooltipVisible(true);
          this.locatorSystem.state.parentTooltipToggled = true;
        }
      }
    }

    /**
     * Cleanup all event listeners
     */
    destroy() {
      this.listeners.forEach((listenerList) => {
        listenerList.forEach(({ target, type, handler, options }) => {
          target.removeEventListener(type, handler, options);
        });
      });

      this.listeners.clear();
      this.throttledHandlers.clear();
      this.debouncedHandlers.clear();
    }
  }

  /**
   * Component Tree View class for displaying hierarchical component structure
   *
   * Features:
   * - Keyboard shortcut activation: Alt + Shift + Cmd
   * - Hierarchical tree display of UIComponent elements
   * - Keyboard navigation (arrow keys, Enter, Escape)
   * - Mouse hover integration with existing overlay system
   * - Collapsible/expandable tree nodes
   * - Context menu with additional actions
   * - Responsive design for different screen sizes
   * - Performance optimizations (lazy loading, caching, throttling)
   * - Real-time updates when components change
   *
   * Integration:
   * - Uses existing UIComponent system and @uicomponent annotations
   * - Leverages LocatorSystem for component discovery and overlay functionality
   * - Maintains consistency with existing keyboard navigation patterns
   * - Follows established CSS custom property conventions
   *
   * Usage:
   * - Press Alt + Shift + Cmd to open/close the tree view
   * - Use arrow keys to navigate within the tree
   * - Press Enter to open component files
   * - Right-click for context menu options
   * - Hover over tree items to highlight corresponding page components
   */
  class ComponentTreeView {
    constructor(locatorSystem) {
      this.locatorSystem = locatorSystem;
      this.isVisible = false;
      this.treeData = null;
      this.expandedNodes = new Set();
      this.selectedNodeId = null;
      this.panelElement = null;
      this.treeContainer = null;

      // Performance optimization properties
      this.nodeCache = new Map();
      this.renderCache = new Map();
      this.lastComponentsHash = null;
      this.throttledRefresh = null;
      this.animationFrameId = null;
      this.intersectionObserver = null;

      // Bind methods
      this.handleKeyDown = this.handleKeyDown.bind(this);
      this.handleTreeKeyDown = this.handleTreeKeyDown.bind(this);
      this.handleTreeItemHover = this.handleTreeItemHover.bind(this);
      this.handleTreeItemClick = this.handleTreeItemClick.bind(this);
      this.close = this.close.bind(this);

      // Initialize performance optimizations
      this.initializePerformanceOptimizations();

      // Initialize keyboard shortcut listener
      this.initializeKeyboardShortcut();

      // Initialize window resize handler
      this.handleWindowResize = this.handleWindowResize.bind(this);
      window.addEventListener('resize', this.handleWindowResize);
    }

    /**
     * Initialize performance optimizations
     */
    initializePerformanceOptimizations() {
      // Create throttled refresh function
      this.throttledRefresh = this.throttle(() => {
        this.refreshTreeIfNeeded();
      }, 250);

      // Set up intersection observer for lazy loading
      if ('IntersectionObserver' in window) {
        this.intersectionObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                this.loadNodeContent(entry.target);
              }
            });
          },
          { threshold: 0.1 }
        );
      }

      // Listen for DOM mutations to detect component changes
      if ('MutationObserver' in window) {
        this.mutationObserver = new MutationObserver(() => {
          this.throttledRefresh();
        });
      }
    }

    /**
     * Initialize keyboard shortcut listener for Alt+Shift+Cmd
     */
    initializeKeyboardShortcut() {
      document.addEventListener('keydown', this.handleKeyDown);
    }

    /**
     * Throttle function execution
     * @param {Function} func - Function to throttle
     * @param {number} delay - Delay in milliseconds
     * @returns {Function} Throttled function
     */
    throttle(func, delay) {
      let timeoutId;
      let lastExecTime = 0;

      return function (...args) {
        const currentTime = Date.now();

        if (currentTime - lastExecTime > delay) {
          func.apply(this, args);
          lastExecTime = currentTime;
        } else {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            func.apply(this, args);
            lastExecTime = Date.now();
          }, delay - (currentTime - lastExecTime));
        }
      };
    }

    /**
     * Generate hash for components to detect changes
     * @param {Array} components - Component array
     * @returns {string} Hash string
     */
    generateComponentsHash(components) {
      return components
        .map(comp => `${comp.filename}:${comp.line}:${comp.path}`)
        .join('|');
    }

    /**
     * Check if tree needs refresh and refresh if needed
     */
    refreshTreeIfNeeded() {
      if (!this.isVisible) return;

      const components = this.locatorSystem.getAllComponents();
      const currentHash = this.generateComponentsHash(components);

      if (currentHash !== this.lastComponentsHash) {
        this.lastComponentsHash = currentHash;
        this.refreshTree();
      }
    }

    /**
     * Load content for a tree node (lazy loading)
     * @param {Element} nodeElement - Node element to load
     */
    loadNodeContent(nodeElement) {
      const nodeId = nodeElement.dataset.nodeId;
      if (!nodeId || this.renderCache.has(nodeId)) return;

      const node = this.findNodeById(nodeId);
      if (!node) return;

      // Mark as loaded
      this.renderCache.set(nodeId, true);

      // Load additional metadata if needed
      this.loadNodeMetadata(node, nodeElement);
    }

    /**
     * Load additional metadata for a node
     * @param {Object} node - Tree node
     * @param {Element} nodeElement - Node DOM element
     */
    loadNodeMetadata(node, nodeElement) {
      // This could load additional information like component props,
      // file size, last modified date, etc.
      // For now, we'll just ensure the element is properly initialized

      if (!nodeElement.dataset.loaded) {
        nodeElement.dataset.loaded = 'true';

        // Add any additional lazy-loaded content here
        // For example, component statistics, dependencies, etc.
      }
    }

    /**
     * Handle keyboard shortcut for opening tree view
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyDown(event) {
      // Alt + Shift + Cmd (Meta) combination
      if (event.altKey && event.shiftKey && event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        this.toggle();
      }
    }

    /**
     * Toggle tree view visibility
     */
    toggle() {
      if (this.isVisible) {
        this.hide();
      } else {
        this.show();
      }
    }

    /**
     * Show the component tree view
     */
    show() {
      if (this.isVisible) return;

      try {
        this.buildTreeData();
        this.initializeTreeState();
        this.createPanel();
        this.renderTree();
        this.positionPanel();

        // Add React DevTools-style entrance animation
        this.animateEntrance();

        this.isVisible = true;

        // Start monitoring for changes
        this.startChangeMonitoring();

        // Handle edge cases
        this.handleEdgeCases();

        // Focus the tree for keyboard navigation with slight delay
        setTimeout(() => {
          if (this.treeContainer) {
            this.treeContainer.focus();
          }
        }, 200);
      } catch (error) {
        console.error('Error showing component tree view:', error);
        this.hide();
      }
    }

    /**
     * Start monitoring for component changes
     */
    startChangeMonitoring() {
      if (this.mutationObserver) {
        this.mutationObserver.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['data-source-path', LOCATOR_PROPERTIES.SCALA_SOURCE_PATH]
        });
      }
    }

    /**
     * Stop monitoring for component changes
     */
    stopChangeMonitoring() {
      if (this.mutationObserver) {
        this.mutationObserver.disconnect();
      }
    }

    /**
     * Hide the component tree view with React DevTools-style exit animation
     */
    hide() {
      if (!this.isVisible) return;

      // Stop monitoring changes
      this.stopChangeMonitoring();

      // Cancel any pending animations
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }

      // Animate exit
      this.animateExit(() => {
        if (this.panelElement) {
          this.panelElement.remove();
          this.panelElement = null;
          this.treeContainer = null;
        }

        this.isVisible = false;
        this.selectedNodeId = null;

        // Clear caches
        this.renderCache.clear();
      });
    }

    /**
     * Close the tree view (same as hide but can be called from UI)
     */
    close() {
      this.hide();
    }

    /**
     * Build hierarchical tree data from components
     */
    buildTreeData() {
      const components = this.locatorSystem.getAllComponents();
      const currentHash = this.generateComponentsHash(components);

      // Use cached data if available and unchanged
      if (this.lastComponentsHash === currentHash && this.treeData) {
        return;
      }

      this.lastComponentsHash = currentHash;
      this.treeData = this.buildHierarchy(components);

      // Clear render cache when tree data changes
      this.renderCache.clear();
    }

    /**
     * Build component hierarchy from flat component list
     * @param {Array} components - Flat list of components
     * @returns {Array} Hierarchical tree structure
     */
    buildHierarchy(components) {
      const nodeMap = new Map();
      const rootNodes = [];

      // Create tree nodes for each component
      components.forEach((comp, index) => {
        const node = {
          id: `node-${index}`,
          element: comp.element,
          filename: comp.filename,
          line: comp.line,
          path: comp.path,
          children: [],
          parent: null,
          expanded: false,
          level: 0
        };
        nodeMap.set(comp.element, node);
      });

      // Build parent-child relationships
      components.forEach(comp => {
        const node = nodeMap.get(comp.element);
        const parentElement = this.findParentComponent(comp.element);

        if (parentElement && nodeMap.has(parentElement)) {
          const parentNode = nodeMap.get(parentElement);
          node.parent = parentNode;
          node.level = parentNode.level + 1;
          parentNode.children.push(node);
        } else {
          // This is a root node
          rootNodes.push(node);
        }
      });

      // Sort children by DOM order for consistent display
      this.sortNodesByDOMOrder(rootNodes);

      return rootNodes;
    }

    /**
     * Find parent component element using existing keyboard navigator logic
     * @param {Element} element - Child element
     * @returns {Element|null} Parent component element
     */
    findParentComponent(element) {
      return this.locatorSystem.keyboard.findParentComponent(element);
    }

    /**
     * Sort tree nodes by their DOM order recursively
     * @param {Array} nodes - Array of tree nodes to sort
     */
    sortNodesByDOMOrder(nodes) {
      // Sort by DOM position
      nodes.sort((a, b) => {
        const position = a.element.compareDocumentPosition(b.element);
        if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
          return -1;
        } else if (position & Node.DOCUMENT_POSITION_PRECEDING) {
          return 1;
        }
        return 0;
      });

      // Recursively sort children
      nodes.forEach(node => {
        if (node.children.length > 0) {
          this.sortNodesByDOMOrder(node.children);
        }
      });
    }

    /**
     * Get clean component name derived from filename
     * @param {Object} node - Tree node
     * @returns {string} Clean component name
     */
    getComponentDisplayName(node) {
      // Extract clean component name from filename only
      const filename = node.filename || 'Unknown';
      return filename.replace(/\.(scala|js|ts)$/, '');
    }



    /**
     * Flatten tree structure for linear navigation
     * @param {Array} nodes - Root nodes
     * @param {Array} result - Accumulator for flattened nodes
     * @returns {Array} Flattened array of visible nodes
     */
    flattenVisibleNodes(nodes = this.treeData, result = []) {
      nodes.forEach(node => {
        result.push(node);
        if (node.expanded && node.children.length > 0) {
          this.flattenVisibleNodes(node.children, result);
        }
      });
      return result;
    }

    /**
     * Create the main panel element
     */
    createPanel() {
      // Create main panel container
      this.panelElement = document.createElement('div');
      this.panelElement.className = 'locator-tree-panel';
      this.panelElement.style.cssText = `
        position: fixed;
        width: var(--tree-panel-width);
        max-height: var(--tree-panel-max-height);
        min-height: var(--tree-panel-min-height);
        background: var(--tree-panel-bg);
        border: var(--tree-panel-border);
        border-radius: var(--tree-panel-border-radius);
        box-shadow: var(--tree-panel-shadow);
        z-index: var(--tree-panel-z-index);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        font-family: var(--tree-text-font-family);
        font-size: var(--tree-text-font-size);
        backdrop-filter: var(--tree-panel-backdrop-filter);
        -webkit-backdrop-filter: var(--tree-panel-backdrop-filter);
      `;

      // Create header
      const header = document.createElement('div');
      header.className = 'locator-tree-header';
      header.style.cssText = `
        height: var(--tree-header-height);
        background: var(--tree-header-bg);
        border-bottom: var(--tree-header-border-bottom);
        padding: var(--tree-header-padding);
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-shrink: 0;
        backdrop-filter: var(--tree-header-backdrop-filter);
        -webkit-backdrop-filter: var(--tree-header-backdrop-filter);
        border-radius: var(--tree-panel-border-radius) var(--tree-panel-border-radius) 0 0;
      `;

      // Create title
      const title = document.createElement('div');
      title.className = 'locator-tree-title';
      title.textContent = 'Component Tree';
      title.style.cssText = `
        font-weight: 700;
        color: var(--tree-text-color);
        font-size: 15px;
        letter-spacing: -0.01em;
      `;

      // Create close button
      const closeButton = document.createElement('button');
      closeButton.className = 'locator-tree-close';
      closeButton.innerHTML = '✕';
      closeButton.style.cssText = `
        width: var(--tree-close-button-size);
        height: var(--tree-close-button-size);
        border: none;
        background: transparent;
        color: var(--tree-text-secondary-color);
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        border-radius: var(--tree-close-button-border-radius);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: var(--tree-item-transition);
        opacity: 0.7;
      `;

      closeButton.addEventListener('mouseenter', () => {
        closeButton.style.background = 'var(--tree-close-button-hover-bg)';
        closeButton.style.opacity = '1';
        closeButton.style.color = 'var(--tree-text-color)';
      });

      closeButton.addEventListener('mouseleave', () => {
        closeButton.style.background = 'transparent';
        closeButton.style.opacity = '0.7';
        closeButton.style.color = 'var(--tree-text-secondary-color)';
      });

      closeButton.addEventListener('mousedown', () => {
        closeButton.style.background = 'var(--tree-close-button-active-bg)';
      });

      closeButton.addEventListener('mouseup', () => {
        closeButton.style.background = 'var(--tree-close-button-hover-bg)';
      });

      closeButton.addEventListener('click', this.close);

      // Create React DevTools-style tree container
      this.treeContainer = document.createElement('div');
      this.treeContainer.className = 'locator-tree-container';
      this.treeContainer.tabIndex = 0; // Make focusable for keyboard navigation
      this.treeContainer.style.cssText = `
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 8px 0;
        outline: none;
        scroll-behavior: smooth;
        background: var(--tree-panel-bg);
        position: relative;
      `;

      // Add React DevTools-style focus styling
      this.treeContainer.addEventListener('focus', () => {
        this.treeContainer.style.outline = '2px solid var(--tree-component-name-color)';
        this.treeContainer.style.outlineOffset = '-2px';
      });

      this.treeContainer.addEventListener('blur', () => {
        this.treeContainer.style.outline = 'none';
      });

      // Add custom scrollbar styling
      this.treeContainer.style.cssText += `
        scrollbar-width: thin;
        scrollbar-color: var(--tree-scrollbar-thumb-bg) var(--tree-scrollbar-track-bg);
      `;

      // Add webkit scrollbar styles for better cross-browser support
      const scrollbarStyle = document.createElement('style');
      scrollbarStyle.id = 'locator-tree-scrollbar-styles';
      scrollbarStyle.textContent = `
        .locator-tree-container::-webkit-scrollbar {
          width: var(--tree-scrollbar-width);
        }
        .locator-tree-container::-webkit-scrollbar-track {
          background: var(--tree-scrollbar-track-bg);
          border-radius: var(--tree-scrollbar-border-radius);
        }
        .locator-tree-container::-webkit-scrollbar-thumb {
          background: var(--tree-scrollbar-thumb-bg);
          border-radius: var(--tree-scrollbar-border-radius);
        }
        .locator-tree-container::-webkit-scrollbar-thumb:hover {
          background: var(--tree-scrollbar-thumb-hover-bg);
        }
        .locator-tree-container::-webkit-scrollbar-corner {
          background: transparent;
        }
      `;

      // Only add if not already present
      if (!document.getElementById('locator-tree-scrollbar-styles')) {
        document.head.appendChild(scrollbarStyle);
      }

      // Add keyboard event listener
      this.treeContainer.addEventListener('keydown', this.handleTreeKeyDown);

      // Add mouse leave handler
      this.treeContainer.addEventListener('mouseleave', () => {
        this.handleTreeMouseLeave();
      });

      // Assemble the panel
      header.appendChild(title);
      header.appendChild(closeButton);
      this.panelElement.appendChild(header);
      this.panelElement.appendChild(this.treeContainer);

      // Add keyboard shortcuts info
      this.addKeyboardShortcutsInfo();

      // Add to document
      document.body.appendChild(this.panelElement);
    }

    /**
     * Render the tree structure
     */
    renderTree() {
      if (!this.treeContainer || !this.treeData) return;

      // Clear existing content
      this.treeContainer.innerHTML = '';

      // Render root nodes
      this.treeData.forEach(node => {
        this.renderTreeNode(node, this.treeContainer);
      });

      // If no components found, show message
      if (this.treeData.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'locator-tree-empty';
        emptyMessage.textContent = 'No components found';
        emptyMessage.style.cssText = `
          padding: 20px;
          text-align: center;
          color: var(--tree-text-secondary-color);
          font-style: italic;
        `;
        this.treeContainer.appendChild(emptyMessage);
      }
    }

    /**
     * Render a single tree node and its children
     * @param {Object} node - Tree node to render
     * @param {Element} container - Container element
     */
    renderTreeNode(node, container) {
      // Create simple node element
      const nodeElement = document.createElement('div');
      nodeElement.className = 'locator-tree-node';
      nodeElement.dataset.nodeId = node.id;
      nodeElement.style.cssText = `
        display: flex;
        align-items: center;
        min-height: 24px;
        padding: 2px 8px;
        margin: 0;
        padding-left: calc(${node.level * 16}px + 8px);
        cursor: pointer;
        user-select: none;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 13px;
        line-height: 1.4;
        color: #24292e;
      `;

      // Add simple hover effects
      nodeElement.addEventListener('mouseenter', (e) => {
        if (this.selectedNodeId !== node.id) {
          nodeElement.style.background = '#f1f8ff';
        }
        this.handleTreeItemHover(e);
      });

      nodeElement.addEventListener('mouseleave', () => {
        if (this.selectedNodeId !== node.id) {
          nodeElement.style.background = 'transparent';
        }
      });

      // Add click handler
      nodeElement.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleTreeItemClick(e);
      });

      // Add context menu handler
      nodeElement.addEventListener('contextmenu', (e) => {
        e.stopPropagation();
        this.showContextMenu(node, e);
      });

      // Create simple expand/collapse triangle (only for nodes with children)
      const expandIcon = document.createElement('span');
      expandIcon.className = 'locator-tree-expand-icon';
      expandIcon.style.cssText = `
        width: 12px;
        height: 12px;
        margin-right: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #586069;
        font-size: 8px;
        flex-shrink: 0;
        font-family: monospace;
      `;

      if (node.children.length > 0) {
        expandIcon.innerHTML = '▶';
        expandIcon.style.cursor = 'pointer';
        expandIcon.style.transform = node.expanded ? 'rotate(90deg)' : 'rotate(0deg)';
        expandIcon.style.transition = 'transform 0.1s ease';

        expandIcon.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggleNodeExpansion(node);
        });
      } else {
        // Empty space for leaf nodes to maintain alignment
        expandIcon.innerHTML = '';
        expandIcon.style.cursor = 'default';
      }

      // Create simple text content - just the component name
      const componentName = this.getComponentDisplayName(node);
      const nameElement = document.createElement('span');
      nameElement.className = 'locator-tree-name';
      nameElement.style.cssText = `
        color: #24292e;
        font-weight: 400;
        flex: 1;
      `;
      nameElement.textContent = componentName;

      // Assemble node - just expand icon and component name
      nodeElement.appendChild(expandIcon);
      nodeElement.appendChild(nameElement);

      // Add to container
      container.appendChild(nodeElement);

      // Render children if expanded
      if (node.expanded && node.children.length > 0) {
        node.children.forEach(child => {
          this.renderTreeNode(child, container);
        });
      }
    }



    /**
     * Toggle expansion state of a tree node
     * @param {Object} node - Tree node to toggle
     */
    toggleNodeExpansion(node) {
      if (node.children.length === 0) return;

      const wasExpanded = node.expanded;
      node.expanded = !node.expanded;

      // Update expanded nodes set
      if (node.expanded) {
        this.expandedNodes.add(node.id);
      } else {
        this.expandedNodes.delete(node.id);
      }

      // Animate the expansion/collapse
      this.animateNodeToggle(node, wasExpanded);
    }

    /**
     * Animate node expansion/collapse
     * @param {Object} node - Tree node
     * @param {boolean} wasExpanded - Previous expansion state
     */
    animateNodeToggle(node, wasExpanded) {
      // Cancel any existing animation
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }

      // Find the node element
      const nodeElement = this.treeContainer.querySelector(`[data-node-id="${node.id}"]`);
      if (!nodeElement) {
        this.renderTree();
        return;
      }

      // Update the expand icon immediately
      const expandIcon = nodeElement.querySelector('.locator-tree-expand-icon');
      if (expandIcon) {
        expandIcon.innerHTML = node.expanded ? '▼' : '▶';
        expandIcon.style.transform = node.expanded ? 'rotate(0deg)' : 'rotate(-90deg)';
        expandIcon.style.transition = 'transform 0.2s ease';
      }

      // Use requestAnimationFrame for smooth rendering
      this.animationFrameId = requestAnimationFrame(() => {
        this.renderTree();
        this.animationFrameId = null;
      });
    }

    /**
     * Expand all nodes in the tree
     */
    expandAll() {
      this.forEachNode(this.treeData, (node) => {
        if (node.children.length > 0) {
          node.expanded = true;
          this.expandedNodes.add(node.id);
        }
      });
      this.renderTree();
    }

    /**
     * Collapse all nodes in the tree
     */
    collapseAll() {
      this.forEachNode(this.treeData, (node) => {
        node.expanded = false;
        this.expandedNodes.delete(node.id);
      });
      this.renderTree();
    }

    /**
     * Apply function to each node in the tree
     * @param {Array} nodes - Tree nodes
     * @param {Function} fn - Function to apply
     */
    forEachNode(nodes, fn) {
      nodes.forEach(node => {
        fn(node);
        if (node.children.length > 0) {
          this.forEachNode(node.children, fn);
        }
      });
    }

    /**
     * Find tree node by ID
     * @param {string} nodeId - Node ID to find
     * @returns {Object|null} Found node or null
     */
    findNodeById(nodeId) {
      let found = null;
      this.forEachNode(this.treeData, (node) => {
        if (node.id === nodeId) {
          found = node;
        }
      });
      return found;
    }

    /**
     * Position the panel intelligently on screen
     */
    positionPanel() {
      if (!this.panelElement) return;

      const panel = this.panelElement;
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };

      // React DevTools-style responsive design adjustments
      const isMobile = viewport.width < 768;
      const isTablet = viewport.width >= 768 && viewport.width < 1200;

      let panelWidth, margin;

      if (isMobile) {
        // Mobile: React DevTools mobile layout
        panelWidth = Math.min(viewport.width - 24, 360);
        margin = 12;
        panel.style.width = `${panelWidth}px`;
        panel.style.maxHeight = '65vh';
        panel.style.minHeight = '200px';
      } else if (isTablet) {
        // Tablet: React DevTools tablet layout
        panelWidth = Math.min(400, viewport.width - 48);
        margin = 24;
        panel.style.width = `${panelWidth}px`;
        panel.style.maxHeight = '75vh';
        panel.style.minHeight = '240px';
      } else {
        // Desktop: React DevTools desktop layout
        const panelRect = panel.getBoundingClientRect();
        panelWidth = panelRect.width || parseInt(getComputedStyle(document.documentElement).getPropertyValue('--tree-panel-width')) || 380;
        margin = 32;
        panel.style.maxHeight = 'var(--tree-panel-max-height)';
        panel.style.minHeight = 'var(--tree-panel-min-height)';
      }

      const panelHeight = panel.getBoundingClientRect().height || Math.min(600, viewport.height * 0.75);

      // Calculate React DevTools-style optimal position
      let left, top;

      if (isMobile) {
        // Mobile: center horizontally with top positioning
        left = Math.max(margin, (viewport.width - panelWidth) / 2);
        top = margin + 20; // Slightly lower on mobile for better thumb reach
      } else {
        // Desktop/Tablet: React DevTools-style top-right positioning
        left = viewport.width - panelWidth - margin;
        top = margin + 8; // Slight offset from very top

        // Smart positioning: avoid overlapping with common UI elements
        if (left < margin) {
          // If doesn't fit on right, try left side
          left = margin;
        }

        // Check for potential overlap with browser UI
        if (top < 60) {
          top = 60; // Account for browser toolbar
        }
      }

      // Ensure panel fits vertically with React DevTools-style constraints
      const availableHeight = viewport.height - top - margin;
      if (panelHeight > availableHeight) {
        // Adjust top position or height to fit
        if (availableHeight < 300) {
          // If very little space, reposition higher
          top = Math.max(margin, viewport.height - 300 - margin);
          panel.style.maxHeight = `${Math.min(300, viewport.height - (margin * 2))}px`;
        } else {
          panel.style.maxHeight = `${availableHeight}px`;
        }
      }

      // Apply position with React DevTools-style precision
      panel.style.left = `${Math.round(left)}px`;
      panel.style.top = `${Math.round(top)}px`;

      // Add entrance animation with enhanced easing
      panel.style.opacity = '0';
      panel.style.transform = 'translateY(-12px) scale(0.96)';
      panel.style.transition = `
        opacity var(--tree-animation-duration) var(--tree-animation-easing),
        transform var(--tree-animation-duration) var(--tree-animation-easing)
      `;

      // Trigger animation
      requestAnimationFrame(() => {
        panel.style.opacity = '1';
        panel.style.transform = 'translateY(0) scale(1)';
      });
    }

    /**
     * Animate React DevTools-style entrance
     */
    animateEntrance() {
      if (!this.panelElement) return;

      const panel = this.panelElement;

      // Set initial state for entrance animation
      panel.style.opacity = '0';
      panel.style.transform = 'translateY(-8px) scale(0.98)';
      panel.style.transition = `
        opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1),
        transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)
      `;

      // Trigger entrance animation
      requestAnimationFrame(() => {
        panel.style.opacity = '1';
        panel.style.transform = 'translateY(0) scale(1)';
      });
    }

    /**
     * Animate React DevTools-style exit
     * @param {Function} callback - Callback to execute after animation
     */
    animateExit(callback) {
      if (!this.panelElement) {
        callback();
        return;
      }

      const panel = this.panelElement;

      // Set exit animation
      panel.style.transition = `
        opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1),
        transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)
      `;

      panel.style.opacity = '0';
      panel.style.transform = 'translateY(-4px) scale(0.99)';

      // Execute callback after animation
      setTimeout(callback, 150);
    }

    /**
     * Handle keyboard navigation within the tree
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleTreeKeyDown(event) {
      const visibleNodes = this.flattenVisibleNodes();
      if (visibleNodes.length === 0) return;

      let currentIndex = -1;
      if (this.selectedNodeId) {
        currentIndex = visibleNodes.findIndex(node => node.id === this.selectedNodeId);
      }

      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          this.navigateUp(visibleNodes, currentIndex);
          break;

        case 'ArrowDown':
          event.preventDefault();
          this.navigateDown(visibleNodes, currentIndex);
          break;

        case 'ArrowLeft':
          event.preventDefault();
          this.navigateLeft(visibleNodes, currentIndex);
          break;

        case 'ArrowRight':
          event.preventDefault();
          this.navigateRight(visibleNodes, currentIndex);
          break;

        case 'Enter':
        case ' ':
          event.preventDefault();
          this.activateSelectedNode();
          break;

        case 'Escape':
          event.preventDefault();
          this.hide();
          break;

        case 'Home':
          event.preventDefault();
          this.selectNode(visibleNodes[0]);
          break;

        case 'End':
          event.preventDefault();
          this.selectNode(visibleNodes[visibleNodes.length - 1]);
          break;
      }
    }

    /**
     * Navigate up in the tree
     * @param {Array} visibleNodes - Array of visible nodes
     * @param {number} currentIndex - Current selection index
     */
    navigateUp(visibleNodes, currentIndex) {
      if (currentIndex > 0) {
        this.selectNode(visibleNodes[currentIndex - 1]);
      } else if (visibleNodes.length > 0) {
        // Wrap to last item
        this.selectNode(visibleNodes[visibleNodes.length - 1]);
      }
    }

    /**
     * Navigate down in the tree
     * @param {Array} visibleNodes - Array of visible nodes
     * @param {number} currentIndex - Current selection index
     */
    navigateDown(visibleNodes, currentIndex) {
      if (currentIndex < visibleNodes.length - 1) {
        this.selectNode(visibleNodes[currentIndex + 1]);
      } else if (visibleNodes.length > 0) {
        // Wrap to first item
        this.selectNode(visibleNodes[0]);
      }
    }

    /**
     * Navigate left in the tree (collapse or go to parent)
     * @param {Array} visibleNodes - Array of visible nodes
     * @param {number} currentIndex - Current selection index
     */
    navigateLeft(visibleNodes, currentIndex) {
      if (currentIndex === -1) return;

      const currentNode = visibleNodes[currentIndex];

      if (currentNode.expanded && currentNode.children.length > 0) {
        // Collapse current node
        this.toggleNodeExpansion(currentNode);
      } else if (currentNode.parent) {
        // Go to parent node
        this.selectNode(currentNode.parent);
      }
    }

    /**
     * Navigate right in the tree (expand or go to first child)
     * @param {Array} visibleNodes - Array of visible nodes
     * @param {number} currentIndex - Current selection index
     */
    navigateRight(visibleNodes, currentIndex) {
      if (currentIndex === -1) return;

      const currentNode = visibleNodes[currentIndex];

      if (currentNode.children.length > 0) {
        if (!currentNode.expanded) {
          // Expand current node
          this.toggleNodeExpansion(currentNode);
        } else {
          // Go to first child
          this.selectNode(currentNode.children[0]);
        }
      }
    }

    /**
     * Activate the currently selected node (expand/collapse or open file)
     */
    activateSelectedNode() {
      if (!this.selectedNodeId) return;

      const node = this.findNodeById(this.selectedNodeId);
      if (!node) return;

      if (node.children.length > 0) {
        // Toggle expansion for nodes with children
        this.toggleNodeExpansion(node);
      } else {
        // Open file for leaf nodes
        this.openNodeFile(node);
      }
    }

    /**
     * Select a tree node
     * @param {Object} node - Node to select
     */
    selectNode(node) {
      if (!node) return;

      // Update selection
      const previousId = this.selectedNodeId;
      this.selectedNodeId = node.id;

      // Update visual selection
      this.updateNodeSelection(previousId, node.id);

      // Scroll into view
      this.scrollNodeIntoView(node.id);

      // Trigger hover effect on the actual component
      this.locatorSystem.showOverlayForElement(node.element);
    }

    /**
     * Update visual selection state
     * @param {string|null} previousId - Previous selected node ID
     * @param {string} currentId - Current selected node ID
     */
    updateNodeSelection(previousId, currentId) {
      // Remove previous selection
      if (previousId) {
        const prevElement = this.treeContainer.querySelector(`[data-node-id="${previousId}"]`);
        if (prevElement) {
          prevElement.style.background = 'transparent';
          prevElement.style.color = '#24292e';
        }
      }

      // Add current selection
      const currentElement = this.treeContainer.querySelector(`[data-node-id="${currentId}"]`);
      if (currentElement) {
        currentElement.style.background = '#0366d6';
        currentElement.style.color = '#ffffff';
      }
    }

    /**
     * Scroll node into view
     * @param {string} nodeId - Node ID to scroll to
     */
    scrollNodeIntoView(nodeId) {
      const nodeElement = this.treeContainer.querySelector(`[data-node-id="${nodeId}"]`);
      if (nodeElement) {
        nodeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    }

    /**
     * Open file for a tree node
     * @param {Object} node - Tree node
     */
    openNodeFile(node) {
      if (!node.path || !node.line) return;

      try {
        // Use the existing openFileAtSourcePath function
        openFileAtSourcePath(node.path, node.line);
        // Optionally close the tree view after opening file
        // this.hide();
      } catch (error) {
        console.error('Error opening file from tree view:', error);
      }
    }

    /**
     * Handle mouse hover over tree items
     * @param {MouseEvent} event - Mouse event
     */
    handleTreeItemHover(event) {
      const nodeElement = event.target.closest('[data-node-id]');
      if (!nodeElement) return;

      const nodeId = nodeElement.dataset.nodeId;
      const node = this.findNodeById(nodeId);
      if (!node) return;

      // Show overlay for the corresponding component
      this.locatorSystem.showOverlayForElement(node.element);
    }

    /**
     * Handle click on tree items
     * @param {MouseEvent} event - Mouse event
     */
    handleTreeItemClick(event) {
      const nodeElement = event.target.closest('[data-node-id]');
      if (!nodeElement) return;

      const nodeId = nodeElement.dataset.nodeId;
      const node = this.findNodeById(nodeId);
      if (!node) return;

      // Select the node
      this.selectNode(node);

      // Handle different click behaviors
      if (event.detail === 2) {
        // Double click - open file
        this.openNodeFile(node);
      } else if (event.shiftKey) {
        // Shift click - toggle expansion
        if (node.children.length > 0) {
          this.toggleNodeExpansion(node);
        }
      } else {
        // Single click - just select and show overlay
        // Already handled by selectNode above
      }
    }

    /**
     * Handle mouse leave from tree container
     */
    handleTreeMouseLeave() {
      // Hide overlay when mouse leaves tree
      this.locatorSystem.hideAll();
    }

    /**
     * Initialize tree with some default expansions
     */
    initializeTreeState() {
      // Expand root nodes by default
      if (this.treeData && this.treeData.length > 0) {
        this.treeData.forEach(node => {
          if (node.children.length > 0) {
            node.expanded = true;
            this.expandedNodes.add(node.id);
          }
        });
      }
    }

    /**
     * Handle window resize events
     */
    handleWindowResize() {
      if (this.isVisible && this.panelElement) {
        // Throttle resize handling
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
          this.positionPanel();
        }, 150);
      }
    }

    /**
     * Update tree when components change
     */
    refreshTree() {
      if (!this.isVisible) return;

      const wasExpanded = new Set(this.expandedNodes);
      const selectedId = this.selectedNodeId;

      // Rebuild tree data
      this.buildTreeData();

      // Restore expansion states
      this.forEachNode(this.treeData, (node) => {
        if (wasExpanded.has(node.id)) {
          node.expanded = true;
          this.expandedNodes.add(node.id);
        }
      });

      // Re-render
      this.renderTree();

      // Restore selection if possible
      if (selectedId && this.findNodeById(selectedId)) {
        this.selectedNodeId = selectedId;
        this.updateNodeSelection(null, selectedId);
      }
    }

    /**
     * Add keyboard shortcuts info to the tree panel
     */
    addKeyboardShortcutsInfo() {
      if (!this.treeContainer) return;

      const shortcutsInfo = document.createElement('div');
      shortcutsInfo.className = 'locator-tree-shortcuts';
      shortcutsInfo.style.cssText = `
        padding: 8px 12px;
        border-top: 1px solid rgba(0, 0, 0, 0.06);
        background: rgba(0, 0, 0, 0.02);
        font-size: 11px;
        color: var(--tree-text-secondary-color);
        line-height: 1.3;
      `;

      shortcutsInfo.innerHTML = `
        <div style="margin-bottom: 4px;"><strong>Keyboard shortcuts:</strong></div>
        <div>↑↓ Navigate • ←→ Expand/Collapse • Enter Open • Esc Close</div>
      `;

      this.panelElement.appendChild(shortcutsInfo);
    }

    /**
     * Handle edge cases and error recovery
     */
    handleEdgeCases() {
      // Handle case where no components are found
      if (!this.treeData || this.treeData.length === 0) {
        console.warn('ComponentTreeView: No components found');
        return;
      }

      // Handle case where DOM elements are removed
      this.forEachNode(this.treeData, (node) => {
        if (!document.contains(node.element)) {
          console.warn('ComponentTreeView: Component element no longer in DOM', node);
        }
      });

      // Handle case where panel is positioned off-screen
      if (this.panelElement) {
        const rect = this.panelElement.getBoundingClientRect();
        if (rect.left < 0 || rect.top < 0 ||
            rect.right > window.innerWidth || rect.bottom > window.innerHeight) {
          this.positionPanel();
        }
      }
    }

    /**
     * Add context menu for tree items
     * @param {Object} node - Tree node
     * @param {MouseEvent} event - Mouse event
     */
    showContextMenu(node, event) {
      event.preventDefault();

      const contextMenu = document.createElement('div');
      contextMenu.className = 'locator-tree-context-menu';
      contextMenu.style.cssText = `
        position: fixed;
        left: ${event.clientX}px;
        top: ${event.clientY}px;
        background: var(--tree-panel-bg);
        border: var(--tree-panel-border);
        border-radius: 6px;
        box-shadow: var(--tree-panel-shadow);
        z-index: ${parseInt(getComputedStyle(document.documentElement).getPropertyValue('--tree-panel-z-index')) + 1};
        padding: 4px 0;
        min-width: 150px;
        font-size: 12px;
      `;

      const menuItems = [
        { label: 'Open File', action: () => this.openNodeFile(node) },
        { label: 'Copy Path', action: () => navigator.clipboard?.writeText(node.path) },
        { label: 'Expand All Children', action: () => this.expandNodeChildren(node) },
        { label: 'Collapse All Children', action: () => this.collapseNodeChildren(node) }
      ];

      menuItems.forEach(item => {
        const menuItem = document.createElement('div');
        menuItem.textContent = item.label;
        menuItem.style.cssText = `
          padding: 6px 12px;
          cursor: pointer;
          transition: background-color 0.15s ease;
        `;

        menuItem.addEventListener('mouseenter', () => {
          menuItem.style.background = 'var(--tree-item-hover-bg)';
        });

        menuItem.addEventListener('mouseleave', () => {
          menuItem.style.background = 'transparent';
        });

        menuItem.addEventListener('click', () => {
          item.action();
          contextMenu.remove();
        });

        contextMenu.appendChild(menuItem);
      });

      document.body.appendChild(contextMenu);

      // Remove context menu when clicking elsewhere
      const removeMenu = (e) => {
        if (!contextMenu.contains(e.target)) {
          contextMenu.remove();
          document.removeEventListener('click', removeMenu);
        }
      };

      setTimeout(() => {
        document.addEventListener('click', removeMenu);
      }, 0);
    }

    /**
     * Expand all children of a node
     * @param {Object} node - Tree node
     */
    expandNodeChildren(node) {
      this.forEachNode([node], (n) => {
        if (n.children.length > 0) {
          n.expanded = true;
          this.expandedNodes.add(n.id);
        }
      });
      this.renderTree();
    }

    /**
     * Collapse all children of a node
     * @param {Object} node - Tree node
     */
    collapseNodeChildren(node) {
      this.forEachNode(node.children, (n) => {
        n.expanded = false;
        this.expandedNodes.delete(n.id);
      });
      this.renderTree();
    }

    /**
     * Cleanup resources
     */
    destroy() {
      this.hide();
      document.removeEventListener('keydown', this.handleKeyDown);
      window.removeEventListener('resize', this.handleWindowResize);

      // Clean up performance optimization resources
      if (this.mutationObserver) {
        this.mutationObserver.disconnect();
        this.mutationObserver = null;
      }

      if (this.intersectionObserver) {
        this.intersectionObserver.disconnect();
        this.intersectionObserver = null;
      }

      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }

      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = null;
      }

      // Clear all caches
      this.nodeCache.clear();
      this.renderCache.clear();
      this.throttledRefresh = null;
    }
  }

  /**
   * Main LocatorSystem class that orchestrates all components
   */
  class LocatorSystem {
    constructor(options = {}) {
      // Initialize state first
      this.state = new LocatorState();

      // Initialize managers with state dependency
      this.overlay = new OverlayManager(this.state);
      this.tooltip = new TooltipManager(this.state);
      this.keyboard = new KeyboardNavigator(this.state, this.overlay);
      this.events = new EventManager(this);
      this.treeView = new ComponentTreeView(this);

      // Configuration
      this.options = {
        enableKeyboardNavigation: true,
        enableParentTooltips: true,
        enableVisualFeedback: true,
        ...options
      };

      // Initialize system
      this.initialize();
    }

    /**
     * Initialize the locator system
     */
    initialize() {
      // CSS variables are already injected at module load
      // Event listeners are already set up by EventManager
      console.log('LocatorSystem initialized with class-based architecture');
    }

    /**
     * Get current system status
     * @returns {Object} Status information
     */
    getStatus() {
      return {
        altPressed: this.state.altPressed,
        shiftPressed: this.state.shiftPressed,
        keyboardNavigationActive: this.state.keyboardNavigationActive,
        currentTarget: this.state.currentTargetElement ? {
          filename: PropertyAccessor.getFilename(this.state.currentTargetElement),
          line: PropertyAccessor.getSourceLine(this.state.currentTargetElement),
          path: PropertyAccessor.getSourcePath(this.state.currentTargetElement)
        } : null,
        overlayVisible: this.overlay.isVisible,
        tooltipVisible: this.tooltip.isMainVisible,
        parentTooltipVisible: this.tooltip.isParentVisible,
        keyboardNavigationActive: this.state.keyboardNavigationActive
      };
    }

    /**
     * Programmatically trigger overlay for element
     * @param {Element} element - Target element
     */
    showOverlayForElement(element) {
      if (!element || !PropertyAccessor.hasSourcePath(element)) {
        console.warn('Invalid element for overlay');
        return;
      }

      this.state.setCurrentTargetElement(element);
    }

    /**
     * Hide all overlays and reset state
     */
    hideAll() {
      this.state.reset();
    }

    /**
     * Enable/disable keyboard navigation
     * @param {boolean} enabled - Whether to enable keyboard navigation
     */
    setKeyboardNavigationEnabled(enabled) {
      this.options.enableKeyboardNavigation = enabled;
      if (!enabled && this.state.keyboardNavigationActive) {
        this.state.setKeyboardNavigationActive(false);
      }
    }

    /**
     * Enable/disable parent tooltips
     * @param {boolean} enabled - Whether to enable parent tooltips
     */
    setParentTooltipsEnabled(enabled) {
      this.options.enableParentTooltips = enabled;
      if (!enabled && this.state.parentTooltipVisible) {
        this.state.setParentTooltipVisible(false);
      }
    }

    /**
     * Get all components in the current page
     * @returns {Array} Array of component information
     */
    getAllComponents() {
      return this.keyboard.getAllComponentsInOrder().map(element => ({
        element,
        filename: PropertyAccessor.getFilename(element),
        line: PropertyAccessor.getSourceLine(element),
        path: PropertyAccessor.getSourcePath(element)
      }));
    }

    /**
     * Navigate to specific component by path and line
     * @param {string} filename - File name
     * @param {number} line - Line number
     * @returns {boolean} True if component found and navigated to
     */
    navigateToComponent(filename, line) {
      const components = this.getAllComponents();
      const target = components.find(comp =>
        comp.filename === filename && comp.line === line
      );

      if (target) {
        this.state.setKeyboardSelectedElement(target.element);
        this.state.setCurrentTargetElement(target.element);
        return true;
      }

      return false;
    }

    /**
     * Export current configuration
     * @returns {Object} Configuration object
     */
    exportConfig() {
      return {
        preferredIDE: PREFER_IDE_PROTOCOL,
        parentTooltipCount: getParentTooltipCount(),
        options: { ...this.options }
      };
    }

    /**
     * Import configuration
     * @param {Object} config - Configuration object
     */
    importConfig(config) {
      if (config.preferredIDE && EDITOR_PROTOCOL[config.preferredIDE]) {
        localStorage.setItem(PREFER_IDE_KEY, config.preferredIDE);
      }

      if (typeof config.parentTooltipCount === 'number') {
        localStorage.setItem(PARENT_TOOLTIP_COUNT_KEY, config.parentTooltipCount.toString());
      }

      if (config.options) {
        Object.assign(this.options, config.options);
      }
    }

    /**
     * Cleanup and destroy the locator system
     */
    destroy() {
      // Cleanup all managers
      this.events.destroy();
      this.overlay.destroy();
      this.tooltip.destroy();
      this.keyboard.destroy();
      this.treeView.destroy();

      // Reset state
      this.state.reset();

      console.log('LocatorSystem destroyed');
    }
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Throttle function to limit how often a function can be called
   * @param {Function} fn - Function to throttle
   * @param {number} delay - Minimum delay between calls in milliseconds
   * @returns {Function} Throttled function
   */
  function throttle(fn, delay) {
    let lastCall = 0;
    return (...args) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        fn(...args);
      }
    };
  }

  /**
   * Debounce function to delay execution until after calls have stopped
   * @param {Function} fn - Function to debounce
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} Debounced function
   */
  function debounce(fn, delay) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  }

  /**
   * Request animation frame throttle for smooth animations
   * @param {Function} fn - Function to throttle
   * @returns {Function} RAF-throttled function
   */
  function rafThrottle(fn) {
    let rafId = null;
    return (...args) => {
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          fn(...args);
          rafId = null;
        });
      }
    };
  }



  /**
   * Open file at source path using configured IDE protocol
   * @param {string} sourcePath - Path to the source file
   */
  function openFileAtSourcePath(sourcePath, sourceLine) {
    let uri = `${EDITOR_PROTOCOL[PREFER_IDE_PROTOCOL]}${sourcePath}`;
    if(sourceLine) {
      if(PREFER_IDE_PROTOCOL === "idea") {
        uri += `&line=${sourceLine}`;
      } else {
        uri += `:${sourceLine}`;
      }
    }
    window.open(uri, "_blank");
  }

  /**
   * Find the nearest parent element with Scala source path information
   * @param {Element} startElement - Element to start searching from
   * @returns {Element|null} Element with source path property or null
   */
  function findLocatorElement(startElement) {
    let element = startElement;

    // Traverse up the DOM tree to find an element with source path property
    while (element && element !== document.body) {
      if (PropertyAccessor.hasSourcePath(element)) {
        return element;
      }
      element = element.parentElement;
    }

    return null;
  }

  /**
   * Get the configured number of parent components to display
   * @returns {number} Number of parents to show (0-3)
   */
  function getParentTooltipCount() {
    const stored = window.localStorage.getItem(PARENT_TOOLTIP_COUNT_KEY);
    if (stored) {
      const count = parseInt(stored, 10);
      if (!isNaN(count) && count >= 0 && count <= MAX_PARENT_COUNT) {
        return count;
      }
    }
    return DEFAULT_PARENT_COUNT;
  }

  /**
   * Find parent UIComponents in the hierarchy
   * @param {Element} currentElement - Current element to start searching from
   * @param {number} maxCount - Maximum number of parents to find
   * @returns {Array} Array of parent component information
   */
  function findParentComponents(currentElement, maxCount) {
    const parents = [];
    let element = currentElement.parentElement;
    let level = 1;

    while (element && element !== document.body && parents.length < maxCount) {
      if (PropertyAccessor.hasSourcePath(element)) {
        const filename = PropertyAccessor.getFilename(element);
        const line = PropertyAccessor.getSourceLine(element);

        if (filename && line) {
          parents.push({
            element: element,
            filename: filename,
            line: line,
            level: level
          });
          level++;
        }
      }
      element = element.parentElement;
    }

    return parents;
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  // Create global instance for backward compatibility
  let globalLocatorSystem = null;

  /**
   * Initialize the new class-based locator system
   */
  function initializeLocatorSystem() {
    try {
      globalLocatorSystem = new LocatorSystem({
        enableKeyboardNavigation: true,
        enableParentTooltips: true,
        enableVisualFeedback: true
      });

      // Expose global instance for debugging and external access
      if (typeof window !== 'undefined') {
        window.LocatorSystem = globalLocatorSystem;

        // Add global status check function
        window.checkLocatorStatus = () => {
          console.log('🔍 Locator System Status:', globalLocatorSystem.getStatus());
          return globalLocatorSystem.getStatus();
        };

        // Add global component discovery function
        window.discoverComponents = () => {
          const components = globalLocatorSystem.getAllComponents();
          console.log(`📦 Found ${components.length} components:`, components);
          return components;
        };
      }

      console.log('✅ Locator system initialized with class-based architecture');
      console.log('💡 Try: window.checkLocatorStatus() or window.discoverComponents() in console');
    } catch (error) {
      console.error('❌ Failed to initialize locator system:', error);
      throw error; // Don't fallback, let the error be visible
    }
  }

  // Initialize the new system
  initializeLocatorSystem();

})();
