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

        /* Locator Colors - Keyboard Theme (Orange) */
        --locator-keyboard-color: #ff8c00;
        --locator-keyboard-bg: rgba(255, 140, 0, 0.15);
        --locator-keyboard-bg-medium: rgba(255, 140, 0, 0.22);
        --locator-keyboard-shadow-light: rgba(255, 140, 0, 0.3);
        --locator-keyboard-shadow-medium: rgba(255, 140, 0, 0.5);
        --locator-keyboard-shadow-active: rgba(255, 140, 0, 0.6);
        --locator-keyboard-border-accent: rgba(255, 140, 0, 0.3);
        --locator-keyboard-glow: rgba(255, 140, 0, 0.2);

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
        --locator-shadow-overlay-keyboard: 0 0 0 2px var(--locator-white-strong), 0 0 16px var(--locator-keyboard-shadow-medium), 0 4px 20px var(--locator-keyboard-shadow-light);
        --locator-shadow-overlay-keyboard-active: 0 0 0 2px var(--locator-white-strong), 0 0 20px var(--locator-keyboard-shadow-active), 0 6px 24px var(--locator-keyboard-shadow-medium);
        --locator-shadow-tooltip: 0 4px 20px var(--locator-black-shadow-max), 0 2px 8px var(--locator-black-shadow-strong);
        --locator-shadow-tooltip-keyboard: 0 6px 24px var(--locator-black-shadow-ultra), 0 0 0 1px var(--locator-keyboard-glow);
        --locator-shadow-parent-tooltip: 0 8px 32px var(--locator-black-shadow-heavy);

        /* Locator Performance */
        --locator-throttle-delay: 50;
        --locator-debounce-delay: 100;
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



  // ============================================================================
  // CLASS-BASED ARCHITECTURE
  // ============================================================================

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
      this.navigationMode = 'mouse'; // 'mouse' or 'keyboard'

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
      this.navigationMode = 'mouse';

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
      const wasActive = this.keyboardNavigationActive;
      this.keyboardNavigationActive = active;
      this.navigationMode = active ? 'keyboard' : 'mouse';

      if (!active) {
        this.keyboardSelectedElement = null;
      }

      if (wasActive !== active) {
        this.notify('keyboardNavigationChanged', { active, mode: this.navigationMode });
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
        this.navigationMode = 'keyboard';
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
     * Get overlay styles based on navigation mode
     * @param {string} mode - 'mouse' or 'keyboard'
     * @param {string} state - 'normal', 'hover', or 'active'
     * @returns {Object} Style object
     */
    getOverlayStyles(mode = 'mouse', state = 'normal') {
      const baseStyles = {
        position: "fixed",
        pointerEvents: "auto",
        display: "block",
        boxSizing: "border-box",
        cursor: "pointer",
        willChange: "transform, box-shadow",
      };

      if (mode === 'keyboard') {
        return {
          ...baseStyles,
          backgroundColor: this.getCSSProperty('keyboard-bg'),
          border: `${this.getCSSProperty('border-width-thick')} solid ${this.getCSSProperty('keyboard-color')}`,
          borderRadius: this.getCSSProperty('border-radius-large'),
          boxShadow: state === 'active'
            ? this.getCSSProperty('shadow-overlay-keyboard-active')
            : this.getCSSProperty('shadow-overlay-keyboard'),
          zIndex: this.getCSSProperty('overlay-z-index'),
          transition: `${this.getCSSProperty('transition-normal')} ${this.getCSSProperty('easing-smooth')}`,
          transform: state === 'active'
            ? `scale(${this.getCSSProperty('scale-hover')})`
            : 'scale(var(--locator-scale-normal))',
        };
      } else {
        return {
          ...baseStyles,
          backgroundColor: state === 'hover'
            ? this.getCSSProperty('primary-bg-medium')
            : this.getCSSProperty('primary-bg-light'),
          border: `${this.getCSSProperty('border-width')} solid ${this.getCSSProperty('primary-color')}`,
          borderRadius: this.getCSSProperty('border-radius'),
          boxShadow: state === 'hover'
            ? this.getCSSProperty('shadow-overlay-hover')
            : this.getCSSProperty('shadow-overlay'),
          zIndex: this.getCSSProperty('overlay-z-index'),
          transition: `all ${this.getCSSProperty('transition-normal')} ${this.getCSSProperty('easing-smooth')}`,
          transform: state === 'hover'
            ? `scale(${this.getCSSProperty('scale-hover')})`
            : 'scale(var(--locator-scale-normal))',
        };
      }
    }

    /**
     * Get tooltip styles based on navigation mode
     * @param {string} mode - 'mouse' or 'keyboard'
     * @returns {Object} Style object
     */
    getTooltipStyles(mode = 'mouse') {
      const baseStyles = {
        position: "fixed",
        pointerEvents: "none",
        color: this.getCSSProperty('white'),
        padding: this.getCSSProperty('tooltip-padding'),
        borderRadius: this.getCSSProperty('border-radius'),
        fontSize: this.getCSSProperty('font-size'),
        fontFamily: this.getCSSProperty('font-family'),
        whiteSpace: mode === 'keyboard' ? "pre-line" : "nowrap",
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

      if (mode === 'keyboard') {
        return {
          ...baseStyles,
          backgroundColor: this.getCSSProperty('black-overlay-strong'),
          border: `${this.getCSSProperty('border-width-thin')} solid ${this.getCSSProperty('keyboard-border-accent')}`,
          boxShadow: this.getCSSProperty('shadow-tooltip-keyboard'),
          borderRadius: this.getCSSProperty('border-radius-large'),
        };
      } else {
        return {
          ...baseStyles,
          backgroundColor: this.getCSSProperty('black-overlay'),
          border: `${this.getCSSProperty('border-width-thin')} solid ${this.getCSSProperty('white-border')}`,
          boxShadow: this.getCSSProperty('shadow-tooltip'),
        };
      }
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
        case 'keyboardNavigationChanged':
          if (this.isVisible) {
            this.updateVisualMode();
          }
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
      const baseStyles = this.styleManager.getOverlayStyles(this.state.navigationMode, 'normal');
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
        if (this.state.navigationMode === 'mouse') {
          this.applyHoverState();
        }
      });

      element.addEventListener("mouseleave", () => {
        if (this.state.navigationMode === 'mouse') {
          this.removeHoverState();
        }
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
      const scalasourcepath = targetElement.__scalasourcepath;
      const scalafilename = targetElement.__scalafilename;
      const scalasourceline = targetElement.__scalasourceline;

      if (!scalasourcepath || !scalafilename || !scalasourceline) {
        this.hide();
        return;
      }

      this.createElement();

      // Calculate and apply position
      const targetRect = targetElement.getBoundingClientRect();
      const position = this.calculatePosition(targetRect);
      this.applyPosition(position);

      // Update visual mode
      this.updateVisualMode();

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
     * Update visual mode based on navigation state
     */
    updateVisualMode() {
      if (!this.element) return;

      const styles = this.styleManager.getOverlayStyles(this.state.navigationMode, 'normal');
      Object.assign(this.element.style, styles);
    }

    /**
     * Apply hover state styling
     */
    applyHoverState() {
      if (!this.element || this.state.navigationMode !== 'mouse') return;

      const styles = this.styleManager.getOverlayStyles('mouse', 'hover');
      Object.assign(this.element.style, {
        backgroundColor: styles.backgroundColor,
        boxShadow: styles.boxShadow,
        transform: styles.transform,
      });
    }

    /**
     * Remove hover state styling
     */
    removeHoverState() {
      if (!this.element || this.state.navigationMode !== 'mouse') return;

      const styles = this.styleManager.getOverlayStyles('mouse', 'normal');
      Object.assign(this.element.style, {
        backgroundColor: styles.backgroundColor,
        boxShadow: styles.boxShadow,
        transform: styles.transform,
      });
    }

    /**
     * Apply keyboard active state
     */
    applyKeyboardActiveState() {
      if (!this.element || this.state.navigationMode !== 'keyboard') return;

      const styles = this.styleManager.getOverlayStyles('keyboard', 'active');
      Object.assign(this.element.style, {
        backgroundColor: styles.backgroundColor,
        boxShadow: styles.boxShadow,
        transform: styles.transform,
      });
    }

    /**
     * Remove keyboard active state
     */
    removeKeyboardActiveState() {
      if (!this.element || this.state.navigationMode !== 'keyboard') return;

      const styles = this.styleManager.getOverlayStyles('keyboard', 'normal');
      Object.assign(this.element.style, {
        backgroundColor: styles.backgroundColor,
        boxShadow: styles.boxShadow,
        transform: styles.transform,
      });
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

        if (targetElement && targetElement.__scalasourcepath) {
          const sourcePath = targetElement.__scalasourcepath;
          const sourceLine = targetElement.__scalasourceline;

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
        case 'keyboardNavigationChanged':
          if (this.isMainVisible) {
            this.updateMainVisualMode();
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
      const styles = this.styleManager.getTooltipStyles(this.state.navigationMode);
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

      const scalafilename = targetElement.__scalafilename;
      const scalasourceline = targetElement.__scalasourceline;

      if (!scalafilename || !scalasourceline) {
        this.hideMain();
        return;
      }

      this.createMainElement();

      // Build tooltip content
      let content = `${scalafilename}:${scalasourceline}`;
      if (this.state.navigationMode === 'keyboard') {
        content += " • Alt+↑↓←→ to navigate • Enter to open";
      }

      // Update content and styles
      this.mainTooltip.textContent = content;
      this.updateMainVisualMode();

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
     * Update main tooltip visual mode
     */
    updateMainVisualMode() {
      if (!this.mainTooltip) return;

      const styles = this.styleManager.getTooltipStyles(this.state.navigationMode);
      Object.assign(this.mainTooltip.style, styles);
      this.mainTooltip.style.whiteSpace = this.state.navigationMode === 'keyboard' ? "pre-line" : "nowrap";
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
        return `<div style="margin: ${this.styleManager.getCSSProperty('parent-tooltip-margin')} 0; font-family: ${this.styleManager.getCSSProperty('font-family')};">
          <span style="color: ${this.styleManager.getCSSProperty('gray-medium')};">${indent}${connector}</span>
          <span style="color: ${this.styleManager.getCSSProperty('white')};">${parent.filename}:${parent.line}</span>
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

      const scalasourcepath = targetElement.__scalasourcepath;
      const scalasourceline = targetElement.__scalasourceline;

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
     * Apply keyboard active state visual feedback
     */
    applyActiveState() {
      if (this.overlayManager) {
        this.overlayManager.applyKeyboardActiveState();
      }
    }

    /**
     * Remove keyboard active state visual feedback
     */
    removeActiveState() {
      if (this.overlayManager) {
        this.overlayManager.removeKeyboardActiveState();
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
        if (Object.hasOwn(element, "__scalasourcepath")) {
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

            if (Object.hasOwn(node, "__scalasourcepath")) {
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
          if (Object.hasOwn(ancestor, "__scalasourcepath")) {
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
            if (Object.hasOwn(node, "__scalasourcepath")) {
              // Check if has parent with source path
              let parent = node.parentElement;
              while (parent && parent !== document.body) {
                if (Object.hasOwn(parent, "__scalasourcepath")) {
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
        if (Object.hasOwn(element, "__scalasourcepath")) {
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
          this.locatorSystem.state.navigationMode === 'keyboard') {
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
        const wasKeyboardMode = this.locatorSystem.state.navigationMode === 'keyboard';
        if (wasKeyboardMode) {
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
        navigationMode: this.state.navigationMode,
        currentTarget: this.state.currentTargetElement ? {
          filename: this.state.currentTargetElement.__scalafilename,
          line: this.state.currentTargetElement.__scalasourceline,
          path: this.state.currentTargetElement.__scalasourcepath
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
      if (!element || !element.__scalasourcepath) {
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
        filename: element.__scalafilename,
        line: element.__scalasourceline,
        path: element.__scalasourcepath
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
   * @returns {Element|null} Element with __scalasourcepath property or null
   */
  function findLocatorElement(startElement) {
    let element = startElement;

    // Traverse up the DOM tree to find an element with __scalasourcepath
    while (element && element !== document.body) {
      if (Object.hasOwn(element, "__scalasourcepath")) {
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
      if (Object.hasOwn(element, "__scalasourcepath")) {
        const filename = element.__scalafilename;
        const line = element.__scalasourceline;

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
