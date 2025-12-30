// --- Core ---
import { getState, setState, resetState } from './core/state.js';

// --- Utils ---
import { fmt, setFractionDisplay } from './utils/helpers.js';

// --- Problem Data Logic ---
import { readProblem } from './problem/problem-parser.js';
import { validateInputs, clearInputData } from './problem/form-data.js';
import { loadTestTask } from './problem/examples.js';

// --- Renderers ---
import { buildForm as buildFormRenderer } from './renderers/form-renderer.js';
import { renderProblemPreview } from './renderers/preview-renderer.js';
import { logToTableau, renderTableau } from './renderers/tableau-renderer.js';
import {
  drawGraph,
  updateGraphWithSolution,
  getBoard,
  setBoard,
} from './renderers/graph-renderer.js';

// --- Algorithms ---
import {
  createInitialTableau,
  jordanElimination,
  choosePhase1Pivot,
  choosePhase2Pivot,
  isAllBNonNegative,
  findAlternativeSolution,
} from './algorithms/simplex.js';
import { runGaussStep } from './algorithms/gauss.js';

export function initialize() {
  const numVarsEl = document.getElementById('numVars');
  const numConsEl = document.getElementById('numCons');
  const problemTypeEl = document.getElementById('problemType');
  const coeffForms = document.getElementById('coeffForms');
  const solveAllBtn = document.getElementById('solveAllBtn');
  const resetBtn = document.getElementById('reset');
  const clearDataBtn = document.getElementById('clearDataBtn');
  const tableauContainer = document.getElementById('tableauContainer');
  const statusEl = document.getElementById('status');
  const graphContainer = document.getElementById('graph-container');
  const loadTestTaskBtn = document.getElementById('loadTestTaskBtn');
  const fileInput = document.getElementById('fileInput');
  const exampleSelector = document.getElementById('exampleSelector');
  const loadSelectedExampleBtn = document.getElementById('loadSelectedExample');
  const fileInputLabel = document.getElementById('fileInputLabel');
  const toggleFractionBtn = document.getElementById('toggleFractionBtn');

  let loadedExamples = [];

  function renderPreviewHandler() {
    renderProblemPreview(numVarsEl, numConsEl, problemTypeEl, coeffForms);
  }

  function attachPreviewHandlers() {
    coeffForms.querySelectorAll('input,select').forEach(el => {
      el.addEventListener('input', renderPreviewHandler);
      el.addEventListener('change', renderPreviewHandler);
    });
  }

  function buildFormHandler() {
    buildFormRenderer(
      numVarsEl,
      numConsEl,
      coeffForms,
      attachPreviewHandlers,
      renderPreviewHandler
    );
  }

  function loadTestTaskHandler() {
    fullReset();
    loadTestTask(
      numVarsEl,
      numConsEl,
      problemTypeEl,
      buildFormHandler,
      coeffForms,
      renderPreviewHandler
    );
  }

  function applyExampleData(example) {
    if (!example) return;
    resetSolution();
    numVarsEl.value = example.numVars;
    numConsEl.value = example.numCons;
    problemTypeEl.value = example.problemType;
    buildFormHandler();
    if (example.c) {
      example.c.forEach((val, j) => {
        const inp = coeffForms.querySelector(`[data-role="c"][data-j="${j}"]`);
        if (inp) inp.value = val;
      });
    }
    if (example.b) {
      example.b.forEach((val, i) => {
        const inp = coeffForms.querySelector(`[data-role="b"][data-i="${i}"]`);
        if (inp) inp.value = val;
      });
    }
    if (example.sign) {
      example.sign.forEach((val, i) => {
        const sel = coeffForms.querySelector(
          `[data-role="sign"][data-i="${i}"]`
        );
        if (sel) sel.value = val;
      });
    }
    if (example.varbound) {
      example.varbound.forEach((val, j) => {
        const sel = coeffForms.querySelector(
          `[data-role="varbound"][data-j="${j}"]`
        );
        if (sel) sel.value = val;
      });
    }
    if (example.a) {
      example.a.forEach((row, i) => {
        row.forEach((val, j) => {
          const inp = coeffForms.querySelector(
            `[data-role="a"][data-i="${i}"][data-j="${j}"]`
          );
          if (inp) inp.value = val;
        });
      });
    }
    renderPreviewHandler();
  }

  function resetSolution() {
    resetState();
    tableauContainer.innerHTML = '';
    statusEl.textContent = '';
    graphContainer.style.display = 'none';
    if (getBoard()) {
      JXG.JSXGraph.freeBoard(getBoard());
    }
    setBoard(null);
  }

  function fullReset() {
    resetSolution();
    fileInputLabel.style.display = '';
    exampleSelector.style.display = 'none';
    loadSelectedExampleBtn.style.display = 'none';
    exampleSelector.innerHTML = '';
    exampleSelector.disabled = true;
    loadSelectedExampleBtn.disabled = true;
    fileInput.value = '';
  }

  function clearDataAndFileHandler() {
    fullReset();
    clearInputData(coeffForms, renderPreviewHandler);
  }

  function start() {
    resetSolution();
    if (!validateInputs(coeffForms)) {
      statusEl.textContent =
        "Будь ласка, введіть дані задачі перед розв'язанням.";
      statusEl.style.color = 'orange';
      tableauContainer.innerHTML = '';
      return;
    }
    statusEl.style.color = '';
    try {
      const originalProblem = (function readOriginal() {
        const n = parseInt(numVarsEl.value, 10);
        const m = parseInt(numConsEl.value, 10);
        let A = Array.from({ length: m }, () => Array(n).fill(0));
        let b = Array(m).fill(0);
        let sign = Array(m).fill('<=');
        let varbound = Array(n).fill('>=0');
        coeffForms
          .querySelectorAll('[data-role="a"]')
          .forEach(
            inp =>
              (A[+inp.dataset.i][+inp.dataset.j] = parseFloat(inp.value || '0'))
          );
        coeffForms
          .querySelectorAll('[data-role="b"]')
          .forEach(inp => (b[+inp.dataset.i] = parseFloat(inp.value || '0')));
        coeffForms
          .querySelectorAll('[data-role="sign"]')
          .forEach(sel => (sign[+sel.dataset.i] = sel.value));
        coeffForms
          .querySelectorAll('[data-role="varbound"]')
          .forEach(sel => (varbound[+sel.dataset.j] = sel.value));
        return { nOrig: n, m, A, b, sign, varbound };
      })();
      drawGraph(originalProblem, graphContainer);
      const problem = readProblem(
        numVarsEl,
        numConsEl,
        problemTypeEl,
        coeffForms
      );
      logToTableau(
        '<h3>Алгоритм симплекс-метода:</h3>',
        false,
        tableauContainer
      );
      let newState;
      if (problem.isCanonical) {
        logToTableau(
          '<b><u>1 етап:</u></b> Задача лінійного вже подана в канонічній формі.',
          false,
          tableauContainer
        );
        logToTableau(
          '<b><u>2 етап:</u></b><br> 2.1. Приведення системи до канонічного вигляду.</br>2.2 Виключення базисних змінних з цільової функції.<br>',
          false,
          tableauContainer
        );
        let matrix = Array.from({ length: problem.m }, (_, i) => [
          ...problem.A[i],
          problem.b[i],
        ]);
        newState = {
          ...problem,
          tableau: matrix,
          currentStage: 'gauss',
          gaussStep: 0,
          finished: false,
        };
        renderTableau(
          newState,
          { caption: 'Початкова розширена матриця [A|b].' },
          tableauContainer
        );
        statusEl.textContent = '2 етап: Покрокове виключення невідомих';
      } else {
        logToTableau(
          '<b><u>1 етап:</u></b> Приведення задачі лінійного програмування до канонічної форми.',
          false,
          tableauContainer
        );
        const tableau = createInitialTableau(problem);
        logToTableau(
          '<b><u>2 етап:</u></b> Приведення системи обмежень до канонічного вигляду.',
          false,
          tableauContainer
        );
        logToTableau(
          '<b><u>3 етап:</u></b> Складання початкової симплекс-таблиці.',
          false,
          tableauContainer
        );
        const currentStage = isAllBNonNegative(
          tableau,
          problem.m,
          problem.nTotal
        )
          ? 5
          : 4;
        const initialNonBasic = [];
        for (let j = 0; j < problem.nTotal; j++)
          if (!problem.base.includes(j)) initialNonBasic.push(j);
        newState = {
          ...problem,
          tableau,
          currentStage,
          pivot: null,
          finished: false,
          solIter: 0,
          nonBasicOrder: initialNonBasic,
          isFirstSimplexStep: true,
        };
        renderTableau(
          newState,
          { caption: 'Початкова симплекс-таблиця.' },
          tableauContainer
        );
      }
      setState(newState);
    } catch (e) {
      console.error(e);
      logToTableau(
        `<p style="color: red;">Помилка: ${e.message}</p>`,
        false,
        tableauContainer
      );
      statusEl.textContent = 'Помилка при ініціалізації задачі.';
    }
  }

  function step() {
    let state = getState();
    if (!state || state.finished) return;

    if (state.currentStage === 'gauss') {
      runGaussStep(state, tableauContainer);
      setState(state);
      return;
    }

    if (state.isFirstSimplexStep) {
      state.isFirstSimplexStep = false;
      if (state.currentStage === 4) {
        logToTableau(
          "<h4><u>4 етап.</u> Знаходження початкового базисного розв'язку</h4>",
          true,
          tableauContainer
        );
        statusEl.textContent = "4 етап. Пошук початкового розв'язку";
      } else {
        logToTableau(
          "<h4><u>5 етап</u>. Знаходження оптимального розв'язку</h4>",
          true,
          tableauContainer
        );
        statusEl.textContent = "5 етап. Пошук оптимального розв'язку";
      }
    }

    if (!state.pivot) {
      const choice =
        state.currentStage === 4
          ? choosePhase1Pivot(
              state.tableau,
              state.m,
              state.nTotal,
              state.nonBasicOrder
            )
          : choosePhase2Pivot(
              state.tableau,
              state.m,
              state.nTotal,
              state.nonBasicOrder
            );

      if (choice === null) {
        state.finished = true;
      } else {
        state.pivot = choice;
      }
    }

    if (state.finished) {
      const f_val =
        state.tableau[state.m][state.nTotal] * (state.type === 'min' ? -1 : 1);

      const fullOptimalVector = Array(state.nTotal).fill(0);
      for (let i = 0; i < state.m; i++) {
        fullOptimalVector[state.base[i]] = state.tableau[i][state.nTotal];
      }

      const getOriginalSolution = solutionVector => {
        const originalSolution = Array(state.nOrig).fill(0);
        if (state.variableMap && state.variableMap.length > 0) {
          state.variableMap.forEach(mapping => {
            const j = mapping.originalIndex;
            if (mapping.type === 'free') {
              const val1 = solutionVector[mapping.newIndices[0]] || 0;
              const val2 = solutionVector[mapping.newIndices[1]] || 0;
              originalSolution[j] = val1 - val2;
            } else if (mapping.type === 'leq') {
              const val = solutionVector[mapping.newIndices[0]] || 0;
              originalSolution[j] = -val;
            } else {
              const val = solutionVector[mapping.newIndices[0]] || 0;
              originalSolution[j] = val;
            }
          });
        } else {
          for (let i = 0; i < state.m; i++) {
            const basisVarIndex = state.base[i];
            if (basisVarIndex < state.nOrig) {
              originalSolution[basisVarIndex] = state.tableau[i][state.nTotal];
            }
          }
        }
        return originalSolution;
      };

      const originalOptimalVector = getOriginalSolution(fullOptimalVector);
      const alternativeSolution = findAlternativeSolution(state);

      let finalCaption;

      if (alternativeSolution) {
        const originalAltVector = getOriginalSolution(
          alternativeSolution.solutionVector
        );
        finalCaption = `Всі коефіцієнти в рядку цільової функції невід'ємні, при цьому коефіцієнт при небазисній змінній дорівнює нулю.
            <br><b>Це свідчить про наявність альтернативних розв'язків.</b>
            <br>Задача має нескінченну кількість розв'язків.
            <br>Оптимальне значення цільової функції <b>f* = ${fmt(
              f_val
            )}</b> досягається в будь-якій точці відрізка, що з'єднує крайні точки:
            <br><b>x*₁ = [${originalOptimalVector
              .map(fmt)
              .join(', ')}]</b> та <b>x*₂ = [${originalAltVector
          .map(fmt)
          .join(', ')}]</b>.`;
      } else {
        finalCaption = `Всі коефіцієнти в рядку коефіцієнтів цільової функції симплекс-таблиці невід'ємні.
            <br><b>Оптимальний розв'язок єдиний.</b>
            <br>x* = x<sup>(${state.solIter})</sup> = [${fullOptimalVector
          .map(fmt)
          .join(', ')}], <br>f* = f(x<sup>(${state.solIter})</sup>) = ${fmt(
          f_val
        )}.`;
      }

      renderTableau(state, { caption: finalCaption }, tableauContainer);

      let altPointForGraph = null;
      if (alternativeSolution) {
        const originalAltGraphPoint = getOriginalSolution(
          alternativeSolution.solutionVector
        );
        altPointForGraph = originalAltGraphPoint.slice(0, 2);
      }
      updateGraphWithSolution(
        { ...state, originalSolution: originalOptimalVector },
        altPointForGraph
      );

      statusEl.textContent = 'Оптимальний розвʼязок знайдено.';
      setState(state);
      return;
    }

    const { tableau, m, nTotal, base, nonBasicOrder } = state;
    const pivotToExecute = state.pivot;

    if (!pivotToExecute) {
      setState(state);
      return;
    }

    if (pivotToExecute.infeasible || pivotToExecute.unbounded) {
      state.finished = true;
      let finalCaption = '';
      if (pivotToExecute.infeasible) {
        finalCaption = `<b>Задача не має розв'язків через несумісність системи обмежень.</b>
            <br>Перевірка показала, що в рядку <b>${
              pivotToExecute.row + 1
            }</b> вільний член β є від'ємним (β = ${fmt(
          tableau[pivotToExecute.row][nTotal]
        )}), 
            але всі коефіцієнти α в цьому рядку є невід'ємними.`;
        statusEl.textContent = 'Система обмежень несумісна.';
      }
      if (pivotToExecute.unbounded) {
        const visualColIndex = nonBasicOrder.indexOf(pivotToExecute.col) + 1;
        finalCaption = `<b>Задача не має розв'язку.</b><br>В стовпці ${visualColIndex} (змінна x<sub>${
          pivotToExecute.col + 1
        }</sub>) з від'ємним коефіцієнтом цільової функції немає додатних коефіцієнтів. Функція необмежена.`;
        statusEl.textContent = 'Цільова функція необмежена.';
      }
      renderTableau(state, { caption: finalCaption }, tableauContainer);
      setState(state);
      return;
    }

    const { row: pivotRow, col: pivotCol } = pivotToExecute;
    const pivotVal = tableau[pivotRow][pivotCol];
    const leavingVar = base[pivotRow];
    let caption = '';

    if (state.currentStage === 4) {
      caption +=
        "Оскільки серед вільних членів βᵢ є від'ємні, то початковий опорний розв'язок відсутній.<br>";

      let candidateRow = -1;
      let minBeta = -1e-9;
      for (let i = 0; i < m; i++) {
        if (tableau[i][nTotal] < minBeta) {
          minBeta = tableau[i][nTotal];
          candidateRow = i;
        }
      }

      caption += `Так як в рядку ${
        candidateRow + 1
      } з від'ємним вільним членом β<sub>${candidateRow + 1}</sub> = ${fmt(
        minBeta
      )} серед коефіцієнтів α є від'ємні, то несумісності системи обмежень не виявлено. `;

      let pivotColForCaption = -1;
      let maxAbsAlpha = 0;
      for (const varIndex of nonBasicOrder) {
        const alpha = tableau[candidateRow][varIndex];
        if (alpha < -1e-9) {
          if (Math.abs(alpha) > maxAbsAlpha) {
            maxAbsAlpha = Math.abs(alpha);
            pivotColForCaption = varIndex;
          }
        }
      }

      let countOfMaxAbs = 0;
      for (const varIndex of nonBasicOrder) {
        const alpha = tableau[candidateRow][varIndex];
        if (alpha < -1e-9 && Math.abs(Math.abs(alpha) - maxAbsAlpha) < 1e-9) {
          countOfMaxAbs++;
        }
      }

      caption += `У рядку β<sub>${candidateRow + 1}</sub> = ${fmt(
        minBeta
      )} виберемо від’ємний елемент α<sub>${candidateRow + 1}${
        nonBasicOrder.indexOf(pivotColForCaption) + 1
      }</sub> = ${fmt(maxAbsAlpha * -1)} – він є `;
      if (countOfMaxAbs > 1) {
        caption += `першим за порядком серед елементів з максимальним модулем.<br>`;
      } else {
        caption += `максимальним за модулем.<br>`;
      }

      caption += `Розв’язувальним стовпцем буде стовпець <b>${
        nonBasicOrder.indexOf(pivotCol) + 1
      }</b>. Змінна <b>x<sub>${pivotCol + 1}</sub></b> вводиться в базис.<br>`;
      const ratios = [];
      for (let i = 0; i < m; i++) {
        const alpha = tableau[i][pivotCol];
        if (Math.abs(alpha) > 1e-9) {
          const ratio = tableau[i][nTotal] / alpha;
          if (ratio >= 0) {
            ratios.push(`${fmt(tableau[i][nTotal])}/${fmt(alpha)}`);
          }
        }
      }

      if (ratios.length > 0) {
        const pivotAlpha = tableau[pivotRow][pivotCol];
        const pivotBeta = tableau[pivotRow][nTotal];
        caption += `Розв’язувальним рядком буде рядок <b>${
          pivotRow + 1
        }</b>, так як min(${ratios.join(', ')}) = ${fmt(pivotBeta)}/${fmt(
          pivotAlpha
        )} = ${fmt(pivotBeta / pivotAlpha)}. Змінна <b>x<sub>${
          leavingVar + 1
        }</sub></b> виводиться з базису.<br>`;
      }

      caption += `Розв'язувальний елемент - α<sub>${pivotRow + 1}${
        nonBasicOrder.indexOf(pivotCol) + 1
      }</sub> = <b>${fmt(pivotVal)}</b>.<br>`;
      caption += 'Виконуємо крок модифікованих Жорданових виключень.';
    } else {
      const fullSolutionVector = Array(state.nTotal).fill(0);
      for (let i = 0; i < m; i++)
        fullSolutionVector[base[i]] = tableau[i][nTotal];

      const solType =
        state.solIter === 0
          ? "Початковий базисний розв'язок"
          : "Базисний розв'язок";
      caption = `<b>${solType}: x<sup>(${
        state.solIter
      })</sup> = [${fullSolutionVector.map(fmt).join(', ')}], f(x<sup>(${
        state.solIter
      })</sup>) = ${fmt(
        tableau[m][nTotal] * (state.type === 'min' ? -1 : 1)
      )}.</b><br>`;

      const mostNegativeCoeff = Math.min(
        ...nonBasicOrder.map(j => tableau[m][j])
      );
      caption += `У рядку коефіцієнтів цільової функції симплекс-таблиці є від’ємний коефіцієнт ${fmt(
        mostNegativeCoeff
      )}.<br>`;

      const colElements = [];
      for (let i = 0; i < m; i++) {
        colElements.push(tableau[i][pivotCol]);
      }
      const allNegativeOrZero = colElements.every(el => el <= 1e-9);
      if (allNegativeOrZero) {
        caption += `Серед коефіцієнтів стовпця з від’ємним коефіцієнтом цільової функції немає додатних коефіцієнтів. <b>Функція необмежена.</b><br>`;
      } else {
        caption += `Так як серед коефіцієнтів стовпця з від’ємним коефіцієнтом цільової функції є додатні коефіцієнти, то необмеженості цільової функції на допустимій множині не виявлено.<br>`;
      }

      const visualColIndex = nonBasicOrder.indexOf(pivotCol) + 1;
      caption += `Розв’язувальним стовпцем буде стовпець <b>${visualColIndex}</b>. `;

      const ratios = [];
      for (let i = 0; i < m; i++) {
        const a = tableau[i][pivotCol];
        if (a > 1e-9) {
          const b = tableau[i][nTotal];
          ratios.push(`${fmt(b)}/${fmt(a)}`);
        }
      }

      caption += `<br>Розв’язувальним рядком буде рядок <b>${
        pivotRow + 1
      }</b>, так як min(${ratios.join(', ')}) = ${fmt(
        tableau[pivotRow][nTotal]
      )}/${fmt(tableau[pivotRow][pivotCol])} = ${fmt(
        tableau[pivotRow][nTotal] / tableau[pivotRow][pivotCol]
      )}.<br>`;

      caption += `Виконуємо крок модифікованих Жорданових виключень і переходимо до нового базисного розв’язку.`;
    }

    renderTableau(state, { caption }, tableauContainer);

    jordanElimination(tableau, m, nTotal, pivotRow, pivotCol);
    const pivotColPos = nonBasicOrder.indexOf(pivotCol);
    base[pivotRow] = pivotCol;
    nonBasicOrder[pivotColPos] = leavingVar;

    const wasStage4 = state.currentStage === 4;
    if (wasStage4 && isAllBNonNegative(tableau, m, nTotal)) {
      state.currentStage = 5;
      state.solIter = 0;
      statusEl.textContent = "5 етап. Пошук оптимального розв'язку";
      logToTableau(
        "<h4><u>5 етап.</u> Знаходження оптимального розв'язку</h4>",
        true,
        tableauContainer
      );
    } else {
      state.solIter++;
    }

    state.pivot = null;
    setState(state);
  }

  function solveAll() {
    start();
    let state = getState();
    if (state && !state.finished) {
      let iterationLimit = 100;
      while (getState() && !getState().finished && iterationLimit-- > 0) {
        step();
      }
      if (iterationLimit <= 0) {
        console.error('Перевищено ліміт ітерацій.');
        logToTableau(
          `<p style="color: red;">Помилка: Перевищено ліміт ітерацій.</p>`,
          false,
          tableauContainer
        );
      }
    }
  }

  numVarsEl.addEventListener('input', buildFormHandler);
  numConsEl.addEventListener('input', buildFormHandler);
  problemTypeEl.addEventListener('change', renderPreviewHandler);
  solveAllBtn.addEventListener('click', solveAll);
  resetBtn.addEventListener('click', resetSolution);
  clearDataBtn.addEventListener('click', clearDataAndFileHandler);
  loadTestTaskBtn.addEventListener('click', loadTestTaskHandler);

  let isFractionMode = true;

  toggleFractionBtn.addEventListener('click', () => {
    isFractionMode = !isFractionMode;
    setFractionDisplay(isFractionMode);

    toggleFractionBtn.textContent = isFractionMode
      ? 'Вигляд: ДРОБИ'
      : 'Вигляд: ДЕСЯТКОВІ';

    const state = getState();
    if (state) {
      if (validateInputs(coeffForms)) {
        solveAll();
      }
    }
  });

  fileInput.addEventListener('change', event => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const content = e.target.result;
        loadedExamples = JSON.parse(content);
        exampleSelector.innerHTML = '';
        loadedExamples.forEach(example => {
          const option = document.createElement('option');
          option.value = example.id;
          option.textContent = example.name || example.id;
          exampleSelector.appendChild(option);
        });
        fileInputLabel.style.display = 'none';
        exampleSelector.style.display = '';
        loadSelectedExampleBtn.style.display = '';
        exampleSelector.disabled = false;
        loadSelectedExampleBtn.disabled = false;
      } catch (err) {
        alert(
          'Помилка: Не вдалося прочитати або розпарсити JSON файл.\n' +
            err.message
        );
        loadedExamples = [];
        fullReset();
      }
    };
    reader.readAsText(file);
  });

  loadSelectedExampleBtn.addEventListener('click', () => {
    const selectedId = exampleSelector.value;
    const selectedExample = loadedExamples.find(ex => ex.id === selectedId);
    if (selectedExample) {
      applyExampleData(selectedExample);
    }
  });

  buildFormHandler();
}
