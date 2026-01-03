export function createInitialTableau(problem) {
  const { A, b, C, m, nTotal } = problem;
  const T = Array.from({ length: m + 1 }, () => Array(nTotal + 1).fill(0));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < nTotal; j++) T[i][j] = A[i][j];
    T[i][nTotal] = b[i];
  }
  for (let j = 0; j < nTotal; j++) T[m][j] = -C[j];
  T[m][nTotal] = 0;
  return T;
}

export function jordanElimination(T, m, n, pr, pc) {
  const pivot = T[pr][pc];
  if (Math.abs(pivot) < 1e-12) {
    throw new Error("Розв'язувальний елемент має нульове значення");
  }

  for (let j = 0; j <= n; j++) {
    T[pr][j] /= pivot;
  }

  for (let i = 0; i <= m; i++) {
    if (i === pr) continue;

    const factor = T[i][pc];

    for (let j = 0; j <= n; j++) {
      T[i][j] -= factor * T[pr][j];
    }
  }
}

export function choosePhase1Pivot(T, m, n, nonBasicOrder) {
  const epsilon = 1e-9;

  const firstNegativeBetaRow = T.slice(0, m).findIndex(
    row => row[n] < -epsilon
  );

  if (firstNegativeBetaRow === -1) {
    return null;
  }

  for (let i = 0; i < m; i++) {
    if (T[i][n] < -epsilon) {
      const allAlphasNonNegative = nonBasicOrder.every(
        j => T[i][j] >= -epsilon
      );

      if (allAlphasNonNegative) {
        return { infeasible: true, row: i };
      }
    }
  }

  let candidateRow = -1;
  let minBeta = -epsilon;

  for (let i = 0; i < m; i++) {
    if (T[i][n] < minBeta) {
      minBeta = T[i][n];
      candidateRow = i;
    }
  }

  if (candidateRow === -1) {
    return null;
  }

  let pivotCol = -1;
  let maxAbsAlpha = 0;

  for (const varIndex of nonBasicOrder) {
    const alpha = T[candidateRow][varIndex];
    if (alpha < -epsilon) {
      if (Math.abs(alpha) > maxAbsAlpha) {
        maxAbsAlpha = Math.abs(alpha);
        pivotCol = varIndex;
      }
    }
  }

  if (pivotCol === -1) {
    return { infeasible: true, row: candidateRow };
  }

  let pivotRow = -1;
  let minRatio = Infinity;

  for (let i = 0; i < m; i++) {
    const alpha = T[i][pivotCol];
    const beta = T[i][n];

    if (Math.abs(alpha) > epsilon) {
      const ratio = beta / alpha;

      if (ratio >= 0 && ratio < minRatio) {
        minRatio = ratio;
        pivotRow = i;
      }
    }
  }

  if (pivotRow === -1) {
    return { infeasible: true, row: candidateRow };
  }

  return { row: pivotRow, col: pivotCol };
}

export function choosePhase2Pivot(T, m, n, nonBasicOrder) {
  let col = -1,
    minVal = -1e-9;
  for (const varIndex of nonBasicOrder) {
    if (T[m][varIndex] < minVal) {
      minVal = T[m][varIndex];
      col = varIndex;
    }
  }
  if (col === -1) return null;
  let row = -1,
    best = Infinity;
  for (let i = 0; i < m; i++) {
    const a = T[i][col];
    if (a > 1e-12) {
      const ratio = T[i][n] / a;
      if (ratio < best) {
        best = ratio;
        row = i;
      }
    }
  }
  if (row === -1) return { unbounded: true, col };
  return { row, col };
}

export function isAllBNonNegative(T, m, n) {
  for (let i = 0; i < m; i++) if (T[i][n] < -1e-12) return false;
  return true;
}

export function findAlternativeSolution(finalState) {
  const { tableau, m, nTotal, base, nonBasicOrder, nOrig } = finalState;

  if (nOrig !== 2) return null;

  const epsilon = 1e-9;
  const objRow = tableau[m];

  let enteringVarCol = -1;
  for (const varIndex of nonBasicOrder) {
    if (Math.abs(objRow[varIndex]) < epsilon) {
      enteringVarCol = varIndex;
      break;
    }
  }

  if (enteringVarCol === -1) {
    return null;
  }

  let leavingVarRow = -1;
  let minRatio = Infinity;
  for (let i = 0; i < m; i++) {
    const a = tableau[i][enteringVarCol];
    if (a > epsilon) {
      const ratio = tableau[i][nTotal] / a;
      if (ratio < minRatio) {
        minRatio = ratio;
        leavingVarRow = i;
      }
    }
  }

  if (leavingVarRow === -1) {
    return null;
  }

  const tempTableau = tableau.map(row => row.slice());
  const tempBase = base.slice();
  jordanElimination(tempTableau, m, nTotal, leavingVarRow, enteringVarCol);
  tempBase[leavingVarRow] = enteringVarCol;

  const alternativeSolutionVector = Array(nTotal).fill(0);
  for (let i = 0; i < m; i++) {
    alternativeSolutionVector[tempBase[i]] = tempTableau[i][nTotal];
  }

  return {
    solutionVector: alternativeSolutionVector,
  };
}
