import { fmt } from '../utils/helpers.js';
import { renderTableau, logToTableau } from '../renderers/tableau-renderer.js';
import { isAllBNonNegative } from './simplex.js';
import { drawGraph } from '../renderers/graph-renderer.js';

export function runGaussStep(state, tableauContainer) {
  const stepNum = state.gaussStep;
  const { tableau, m, nTotal } = state;

  if (stepNum >= m) {
    return;
  }

  const pivotRow = stepNum;
  const pivotCol = stepNum;
  const pivotVal = tableau[pivotRow][pivotCol];

  let tempTableau = tableau.map(r => r.slice());
  let operationsLog = `Крок ${stepNum + 1}. Виконуємо перетворення:<br>`;

  if (Math.abs(pivotVal - 1) > 1e-9) {
    operationsLog += `Рядок<sub>${pivotRow + 1}</sub> = Рядок<sub>${
      pivotRow + 1
    }</sub> / (${fmt(pivotVal)})<br>`;
    for (let j = 0; j <= nTotal; j++) {
      tempTableau[pivotRow][j] /= pivotVal;
    }
  }

  for (let i = 0; i < m; i++) {
    if (i === pivotRow) continue;
    const factor = tempTableau[i][pivotCol];
    if (Math.abs(factor) > 1e-9) {
      operationsLog += `Рядок<sub>${i + 1}</sub> = Рядок<sub>${
        i + 1
      }</sub> - (${fmt(factor)}) * Рядок<sub>${pivotRow + 1}</sub><br>`;
      for (let j = 0; j <= nTotal; j++) {
        tempTableau[i][j] -= factor * tempTableau[pivotRow][j];
      }
    }
  }

  state.tableau = tempTableau;
  state.gaussStep++;

  renderTableau(state, { caption: operationsLog }, tableauContainer);

  if (state.gaussStep === m) {
    logToTableau('<hr>', false, tableauContainer);

    let finalC = state.C.slice();
    let finalQ = 0;
    for (let i = 0; i < m; i++) {
      const basisVar = i;
      const cCoeff = finalC[basisVar];
      if (Math.abs(cCoeff) < 1e-9) continue;

      finalQ += cCoeff * state.tableau[i][nTotal];
      for (let j = m; j < nTotal; j++) {
        finalC[j] -= cCoeff * state.tableau[i][j];
      }
      finalC[basisVar] = 0;
    }

    let newTableau = Array.from({ length: m + 1 }, () =>
      Array(nTotal + 1).fill(0)
    );

    for (let i = 0; i < m; i++) {
      for (let j = 0; j <= nTotal; j++) {
        newTableau[i][j] = state.tableau[i][j];
      }
    }

    for (let j = 0; j < nTotal; j++) {
      newTableau[m][j] = -finalC[j];
    }
    newTableau[m][nTotal] = finalQ;

    state.tableau = newTableau;
    state.base = Array.from({ length: m }, (_, i) => i);
    state.nonBasicOrder = Array.from({ length: nTotal - m }, (_, i) => m + i);

    const currentStage = isAllBNonNegative(state.tableau, m, state.nTotal)
      ? 5
      : 4;
    state.currentStage = currentStage;
    state.solIter = 0;
    state.isFirstSimplexStep = true;

    logToTableau(
      '<b><u>3 етап:</u></b> Складання початкової симплекс-таблиці.',
      false,
      tableauContainer
    );
    renderTableau(
      state,
      { caption: 'Початкова симплекс-таблиця.' },
      tableauContainer
    );

    if (state.nonBasicOrder.length === 2) {
      const graphContainer = document.getElementById('graph-container');

      const problemForGraph = {
        nOrig: 2,
        m: state.m,
        A: state.tableau
          .slice(0, state.m)
          .map(row => state.nonBasicOrder.map(j => -row[j])),
        b: state.tableau.slice(0, state.m).map(row => row[state.nTotal]),
        sign: Array(state.m).fill('<='),
        varbound: ['>=0', '>=0'],
      };

      drawGraph(problemForGraph, graphContainer);
    }
  }
}
