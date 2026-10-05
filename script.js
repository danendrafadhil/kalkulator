const display = document.querySelector("#display");
const expression = document.querySelector("#expression");
const keypad = document.querySelector("#calculator-keys");

let currentValue = "0";
let storedValue = null;
let pendingOperator = null;
let waitingForOperand = false;
let justCalculated = false;

const operatorLabels = {
  "+": "+",
  "-": "−",
  "*": "×",
  "/": "÷",
};

function formatNumber(value) {
  if (!Number.isFinite(value)) return "Error";
  if (Object.is(value, -0)) value = 0;

  const rounded = Number.parseFloat(value.toPrecision(10));
  const [integerPart, decimalPart] = String(rounded).split(".");
  const formattedInteger = Number(integerPart).toLocaleString("en-US");
  return decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
}

function render() {
  display.textContent = formatNumber(Number(currentValue)).replaceAll(",", ".");
  display.classList.toggle("is-compact", display.textContent.length > 10);

  if (pendingOperator !== null && storedValue !== null) {
    expression.textContent = `${formatNumber(storedValue).replaceAll(",", ".")} ${operatorLabels[pendingOperator]}`;
  } else {
    expression.textContent = "";
  }

  keypad.querySelectorAll("[data-operator]").forEach((button) => {
    button.classList.toggle(
      "is-selected",
      button.dataset.operator === pendingOperator && waitingForOperand,
    );
  });
}

function clear() {
  currentValue = "0";
  storedValue = null;
  pendingOperator = null;
  waitingForOperand = false;
  justCalculated = false;
  render();
}

function enterDigit(digit) {
  if (currentValue === "Error" || waitingForOperand || justCalculated) {
    currentValue = digit;
    waitingForOperand = false;
    justCalculated = false;
  } else if (currentValue.replace("-", "").replace(".", "").length < 15) {
    currentValue = currentValue === "0" ? digit : `${currentValue}${digit}`;
  }
  render();
}

function enterDecimal() {
  if (currentValue === "Error" || waitingForOperand || justCalculated) {
    currentValue = "0.";
    waitingForOperand = false;
    justCalculated = false;
  } else if (!currentValue.includes(".")) {
    currentValue += ".";
  }
  render();
}

function calculate(left, right, operator) {
  switch (operator) {
    case "+":
      return left + right;
    case "-":
      return left - right;
    case "*":
      return left * right;
    case "/":
      return right === 0 ? Number.NaN : left / right;
    default:
      return right;
  }
}

function chooseOperator(operator) {
  if (currentValue === "Error") clear();

  const inputValue = Number(currentValue);
  if (pendingOperator && !waitingForOperand) {
    const result = calculate(storedValue, inputValue, pendingOperator);
    if (!Number.isFinite(result)) {
      currentValue = "Error";
      storedValue = null;
      pendingOperator = null;
      waitingForOperand = true;
      render();
      return;
    }
    currentValue = String(result);
    storedValue = result;
  } else if (storedValue === null || !waitingForOperand) {
    storedValue = inputValue;
  }

  pendingOperator = operator;
  waitingForOperand = true;
  justCalculated = false;
  render();
}

function equals() {
  if (!pendingOperator || storedValue === null || waitingForOperand) return;

  const left = storedValue;
  const right = Number(currentValue);
  const operator = pendingOperator;
  const result = calculate(left, right, operator);
  currentValue = Number.isFinite(result) ? String(result) : "Error";
  storedValue = null;
  pendingOperator = null;
  waitingForOperand = true;
  justCalculated = true;
  render();
  expression.textContent = `${formatNumber(left).replaceAll(",", ".")} ${operatorLabels[operator]} ${formatNumber(right).replaceAll(",", ".")} =`;
}

function toggleSign() {
  if (currentValue === "Error" || Number(currentValue) === 0) return;
  currentValue = currentValue.startsWith("-") ? currentValue.slice(1) : `-${currentValue}`;
  render();
}

function percent() {
  if (currentValue === "Error") return;
  currentValue = String(Number(currentValue) / 100);
  waitingForOperand = false;
  justCalculated = false;
  render();
}

function backspace() {
  if (currentValue === "Error") {
    currentValue = "0";
    waitingForOperand = false;
    justCalculated = false;
  } else if (currentValue.length <= 1 || (currentValue.length === 2 && currentValue.startsWith("-"))) {
    currentValue = "0";
  } else {
    currentValue = currentValue.slice(0, -1);
    waitingForOperand = false;
    justCalculated = false;
  }
  render();
}

function handleAction(action) {
  switch (action) {
    case "clear":
      clear();
      break;
    case "sign":
      toggleSign();
      break;
    case "percent":
      percent();
      break;
    case "decimal":
      enterDecimal();
      break;
    case "equals":
      equals();
      break;
    case "backspace":
      backspace();
      break;
  }
}

keypad.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  if (button.dataset.digit !== undefined) {
    enterDigit(button.dataset.digit);
  } else if (button.dataset.operator) {
    chooseOperator(button.dataset.operator);
  } else if (button.dataset.action) {
    handleAction(button.dataset.action);
  }
});

document.addEventListener("keydown", (event) => {
  if (/^\d$/.test(event.key)) {
    enterDigit(event.key);
  } else if (event.key === "." || event.key === ",") {
    enterDecimal();
  } else if (["+", "-", "*", "/"].includes(event.key)) {
    chooseOperator(event.key);
  } else if (event.key === "Enter" || event.key === "=") {
    event.preventDefault();
    equals();
  } else if (event.key === "Escape") {
    clear();
  } else if (event.key === "Backspace") {
    event.preventDefault();
    backspace();
  } else if (event.key === "%") {
    percent();
  }
});

render();
