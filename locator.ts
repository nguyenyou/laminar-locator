/**
 * Scala Source Locator
 *
 * This module provides visual overlay functionality for Scala source code navigation.
 * When Alt key is pressed, it highlights DOM elements that have source path information
 * and allows clicking to open the corresponding source file in the configured IDE.
 */

(function(): void {
  'use strict';

  // ============================================================================
  // TYPE DEFINITIONS
  // ============================================================================

  interface EditorProtocol {
    readonly idea: string;
    readonly vscode: string;
    readonly cursor: string;
    readonly windsurf: string;
  }

  interface OverlayStyles {
    readonly backgroundColor: string;
    readonly border: string;
    readonly borderRadius: string;
    readonly boxShadow: string;
    readonly zIndex: string;
    readonly transition: string;
    readonly elementOffset: number;
  }

  interface TooltipStyles {
    readonly backgroundColor: string;
    readonly color: string;
    readonly padding: string;
    readonly borderRadius: string;
    readonly fontSize: string;
    readonly fontFamily: string;
    readonly border: string;
    readonly boxShadow: string;
    readonly zIndex: string;
    readonly margin: number;
  }

  interface MousePosition {
    clientX: number;
    clientY: number;
  }

  interface Position {
    left: number;
    top: number;
    width: number;
    height: number;
  }

  interface TooltipPosition {
    left: number;
    top: number;
    placement: string;
  }

  interface OverlayRect {
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
  }

  interface LocatorElement extends Element {
    __scalasourcepath?: string;
    __scalafilename?: string;
    __scalasourceline?: string;
  }

  interface LocatorStateType {
    altPressed: boolean;
    overlayDiv: HTMLDivElement | null;
    tooltipDiv: HTMLDivElement | null;
    currentTargetElement: LocatorElement | null;
    currentMousePosition: MousePosition;
    reset(): void;
    updateMousePosition(clientX: number, clientY: number): void;
    setAltPressed(pressed: boolean): void;
    resetCursor(): void;
    hideOverlay(): void;
  }

  type IDEProtocolKey = keyof EditorProtocol;

  // ============================================================================
  // CONSTANTS AND CONFIGURATION
  // ============================================================================

  const PREFER_IDE_KEY: string = "locator_prefer_ide_protocol";
  const PREFER_IDE_PROTOCOL: IDEProtocolKey = (window.localStorage.getItem(PREFER_IDE_KEY) as IDEProtocolKey) || "idea";
  const EDITOR_PROTOCOL: EditorProtocol = {
    "idea": "idea://open?file=",
    "vscode": "vscode://file/",
    "cursor": "cursor://file/",
    "windsurf": "windsurf://file/",
  };

  // Overlay styling constants
  const OVERLAY_STYLES: OverlayStyles = {
    backgroundColor: "rgba(0, 123, 255, 0.15)",
    border: "2px solid #007bff",
    borderRadius: "2px",
    boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.5), 0 2px 8px rgba(0, 0, 0, 0.15)",
    zIndex: "9999",
    transition: "all 0.1s ease-out",
    elementOffset: 8, // Offset around target elements
  };

  // Tooltip styling constants
  const TOOLTIP_STYLES: TooltipStyles = {
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    color: "white",
    padding: "8px 12px",
    borderRadius: "4px",
    fontSize: "12px",
    fontFamily: "monospace",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
    zIndex: "10000",
    margin: 8, // Margin from viewport edges
  };

  // Performance constants
  const MOUSEMOVE_THROTTLE_DELAY: number = 50; // ms

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  /**
   * Application state container
   */
  const LocatorState: LocatorStateType = {
    altPressed: false,
    overlayDiv: null,
    tooltipDiv: null,
    currentTargetElement: null,
    currentMousePosition: { clientX: 0, clientY: 0 },

    /**
     * Reset all state to initial values
     */
    reset(): void {
      this.altPressed = false;
      this.currentTargetElement = null;
      this.currentMousePosition = { clientX: 0, clientY: 0 };
      this.resetCursor();
      this.hideOverlay();
    },

    /**
     * Update current mouse position
     */
    updateMousePosition(clientX: number, clientY: number): void {
      this.currentMousePosition.clientX = clientX;
      this.currentMousePosition.clientY = clientY;
    },

    /**
     * Set Alt key pressed state and update cursor
     */
    setAltPressed(pressed: boolean): void {
      this.altPressed = pressed;
      document.body.style.cursor = pressed ? "crosshair" : "";
    },

    /**
     * Reset cursor to default
     */
    resetCursor(): void {
      document.body.style.cursor = "";
    },

    /**
     * Hide overlay and tooltip
     */
    hideOverlay(): void {
      if (this.overlayDiv) {
        this.overlayDiv.style.display = "none";
      }
      if (this.tooltipDiv) {
        this.tooltipDiv.style.display = "none";
      }
    }
  };

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Throttle function to limit how often a function can be called
   * @param fn - Function to throttle
   * @param delay - Minimum delay between calls in milliseconds
   * @returns Throttled function
   */
  function throttle<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
    let lastCall: number = 0;
    return (...args: Parameters<T>): void => {
      const now: number = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        fn(...args);
      }
    };
  }

  /**
   * Open file at source path using configured IDE protocol
   * @param sourcePath - Path to the source file
   * @param sourceLine - Line number in the source file
   */
  function openFileAtSourcePath(sourcePath: string, sourceLine?: string): void {
    let uri: string = `${EDITOR_PROTOCOL[PREFER_IDE_PROTOCOL]}${sourcePath}`;
    if (sourceLine) {
      if (PREFER_IDE_PROTOCOL === "idea") {
        uri += `&line=${sourceLine}`;
      } else {
        uri += `:${sourceLine}`;
      }
    }
    window.open(uri, "_blank");
  }

  /**
   * Find the nearest parent element with Scala source path information
   * @param startElement - Element to start searching from
   * @returns Element with __scalasourcepath property or null
   */
  function findLocatorElement(startElement: Element): LocatorElement | null {
    let element: Element | null = startElement;

    // Traverse up the DOM tree to find an element with __scalasourcepath
    while (element && element !== document.body) {
      if (Object.hasOwn(element, "__scalasourcepath")) {
        return element as LocatorElement;
      }
      element = element.parentElement;
    }

    return null;
  }

  /**
   * Get the topmost element with source path information at mouse position
   * @param mouseEvent - Mouse event with clientX and clientY
   * @returns Target element or null if none found
   */
  function getTargetElementAtPosition(mouseEvent: MouseEvent): LocatorElement | null {
    const elementsAtPoint: Element[] = document.elementsFromPoint(
      mouseEvent.clientX,
      mouseEvent.clientY
    );

    // Find the first element with __scalasourcepath property
    for (const element of elementsAtPoint) {
      const locatorElement: LocatorElement | null = findLocatorElement(element);
      if (locatorElement) {
        return locatorElement;
      }
    }

    return null;
  }

  // ============================================================================
  // OVERLAY CREATION AND MANAGEMENT
  // ============================================================================

  /**
   * Create the overlay element that highlights target elements
   * @returns Created overlay element
   */
  function createOverlayElement(): HTMLDivElement {
    const div: HTMLDivElement = document.createElement("div");
    div.id = "locator-overlay";

    // Apply base styles
    Object.assign(div.style, {
      position: "fixed",
      pointerEvents: "auto",
      backgroundColor: OVERLAY_STYLES.backgroundColor,
      border: OVERLAY_STYLES.border,
      borderRadius: OVERLAY_STYLES.borderRadius,
      boxShadow: OVERLAY_STYLES.boxShadow,
      zIndex: OVERLAY_STYLES.zIndex,
      display: "none",
      boxSizing: "border-box",
      transition: OVERLAY_STYLES.transition,
      cursor: "pointer",
    });

    // Add click event listener
    div.addEventListener("click", handleOverlayClick);

    document.body.appendChild(div);
    return div;
  }

  /**
   * Create the tooltip element that shows element information
   * @returns Created tooltip element
   */
  function createTooltipElement(): HTMLDivElement {
    const tooltip: HTMLDivElement = document.createElement("div");
    tooltip.id = "locator-tooltip";

    // Apply base styles
    Object.assign(tooltip.style, {
      position: "fixed",
      pointerEvents: "none",
      backgroundColor: TOOLTIP_STYLES.backgroundColor,
      color: TOOLTIP_STYLES.color,
      padding: TOOLTIP_STYLES.padding,
      borderRadius: TOOLTIP_STYLES.borderRadius,
      fontSize: TOOLTIP_STYLES.fontSize,
      fontFamily: TOOLTIP_STYLES.fontFamily,
      border: TOOLTIP_STYLES.border,
      boxShadow: TOOLTIP_STYLES.boxShadow,
      whiteSpace: "nowrap",
      zIndex: TOOLTIP_STYLES.zIndex,
      display: "none",
      boxSizing: "border-box",
      transition: "all 0.1s ease-out",
    });

    document.body.appendChild(tooltip);
    return tooltip;
  }

  /**
   * Initialize overlay and tooltip elements if they don't exist
   */
  function initializeOverlayElements(): void {
    if (!LocatorState.overlayDiv) {
      LocatorState.overlayDiv = createOverlayElement();
    }
    if (!LocatorState.tooltipDiv) {
      LocatorState.tooltipDiv = createTooltipElement();
    }
  }

  // ============================================================================
  // POSITIONING CALCULATIONS
  // ============================================================================

  /**
   * Calculate overlay position with bounds checking
   * @param targetRect - Bounding rectangle of target element
   * @returns Position object with left, top, width, height
   */
  function calculateOverlayPosition(targetRect: DOMRect): Position {
    const offset: number = OVERLAY_STYLES.elementOffset;
    const viewportWidth: number = window.innerWidth;
    const viewportHeight: number = window.innerHeight;

    // Calculate position with offset
    const left: number = targetRect.left - offset;
    const top: number = targetRect.top - offset;
    const width: number = targetRect.width + offset * 2;
    const height: number = targetRect.height + offset * 2;

    // Ensure overlay stays within viewport bounds
    const adjustedLeft: number = Math.max(0, Math.min(left, viewportWidth - width));
    const adjustedTop: number = Math.max(0, Math.min(top, viewportHeight - height));
    const adjustedWidth: number = Math.min(width, viewportWidth - adjustedLeft);
    const adjustedHeight: number = Math.min(height, viewportHeight - adjustedTop);

    return {
      left: adjustedLeft,
      top: adjustedTop,
      width: adjustedWidth,
      height: adjustedHeight,
    };
  }

  /**
   * Calculate optimal tooltip position to avoid viewport edges
   * @param overlayRect - Overlay rectangle with position and dimensions
   * @param tooltipWidth - Tooltip width
   * @param tooltipHeight - Tooltip height
   * @returns Position object with left, top, and placement
   */
  function calculateTooltipPosition(overlayRect: OverlayRect, tooltipWidth: number, tooltipHeight: number): TooltipPosition {
    const viewportWidth: number = window.innerWidth;
    const viewportHeight: number = window.innerHeight;
    const margin: number = TOOLTIP_STYLES.margin;

    // Define position calculation strategies
    const strategies: TooltipPosition[] = [
      // Bottom center (default)
      {
        left: overlayRect.left + overlayRect.width / 2 - tooltipWidth / 2,
        top: overlayRect.bottom + margin,
        placement: "bottom",
      },
      // Top center
      {
        left: overlayRect.left + overlayRect.width / 2 - tooltipWidth / 2,
        top: overlayRect.top - tooltipHeight - margin,
        placement: "top",
      },
      // Right center
      {
        left: overlayRect.right + margin,
        top: overlayRect.top + overlayRect.height / 2 - tooltipHeight / 2,
        placement: "right",
      },
      // Left center
      {
        left: overlayRect.left - tooltipWidth - margin,
        top: overlayRect.top + overlayRect.height / 2 - tooltipHeight / 2,
        placement: "left",
      },
    ];

    // Try each strategy and return the first that fits
    for (const position of strategies) {
      if (isPositionWithinViewport(position, tooltipWidth, tooltipHeight, margin)) {
        return position;
      }
    }

    // Fallback: position at viewport edges to keep tooltip visible
    return {
      left: Math.max(
        margin,
        Math.min(
          overlayRect.left + overlayRect.width / 2 - tooltipWidth / 2,
          viewportWidth - tooltipWidth - margin
        )
      ),
      top: Math.max(
        margin,
        Math.min(
          overlayRect.bottom + margin,
          viewportHeight - tooltipHeight - margin
        )
      ),
      placement: "fallback",
    };
  }

  /**
   * Check if a position fits within the viewport
   * @param position - Position with left and top
   * @param width - Element width
   * @param height - Element height
   * @param margin - Margin from viewport edges
   * @returns True if position fits within viewport
   */
  function isPositionWithinViewport(position: { left: number; top: number }, width: number, height: number, margin: number): boolean {
    const viewportWidth: number = window.innerWidth;
    const viewportHeight: number = window.innerHeight;

    return (
      position.left >= margin &&
      position.top >= margin &&
      position.left + width <= viewportWidth - margin &&
      position.top + height <= viewportHeight - margin
    );
  }

  // ============================================================================
  // OVERLAY UPDATE LOGIC
  // ============================================================================

  /**
   * Update overlay and tooltip position based on target element
   * @param targetElement - Element to highlight or null to hide
   */
  function updateOverlayPosition(targetElement: LocatorElement | null): void {
    initializeOverlayElements();

    // Store current target for click handling
    LocatorState.currentTargetElement = targetElement;

    if (!targetElement) {
      LocatorState.hideOverlay();
      return;
    }

    // Validate required properties
    const scalasourcepath: string | undefined = targetElement.__scalasourcepath;
    const scalafilename: string | undefined = targetElement.__scalafilename;
    const scalasourceline: string | undefined = targetElement.__scalasourceline;

    if (!scalasourcepath || !scalafilename || !scalasourceline) {
      LocatorState.hideOverlay();
      return;
    }

    // Calculate and apply overlay position
    const targetRect: DOMRect = targetElement.getBoundingClientRect();
    const overlayPosition: Position = calculateOverlayPosition(targetRect);

    applyOverlayStyles(overlayPosition);

    // Update tooltip
    updateTooltipPosition(`${scalafilename}:${scalasourceline}`, overlayPosition);
  }

  /**
   * Apply calculated position styles to overlay element
   * @param position - Position object with left, top, width, height
   */
  function applyOverlayStyles(position: Position): void {
    if (LocatorState.overlayDiv) {
      Object.assign(LocatorState.overlayDiv.style, {
        left: `${position.left}px`,
        top: `${position.top}px`,
        width: `${position.width}px`,
        height: `${position.height}px`,
        display: "block",
      });
    }
  }

  /**
   * Update tooltip content and position
   * @param content - Tooltip text content
   * @param overlayPosition - Overlay position for tooltip positioning
   */
  function updateTooltipPosition(content: string, overlayPosition: Position): void {
    const tooltip: HTMLDivElement | null = LocatorState.tooltipDiv;

    if (!tooltip) return;

    // Set content and make visible to measure dimensions
    tooltip.textContent = content;
    tooltip.style.display = "block";

    // Get tooltip dimensions
    const tooltipRect: DOMRect = tooltip.getBoundingClientRect();
    const tooltipWidth: number = tooltipRect.width;
    const tooltipHeight: number = tooltipRect.height;

    // Create overlay rect for positioning calculations
    const overlayRect: OverlayRect = {
      left: overlayPosition.left,
      top: overlayPosition.top,
      right: overlayPosition.left + overlayPosition.width,
      bottom: overlayPosition.top + overlayPosition.height,
      width: overlayPosition.width,
      height: overlayPosition.height,
    };

    // Calculate and apply tooltip position
    const tooltipPosition: TooltipPosition = calculateTooltipPosition(
      overlayRect,
      tooltipWidth,
      tooltipHeight
    );

    Object.assign(tooltip.style, {
      left: `${tooltipPosition.left}px`,
      top: `${tooltipPosition.top}px`,
    });
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handle overlay click events to open source files
   * @param event - Click event
   */
  function handleOverlayClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    try {
      const targetElement: LocatorElement | null = LocatorState.currentTargetElement;

      if (targetElement && targetElement.__scalasourcepath) {
        const sourcePath: string = targetElement.__scalasourcepath;
        const sourceLine: string | undefined = targetElement.__scalasourceline;

        openFileAtSourcePath(sourcePath, sourceLine);

        // Exit locator mode after successful click
        LocatorState.reset();
      } else {
        console.warn("No source path found for the clicked element");
      }
    } catch (error) {
      console.error("Error handling overlay click:", error);
    }
  }

  /**
   * Handle keydown events for Alt key detection
   * @param event - Keyboard event
   */
  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key === "Alt" && !LocatorState.altPressed) {
      // Alt key pressed for the first time - immediately trigger overlay at current mouse position
      LocatorState.setAltPressed(true);

      // Create a synthetic mouse event with current mouse position
      const syntheticMouseEvent: MouseEvent = {
        clientX: LocatorState.currentMousePosition.clientX,
        clientY: LocatorState.currentMousePosition.clientY
      } as MouseEvent;

      // Immediately render overlay at current mouse position
      renderLocatorOverlay(syntheticMouseEvent);
    }
  }

  /**
   * Handle keyup events for Alt key release
   * @param event - Keyboard event
   */
  function handleKeyUp(event: KeyboardEvent): void {
    if (event.key === "Alt") {
      LocatorState.setAltPressed(false);
      LocatorState.hideOverlay();
    }
  }

  /**
   * Handle window blur events to reset state
   */
  function handleWindowBlur(): void {
    LocatorState.reset();
  }

  /**
   * Handle mouse move events to update overlay position
   * @param event - Mouse event
   */
  function handleMouseMove(event: MouseEvent): void {
    // Always update current mouse position for immediate Alt-key response
    LocatorState.updateMousePosition(event.clientX, event.clientY);

    if (LocatorState.altPressed) {
      renderLocatorOverlay(event);
    } else {
      LocatorState.hideOverlay();
    }
  }

  // ============================================================================
  // MAIN RENDERING LOGIC
  // ============================================================================

  /**
   * Main function to render locator overlay based on mouse position
   * @param mouseEvent - Mouse event or null to hide overlay
   */
  function renderLocatorOverlay(mouseEvent: MouseEvent | null): void {
    if (!mouseEvent) {
      LocatorState.hideOverlay();
      return;
    }

    const targetElement: LocatorElement | null = getTargetElementAtPosition(mouseEvent);

    updateOverlayPosition(targetElement);
  }

  // ============================================================================
  // EVENT LISTENER SETUP
  // ============================================================================

  /**
   * Initialize all event listeners
   */
  function initializeEventListeners(): void {
    // Keyboard event listeners
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Window focus management
    window.addEventListener("blur", handleWindowBlur);

    // Mouse movement with throttling for performance
    window.addEventListener(
      "mousemove",
      throttle(handleMouseMove, MOUSEMOVE_THROTTLE_DELAY)
    );
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  // Initialize event listeners when script loads
  initializeEventListeners();

})();
