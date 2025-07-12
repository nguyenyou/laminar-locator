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
  const DEFAULT_PARENT_COUNT = 5;
  const MAX_PARENT_COUNT = 5;
  const EDITOR_PROTOCOL = {
    "idea": "idea://open?file=",
    "vscode": "vscode://file/",
    "cursor": "cursor://file/",
    "windsurf": "windsurf://file/",
  };

  // Overlay styling constants - consistent with modern design principles
  const OVERLAY_STYLES = {
    backgroundColor: "rgba(0, 123, 255, 0.12)",
    border: "2px solid #007bff",
    borderRadius: "6px", // Consistent rounded corners
    boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.6), 0 4px 16px rgba(0, 123, 255, 0.25), 0 2px 8px rgba(0, 0, 0, 0.1)",
    zIndex: "9999",
    transition: "all 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    elementOffset: 6, // Consistent with card padding

    // Enhanced visual states
    hover: {
      backgroundColor: "rgba(0, 123, 255, 0.18)",
      boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.7), 0 6px 20px rgba(0, 123, 255, 0.35), 0 3px 12px rgba(0, 0, 0, 0.15)",
      transform: "scale(1.02)",
    },

    // Keyboard navigation specific styles - harmonious orange theme
    keyboard: {
      backgroundColor: "rgba(255, 140, 0, 0.15)",
      border: "3px solid #ff8c00",
      boxShadow: "0 0 0 2px rgba(255, 255, 255, 0.85), 0 0 16px rgba(255, 140, 0, 0.5), 0 4px 20px rgba(255, 140, 0, 0.3)",
      borderRadius: "8px", // Slightly more rounded for keyboard mode distinction
    }
  };

  // Navigation indicator styling constants (no animations)
  const NAVIGATION_INDICATOR_STYLES = {
    size: 24, // Slightly larger for better visibility
    offset: 6, // Increased distance from overlay edge
    backgroundColor: "rgba(255, 140, 0, 0.95)",
    color: "white",
    borderRadius: "50%",
    fontSize: "13px",
    fontWeight: "600",
    boxShadow: "0 3px 12px rgba(255, 140, 0, 0.4), 0 1px 4px rgba(0, 0, 0, 0.3)",
    zIndex: "10001", // Above overlay
    border: "2px solid rgba(255, 255, 255, 0.9)",

    // Different styles for different directions
    directions: {
      up: { symbol: "↑", position: "top" },
      down: { symbol: "↓", position: "bottom" },
      left: { symbol: "←", position: "left" },
      right: { symbol: "→", position: "right" }
    }
  };

  // Visual feedback animation constants
  const VISUAL_FEEDBACK_STYLES = {
    // Enhanced bounce animation for navigation indicators
    bounce: {
      duration: 350, // Slightly longer for smoother feel
      distance: 10, // Increased distance for more noticeable effect
      easing: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      returnDuration: 200, // Faster return for snappier feel
    },

    // Enhanced scale animation for overlay selection
    scale: {
      duration: 280, // Slightly longer for smoother scaling
      maxScale: 1.06, // Reduced scale for more subtle effect
      easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      returnDuration: 200,
    },

    // Enhanced pulse animation for boundary navigation
    pulse: {
      duration: 500, // Longer duration for more noticeable effect
      iterations: 2,
      easing: "cubic-bezier(0.4, 0, 0.6, 1)",
      intensity: 1.3, // Multiplier for pulse effect intensity
    },

    // New shimmer animation for initial appearance
    shimmer: {
      duration: 600,
      easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    },

    // Enhanced error animation (shake)
    error: {
      duration: 300,
      distance: 4,
      iterations: 3,
      easing: "cubic-bezier(0.36, 0.07, 0.19, 0.97)",
    }
  };

  // Tooltip styling constants - consistent with system design
  const TOOLTIP_STYLES = {
    backgroundColor: "rgba(0, 0, 0, 0.92)",
    color: "white",
    padding: "10px 14px", // Consistent with card padding scale
    borderRadius: "6px", // Matches overlay border radius
    fontSize: "12px",
    fontFamily: "ui-monospace, 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace",
    border: "1px solid rgba(255, 255, 255, 0.25)",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2)",
    zIndex: "10000",
    margin: 10, // Consistent spacing
    backdropFilter: "blur(8px)", // Modern backdrop blur effect
    lineHeight: "1.4", // Comfortable reading

    // Enhanced visual states for keyboard mode
    keyboard: {
      backgroundColor: "rgba(20, 20, 20, 0.95)",
      border: "1px solid rgba(255, 140, 0, 0.3)",
      boxShadow: "0 6px 24px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 140, 0, 0.2)",
      borderRadius: "8px", // Slightly more rounded to match keyboard overlay
    }
  };

  // Performance constants
  const MOUSEMOVE_THROTTLE_DELAY = 50; // ms
  const ANIMATION_FRAME_THROTTLE_DELAY = 16; // ~60fps
  const DEBOUNCE_DELAY = 100; // ms for debouncing rapid state changes

  // Status indicator styling constants - consistent with tooltip design
  const STATUS_INDICATOR_STYLES = {
    backgroundColor: "rgba(0, 0, 0, 0.88)",
    color: "white",
    padding: "8px 16px", // Slightly larger for better readability
    borderRadius: "20px", // Pill-shaped for modern look
    fontSize: "11px",
    fontFamily: "system-ui, -apple-system, sans-serif", // System font for UI elements
    fontWeight: "500",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2)",
    zIndex: "10002", // Above navigation indicators
    transition: "all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    backdropFilter: "blur(12px)", // Enhanced blur for better readability
  };

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  /**
   * Application state container
   */
  const LocatorState = {
    altPressed: false,
    shiftPressed: false,
    overlayDiv: null,
    tooltipDiv: null,
    parentTooltipDiv: null,
    statusIndicatorDiv: null, // Status indicator for keyboard navigation
    navigationIndicators: {}, // Store navigation indicator elements by direction

    currentTargetElement: null,
    currentMousePosition: { clientX: 0, clientY: 0 },
    parentTooltipVisible: false,
    parentTooltipTimeout: null,
    lastTargetElement: null, // Track last target to detect component changes
    parentTooltipToggled: false, // Track if parent tooltip was manually toggled

    // Keyboard navigation state
    keyboardNavigationActive: false, // Track if keyboard navigation is active
    keyboardSelectedElement: null, // Currently selected element via keyboard
    navigationMode: 'mouse', // 'mouse' or 'keyboard'

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
      this.hideOverlay();
      this.hideParentTooltip();
      this.hideNavigationIndicators();
    },

    /**
     * Set keyboard navigation mode and update visual state
     */
    setKeyboardNavigationActive(active) {
      this.keyboardNavigationActive = active;
      this.navigationMode = active ? 'keyboard' : 'mouse';
      if (!active) {
        this.keyboardSelectedElement = null;
        // When switching back to mouse mode, ensure the current target is updated
        // This will trigger a re-render with mouse mode styling
      }
    },

    /**
     * Set the currently selected element for keyboard navigation
     */
    setKeyboardSelectedElement(element) {
      this.keyboardSelectedElement = element;
      if (element) {
        this.keyboardNavigationActive = true;
        this.navigationMode = 'keyboard';
      }
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
     * Set Shift key pressed state
     */
    setShiftPressed(pressed) {
      this.shiftPressed = pressed;
    },

    /**
     * Reset cursor to default
     */
    resetCursor() {
      document.body.style.cursor = "";
    },

    /**
     * Hide overlay and tooltip with smooth exit animations
     */
    hideOverlay() {
      if (this.overlayDiv && this.overlayDiv.style.display !== "none") {
        // Fade out overlay
        this.overlayDiv.style.transition = "opacity 0.15s ease-out, transform 0.15s ease-out";
        this.overlayDiv.style.opacity = "0";
        this.overlayDiv.style.transform = "scale(0.95)";

        setTimeout(() => {
          this.overlayDiv.style.display = "none";
          this.overlayDiv.style.opacity = "1";
          this.overlayDiv.style.transform = "scale(1)";
          this.overlayDiv.style.transition = OVERLAY_STYLES.transition;
        }, 150);
      }

      if (this.tooltipDiv && this.tooltipDiv.style.display !== "none") {
        // Fade out tooltip
        this.tooltipDiv.style.opacity = "0";
        this.tooltipDiv.style.transform = "translateY(4px)";

        setTimeout(() => {
          this.tooltipDiv.style.display = "none";
        }, 150);
      }

      this.hideNavigationIndicators();
    },

    /**
     * Hide parent tooltip
     */
    hideParentTooltip() {
      if (this.parentTooltipDiv) {
        this.parentTooltipDiv.style.display = "none";
      }
      this.parentTooltipVisible = false;
    },

    /**
     * Hide all navigation indicators instantly (no animations)
     */
    hideNavigationIndicators() {
      Object.values(this.navigationIndicators).forEach(indicator => {
        if (indicator) {
          indicator.style.display = "none";
        }
      });
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
   * Batch DOM operations to reduce reflows
   * @param {Function} fn - Function containing DOM operations
   */
  function batchDOMOperations(fn) {
    requestAnimationFrame(() => {
      fn();
    });
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
  // NAVIGATION STATE ANALYSIS FUNCTIONS
  // ============================================================================

  /**
   * Analyze the navigation context for a given component
   * @param {Element} currentElement - Current element to analyze
   * @returns {Object} Navigation context information
   */
  function analyzeNavigationContext(currentElement) {
    if (!currentElement) {
      return {
        hasParent: false,
        hasChildren: false,
        siblingCount: 0,
        siblingPosition: 0,
        parentInfo: null,
        childCount: 0,
        isAtRoot: true,
        isAtLeaf: true,
        availableDirections: []
      };
    }

    const parent = findParentComponent(currentElement);
    const children = findChildComponents(currentElement);
    const siblings = findSiblingComponents(currentElement);

    // Calculate sibling position (1-based index)
    // Need to get all siblings including current element to find position
    let siblingPosition = 0;
    if (parent) {
      // Get all children of parent (which includes current element and its siblings)
      const allSiblings = findChildComponents(parent);
      siblingPosition = allSiblings.indexOf(currentElement) + 1;
    } else {
      // At root level, get all top-level components
      const topLevelComponents = findTopLevelComponents();
      siblingPosition = topLevelComponents.indexOf(currentElement) + 1;
    }

    // Determine available navigation directions
    const availableDirections = [];
    if (parent || findDeepestComponent()) availableDirections.push('up');
    if (children.length > 0 || findFirstComponent()) availableDirections.push('down');
    if (siblings.length > 0) {
      availableDirections.push('left', 'right');
    }

    // Get parent component info
    let parentInfo = null;
    if (parent) {
      parentInfo = {
        filename: parent.__scalafilename,
        line: parent.__scalasourceline,
        element: parent
      };
    }

    return {
      hasParent: !!parent,
      hasChildren: children.length > 0,
      siblingCount: siblings.length,
      siblingPosition: siblingPosition,
      parentInfo: parentInfo,
      childCount: children.length,
      isAtRoot: !parent,
      isAtLeaf: children.length === 0,
      availableDirections: availableDirections,
      siblings: siblings,
      children: children
    };
  }



  /**
   * Get short navigation hints for tooltip
   * @param {Element} currentElement - Current element
   * @returns {string} Short navigation hints
   */
  function getNavigationHints(currentElement) {
    const context = analyzeNavigationContext(currentElement);

    if (context.availableDirections.length === 0) {
      return "No navigation available";
    }

    const hints = [];
    if (context.availableDirections.includes('up')) {
      hints.push(context.hasParent ? "↑Parent" : "↑Cycle");
    }
    if (context.availableDirections.includes('down')) {
      hints.push(context.hasChildren ? "↓Child" : "↓Cycle");
    }
    if (context.availableDirections.includes('left') || context.availableDirections.includes('right')) {
      hints.push(`←→Siblings(${context.siblingCount + 1})`);
    }

    return hints.join(' ');
  }

  // ============================================================================
  // KEYBOARD NAVIGATION FUNCTIONS
  // ============================================================================

  /**
   * Navigate to parent component (with cycling to deepest component if at root)
   * @param {Element} currentElement - Current element
   * @returns {Element|null} Parent component or deepest component if at root
   */
  function navigateToParent(currentElement) {
    if (!currentElement) return null;

    const parent = findParentComponent(currentElement);
    if (parent) {
      return parent;
    } else {
      // At root level, cycle to the deepest component
      return findDeepestComponent();
    }
  }

  /**
   * Navigate to first child component (with cycling to first component if no children)
   * @param {Element} currentElement - Current element
   * @returns {Element|null} First child component or first component if no children
   */
  function navigateToFirstChild(currentElement) {
    if (!currentElement) return null;

    const children = findChildComponents(currentElement);
    if (children.length > 0) {
      return children[0];
    } else {
      // No children, cycle to the first component in the tree
      return findFirstComponent();
    }
  }

  /**
   * Navigate to next sibling component (with cycling)
   * @param {Element} currentElement - Current element
   * @returns {Element|null} Next sibling component or null if none found
   */
  function navigateToNextSibling(currentElement) {
    if (!currentElement) return null;
    const allSiblings = getAllSiblingsIncludingCurrent(currentElement);
    return getNextSibling(currentElement, allSiblings);
  }

  /**
   * Navigate to previous sibling component (with cycling)
   * @param {Element} currentElement - Current element
   * @returns {Element|null} Previous sibling component or null if none found
   */
  function navigateToPreviousSibling(currentElement) {
    if (!currentElement) return null;
    const allSiblings = getAllSiblingsIncludingCurrent(currentElement);
    return getPreviousSibling(currentElement, allSiblings);
  }

  /**
   * Handle enhanced keyboard navigation with improved feedback
   * @param {string} direction - 'up', 'down', 'left', 'right'
   */
  function handleKeyboardNavigation(direction) {
    let targetElement = null;
    const currentElement = LocatorState.keyboardSelectedElement || LocatorState.currentTargetElement;
    let isBoundaryNavigation = false;
    let statusMessage = "";

    if (!currentElement) {
      // No current element, start with first top-level component
      const topLevel = findTopLevelComponents();
      if (topLevel.length > 0) {
        targetElement = topLevel[0];
        statusMessage = "Started keyboard navigation";
        showStatusIndicator(statusMessage, 1500);
      } else {
        showStatusIndicator("No components found", 2000);
        return;
      }
    } else {
      const context = analyzeNavigationContext(currentElement);

      switch (direction) {
        case 'up':
          targetElement = navigateToParent(currentElement);
          isBoundaryNavigation = !context.hasParent;
          statusMessage = isBoundaryNavigation ?
            "Cycled to deepest component" :
            `Moved to parent: ${targetElement.__scalafilename}:${targetElement.__scalasourceline}`;
          break;
        case 'down':
          targetElement = navigateToFirstChild(currentElement);
          isBoundaryNavigation = !context.hasChildren;
          statusMessage = isBoundaryNavigation ?
            "Cycled to first component" :
            `Moved to child: ${targetElement.__scalafilename}:${targetElement.__scalasourceline}`;
          break;
        case 'left':
          targetElement = navigateToPreviousSibling(currentElement);
          isBoundaryNavigation = context.siblingCount === 0 || context.siblingPosition === 1;
          if (context.siblingCount === 0) {
            statusMessage = "No siblings available";
          } else {
            statusMessage = isBoundaryNavigation ?
              "Cycled to last sibling" :
              `Previous sibling (${context.siblingPosition - 1}/${context.siblingCount + 1})`;
          }
          break;
        case 'right':
          targetElement = navigateToNextSibling(currentElement);
          isBoundaryNavigation = context.siblingCount === 0 ||
            context.siblingPosition === (context.siblingCount + 1);
          if (context.siblingCount === 0) {
            statusMessage = "No siblings available";
          } else {
            statusMessage = isBoundaryNavigation ?
              "Cycled to first sibling" :
              `Next sibling (${context.siblingPosition + 1}/${context.siblingCount + 1})`;
          }
          break;
      }
    }

    if (targetElement) {
      LocatorState.setKeyboardSelectedElement(targetElement);
      updateOverlayPosition(targetElement);

      // Show status message for successful navigation
      if (statusMessage && !statusMessage.includes("Cycled")) {
        showStatusIndicator(statusMessage, 1500);
      }

      // Provide visual feedback
      if (isBoundaryNavigation) {
        triggerVisualFeedback('boundary', direction);
      } else {
        triggerVisualFeedback('navigate', direction);
      }
    } else {
      showStatusIndicator("Navigation failed", 2000);
      triggerVisualFeedback('error', direction);
    }
  }

  /**
   * Handle Enter key press to open selected component file with enhanced feedback
   */
  function handleKeyboardFileOpen() {
    const targetElement = LocatorState.keyboardSelectedElement || LocatorState.currentTargetElement;

    if (!targetElement) {
      showStatusIndicator("No component selected", 2000);
      triggerVisualFeedback('error', 'enter');
      return;
    }

    // Validate required properties
    const scalasourcepath = targetElement.__scalasourcepath;
    const scalasourceline = targetElement.__scalasourceline;
    const scalafilename = targetElement.__scalafilename;

    if (!scalasourcepath) {
      showStatusIndicator("Invalid component - no source path", 2000);
      triggerVisualFeedback('error', 'enter');
      return;
    }

    try {
      // Show opening status
      showStatusIndicator(`Opening ${scalafilename}:${scalasourceline}...`, 1000);

      // Trigger visual feedback to indicate action
      triggerScaleAnimation();

      // Open file at source path (same logic as handleOverlayClick)
      openFileAtSourcePath(scalasourcepath, scalasourceline);

      // Exit locator mode after successful file opening
      setTimeout(() => {
        LocatorState.reset();
      }, 300); // Small delay to show the feedback
    } catch (error) {
      console.error("Error opening file from keyboard navigation:", error);
      showStatusIndicator("Failed to open file", 2000);
      triggerVisualFeedback('error', 'enter');
    }
  }

  // ============================================================================
  // COMPONENT TREE NAVIGATION FUNCTIONS
  // ============================================================================

  /**
   * Find the immediate parent component with source path information
   * @param {Element} currentElement - Current element to start searching from
   * @returns {Element|null} Parent element with __scalasourcepath property or null
   */
  function findParentComponent(currentElement) {
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
   * Find all direct child components with source path information
   * @param {Element} currentElement - Current element to search within
   * @returns {Array} Array of child elements with __scalasourcepath property
   */
  function findChildComponents(currentElement) {
    const children = [];
    const walker = document.createTreeWalker(
      currentElement,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: function(node) {
          // Skip the current element itself
          if (node === currentElement) {
            return NodeFilter.FILTER_SKIP;
          }

          // If this node has source path, it's a component
          if (Object.hasOwn(node, "__scalasourcepath")) {
            return NodeFilter.FILTER_ACCEPT;
          }

          // Continue searching through this node's children
          return NodeFilter.FILTER_SKIP;
        }
      }
    );

    let node;
    while (node = walker.nextNode()) {
      // Only include direct children, not nested grandchildren
      // Check if any ancestor between this node and currentElement has __scalasourcepath
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
   * Find all sibling components at the same level
   * @param {Element} currentElement - Current element to find siblings for
   * @returns {Array} Array of sibling elements with __scalasourcepath property
   */
  function findSiblingComponents(currentElement) {
    const parent = findParentComponent(currentElement);
    if (!parent) {
      // If no parent component, look for siblings at the document level
      return findTopLevelComponents().filter(el => el !== currentElement);
    }

    const siblings = findChildComponents(parent);
    return siblings.filter(el => el !== currentElement);
  }

  /**
   * Get all sibling components including the current element in DOM order
   * @param {Element} currentElement - Current element
   * @returns {Array} Array of all sibling elements including current element
   */
  function getAllSiblingsIncludingCurrent(currentElement) {
    const parent = findParentComponent(currentElement);
    if (!parent) {
      // If no parent component, get all top-level components
      return findTopLevelComponents();
    }

    // Get all children of parent (which includes current element and its siblings)
    return findChildComponents(parent);
  }

  /**
   * Find all top-level components (components without parent components)
   * @returns {Array} Array of top-level elements with __scalasourcepath property
   */
  function findTopLevelComponents() {
    const topLevel = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: function(node) {
          if (Object.hasOwn(node, "__scalasourcepath")) {
            // Check if this element has any parent with __scalasourcepath
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
   * Get all components in the tree in depth-first order
   * @returns {Array} Array of all components in traversal order
   */
  function getAllComponentsInOrder() {
    const components = [];

    function traverseDepthFirst(element) {
      if (Object.hasOwn(element, "__scalasourcepath")) {
        components.push(element);
      }

      // Traverse children
      const children = findChildComponents(element);
      for (const child of children) {
        traverseDepthFirst(child);
      }
    }

    // Start with top-level components
    const topLevel = findTopLevelComponents();
    for (const component of topLevel) {
      traverseDepthFirst(component);
    }

    return components;
  }

  /**
   * Find the deepest/last component in the tree hierarchy
   * @returns {Element|null} The deepest component or null if none found
   */
  function findDeepestComponent() {
    const allComponents = getAllComponentsInOrder();
    return allComponents.length > 0 ? allComponents[allComponents.length - 1] : null;
  }

  /**
   * Find the first/topmost component in the tree hierarchy
   * @returns {Element|null} The first component or null if none found
   */
  function findFirstComponent() {
    const allComponents = getAllComponentsInOrder();
    return allComponents.length > 0 ? allComponents[0] : null;
  }

  /**
   * Get the next sibling component in the list (with cycling)
   * @param {Element} currentElement - Current element
   * @param {Array} siblings - Array of sibling elements
   * @returns {Element|null} Next sibling element or null if no siblings
   */
  function getNextSibling(currentElement, siblings) {
    if (siblings.length === 0) return null;

    const currentIndex = siblings.indexOf(currentElement);
    if (currentIndex === -1) return siblings[0]; // Current not in siblings, return first

    // Cycle to first if at the end
    return siblings[(currentIndex + 1) % siblings.length];
  }

  /**
   * Get the previous sibling component in the list (with cycling)
   * @param {Element} currentElement - Current element
   * @param {Array} siblings - Array of sibling elements
   * @returns {Element|null} Previous sibling element or null if no siblings
   */
  function getPreviousSibling(currentElement, siblings) {
    if (siblings.length === 0) return null;

    const currentIndex = siblings.indexOf(currentElement);
    if (currentIndex === -1) return siblings[siblings.length - 1]; // Current not in siblings, return last

    // Cycle to last if at the beginning
    return siblings[(currentIndex - 1 + siblings.length) % siblings.length];
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
      transition: OVERLAY_STYLES.transition + ", transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      cursor: "pointer",
      transform: "scale(1)", // Initialize transform for animations
      willChange: "transform, box-shadow", // Optimize for animations
    });

    // Add enhanced hover effects
    div.addEventListener("mouseenter", () => {
      if (LocatorState.navigationMode === 'mouse') {
        Object.assign(div.style, {
          backgroundColor: OVERLAY_STYLES.hover.backgroundColor,
          boxShadow: OVERLAY_STYLES.hover.boxShadow,
          transform: OVERLAY_STYLES.hover.transform,
        });
      }
    });

    div.addEventListener("mouseleave", () => {
      if (LocatorState.navigationMode === 'mouse') {
        Object.assign(div.style, {
          backgroundColor: OVERLAY_STYLES.backgroundColor,
          boxShadow: OVERLAY_STYLES.boxShadow,
          transform: "scale(1)",
        });
      }
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
      transition: "all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      backdropFilter: TOOLTIP_STYLES.backdropFilter,
      lineHeight: TOOLTIP_STYLES.lineHeight,
      willChange: "transform, opacity", // Optimize for animations
      opacity: "0",
      transform: "translateY(4px)", // Initial position for entrance animation
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
   * Create a navigation indicator element for a specific direction
   * @param {string} direction - Direction ('up', 'down', 'left', 'right')
   * @returns {HTMLDivElement} Created navigation indicator element
   */
  function createNavigationIndicator(direction) {
    const indicator = document.createElement("div");
    indicator.id = `locator-nav-indicator-${direction}`;

    const directionInfo = NAVIGATION_INDICATOR_STYLES.directions[direction];
    const size = NAVIGATION_INDICATOR_STYLES.size;

    // Apply base styles with perfect centering and no animations
    Object.assign(indicator.style, {
      position: "fixed",
      width: `${size}px`,
      height: `${size}px`,
      backgroundColor: NAVIGATION_INDICATOR_STYLES.backgroundColor,
      color: NAVIGATION_INDICATOR_STYLES.color,
      borderRadius: NAVIGATION_INDICATOR_STYLES.borderRadius,
      fontSize: NAVIGATION_INDICATOR_STYLES.fontSize,
      fontWeight: NAVIGATION_INDICATOR_STYLES.fontWeight,
      boxShadow: NAVIGATION_INDICATOR_STYLES.boxShadow,
      border: NAVIGATION_INDICATOR_STYLES.border,
      zIndex: NAVIGATION_INDICATOR_STYLES.zIndex,
      display: "none",
      boxSizing: "border-box",
      cursor: "pointer",
      userSelect: "none",
      // Perfect centering for arrow symbols
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      pointerEvents: "none", // Don't interfere with overlay clicks
    });

    // Set the arrow symbol
    indicator.textContent = directionInfo.symbol;

    document.body.appendChild(indicator);
    return indicator;
  }

  /**
   * Create the status indicator element for keyboard navigation feedback
   * @returns {HTMLDivElement} Created status indicator element
   */
  function createStatusIndicator() {
    const indicator = document.createElement("div");
    indicator.id = "locator-status-indicator";

    // Apply base styles
    Object.assign(indicator.style, {
      position: "fixed",
      top: "20px",
      right: "20px",
      backgroundColor: STATUS_INDICATOR_STYLES.backgroundColor,
      color: STATUS_INDICATOR_STYLES.color,
      padding: STATUS_INDICATOR_STYLES.padding,
      borderRadius: STATUS_INDICATOR_STYLES.borderRadius,
      fontSize: STATUS_INDICATOR_STYLES.fontSize,
      fontFamily: STATUS_INDICATOR_STYLES.fontFamily,
      fontWeight: STATUS_INDICATOR_STYLES.fontWeight,
      border: STATUS_INDICATOR_STYLES.border,
      boxShadow: STATUS_INDICATOR_STYLES.boxShadow,
      zIndex: STATUS_INDICATOR_STYLES.zIndex,
      display: "none",
      boxSizing: "border-box",
      transition: STATUS_INDICATOR_STYLES.transition,
      backdropFilter: STATUS_INDICATOR_STYLES.backdropFilter,
      pointerEvents: "none",
      userSelect: "none",
      opacity: "0",
      transform: "translateY(-10px)",
      willChange: "transform, opacity",
    });

    document.body.appendChild(indicator);
    return indicator;
  }

  /**
   * Show status indicator with message
   * @param {string} message - Status message to display
   * @param {number} duration - Duration to show in milliseconds (optional)
   */
  function showStatusIndicator(message, duration = 2000) {
    if (!LocatorState.statusIndicatorDiv) {
      LocatorState.statusIndicatorDiv = createStatusIndicator();
    }

    const indicator = LocatorState.statusIndicatorDiv;
    indicator.textContent = message;
    indicator.style.display = "block";

    // Animate in
    requestAnimationFrame(() => {
      indicator.style.opacity = "1";
      indicator.style.transform = "translateY(0)";
    });

    // Auto-hide after duration
    if (duration > 0) {
      setTimeout(() => {
        hideStatusIndicator();
      }, duration);
    }
  }

  /**
   * Hide status indicator
   */
  function hideStatusIndicator() {
    if (!LocatorState.statusIndicatorDiv) return;

    const indicator = LocatorState.statusIndicatorDiv;
    indicator.style.opacity = "0";
    indicator.style.transform = "translateY(-10px)";

    setTimeout(() => {
      indicator.style.display = "none";
    }, 200);
  }







  /**
   * Trigger visual feedback animations for navigation actions
   * @param {string} action - Type of action ('navigate', 'boundary', 'error')
   * @param {string} direction - Direction of navigation ('up', 'down', 'left', 'right', 'enter')
   */
  function triggerVisualFeedback(action, direction) {
    switch (action) {
      case 'navigate':
        triggerBounceAnimation(direction);
        triggerScaleAnimation();
        break;
      case 'boundary':
        triggerBounceAnimation(direction);
        triggerPulseAnimation();
        break;
      case 'error':
        triggerErrorAnimation(direction);
        break;
    }
  }

  /**
   * Trigger bounce animation for navigation indicator (static - no animation)
   * @param {string} direction - Direction of navigation
   */
  function triggerBounceAnimation(direction) {
    // Navigation indicators are now static - no bounce animation
    // This function is kept for compatibility but does nothing
    // eslint-disable-next-line no-unused-vars
    void direction;
    return;
  }

  /**
   * Trigger enhanced scale animation for overlay selection
   */
  function triggerScaleAnimation() {
    const overlay = LocatorState.overlayDiv;
    if (!overlay || overlay.style.display === 'none') return;

    const scale = VISUAL_FEEDBACK_STYLES.scale;
    const originalTransform = overlay.style.transform || 'scale(1)';
    const originalBoxShadow = overlay.style.boxShadow;

    // Apply enhanced scale animation with glow effect
    Object.assign(overlay.style, {
      transition: `transform ${scale.duration}ms ${scale.easing}, box-shadow ${scale.duration}ms ease-out`,
      transform: `scale(${scale.maxScale})`,
      boxShadow: originalBoxShadow + ', 0 0 20px rgba(0, 123, 255, 0.4)',
    });

    // Return to original scale with faster return
    setTimeout(() => {
      Object.assign(overlay.style, {
        transition: `transform ${scale.returnDuration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow ${scale.returnDuration}ms ease-out`,
        transform: originalTransform,
        boxShadow: originalBoxShadow,
      });

      // Reset transition after animation completes
      setTimeout(() => {
        overlay.style.transition = OVERLAY_STYLES.transition;
      }, scale.returnDuration);
    }, scale.duration / 2);
  }

  /**
   * Trigger enhanced pulse animation for boundary navigation
   */
  function triggerPulseAnimation() {
    const overlay = LocatorState.overlayDiv;
    if (!overlay || overlay.style.display === 'none') return;

    const pulse = VISUAL_FEEDBACK_STYLES.pulse;
    const originalBoxShadow = overlay.style.boxShadow;
    const originalTransform = overlay.style.transform || 'scale(1)';

    // Create enhanced pulsing effect with scale and glow
    const pulseBoxShadow = originalBoxShadow + `, 0 0 ${20 * pulse.intensity}px rgba(255, 140, 0, 0.6)`;
    const pulseTransform = `scale(${1 + (0.05 * pulse.intensity)})`;

    overlay.style.transition = `box-shadow ${pulse.duration / pulse.iterations}ms ${pulse.easing}, transform ${pulse.duration / pulse.iterations}ms ${pulse.easing}`;

    let iteration = 0;
    const pulseInterval = setInterval(() => {
      if (iteration % 2 === 0) {
        Object.assign(overlay.style, {
          boxShadow: pulseBoxShadow,
          transform: pulseTransform,
        });
      } else {
        Object.assign(overlay.style, {
          boxShadow: originalBoxShadow,
          transform: originalTransform,
        });
      }

      iteration++;
      if (iteration >= pulse.iterations * 2) {
        clearInterval(pulseInterval);
        // Ensure we end in the original state
        Object.assign(overlay.style, {
          boxShadow: originalBoxShadow,
          transform: originalTransform,
        });
        setTimeout(() => {
          overlay.style.transition = OVERLAY_STYLES.transition;
        }, pulse.duration / pulse.iterations);
      }
    }, pulse.duration / pulse.iterations);
  }

  /**
   * Trigger enhanced error animation (subtle shake with visual feedback)
   * @param {string} direction - Direction context for the error (optional)
   */
  function triggerErrorAnimation(direction) {
    const overlay = LocatorState.overlayDiv;
    if (!overlay || overlay.style.display === 'none') return;

    const error = VISUAL_FEEDBACK_STYLES.error;
    const originalTransform = overlay.style.transform || 'scale(1)';
    const originalBorder = overlay.style.border;

    // Add error visual state
    overlay.style.border = '2px solid rgba(220, 53, 69, 0.8)';
    overlay.style.transition = `transform ${error.duration / error.iterations}ms ${error.easing}, border-color ${error.duration}ms ease-out`;

    let iteration = 0;
    const shakeInterval = setInterval(() => {
      let shakeTransform;

      if (direction === 'enter') {
        // Vertical shake for Enter key errors
        const offset = (iteration % 2 === 0) ? -error.distance : error.distance;
        shakeTransform = `translateY(${offset}px) scale(1)`;
      } else {
        // Horizontal shake for navigation errors
        const offset = (iteration % 2 === 0) ? -error.distance : error.distance;
        shakeTransform = `translateX(${offset}px) scale(1)`;
      }

      overlay.style.transform = shakeTransform;
      iteration++;

      if (iteration >= error.iterations) {
        clearInterval(shakeInterval);
        // Return to original state
        Object.assign(overlay.style, {
          transform: originalTransform,
          border: originalBorder,
          transition: OVERLAY_STYLES.transition,
        });
      }
    }, error.duration / error.iterations);
  }

  /**
   * Trigger shimmer animation for initial appearance
   */
  function triggerShimmerAnimation() {
    const overlay = LocatorState.overlayDiv;
    if (!overlay || overlay.style.display === 'none') return;

    const shimmer = VISUAL_FEEDBACK_STYLES.shimmer;
    const originalBoxShadow = overlay.style.boxShadow;

    // Create shimmer effect
    const shimmerBoxShadow = originalBoxShadow + ', 0 0 30px rgba(0, 123, 255, 0.5)';

    overlay.style.transition = `box-shadow ${shimmer.duration}ms ${shimmer.easing}`;
    overlay.style.boxShadow = shimmerBoxShadow;

    setTimeout(() => {
      overlay.style.boxShadow = originalBoxShadow;
      setTimeout(() => {
        overlay.style.transition = OVERLAY_STYLES.transition;
      }, shimmer.duration / 2);
    }, shimmer.duration / 2);
  }



  /**
   * Initialize all overlay and UI elements if they don't exist
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
    if (!LocatorState.statusIndicatorDiv) {
      LocatorState.statusIndicatorDiv = createStatusIndicator();
    }

    // Initialize navigation indicators
    const directions = ['up', 'down', 'left', 'right'];
    directions.forEach(direction => {
      if (!LocatorState.navigationIndicators[direction]) {
        LocatorState.navigationIndicators[direction] = createNavigationIndicator(direction);
      }
    });
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

  /**
   * Update navigation indicators with static positioning (no animations)
   * @param {Object} overlayPosition - Overlay position for indicator positioning
   * @param {Array} availableDirections - Array of available navigation directions
   */
  function updateNavigationIndicators(overlayPosition, availableDirections) {
    const size = NAVIGATION_INDICATOR_STYLES.size;
    const offset = NAVIGATION_INDICATOR_STYLES.offset;

    // Hide all indicators first
    LocatorState.hideNavigationIndicators();

    // Show indicators for available directions instantly
    availableDirections.forEach(direction => {
      const indicator = LocatorState.navigationIndicators[direction];
      if (!indicator) return;

      let left, top;

      switch (direction) {
        case 'up':
          left = overlayPosition.left + overlayPosition.width / 2 - size / 2;
          top = overlayPosition.top - size - offset;
          break;
        case 'down':
          left = overlayPosition.left + overlayPosition.width / 2 - size / 2;
          top = overlayPosition.top + overlayPosition.height + offset;
          break;
        case 'left':
          left = overlayPosition.left - size - offset;
          top = overlayPosition.top + overlayPosition.height / 2 - size / 2;
          break;
        case 'right':
          left = overlayPosition.left + overlayPosition.width + offset;
          top = overlayPosition.top + overlayPosition.height / 2 - size / 2;
          break;
      }

      // Ensure indicators stay within viewport
      left = Math.max(0, Math.min(left, window.innerWidth - size));
      top = Math.max(0, Math.min(top, window.innerHeight - size));

      // Set position and show immediately (no animations)
      Object.assign(indicator.style, {
        left: `${left}px`,
        top: `${top}px`,
        display: "flex", // Use flex for perfect centering
      });
    });
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

    // Update navigation indicators if in keyboard mode
    if (LocatorState.navigationMode === 'keyboard') {
      const context = analyzeNavigationContext(targetElement);
      updateNavigationIndicators(overlayPosition, context.availableDirections);
    }
  }

  /**
   * Apply calculated position styles to overlay element with enhanced visual effects and performance optimization
   * @param {Object} position - Position object with left, top, width, height
   */
  function applyOverlayStyles(position) {
    const isKeyboardMode = LocatorState.navigationMode === 'keyboard';
    const overlay = LocatorState.overlayDiv;
    const wasVisible = overlay.style.display === "block";

    // Batch DOM operations for better performance
    batchDOMOperations(() => {
      const styles = {
        left: `${position.left}px`,
        top: `${position.top}px`,
        width: `${position.width}px`,
        height: `${position.height}px`,
        display: "block",
      };

      // Apply different visual styles based on navigation mode
      if (isKeyboardMode) {
        Object.assign(styles, {
          backgroundColor: OVERLAY_STYLES.keyboard.backgroundColor,
          border: OVERLAY_STYLES.keyboard.border,
          borderRadius: OVERLAY_STYLES.keyboard.borderRadius,
          boxShadow: OVERLAY_STYLES.keyboard.boxShadow,
        });
      } else {
        Object.assign(styles, {
          backgroundColor: OVERLAY_STYLES.backgroundColor,
          border: OVERLAY_STYLES.border,
          borderRadius: OVERLAY_STYLES.borderRadius,
          boxShadow: OVERLAY_STYLES.boxShadow,
        });
      }

      Object.assign(overlay.style, styles);

      // Trigger entrance animation for new overlays
      if (!wasVisible) {
        triggerShimmerAnimation();
      }
    });
  }

  /**
   * Update tooltip content and position with enhanced visual effects
   * @param {string} content - Tooltip text content
   * @param {Object} overlayPosition - Overlay position for tooltip positioning
   */
  function updateTooltipPosition(content, overlayPosition) {
    const tooltip = LocatorState.tooltipDiv;
    const isKeyboardMode = LocatorState.navigationMode === 'keyboard';
    const currentElement = LocatorState.currentTargetElement;
    const wasVisible = tooltip.style.display === "block" && tooltip.style.opacity !== "0";

    // Build enhanced tooltip content
    let tooltipContent = content;

    if (isKeyboardMode && currentElement) {
      const context = analyzeNavigationContext(currentElement);
      const navigationHints = getNavigationHints(currentElement);

      // Add navigation information
      const parts = [content];

      // Add navigation hints
      if (navigationHints && navigationHints !== "No navigation available") {
        parts.push(navigationHints);
      }

      // Add detailed context information
      const contextParts = [];

      if (context.hasParent) {
        contextParts.push(`Parent: ${context.parentInfo.filename}:${context.parentInfo.line}`);
      } else {
        contextParts.push("Root level");
      }

      if (context.siblingCount > 0) {
        contextParts.push(`${context.siblingPosition}/${context.siblingCount + 1} siblings`);
      }

      if (context.hasChildren) {
        contextParts.push(`${context.childCount} child${context.childCount === 1 ? '' : 'ren'}`);
      }

      if (contextParts.length > 0) {
        parts.push(contextParts.join(' • '));
      }

      // Add basic navigation hint
      parts.push("Alt+↑↓←→ to navigate • Enter to open");

      tooltipContent = parts.join('\n');
    } else if (isKeyboardMode) {
      tooltipContent += " • Alt+↑↓←→ to navigate";
    }

    // Apply enhanced styling based on mode
    if (isKeyboardMode) {
      Object.assign(tooltip.style, {
        backgroundColor: TOOLTIP_STYLES.keyboard.backgroundColor,
        border: TOOLTIP_STYLES.keyboard.border,
        borderRadius: TOOLTIP_STYLES.keyboard.borderRadius,
        boxShadow: TOOLTIP_STYLES.keyboard.boxShadow,
      });
    } else {
      Object.assign(tooltip.style, {
        backgroundColor: TOOLTIP_STYLES.backgroundColor,
        border: TOOLTIP_STYLES.border,
        borderRadius: TOOLTIP_STYLES.borderRadius,
        boxShadow: TOOLTIP_STYLES.boxShadow,
      });
    }

    // Set content and make visible to measure dimensions
    tooltip.textContent = tooltipContent;
    tooltip.style.display = "block";
    tooltip.style.whiteSpace = isKeyboardMode ? "pre-line" : "nowrap";

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

    // Trigger entrance animation for new tooltips
    if (!wasVisible) {
      // Start with entrance state
      tooltip.style.opacity = "0";
      tooltip.style.transform = "translateY(4px)";

      // Animate to visible state
      requestAnimationFrame(() => {
        tooltip.style.opacity = "1";
        tooltip.style.transform = "translateY(0)";
      });
    } else {
      // Ensure visible state for existing tooltips
      tooltip.style.opacity = "1";
      tooltip.style.transform = "translateY(0)";
    }
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
   * Toggle parent tooltip display when Shift key is pressed while Alt is held
   */
  function toggleParentTooltip() {
    // Only toggle if Alt is pressed and a tooltip is currently visible
    if (!LocatorState.altPressed || !LocatorState.currentTargetElement) return;
    if (!LocatorState.tooltipDiv || LocatorState.tooltipDiv.style.display === "none") return;

    const parentCount = getParentTooltipCount();
    if (parentCount === 0) return;

    if (LocatorState.parentTooltipVisible) {
      // Hide parent tooltip and mark as manually toggled off
      LocatorState.hideParentTooltip();
      LocatorState.parentTooltipToggled = false;
    } else {
      // Show parent tooltip and mark as manually toggled on
      const parents = findParentComponents(LocatorState.currentTargetElement, parentCount);
      if (parents.length > 0) {
        showParentTooltip(parents);
        LocatorState.parentTooltipToggled = true;
      }
    }
  }

  /**
   * Check if parent tooltip should be automatically shown when both Alt and Shift are held
   */
  function checkAutoShowParentTooltip() {
    // Only auto-show if both Alt and Shift are pressed, tooltip is visible
    if (!LocatorState.altPressed || !LocatorState.shiftPressed) return;
    if (!LocatorState.currentTargetElement) return;
    if (!LocatorState.tooltipDiv || LocatorState.tooltipDiv.style.display === "none") return;

    const parentCount = getParentTooltipCount();
    if (parentCount === 0) return;

    const parents = findParentComponents(LocatorState.currentTargetElement, parentCount);
    if (parents.length > 0) {
      if (LocatorState.parentTooltipVisible && !LocatorState.parentTooltipToggled) {
        // Parent tooltip is already visible and was auto-shown, update it for current component
        updateParentTooltipForNewComponent();
      } else if (!LocatorState.parentTooltipVisible) {
        // Show parent tooltip for the first time
        showParentTooltip(parents);
        // Don't mark as manually toggled since this is automatic
      }
    } else if (LocatorState.parentTooltipVisible && !LocatorState.parentTooltipToggled) {
      // No parents found but tooltip is visible and was auto-shown, hide it
      LocatorState.hideParentTooltip();
    }
  }

  /**
   * Hide parent tooltip when either Alt or Shift is released (unless manually toggled)
   */
  function checkAutoHideParentTooltip() {
    // If parent tooltip was manually toggled on, don't auto-hide
    if (LocatorState.parentTooltipToggled) return;

    // Hide if either key is released and parent tooltip is visible
    if ((!LocatorState.altPressed || !LocatorState.shiftPressed) && LocatorState.parentTooltipVisible) {
      LocatorState.hideParentTooltip();
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
   * Check if the target element has changed and update parent tooltip accordingly
   * @param {Element} newTargetElement - New target element
   */
  function checkForComponentChange(newTargetElement) {
    if (LocatorState.lastTargetElement !== newTargetElement) {
      const wasParentTooltipVisible = LocatorState.parentTooltipVisible;
      const wasManuallyToggled = LocatorState.parentTooltipToggled;

      // Component changed, reset toggle state for manual toggles
      if (wasManuallyToggled) {
        LocatorState.hideParentTooltip();
        LocatorState.parentTooltipToggled = false;
      }

      LocatorState.lastTargetElement = newTargetElement;

      // If parent tooltip was visible (either auto or manual) and we have a new component,
      // update it for the new component
      if (wasParentTooltipVisible && newTargetElement && !wasManuallyToggled) {
        // For auto-shown tooltips, update the position for the new component
        // Use a small timeout to ensure the main tooltip is rendered first
        setTimeout(() => {
          updateParentTooltipForNewComponent();
        }, 20);
      } else if (newTargetElement && !wasParentTooltipVisible) {
        // Check if we should auto-show parent tooltip for the new component
        setTimeout(() => {
          checkAutoShowParentTooltip();
        }, 20);
      }
    }
  }

  /**
   * Update parent tooltip content and position for the current component
   */
  function updateParentTooltipForNewComponent() {
    if (!LocatorState.currentTargetElement || !LocatorState.parentTooltipDiv) return;
    if (!LocatorState.tooltipDiv || LocatorState.tooltipDiv.style.display === "none") return;

    const parentCount = getParentTooltipCount();
    if (parentCount === 0) return;

    const parents = findParentComponents(LocatorState.currentTargetElement, parentCount);
    if (parents.length > 0) {
      // Update content
      const content = createParentTooltipContent(parents);
      LocatorState.parentTooltipDiv.innerHTML = content;

      // Recalculate position relative to the new main tooltip
      const tooltipRect = LocatorState.parentTooltipDiv.getBoundingClientRect();
      const mainTooltipRect = LocatorState.tooltipDiv.getBoundingClientRect();
      const position = calculateParentTooltipPosition(mainTooltipRect, tooltipRect.width, tooltipRect.height);

      // Apply new position
      Object.assign(LocatorState.parentTooltipDiv.style, {
        left: `${position.left}px`,
        top: `${position.top}px`,
        display: "block"
      });

      LocatorState.parentTooltipVisible = true;
    } else {
      // No parents found, hide the tooltip
      LocatorState.hideParentTooltip();
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
   * Handle keydown events for Alt and Shift key detection and arrow key navigation
   * @param {KeyboardEvent} event - Keyboard event
   */
  function handleKeyDown(event) {
    console.log("keydown", event.key);

    // Handle Alt + Arrow key combinations for keyboard navigation
    if (event.altKey && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
      switch (event.key) {
        case "ArrowUp":
          event.preventDefault();
          // Show keyboard navigation status if first time
          if (!LocatorState.keyboardNavigationActive) {
            showStatusIndicator("Keyboard navigation active", 1500);
          }
          handleKeyboardNavigation('up');
          return;
        case "ArrowDown":
          event.preventDefault();
          if (!LocatorState.keyboardNavigationActive) {
            showStatusIndicator("Keyboard navigation active", 1500);
          }
          handleKeyboardNavigation('down');
          return;
        case "ArrowLeft":
          event.preventDefault();
          if (!LocatorState.keyboardNavigationActive) {
            showStatusIndicator("Keyboard navigation active", 1500);
          }
          handleKeyboardNavigation('left');
          return;
        case "ArrowRight":
          event.preventDefault();
          if (!LocatorState.keyboardNavigationActive) {
            showStatusIndicator("Keyboard navigation active", 1500);
          }
          handleKeyboardNavigation('right');
          return;
      }
    }

    // Handle Enter key for opening selected component in keyboard navigation mode
    if (event.key === "Enter" && LocatorState.altPressed && LocatorState.navigationMode === 'keyboard') {
      event.preventDefault();
      handleKeyboardFileOpen();
      return;
    }

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

      // Check if we should auto-show parent tooltip (if Shift is already held)
      setTimeout(() => {
        checkAutoShowParentTooltip();
      }, 25);
    } else if (event.key === "Shift" && !LocatorState.shiftPressed) {
      // Shift key pressed
      LocatorState.setShiftPressed(true);

      if (LocatorState.altPressed) {
        // Both Alt and Shift are now held - toggle parent tooltip or auto-show
        if (LocatorState.currentTargetElement && LocatorState.tooltipDiv &&
            LocatorState.tooltipDiv.style.display !== "none") {
          // If parent tooltip is already visible, this acts as a toggle off
          if (LocatorState.parentTooltipVisible) {
            toggleParentTooltip();
          } else {
            // Auto-show parent tooltip
            setTimeout(() => {
              checkAutoShowParentTooltip();
            }, 25);
          }
        }
      }
    }
  }

  /**
   * Handle keyup events for Alt and Shift key release
   * @param {KeyboardEvent} event - Keyboard event
   */
  function handleKeyUp(event) {
    if (event.key === "Alt") {
      LocatorState.setAltPressed(false);
      LocatorState.setKeyboardNavigationActive(false);
      LocatorState.hideOverlay();
      LocatorState.hideParentTooltip();
      LocatorState.parentTooltipToggled = false; // Reset toggle state
    } else if (event.key === "Shift") {
      LocatorState.setShiftPressed(false);
      // Check if we should auto-hide parent tooltip
      checkAutoHideParentTooltip();
    }
  }

  /**
   * Handle window blur events to reset state
   */
  function handleWindowBlur() {
    LocatorState.reset();
  }

  /**
   * Handle mouse move events to update overlay position with performance optimization
   * @param {MouseEvent} event - Mouse event
   */
  function handleMouseMove(event) {
    // Always update current mouse position for immediate Alt-key response
    LocatorState.updateMousePosition(event.clientX, event.clientY);

    if (LocatorState.altPressed) {
      // Switch back to mouse navigation mode when mouse moves during Alt press
      const wasKeyboardMode = LocatorState.navigationMode === 'keyboard';
      if (wasKeyboardMode) {
        LocatorState.setKeyboardNavigationActive(false);
      }

      // Use RAF throttling for smooth overlay updates
      rafThrottle(() => {
        renderLocatorOverlay(event);

        // If we just switched from keyboard to mouse mode, force a re-render
        // to ensure the styling updates immediately
        if (wasKeyboardMode && LocatorState.currentTargetElement) {
          updateOverlayPosition(LocatorState.currentTargetElement);
        }
      })();

      // Debounce parent tooltip check to avoid excessive updates
      debounce(() => {
        checkAutoShowParentTooltip();
      }, DEBOUNCE_DELAY)();
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
   * Initialize all event listeners with performance optimizations
   */
  function initializeEventListeners() {
    // Keyboard event listeners
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Window focus management
    window.addEventListener("blur", handleWindowBlur);

    // Mouse movement with optimized throttling for performance
    // Use both traditional throttling and RAF throttling for best performance
    const optimizedMouseMove = throttle(handleMouseMove, MOUSEMOVE_THROTTLE_DELAY);
    window.addEventListener("mousemove", optimizedMouseMove);

    // Add passive event listeners where possible for better performance
    window.addEventListener("scroll", () => {
      // Hide overlay during scroll to avoid positioning issues
      if (LocatorState.altPressed) {
        LocatorState.hideOverlay();
      }
    }, { passive: true });

    window.addEventListener("resize", debounce(() => {
      // Recalculate positions on window resize
      if (LocatorState.currentTargetElement && LocatorState.altPressed) {
        updateOverlayPosition(LocatorState.currentTargetElement);
      }
    }, DEBOUNCE_DELAY), { passive: true });
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  // Initialize event listeners when script loads
  initializeEventListeners();

})();
