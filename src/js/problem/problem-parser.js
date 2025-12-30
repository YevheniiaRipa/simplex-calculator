export function readProblem(numVarsEl, numConsEl, problemTypeEl, coeffForms) {
  const n = parseInt(numVarsEl.value, 10);
  const m = parseInt(numConsEl.value, 10);
  const type = problemTypeEl.value;

  let a_orig = Array.from({ length: m }, () => Array(n).fill(0));
  let b = Array(m).fill(0);
  let sign = Array(m).fill('<=');
  let c_orig = Array(n).fill(0);
  let varbound = Array(n).fill('>=0');

  coeffForms
    .querySelectorAll('[data-role="a"]')
    .forEach(
      inp =>
        (a_orig[+inp.dataset.i][+inp.dataset.j] = parseFloat(inp.value || '0'))
    );
  coeffForms
    .querySelectorAll('[data-role="b"]')
    .forEach(inp => (b[+inp.dataset.i] = parseFloat(inp.value || '0')));
  coeffForms
    .querySelectorAll('[data-role="sign"]')
    .forEach(sel => (sign[+sel.dataset.i] = sel.value));
  coeffForms
    .querySelectorAll('[data-role="c"]')
    .forEach(inp => (c_orig[+inp.dataset.j] = parseFloat(inp.value || '0')));
  coeffForms
    .querySelectorAll('[data-role="varbound"]')
    .forEach(sel => (varbound[+sel.dataset.j] = sel.value));

  let a_new = Array.from({ length: m }, () => []);
  let c_new = [];
  let variableMap = [];
  let newVarCounter = 0;

  for (let j = 0; j < n; j++) {
    if (varbound[j] === 'free') {
      // Заміна xⱼ -> xⱼ' - xⱼ''
      for (let i = 0; i < m; i++) {
        a_new[i].push(a_orig[i][j]); // Стовпець для xⱼ'
        a_new[i].push(-a_orig[i][j]); // Стовпець для xⱼ''
      }
      c_new.push(c_orig[j]); // Коефіцієнт для xⱼ'
      c_new.push(-c_orig[j]); // Коефіцієнт для xⱼ''
      variableMap.push({
        originalIndex: j,
        newIndices: [newVarCounter, newVarCounter + 1],
        type: 'free',
      });
      newVarCounter += 2;
    } else if (varbound[j] === '<=0') {
      // Заміна xⱼ -> -xⱼ', де xⱼ' >= 0
      for (let i = 0; i < m; i++) {
        a_new[i].push(-a_orig[i][j]);
      }
      c_new.push(-c_orig[j]);
      variableMap.push({
        originalIndex: j,
        newIndices: [newVarCounter],
        type: 'leq',
      });
      newVarCounter += 1;
    } else {
      // Звичайна змінна xⱼ >= 0
      for (let i = 0; i < m; i++) {
        a_new[i].push(a_orig[i][j]);
      }
      c_new.push(c_orig[j]);
      variableMap.push({
        originalIndex: j,
        newIndices: [newVarCounter],
        type: 'geq',
      });
      newVarCounter += 1;
    }
  }

  const isCanonical = sign.every(s => s === '=');

  for (let i = 0; i < m; i++) {
    if (sign[i] === '>=') {
      sign[i] = '<=';
      b[i] *= -1;
      for (let j = 0; j < a_new[i].length; j++) {
        a_new[i][j] *= -1;
      }
    }
  }

  const cMax = type === 'min' ? c_new.map(x => -x) : c_new.slice();

  if (isCanonical) {
    return {
      A: a_new,
      b,
      C: cMax,
      m,
      nTotal: newVarCounter,
      nOrig: n,
      type,
      isCanonical: true,
      variableMap,
    };
  } else {
    let A = a_new.map(row => row.slice());
    let C = cMax.slice();
    let base = [];
    let n_current = newVarCounter;

    for (let i = 0; i < m; i++) {
      for (let r = 0; r < m; r++) A[r].push(r === i ? 1 : 0);
      C.push(0);
      base.push(n_current++);
    }
    return {
      A,
      b,
      C,
      base,
      m,
      nTotal: n_current,
      nOrig: n,
      type,
      isCanonical: false,
      variableMap,
    };
  }
}
