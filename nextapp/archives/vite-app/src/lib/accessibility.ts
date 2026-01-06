export class AccessibilityHelper {
  static announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  static focusElement(element: HTMLElement | null, options?: FocusOptions): void {
    if (!element) return;

    requestAnimationFrame(() => {
      element.focus(options);
    });
  }

  static trapFocus(container: HTMLElement): () => void {
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }

  static addKeyboardNavigation(
    elements: HTMLElement[],
    options: {
      orientation?: 'horizontal' | 'vertical' | 'both';
      loop?: boolean;
      onSelect?: (element: HTMLElement, index: number) => void;
    } = {}
  ): () => void {
    const { orientation = 'vertical', loop = true, onSelect } = options;

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentIndex = elements.findIndex((el) => el === document.activeElement);
      if (currentIndex === -1) return;

      let nextIndex = currentIndex;

      const isVertical = orientation === 'vertical' || orientation === 'both';
      const isHorizontal = orientation === 'horizontal' || orientation === 'both';

      if ((e.key === 'ArrowDown' && isVertical) || (e.key === 'ArrowRight' && isHorizontal)) {
        e.preventDefault();
        nextIndex = currentIndex + 1;
        if (nextIndex >= elements.length) {
          nextIndex = loop ? 0 : elements.length - 1;
        }
      } else if ((e.key === 'ArrowUp' && isVertical) || (e.key === 'ArrowLeft' && isHorizontal)) {
        e.preventDefault();
        nextIndex = currentIndex - 1;
        if (nextIndex < 0) {
          nextIndex = loop ? elements.length - 1 : 0;
        }
      } else if (e.key === 'Home') {
        e.preventDefault();
        nextIndex = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        nextIndex = elements.length - 1;
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (onSelect) {
          e.preventDefault();
          onSelect(elements[currentIndex], currentIndex);
        }
      }

      if (nextIndex !== currentIndex && elements[nextIndex]) {
        elements[nextIndex].focus();
      }
    };

    elements.forEach((element) => {
      element.addEventListener('keydown', handleKeyDown);
      if (!element.hasAttribute('tabindex')) {
        element.setAttribute('tabindex', '0');
      }
    });

    return () => {
      elements.forEach((element) => {
        element.removeEventListener('keydown', handleKeyDown);
      });
    };
  }

  static setupSkipLink(targetId: string, linkText: string = 'Skip to main content'): HTMLAnchorElement {
    const skipLink = document.createElement('a');
    skipLink.href = `#${targetId}`;
    skipLink.textContent = linkText;
    skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:bg-blue-600 focus:text-white focus:p-4';

    skipLink.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById(targetId);
      if (target) {
        target.setAttribute('tabindex', '-1');
        target.focus();
        target.addEventListener('blur', () => {
          target.removeAttribute('tabindex');
        }, { once: true });
      }
    });

    return skipLink;
  }

  static addAriaLabel(element: HTMLElement, label: string, describedBy?: string): void {
    element.setAttribute('aria-label', label);
    if (describedBy) {
      element.setAttribute('aria-describedby', describedBy);
    }
  }

  static createAriaLiveRegion(priority: 'polite' | 'assertive' = 'polite'): HTMLDivElement {
    const region = document.createElement('div');
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', priority);
    region.setAttribute('aria-atomic', 'true');
    region.className = 'sr-only';
    document.body.appendChild(region);
    return region;
  }

  static updateAriaLiveRegion(region: HTMLElement, message: string): void {
    region.textContent = message;
  }

  static ensureUniqueId(element: HTMLElement, prefix: string = 'element'): string {
    if (element.id) {
      return element.id;
    }

    let id = `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
    let attempts = 0;

    while (document.getElementById(id) && attempts < 10) {
      id = `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
      attempts++;
    }

    element.id = id;
    return id;
  }

  static getContrastRatio(foreground: string, background: string): number {
    const getLuminance = (color: string): number => {
      const rgb = this.hexToRgb(color);
      if (!rgb) return 0;

      const [r, g, b] = rgb.map((val) => {
        val = val / 255;
        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
      });

      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const l1 = getLuminance(foreground);
    const l2 = getLuminance(background);

    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  private static hexToRgb(hex: string): [number, number, number] | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16)
        ]
      : null;
  }

  static meetsWCAGStandard(
    foreground: string,
    background: string,
    level: 'AA' | 'AAA' = 'AA',
    isLargeText: boolean = false
  ): boolean {
    const ratio = this.getContrastRatio(foreground, background);

    if (level === 'AAA') {
      return isLargeText ? ratio >= 4.5 : ratio >= 7;
    } else {
      return isLargeText ? ratio >= 3 : ratio >= 4.5;
    }
  }

  static setupFocusVisible(): void {
    let hadKeyboardEvent = false;
    const keyboardThrottleTimeMs = 100;
    let keyboardThrottleTimeout: number | null = null;

    const handlePointerDown = () => {
      hadKeyboardEvent = false;
      if (keyboardThrottleTimeout !== null) {
        clearTimeout(keyboardThrottleTimeout);
        keyboardThrottleTimeout = null;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.altKey || e.ctrlKey) {
        return;
      }

      hadKeyboardEvent = true;

      if (keyboardThrottleTimeout !== null) {
        clearTimeout(keyboardThrottleTimeout);
      }

      keyboardThrottleTimeout = window.setTimeout(() => {
        hadKeyboardEvent = false;
        keyboardThrottleTimeout = null;
      }, keyboardThrottleTimeMs);
    };

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (hadKeyboardEvent && target) {
        target.classList.add('focus-visible');
      }
    };

    const handleBlur = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target) {
        target.classList.remove('focus-visible');
      }
    };

    document.addEventListener('mousedown', handlePointerDown, true);
    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('touchstart', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('focus', handleFocus, true);
    document.addEventListener('blur', handleBlur, true);
  }

  static addTooltip(
    element: HTMLElement,
    tooltipText: string,
    position: 'top' | 'bottom' | 'left' | 'right' = 'top'
  ): void {
    const tooltipId = this.ensureUniqueId(element, 'tooltip-trigger');
    element.setAttribute('aria-describedby', `${tooltipId}-content`);

    const showTooltip = () => {
      this.announceToScreenReader(tooltipText, 'polite');
    };

    element.addEventListener('mouseenter', showTooltip);
    element.addEventListener('focus', showTooltip);
  }

  static createProgressBar(
    current: number,
    total: number,
    label: string
  ): HTMLDivElement {
    const container = document.createElement('div');
    container.setAttribute('role', 'progressbar');
    container.setAttribute('aria-valuenow', current.toString());
    container.setAttribute('aria-valuemin', '0');
    container.setAttribute('aria-valuemax', total.toString());
    container.setAttribute('aria-label', label);

    const percentage = Math.round((current / total) * 100);
    container.setAttribute('aria-valuetext', `${percentage}% complete`);

    return container;
  }
}

export default AccessibilityHelper;
