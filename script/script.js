document.addEventListener('DOMContentLoaded', () => {
	const screen = document.getElementById('screen');
	const keys = document.querySelector('.keys');

	let current = '0';
	let previous = null;
	let operator = null;
	let waitingForNew = false;

	function updateScreen() {
		screen.textContent = current;
		screen.classList.toggle('error', current === 'Error');
	}

	function inputDigit(digit) {
		if (waitingForNew) {
			current = digit === '.' ? '0.' : digit;
			waitingForNew = false;
			return updateScreen();
		}

		if (digit === '.' && current.includes('.')) return;

		if (current === '0' && digit !== '.') current = digit;
		else current = current + digit;

		// Limit length to avoid layout overflow
		if (current.length > 18) {
			// convert to exponential
			const n = parseFloat(current);
			current = n.toExponential(9);
		}

		updateScreen();
	}

	function clearAll() {
		current = '0';
		previous = null;
		operator = null;
		waitingForNew = false;
		updateScreen();
	}

	function plusMinus() {
		if (current === '0') return;
		current = String(parseFloat(current) * -1);
		updateScreen();
	}

	function percent() {
		current = String(parseFloat(current) / 100);
		updateScreen();
	}

	function handleOperator(nextOp) {
		if (operator && !waitingForNew) {
			compute();
		}
		previous = current;
		operator = nextOp;
		waitingForNew = true;
	}

	function compute() {
		if (!operator || previous == null) return;
		const a = parseFloat(previous);
		const b = parseFloat(current);
		let result = 0;

		switch (operator) {
			case 'add':
				result = a + b;
				break;
			case 'subtract':
				result = a - b;
				break;
			case 'multiply':
				result = a * b;
				break;
			case 'divide':
				result = b === 0 ? 'Error' : a / b;
				break;
		}

		current = result === 'Error' ? 'Error' : formatResult(result);
		operator = null;
		previous = null;
		waitingForNew = true;
		updateScreen();
	}

	function formatResult(num) {
		if (!isFinite(num)) return 'Error';
		// Use exponential for extremely large/small numbers
		if (Math.abs(num) > 1e12 || (Math.abs(num) !== 0 && Math.abs(num) < 1e-9)) {
			return Number(num).toExponential(9);
		}
		if (Number.isInteger(num)) return String(num);
		// trim to sensible decimal places
		return parseFloat(num.toFixed(9)).toString();
	}

	function backspace() {
		if (waitingForNew) return;
		if (current.length === 1 || (current.length === 2 && current.startsWith('-'))) {
			current = '0';
		} else {
			current = current.slice(0, -1);
		}
		updateScreen();
	}

	// Click handling
	keys.addEventListener('click', (e) => {
		const btn = e.target.closest('button');
		if (!btn) return;
		const value = btn.dataset.value;
		const action = btn.dataset.action;

		if (value) {
			inputDigit(value);
			return;
		}

		if (action) {
			switch (action) {
				case 'clear':
					clearAll();
					break;
				case 'percent':
					percent();
					break;
				case 'plus-minus':
					plusMinus();
					break;
				case 'equals':
					compute();
					break;
				case 'add':
				case 'subtract':
				case 'multiply':
				case 'divide':
					handleOperator(action);
					break;
			}
		}
	});

	// Keyboard support
	window.addEventListener('keydown', (e) => {
		const k = e.key;
		if (k >= '0' && k <= '9') {
			inputDigit(k);
			e.preventDefault();
			return;
		}
		if (k === '.') {
			inputDigit('.');
			e.preventDefault();
			return;
		}
		if (k === 'Enter' || k === '=') {
			compute();
			e.preventDefault();
			return;
		}
		if (k === '+') {
			handleOperator('add');
			e.preventDefault();
			return;
		}
		if (k === '-') {
			handleOperator('subtract');
			e.preventDefault();
			return;
		}
		if (k === '*' || k === 'x' || k === 'X') {
			handleOperator('multiply');
			e.preventDefault();
			return;
		}
		if (k === '/') {
			handleOperator('divide');
			e.preventDefault();
			return;
		}
		if (k === 'Backspace') {
			backspace();
			e.preventDefault();
			return;
		}
		if (k === 'Escape' || k.toLowerCase() === 'c') {
			clearAll();
			e.preventDefault();
			return;
		}
		if (k === '%') {
			percent();
			e.preventDefault();
			return;
		}
	});

	// init
	updateScreen();
});