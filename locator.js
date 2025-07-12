/**
 * Scala Source Locator
 *
 * This module provides visual overlay functionality for Scala source code navigation.
 * When Alt key is pressed, it highlights DOM elements that have source path information
 * and allows clicking to open the corresponding source file in the configured IDE.
 */

(function() {
  'use strict';

  // ============================================================================
  // CONSTANTS AND CONFIGURATION
  // ============================================================================

  const PREFER_IDE_KEY = "locator_prefer_ide_protocol";
  const PREFER_IDE_PROTOCOL = window.localStorage.getItem(PREFER_IDE_KEY) || "idea";
  const PARENT_TOOLTIP_COUNT_KEY = "locator_parent_tooltip_count";
  const DEFAULT_PARENT_COUNT = 3;
  const MAX_PARENT_COUNT = 3;
  const EDITOR_PROTOCOL = {
    "idea": "idea://open?file=",
    "vscode": "vscode://file/",
    "cursor": "cursor://file/",
    "windsurf": "windsurf://file/",
  };

  // Overlay styling constants
  const OVERLAY_STYLES = {
    backgroundColor: "rgba(0, 123, 255, 0.15)",
    border: "2px solid #007bff",
    borderRadius: "2px",
    boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.5), 0 2px 8px rgba(0, 0, 0, 0.15)",
    zIndex: "9999",
    transition: "all 0.1s ease-out",
    elementOffset: 8, // Offset around target elements
  };

  // Tooltip styling constants
  const TOOLTIP_STYLES = {
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
  const MOUSEMOVE_THROTTLE_DELAY = 50; // ms

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  /**
   * Application state container
   */
  const LocatorState = {
    altPressed: false,
    overlayDiv: null,
    tooltipDiv: null,
    parentTooltipDiv: null,
    currentTargetElement: null,
    currentMousePosition: { clientX: 0, clientY: 0 },
    parentTooltipVisible: false,
    parentTooltipTimeout: null,
    lastTargetElement: null, // Track last target to detect component changes

    /**
     * Reset all state to initial values
     */
    reset() {
      this.altPressed = false;
      this.currentTargetElement = null;
      this.lastTargetElement = null;
      this.currentMousePosition = { clientX: 0, clientY: 0 };
      this.parentTooltipVisible = false;
      if (this.parentTooltipTimeout) {
        clearTimeout(this.parentTooltipTimeout);
        this.parentTooltipTimeout = null;
      }
      this.resetCursor();
      this.hideOverlay();
      this.hideParentTooltip();
    },

    /**
     * Update current mouse position
     */
    updateMousePosition(clientX, clientY) {
      this.currentMousePosition.clientX = clientX;
      this.currentMousePosition.clientY = clientY;
    },

    /**
     * Set Alt key pressed state and update cursor
     */
    setAltPressed(pressed) {
      this.altPressed = pressed;
      document.body.style.cursor = pressed ? "crosshair" : "";
    },

    /**
     * Reset cursor to default
     */
    resetCursor() {
      document.body.style.cursor = "";
    },

    /**
     * Hide overlay and tooltip
     */
    hideOverlay() {
      if (this.overlayDiv) {
        this.overlayDiv.style.display = "none";
      }
      if (this.tooltipDiv) {
        this.tooltipDiv.style.display = "none";
      }
    },

    /**
     * Hide parent tooltip
     */
    hideParentTooltip() {
      if (this.parentTooltipDiv) {
        this.parentTooltipDiv.style.display = "none";
      }
      this.parentTooltipVisible = false;
    }
  };

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

  /**
   * Get the topmost element with source path information at mouse position
   * @param {MouseEvent} mouseEvent - Mouse event with clientX and clientY
   * @returns {Element|null} Target element or null if none found
   */
  function getTargetElementAtPosition(mouseEvent) {
    const elementsAtPoint = document.elementsFromPoint(
      mouseEvent.clientX,
      mouseEvent.clientY
    );

    // Find the first element with __scalasourcepath property
    for (const element of elementsAtPoint) {
      const locatorElement = findLocatorElement(element);
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
   * @returns {HTMLDivElement} Created overlay element
   */
  function createOverlayElement() {
    const div = document.createElement("div");
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
   * @returns {HTMLDivElement} Created tooltip element
   */
  function createTooltipElement() {
    const tooltip = document.createElement("div");
    tooltip.id = "locator-tooltip";

    // Apply base styles
    Object.assign(tooltip.style, {
      position: "fixed",
      pointerEvents: "none", // Changed back to none since we're using keyboard interaction
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
   * Create the parent tooltip element that shows parent component hierarchy
   * @returns {HTMLDivElement} Created parent tooltip element
   */
  function createParentTooltipElement() {
    const tooltip = document.createElement("div");
    tooltip.id = "locator-parent-tooltip";

    // Apply base styles with higher z-index
    Object.assign(tooltip.style, {
      position: "fixed",
      pointerEvents: "none", // Changed to none since we're using keyboard interaction
      backgroundColor: TOOLTIP_STYLES.backgroundColor,
      color: TOOLTIP_STYLES.color,
      padding: "12px 16px",
      borderRadius: TOOLTIP_STYLES.borderRadius,
      fontSize: TOOLTIP_STYLES.fontSize,
      fontFamily: TOOLTIP_STYLES.fontFamily,
      border: TOOLTIP_STYLES.border,
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
      whiteSpace: "nowrap",
      zIndex: (parseInt(TOOLTIP_STYLES.zIndex) + 1).toString(),
      display: "none",
      boxSizing: "border-box",
      transition: "all 0.1s ease-out",
      minWidth: "200px",
    });

    document.body.appendChild(tooltip);
    return tooltip;
  }

  /**
   * Initialize overlay and tooltip elements if they don't exist
   */
  function initializeOverlayElements() {
    if (!LocatorState.overlayDiv) {
      LocatorState.overlayDiv = createOverlayElement();
    }
    if (!LocatorState.tooltipDiv) {
      LocatorState.tooltipDiv = createTooltipElement();
    }
    if (!LocatorState.parentTooltipDiv) {
      LocatorState.parentTooltipDiv = createParentTooltipElement();
    }
  }

  // ============================================================================
  // POSITIONING CALCULATIONS
  // ============================================================================

  /**
   * Calculate overlay position with bounds checking
   * @param {DOMRect} targetRect - Bounding rectangle of target element
   * @returns {Object} Position object with left, top, width, height
   */
  function calculateOverlayPosition(targetRect) {
    const offset = OVERLAY_STYLES.elementOffset;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate position with offset
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
   * Calculate optimal tooltip position to avoid viewport edges
   * @param {Object} overlayRect - Overlay rectangle with position and dimensions
   * @param {number} tooltipWidth - Tooltip width
   * @param {number} tooltipHeight - Tooltip height
   * @returns {Object} Position object with left, top, and placement
   */
  function calculateTooltipPosition(overlayRect, tooltipWidth, tooltipHeight) {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = TOOLTIP_STYLES.margin;

    // Define position calculation strategies
    const strategies = [
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
   * @param {Object} position - Position with left and top
   * @param {number} width - Element width
   * @param {number} height - Element height
   * @param {number} margin - Margin from viewport edges
   * @returns {boolean} True if position fits within viewport
   */
  function isPositionWithinViewport(position, width, height, margin) {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

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
   * @param {Element|null} targetElement - Element to highlight or null to hide
   */
  function updateOverlayPosition(targetElement) {
    initializeOverlayElements();

    // Check for component change and hide parent tooltip if needed
    checkForComponentChange(targetElement);

    // Store current target for click handling
    LocatorState.currentTargetElement = targetElement;

    if (!targetElement) {
      LocatorState.hideOverlay();
      return;
    }

    // Validate required properties
    const scalasourcepath = targetElement.__scalasourcepath;
    const scalafilename = targetElement.__scalafilename;
    const scalasourceline = targetElement.__scalasourceline;

    if (!scalasourcepath || !scalafilename || !scalasourceline) {
      LocatorState.hideOverlay();
      return;
    }

    // Calculate and apply overlay position
    const targetRect = targetElement.getBoundingClientRect();
    const overlayPosition = calculateOverlayPosition(targetRect);

    applyOverlayStyles(overlayPosition);

    // Update tooltip
    updateTooltipPosition(`${scalafilename}:${scalasourceline}`, overlayPosition);
  }

  /**
   * Apply calculated position styles to overlay element
   * @param {Object} position - Position object with left, top, width, height
   */
  function applyOverlayStyles(position) {
    Object.assign(LocatorState.overlayDiv.style, {
      left: `${position.left}px`,
      top: `${position.top}px`,
      width: `${position.width}px`,
      height: `${position.height}px`,
      display: "block",
    });
  }

  /**
   * Update tooltip content and position
   * @param {string} content - Tooltip text content
   * @param {Object} overlayPosition - Overlay position for tooltip positioning
   */
  function updateTooltipPosition(content, overlayPosition) {
    const tooltip = LocatorState.tooltipDiv;

    // Set content and make visible to measure dimensions
    tooltip.textContent = content;
    tooltip.style.display = "block";

    // Get tooltip dimensions
    const tooltipRect = tooltip.getBoundingClientRect();
    const tooltipWidth = tooltipRect.width;
    const tooltipHeight = tooltipRect.height;

    // Create overlay rect for positioning calculations
    const overlayRect = {
      left: overlayPosition.left,
      top: overlayPosition.top,
      right: overlayPosition.left + overlayPosition.width,
      bottom: overlayPosition.top + overlayPosition.height,
      width: overlayPosition.width,
      height: overlayPosition.height,
    };

    // Calculate and apply tooltip position
    const tooltipPosition = calculateTooltipPosition(
      overlayRect,
      tooltipWidth,
      tooltipHeight
    );

    Object.assign(tooltip.style, {
      left: `${tooltipPosition.left}px`,
      top: `${tooltipPosition.top}px`,
    });
  }

  /**
   * Show parent tooltip with hierarchical component information
   * @param {Array} parents - Array of parent component information
   */
  function showParentTooltip(parents) {
    if (!LocatorState.parentTooltipDiv || parents.length === 0) return;

    // Create hierarchical content
    const content = createParentTooltipContent(parents);
    LocatorState.parentTooltipDiv.innerHTML = content;

    // Make visible to measure dimensions
    LocatorState.parentTooltipDiv.style.display = "block";
    const tooltipRect = LocatorState.parentTooltipDiv.getBoundingClientRect();

    // Calculate position relative to the main tooltip
    const mainTooltip = LocatorState.tooltipDiv;
    if (!mainTooltip) return;

    const mainTooltipRect = mainTooltip.getBoundingClientRect();
    const position = calculateParentTooltipPosition(mainTooltipRect, tooltipRect.width, tooltipRect.height);

    // Apply position
    Object.assign(LocatorState.parentTooltipDiv.style, {
      left: `${position.left}px`,
      top: `${position.top}px`,
    });

    LocatorState.parentTooltipVisible = true;
  }

  /**
   * Toggle parent tooltip display when 'X' key is pressed while Alt is held
   */
  function toggleParentTooltip() {
    // Only toggle if Alt is pressed and a tooltip is currently visible
    if (!LocatorState.altPressed || !LocatorState.currentTargetElement) return;
    if (!LocatorState.tooltipDiv || LocatorState.tooltipDiv.style.display === "none") return;

    const parentCount = getParentTooltipCount();
    if (parentCount === 0) return;

    if (LocatorState.parentTooltipVisible) {
      // Hide parent tooltip
      LocatorState.hideParentTooltip();
    } else {
      // Show parent tooltip
      const parents = findParentComponents(LocatorState.currentTargetElement, parentCount);
      if (parents.length > 0) {
        showParentTooltip(parents);
      }
    }
  }

  /**
   * Create HTML content for parent tooltip with hierarchical styling
   * @param {Array} parents - Array of parent component information
   * @returns {string} HTML string for tooltip content
   */
  function createParentTooltipContent(parents) {
    const items = parents.map((parent, index) => {
      const indent = "  ".repeat(parent.level - 1);
      const connector = index === 0 ? "└─ " : "├─ ";
      return `<div style="margin: 4px 0; font-family: monospace;">
        <span style="color: #888;">${indent}${connector}</span>
        <span style="color: #fff;">${parent.filename}:${parent.line}</span>
      </div>`;
    });

    return `
      <div style="color: #ccc; font-size: 11px; margin-bottom: 8px;">Parent Components:</div>
      ${items.join("")}
    `;
  }

  /**
   * Calculate position for parent tooltip relative to main tooltip
   * @param {DOMRect} mainTooltipRect - Main tooltip bounding rectangle
   * @param {number} parentWidth - Parent tooltip width
   * @param {number} parentHeight - Parent tooltip height
   * @returns {Object} Position object with left and top coordinates
   */
  function calculateParentTooltipPosition(mainTooltipRect, parentWidth, parentHeight) {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 8;

    // Try positions in order of preference: right, left, bottom, top
    const positions = [
      // Right of main tooltip
      {
        left: mainTooltipRect.right + margin,
        top: mainTooltipRect.top,
      },
      // Left of main tooltip
      {
        left: mainTooltipRect.left - parentWidth - margin,
        top: mainTooltipRect.top,
      },
      // Below main tooltip
      {
        left: mainTooltipRect.left,
        top: mainTooltipRect.bottom + margin,
      },
      // Above main tooltip
      {
        left: mainTooltipRect.left,
        top: mainTooltipRect.top - parentHeight - margin,
      },
    ];

    // Find first position that fits in viewport
    for (const pos of positions) {
      if (
        pos.left >= 0 &&
        pos.top >= 0 &&
        pos.left + parentWidth <= viewportWidth &&
        pos.top + parentHeight <= viewportHeight
      ) {
        return pos;
      }
    }

    // Fallback to right position with viewport clamping
    return {
      left: Math.max(0, Math.min(mainTooltipRect.right + margin, viewportWidth - parentWidth)),
      top: Math.max(0, Math.min(mainTooltipRect.top, viewportHeight - parentHeight)),
    };
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Check if the target element has changed and hide parent tooltip if so
   * @param {Element} newTargetElement - New target element
   */
  function checkForComponentChange(newTargetElement) {
    if (LocatorState.lastTargetElement !== newTargetElement) {
      // Component changed, hide parent tooltip
      LocatorState.hideParentTooltip();
      LocatorState.lastTargetElement = newTargetElement;
    }
  }

  /**
   * Handle overlay click events to open source files
   * @param {Event} event - Click event
   */
  function handleOverlayClick(event) {
    event.preventDefault();
    event.stopPropagation();

    try {
      const targetElement = LocatorState.currentTargetElement;

      if (targetElement && targetElement.__scalasourcepath) {
        const sourcePath = targetElement.__scalasourcepath;
        const sourceLine = targetElement.__scalasourceline

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
   * Handle keydown events for Alt key detection and X key toggle
   * @param {KeyboardEvent} event - Keyboard event
   */
  function handleKeyDown(event) {
    console.log("Key down", event.key);
    if (event.key === "Alt" && !LocatorState.altPressed) {
      // Alt key pressed for the first time - immediately trigger overlay at current mouse position
      LocatorState.setAltPressed(true);

      // Create a synthetic mouse event with current mouse position
      const syntheticMouseEvent = {
        clientX: LocatorState.currentMousePosition.clientX,
        clientY: LocatorState.currentMousePosition.clientY
      };

      // Immediately render overlay at current mouse position
      renderLocatorOverlay(syntheticMouseEvent);
    } else if (event.key === "Shift") {
      console.log("X key pressed");
      // X key pressed - toggle parent tooltip if Alt is held and tooltip is visible
      if (LocatorState.altPressed) {
        event.preventDefault(); // Prevent any default behavior
        toggleParentTooltip();
      }
    }
  }

  /**
   * Handle keyup events for Alt key release
   * @param {KeyboardEvent} event - Keyboard event
   */
  function handleKeyUp(event) {
    if (event.key === "Alt") {
      LocatorState.setAltPressed(false);
      LocatorState.hideOverlay();
      LocatorState.hideParentTooltip();
    }
  }

  /**
   * Handle window blur events to reset state
   */
  function handleWindowBlur() {
    LocatorState.reset();
  }

  /**
   * Handle mouse move events to update overlay position
   * @param {MouseEvent} event - Mouse event
   */
  function handleMouseMove(event) {
    // Always update current mouse position for immediate Alt-key response
    LocatorState.updateMousePosition(event.clientX, event.clientY);

    if (LocatorState.altPressed) {
      renderLocatorOverlay(event);
    } else {
      LocatorState.hideOverlay();
      LocatorState.hideParentTooltip();
    }
  }

  // ============================================================================
  // MAIN RENDERING LOGIC
  // ============================================================================

  /**
   * Main function to render locator overlay based on mouse position
   * @param {MouseEvent|null} mouseEvent - Mouse event or null to hide overlay
   */
  function renderLocatorOverlay(mouseEvent) {
    if (!mouseEvent) {
      LocatorState.hideOverlay();
      return;
    }

    const targetElement = getTargetElementAtPosition(mouseEvent);

    updateOverlayPosition(targetElement);
  }

  // ============================================================================
  // EVENT LISTENER SETUP
  // ============================================================================

  /**
   * Initialize all event listeners
   */
  function initializeEventListeners() {
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
