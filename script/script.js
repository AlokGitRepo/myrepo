document.addEventListener('DOMContentLoaded', () => {
	const screen = document.getElementById('screen');
	const keys = document.querySelector('.keys');
	const advancedPanel = document.getElementById('advanced');
	const toggleAdvanced = document.getElementById('toggle-advanced');
	const historyListEl = document.getElementById('history-list');
	const historyClearBtn = document.getElementById('history-clear');

	let current = '0';
	let previous = null;
	let operator = null;
	let waitingForNew = false;

	// business features
	let memory = 0; // memory register
	const history = [];

	function flashScreen() {
		screen.classList.add('updated');
		setTimeout(() => screen.classList.remove('updated'), 160);
	}

	function updateScreen() {
		screen.textContent = current;
		screen.classList.toggle('error', current === 'Error');
		flashScreen();
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

		const prevDisplay = `${previous} ${operatorSymbol(operator)} ${current}`;

		current = result === 'Error' ? 'Error' : formatResult(result);
		operator = null;
		previous = null;
		waitingForNew = true;
		updateScreen();

		if (result !== 'Error') addHistory(`${prevDisplay} = ${current}`);
	}

	function operatorSymbol(op){
		switch(op){
			case 'add': return '+';
			case 'subtract': return '-';
			case 'multiply': return '×';
			case 'divide': return '÷';
		}
		return op;
	}

	function formatResult(num) {
		if (!isFinite(num)) return 'Error';
		if (Math.abs(num) > 1e12 || (Math.abs(num) !== 0 && Math.abs(num) < 1e-9)) {
			return Number(num).toExponential(9);
		}
		if (Number.isInteger(num)) return String(num);
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

	// Memory functions
	function memoryClear(){ memory = 0; }
	function memoryRecall(){ current = String(memory); waitingForNew = false; updateScreen(); }
	function memoryAdd(){ memory = memory + parseFloat(current || 0); }
	function memorySubtract(){ memory = memory - parseFloat(current || 0); }

	// Advanced unary operations
	function applyUnary(op){
		let x = parseFloat(current);
		let res = x;
		switch(op){
			case 'sqrt': res = x < 0 ? 'Error' : Math.sqrt(x); break;
			case 'square': res = x * x; break;
			case 'reciprocal': res = x === 0 ? 'Error' : 1 / x; break;
			case 'taxplus': res = x * 1.10; break; // default 10% tax
			case 'taxminus': res = x / 1.10; break;
		}
		current = res === 'Error' ? 'Error' : formatResult(res);
		waitingForNew = true;
		updateScreen();
		if (res !== 'Error') addHistory(`${op}(${x}) = ${current}`);
	}

	// History
	function addHistory(entry){
		history.unshift(entry);
		while(history.length > 50) history.pop();
		renderHistory();
	}

	function renderHistory(){
		historyListEl.innerHTML = '';
		history.forEach((h, i) => {
			const li = document.createElement('li');
			li.textContent = h;
			li.dataset.index = i;
			historyListEl.appendChild(li);
		});
	}

	function clearHistory(){ history.length = 0; renderHistory(); }

	// Click handling
	keys.addEventListener('click', (e) => {
		const btn = e.target.closest('button');
		if (!btn) return;
		const value = btn.dataset.value;
		const action = btn.dataset.action;

		if (value) { inputDigit(value); return; }

		if (action) {
			switch (action) {
				case 'clear': clearAll(); break;
				case 'back': backspace(); break;
				case 'percent': percent(); break;
				case 'plus-minus': plusMinus(); break;
				case 'equals': compute(); break;
				case 'add': case 'subtract': case 'multiply': case 'divide': handleOperator(action); break;
				case 'mc': memoryClear(); break;
				case 'mr': memoryRecall(); break;
				case 'mplus': memoryAdd(); break;
				case 'mminus': memorySubtract(); break;
				case 'sqrt': case 'square': case 'reciprocal': case 'taxplus': case 'taxminus': applyUnary(action); break;
			}
		}
	});

	// History click: recall result when clicking an entry
	historyListEl.addEventListener('click', (e)=>{
		const li = e.target.closest('li');
		if(!li) return;
		const text = li.textContent || '';
		const m = text.match(/=\s*(.*)$/);
		if(m) {
			current = m[1];
			waitingForNew = false;
			updateScreen();
		}
	});

	historyClearBtn.addEventListener('click', clearHistory);

	// Toggle advanced
	toggleAdvanced.addEventListener('click', ()=>{
		const showing = advancedPanel.classList.toggle('show');
		advancedPanel.setAttribute('aria-hidden', !showing);
		toggleAdvanced.setAttribute('aria-pressed', showing);
	});

	// Keyboard support
	window.addEventListener('keydown', (e) => {
		const k = e.key;
		if (k >= '0' && k <= '9') { inputDigit(k); e.preventDefault(); return; }
		if (k === '.') { inputDigit('.'); e.preventDefault(); return; }
		if (k === 'Enter' || k === '=') { compute(); e.preventDefault(); return; }
		if (k === '+') { handleOperator('add'); e.preventDefault(); return; }
		if (k === '-') { handleOperator('subtract'); e.preventDefault(); return; }
		if (k === '*' || k === 'x' || k === 'X') { handleOperator('multiply'); e.preventDefault(); return; }
		if (k === '/') { handleOperator('divide'); e.preventDefault(); return; }
		if (k === 'Backspace') { backspace(); e.preventDefault(); return; }
		if (k === 'Escape' || k.toLowerCase() === 'c') { clearAll(); e.preventDefault(); return; }
		if (k === '%') { percent(); e.preventDefault(); return; }
	});

	// init
	updateScreen();
});