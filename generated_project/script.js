// Calculator logic and UI interaction for the web calculator
// Part A – Core Calculation Engine

class Calculator {
  // Private fields for expression and result
  #expression = '';
  #result = '';

  // Append a digit, decimal point, or operator to the current expression.
  // Prevents two operators in a row.
  append(value) {
    const operators = '+-*/';
    const lastChar = this.#expression.slice(-1);
    // If value is an operator, ensure we don't have two operators consecutively.
    if (operators.includes(value)) {
      if (this.#expression === '' && value !== '-') {
        // Disallow starting expression with an operator other than minus.
        return;
      }
      if (operators.includes(lastChar)) {
        // Replace the previous operator with the new one (e.g., change + to -).
        this.#expression = this.#expression.slice(0, -1) + value;
        return;
      }
    }
    // Prevent multiple leading zeros like "00" (optional, simple guard).
    if (value === '0' && this.#expression === '0') return;
    this.#expression += value;
    // Reset result when user continues typing after a previous evaluation.
    this.#result = '';
  }

  // Reset the calculator.
  clear() {
    this.#expression = '';
    this.#result = '';
  }

  // Remove the last character from the expression.
  backspace() {
    if (this.#expression.length > 0) {
      this.#expression = this.#expression.slice(0, -1);
    }
    // If we backspace after an evaluation, also clear the stored result.
    this.#result = '';
  }

  // Evaluate the current expression safely.
  evaluate() {
    // If expression is empty, nothing to evaluate.
    if (this.#expression.trim() === '') {
      this.#result = '';
      return this.#result;
    }
    // Sanitize: allow only numbers, decimal points and basic operators.
    const safeExpression = this.#expression.replace(/[^0-9.+\-*/()]/g, '');
    try {
      // Use Function constructor for evaluation.
      // eslint-disable-next-line no-new-func
      const evalResult = Function('return ' + safeExpression)();
      // Detect division by zero or non-finite results.
      if (!isFinite(evalResult)) {
        this.#result = 'Error';
      } else {
        // Round to avoid floating‑point noise (optional).
        this.#result = String(evalResult);
      }
    } catch (e) {
      this.#result = 'Error';
    }
    // After evaluation keep the expression unchanged so the user can continue editing.
    return this.#result;
  }

  // Return what should be shown on the display.
  getDisplay() {
    return this.#result !== '' ? this.#result : this.#expression;
  }
}

// Export a global instance as required.
window.calculator = new Calculator();

// Part B – UI Update Helpers

/**
 * Updates the calculator display with the current value from the Calculator instance.
 */
function updateDisplay() {
  const display = document.querySelector('.display');
  if (display) {
    display.value = calculator.getDisplay();
  }
}

/**
 * Handles button clicks from the calculator UI.
 * @param {MouseEvent} event
 */
function handleButtonClick(event) {
  const button = event.currentTarget;
  const { value, action } = button.dataset;

  if (value !== undefined) {
    calculator.append(value);
  } else if (action !== undefined) {
    switch (action) {
      case 'clear':
        calculator.clear();
        break;
      case 'backspace':
        calculator.backspace();
        break;
      case 'equals':
        calculator.evaluate();
        break;
      case 'add':
        calculator.append('+');
        break;
      case 'subtract':
        calculator.append('-');
        break;
      case 'multiply':
        calculator.append('*');
        break;
      case 'divide':
        calculator.append('/');
        break;
      default:
        // Unknown action – ignore.
        break;
    }
  }
  updateDisplay();
}

/**
 * Handles keyboard input for the calculator.
 * @param {KeyboardEvent} event
 */
function handleKeyboard(event) {
  const key = event.key;
  const operators = {
    '+': '+',
    '-': '-',
    '*': '*',
    '/': '/',
    'x': '*', // sometimes users press 'x'
    'X': '*',
  };

  if (/^[0-9]$/.test(key) || key === '.') {
    calculator.append(key);
    updateDisplay();
    event.preventDefault();
  } else if (key in operators) {
    calculator.append(operators[key]);
    updateDisplay();
    event.preventDefault();
  } else if (key === 'Enter' || key === '=') {
    calculator.evaluate();
    updateDisplay();
    event.preventDefault();
  } else if (key === 'Backspace') {
    calculator.backspace();
    updateDisplay();
    event.preventDefault();
  } else if (key === 'Escape') {
    calculator.clear();
    updateDisplay();
    event.preventDefault();
  }
}

// Part C – Event Binding (executed on DOMContentLoaded)

document.addEventListener('DOMContentLoaded', () => {
  // Attach click listeners to all calculator buttons.
  const buttons = document.querySelectorAll('.buttons button');
  buttons.forEach((btn) => btn.addEventListener('click', handleButtonClick));

  // Global keyboard handling.
  document.addEventListener('keydown', handleKeyboard);

  // Initialise display.
  updateDisplay();
});
