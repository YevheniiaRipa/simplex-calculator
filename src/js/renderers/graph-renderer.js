import { fmt } from '../utils/helpers.js';
import JXG from 'jsxgraph';

let board = null;

export function getBoard() {
  return board;
}
export function setBoard(newBoard) {
  board = newBoard;
}

export function drawGraph(originalProblem, graphContainer) {
  if (originalProblem.nOrig !== 2) {
    graphContainer.style.display = 'none';
    return;
  }
  graphContainer.style.display = 'block';

  if (getBoard()) JXG.JSXGraph.freeBoard(getBoard());

  setBoard(
    JXG.JSXGraph.initBoard('jxgbox', {
      boundingbox: [-10, 10, 10, -10],
      axis: true,
      grid: true,
      pan: {
        enabled: true,
        needShift: false,
      },
      zoom: {
        factorX: 1.25,
        factorY: 1.25,
        wheel: true,
        pinch: true,
        needShift: false,
      },
      showNavigation: true,
    })
  );

  const board = getBoard();

  const fillSettings = {
    fillColor: '#27ae60',
    fillOpacity: 0.2,
    highlight: false,
  };

  const lineYAxis = board.create('line', [0, 1, 0], { visible: false }); // x₁ = 0
  const lineXAxis = board.create('line', [0, 0, 1], { visible: false }); // x₂ = 0

  // Обмеження для x₁
  if (originalProblem.varbound[0] === '>=0') {
    board.create('inequality', [lineYAxis], { inverse: true, ...fillSettings }); // x₁ >= 0
  } else if (originalProblem.varbound[0] === '<=0') {
    board.create('inequality', [lineYAxis], { ...fillSettings }); // x₁ <= 0
  }

  // Обмеження для x₂
  if (originalProblem.varbound[1] === '>=0') {
    board.create('inequality', [lineXAxis], { inverse: true, ...fillSettings }); // x₂ >= 0
  } else if (originalProblem.varbound[1] === '<=0') {
    board.create('inequality', [lineXAxis], { ...fillSettings }); // x₂ <= 0
  }

  originalProblem.A.forEach((row, i) => {
    const a1 = row[0];
    const a2 = row[1];
    const b_val = originalProblem.b[i];
    const sign = originalProblem.sign[i];

    if (sign === '=') return;

    const line = board.create('line', [-b_val, a1, a2], {
      strokeColor: '#3498db',
      strokeWidth: 2,
      name: `Обм. ${i + 1}`,
      withLabel: true,
    });

    board.create('inequality', [line], {
      inverse: sign === '>=',
      ...fillSettings,
    });
  });
}
export function updateGraphWithSolution(
  finalState,
  alternativeSolutionPoint = null
) {
  if (!getBoard() || finalState.nOrig !== 2) return;

  const x1_opt = finalState.originalSolution[0];
  const x2_opt = finalState.originalSolution[1];

  if (alternativeSolutionPoint) {
    const [x1_alt, x2_alt] = alternativeSolutionPoint;
    getBoard().create(
      'segment',
      [
        [x1_opt, x2_opt],
        [x1_alt, x2_alt],
      ],
      {
        name: "Оптимальні розв'язки",
        withLabel: true,
        label: { position: 'top' },
        strokeColor: '#e74c3c',
        strokeWidth: 4,
      }
    );
  } else {
    getBoard().create('point', [x1_opt, x2_opt], {
      name: `<div style="text-align:center;">
           Оптимальний розв'язок <br>
           x* = (${fmt(x1_opt)}, ${fmt(x2_opt)})
         </div>`,
      face: 'diamond',
      size: 5,
      color: '#e74c3c',
    });
  }

  const { C, type } = finalState;
  const c1 =
    finalState.variableMap[0].type === 'free'
      ? C[0]
      : finalState.variableMap[0].type === 'leq'
      ? -C[0]
      : C[0];
  const c2 =
    finalState.variableMap[1].type === 'free'
      ? C[2] || C[1]
      : finalState.variableMap[1].type === 'leq'
      ? -C[1]
      : C[1];
  const Z_opt = c1 * x1_opt + c2 * x2_opt;

  getBoard().create('line', [-Z_opt, c1, c2], {
    strokeColor: '#e74c3c',
    strokeWidth: 2,
    dash: 2,
    name: `f(x) -> ${finalState.type}`,
    withLabel: true,
    label: { position: 'ur' },
  });
}
