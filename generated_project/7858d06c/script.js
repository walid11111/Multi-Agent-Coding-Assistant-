// script.js
// Calculator implementation with UI interaction
// This script assumes the HTML structure defined in index.html.

/**
 * Calculator class handling expression building, evaluation, and display updates.
 */
class Calculator {
  /**
   * @param {HTMLInputElement} displayElement - The input element that shows the expression/result.
   */
  constructor(displayElement) {
    this.displayElement = displayElement;
    this.currentInput = '';
    this.updateDisplay();
  }

  /**
   * Append a digit, decimal point, or operator to the current expression.
   * Handles edge cases such as multiple decimal points in a number and
   * consecutive operators.
   * @param {string} value
   */
  append(value) {
    const operators = ['+', '-', '*', '/'];
    const lastChar = this.currentInput.slice(-1);

    // If the value is a decimal point, ensure the current number does not already contain one.
    if (value === '.') {
      // Get the part after the last operator (or the whole string if none).
      const parts = this.currentInput.split(/[+\-*/]/);
      const lastPart = parts[parts.length - 1];
      if (lastPart.includes('.')) {
        return; // ignore duplicate decimal
      }
      // If the last character is an operator or empty, prepend a leading zero.
      if (lastChar && operators.includes(lastChar)) {
        this.currentInput += '0';
      }
      this.currentInput += value;
      return;
    }

    // If the value is an operator.
    if (operators.includes(value)) {
      // Do not allow an operator as the first character (except minus for negative numbers).
      if (this.currentInput === '' && value !== '-') {
        return;
      }
      // Replace the last operator if the previous character is also an operator.
      if (lastChar && operators.includes(lastChar)) {
        // Replace the last operator with the new one.
        this.currentInput = this.currentInput.slice(0, -1) + value;
        return;
      }
      this.currentInput += value;
      return;
    }

    // For digits (0-9) simply append.
    this.currentInput += value;
  }

  /** Remove the last character from the current input. */
  clearEntry() {
    this.currentInput = this.currentInput.slice(0, -1);
  }

  /** Reset the entire expression. */
  allClear() {
    this.currentInput = '';
  }

  /** Alias for clearEntry – used for backspace handling. */
  backspace() {
    this.clearEntry();
  }

  /** Evaluate the arithmetic expression safely. */
  evaluate() {
    if (!this.currentInput) return;
    // Sanitize: allow only numbers, operators, decimal points.
    const sanitized = this.currentInput.replace(/[^0-9+\-*/.]/g, '');
    try {
      // eslint-disable-next-line no-new-func
      const result = Function('return ' + sanitized)();
      if (result === Infinity || result === -Infinity) {
        this.currentInput = '';
        this.displayElement.value = 'Error';
        return;
      }
      // Round to a reasonable number of decimal places to avoid floating point noise.
      const rounded = Number.isFinite(result) ? parseFloat(result.toFixed(12)) : result;
      this.currentInput = String(rounded);
    } catch (e) {
      this.currentInput = '';
      this.displayElement.value = 'Error';
    }
  }

  /** Write the current input (or result) to the display element. */
  updateDisplay() {
    this.displayElement.value = this.currentInput;
  }
}

// Export for testing environments (e.g., Node). In a browser the class will also be
// attached to the window object for easy access.
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = { Calculator };
} else {
  window.Calculator = Calculator; // eslint-disable-line no-var
}

// DOMContentLoaded – set up event listeners and instantiate the calculator.
window.addEventListener('DOMContentLoaded', () => {
  const display = document.getElementById('display');
  const calc = new Calculator(display);

  // Click handling using event delegation on the .buttons container.
  const buttonsContainer = document.querySelector('.buttons');
  if (buttonsContainer) {
    buttonsContainer.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button) return;

      const action = button.dataset.action;
      const type = button.dataset.type;
      const value = button.dataset.value;

      if (action) {
        switch (action) {
          case 'allClear':
            calc.allClear();
            break;
          case 'clear':
            calc.clearEntry();
            break;
          case 'backspace':
            calc.backspace();
            break;
          case 'equals':
            calc.evaluate();
            break;
          default:
            // No other actions defined.
            break;
        }
      } else if (type && value !== undefined) {
        // Digit or operator button.
        calc.append(value);
      }

      // After handling the button press, update the display.
      calc.updateDisplay();
    });
  }

  // Keyboard handling – map keys to calculator functions.
  window.addEventListener('keydown', (e) => {
    // Allow only relevant keys.
    const key = e.key;
    const operators = ['+', '-', '*', '/'];
    if (/^[0-9]$/.test(key)) {
      calc.append(key);
    } else if (key === '.') {
      calc.append('.');
    } else if (operators.includes(key)) {
      calc.append(key);
    } else if (key === 'Enter' || key === '=') {
      e.preventDefault(); // Prevent form submission if any.
      calc.evaluate();
    } else if (key === 'Backspace') {
      calc.backspace();
    } else if (key === 'Escape') {
      calc.allClear();
    } else {
      // Unhandled key – ignore.
      return;
    }
    calc.updateDisplay();
  });
});
