// State Variables
let currentInput = '0';
let previousInput = '';
let selectedOperator = null;
let shouldResetScreen = false;
let historyLog = JSON.parse(localStorage.getItem('aura-calc-history')) || [];

// DOM Elements
const displayCurrent = document.getElementById('display-current');
const displayHistory = document.getElementById('display-history');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const historyToggleBtn = document.getElementById('history-toggle-btn');
const historyCloseBtn = document.getElementById('history-close-btn');
const historyBackBtn = document.getElementById('history-back-btn');
const historyClearBtn = document.getElementById('history-clear-btn');
const historyPanel = document.getElementById('history-panel');
const historyList = document.getElementById('history-list');

// Icons definition
const SUN_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
</svg>`;

const MOON_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
</svg>`;

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  setupTheme();
  renderHistory();
  setupEventListeners();
});

// Setup Initial Theme
function setupTheme() {
  const savedTheme = localStorage.getItem('aura-calc-theme') || 'dark';
  document.body.setAttribute('data-theme', savedTheme);
  themeToggleBtn.innerHTML = savedTheme === 'dark' ? SUN_ICON : MOON_ICON;
}

// Toggle Theme
function toggleTheme() {
  const currentTheme = document.body.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  document.body.setAttribute('data-theme', newTheme);
  themeToggleBtn.innerHTML = newTheme === 'dark' ? SUN_ICON : MOON_ICON;
  localStorage.setItem('aura-calc-theme', newTheme);
}

// Event Listeners setup
function setupEventListeners() {
  // Theme Toggle click
  themeToggleBtn.addEventListener('click', toggleTheme);

  // History Panel actions
  historyToggleBtn.addEventListener('click', openHistory);
  historyCloseBtn.addEventListener('click', closeHistory);
  historyBackBtn.addEventListener('click', closeHistory);
  historyClearBtn.addEventListener('click', clearHistory);

  // Grid keys click
  document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const target = e.currentTarget;
      handleButtonInput(target);
    });
  });

  // Keyboard support
  window.addEventListener('keydown', handleKeyboardInput);
}

// Map HTML button actions
function handleButtonInput(button) {
  // Pulse animation on click
  button.classList.add('key-press-animation');
  setTimeout(() => button.classList.remove('key-press-animation'), 150);

  if (button.dataset.number !== undefined) {
    appendNumber(button.dataset.number);
  } else if (button.dataset.decimal !== undefined) {
    appendDecimal();
  } else if (button.dataset.operator !== undefined) {
    chooseOperator(button.dataset.operator);
  } else if (button.dataset.action !== undefined) {
    const action = button.dataset.action;
    if (action === 'clear') clearAll();
    if (action === 'delete') deleteDigit();
    if (action === 'percent') calculatePercentage();
    if (action === 'toggle-sign') toggleSign();
    if (action === 'calculate') evaluateExpression();
  }
}

// Update primary screen and previous expression screen
function updateDisplay() {
  displayCurrent.textContent = formatDisplayNumber(currentInput);
  
  if (selectedOperator) {
    const opSymbols = { '+': '+', '-': '−', '*': '×', '/': '÷' };
    displayHistory.textContent = `${formatDisplayNumber(previousInput)} ${opSymbols[selectedOperator] || selectedOperator}`;
  } else {
    displayHistory.textContent = '';
  }
  
  // Auto-scroll output display to the right if contents overflow
  displayCurrent.scrollLeft = displayCurrent.scrollWidth;
}

// Format number styling with commas
function formatDisplayNumber(numberStr) {
  if (numberStr === 'Error' || numberStr === 'Cannot divide by 0') {
    return numberStr;
  }
  
  const parts = numberStr.split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];
  
  // Format with local string format
  if (integerPart !== '' && !isNaN(integerPart)) {
    integerPart = parseFloat(integerPart).toLocaleString('en', { maximumFractionDigits: 0 });
  }
  
  if (decimalPart !== undefined) {
    return `${integerPart}.${decimalPart}`;
  }
  return integerPart;
}

// Append digits
function appendNumber(number) {
  if (currentInput === '0' || shouldResetScreen) {
    currentInput = number;
    shouldResetScreen = false;
  } else {
    // Limit inputs to 15 digits
    if (currentInput.replace(/[^0-9]/g, '').length >= 15) return;
    currentInput += number;
  }
  updateDisplay();
}

// Append decimals safely
function appendDecimal() {
  if (shouldResetScreen) {
    currentInput = '0.';
    shouldResetScreen = false;
    updateDisplay();
    return;
  }
  if (!currentInput.includes('.')) {
    currentInput += '.';
  }
  updateDisplay();
}

// Backspace
function deleteDigit() {
  if (shouldResetScreen || currentInput === 'Error' || currentInput === 'Cannot divide by 0') {
    currentInput = '0';
    updateDisplay();
    return;
  }
  
  currentInput = currentInput.slice(0, -1);
  if (currentInput === '' || currentInput === '-') {
    currentInput = '0';
  }
  updateDisplay();
}

// Clear all
function clearAll() {
  currentInput = '0';
  previousInput = '';
  selectedOperator = null;
  shouldResetScreen = false;
  updateDisplay();
}

// Toggle sign +/-
function toggleSign() {
  if (currentInput === '0' || currentInput === 'Error' || currentInput === 'Cannot divide by 0') return;
  
  if (currentInput.startsWith('-')) {
    currentInput = currentInput.substring(1);
  } else {
    currentInput = '-' + currentInput;
  }
  updateDisplay();
}

// Percent modifier
function calculatePercentage() {
  if (currentInput === 'Error' || currentInput === 'Cannot divide by 0') return;
  
  const currentVal = parseFloat(currentInput);
  if (isNaN(currentVal)) return;
  
  // If there's a previous input and an operator, evaluate percentage relative to previous
  if (previousInput && selectedOperator && (selectedOperator === '+' || selectedOperator === '-')) {
    const prevVal = parseFloat(previousInput);
    const percentAmount = prevVal * (currentVal / 100);
    currentInput = limitDecimals(percentAmount).toString();
  } else {
    currentInput = limitDecimals(currentVal / 100).toString();
  }
  
  updateDisplay();
}

// Set Operator
function chooseOperator(op) {
  if (currentInput === 'Error' || currentInput === 'Cannot divide by 0') return;
  
  if (selectedOperator !== null && !shouldResetScreen) {
    // If double operators are inputted sequentially, compute intermediate state
    const success = calculateResult();
    if (!success) return;
  }
  
  previousInput = currentInput;
  selectedOperator = op;
  shouldResetScreen = true;
  updateDisplay();
}

// Compute arithmetic step
function calculateResult() {
  const prev = parseFloat(previousInput);
  const current = parseFloat(currentInput);
  
  if (isNaN(prev) || isNaN(current)) return false;
  
  let computation;
  switch (selectedOperator) {
    case '+':
      computation = prev + current;
      break;
    case '-':
      computation = prev - current;
      break;
    case '*':
      computation = prev * current;
      break;
    case '/':
      if (current === 0) {
        currentInput = 'Cannot divide by 0';
        selectedOperator = null;
        previousInput = '';
        shouldResetScreen = true;
        updateDisplay();
        return false;
      }
      computation = prev / current;
      break;
    default:
      return false;
  }
  
  // Format float precision issues (e.g. 0.1 + 0.2)
  currentInput = limitDecimals(computation).toString();
  return true;
}

// Evaluate expression to equal value
function evaluateExpression() {
  if (selectedOperator === null || shouldResetScreen) return;
  
  const operand1 = previousInput;
  const operand2 = currentInput;
  const op = selectedOperator;
  
  const success = calculateResult();
  
  if (success) {
    const opSymbols = { '+': '+', '-': '−', '*': '×', '/': '÷' };
    const formattedExpression = `${formatDisplayNumber(operand1)} ${opSymbols[op]} ${formatDisplayNumber(operand2)}`;
    
    // Add to history log
    addToHistory(formattedExpression, formatDisplayNumber(currentInput));
    
    selectedOperator = null;
    previousInput = '';
    shouldResetScreen = true;
    updateDisplay();
  }
}

// Solve standard float errors by formatting
function limitDecimals(num) {
  if (isNaN(num)) return 0;
  if (!isFinite(num)) return num;
  
  // Set precision to 10 decimals, parse float to clear trailing zeroes
  return parseFloat(Number(num.toPrecision(12)));
}

// Keyboard input key mapping
function handleKeyboardInput(e) {
  const key = e.key;
  
  // Prevent default scroll behaviors for space bar or arrow keys if calculator is active
  if (key === ' ') e.preventDefault();
  
  // Numeric values
  if (/[0-9]/.test(key)) {
    animateAndClickBtn(`[data-number="${key}"]`);
    appendNumber(key);
  }
  
  // Decimal symbol
  if (key === '.' || key === ',') {
    animateAndClickBtn('[data-decimal="."]');
    appendDecimal();
  }
  
  // Operators
  if (key === '+') {
    animateAndClickBtn('[data-operator="+"]');
    chooseOperator('+');
  }
  if (key === '-') {
    animateAndClickBtn('[data-operator="-"]');
    chooseOperator('-');
  }
  if (key === '*' || key === 'x' || key === 'X') {
    animateAndClickBtn('[data-operator="*"]');
    chooseOperator('*');
  }
  if (key === '/') {
    e.preventDefault(); // Prevent search overlay in Firefox
    animateAndClickBtn('[data-operator="/"]');
    chooseOperator('/');
  }
  
  // Percentage
  if (key === '%') {
    animateAndClickBtn('[data-action="percent"]');
    calculatePercentage();
  }
  
  // Calculate / Equals
  if (key === 'Enter' || key === '=') {
    e.preventDefault(); // Prevent standard forms submit if any
    animateAndClickBtn('[data-action="calculate"]');
    evaluateExpression();
  }
  
  // Backspace / Delete
  if (key === 'Backspace') {
    animateAndClickBtn('[data-action="delete"]');
    deleteDigit();
  }
  
  // Escape -> clear
  if (key === 'Escape' || key.toLowerCase() === 'c') {
    animateAndClickBtn('[data-action="clear"]');
    clearAll();
  }
}

// Keyboard feedback animation helper
function animateAndClickBtn(selector) {
  const btn = document.querySelector(selector);
  if (btn) {
    btn.classList.add('key-press-animation');
    setTimeout(() => btn.classList.remove('key-press-animation'), 150);
  }
}

// History Actions
function openHistory() {
  historyPanel.classList.add('open');
}

function closeHistory() {
  historyPanel.classList.remove('open');
}

function addToHistory(expr, result) {
  // Push item
  historyLog.unshift({ expr, result });
  
  // Limit to 20 computations
  if (historyLog.length > 20) {
    historyLog.pop();
  }
  
  localStorage.setItem('aura-calc-history', JSON.stringify(historyLog));
  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = '';
  
  if (historyLog.length === 0) {
    historyList.innerHTML = '<div class="history-empty">No calculations yet</div>';
    return;
  }
  
  historyLog.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.innerHTML = `
      <div class="history-expr">${item.expr}</div>
      <div class="history-res">= ${item.result}</div>
    `;
    
    // Tap to reload formula item
    div.addEventListener('click', () => {
      // Re-load result as current active input
      currentInput = item.result.replace(/,/g, ''); // Remove commas to preserve parse-ability
      previousInput = '';
      selectedOperator = null;
      shouldResetScreen = true;
      updateDisplay();
      closeHistory();
    });
    
    historyList.appendChild(div);
  });
}

function clearHistory() {
  historyLog = [];
  localStorage.removeItem('aura-calc-history');
  renderHistory();
}
