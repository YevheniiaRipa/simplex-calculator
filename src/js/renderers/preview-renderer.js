export function renderProblemPreview(
  numVarsEl,
  numConsEl,
  problemTypeEl,
  coeffForms
) {
  const box = document.getElementById('prettyProblem');
  const n = parseInt(numVarsEl.value, 10);
  const m = parseInt(numConsEl.value, 10);
  const type = problemTypeEl.value;

  const getC = j =>
    parseFloat(
      (
        coeffForms.querySelector(`[data-role="c"][data-j="${j}"]`) || {
          value: '0',
        }
      ).value || '0'
    );
  const getA = (i, j) =>
    parseFloat(
      (
        coeffForms.querySelector(
          `[data-role="a"][data-i="${i}"][data-j="${j}"]`
        ) || { value: '0' }
      ).value || '0'
    );
  const getB = i =>
    parseFloat(
      (
        coeffForms.querySelector(`[data-role="b"][data-i="${i}"]`) || {
          value: '0',
        }
      ).value || '0'
    );
  const getS = i => {
    const val = (
      coeffForms.querySelector(`[data-role="sign"][data-i="${i}"]`) || {
        value: '<=',
      }
    ).value;
    return val.replace('<=', '≤').replace('>=', '≥');
  };

  const term = (coef, name) => {
    const c = Number(coef);
    if (Math.abs(c) < 1e-12) return '';
    if (Math.abs(c - 1) < 1e-12) return '+' + name;
    if (Math.abs(c + 1) < 1e-12) return '-' + name;
    return `${c >= 0 ? '+' : ''}${c}${name}`;
  };

  let f = '';
  for (let j = 0; j < n; j++) f += term(getC(j), `x<sub>${j + 1}</sub>`);
  if (f.startsWith('+')) f = f.slice(1);

  let html = `<div><strong>Цільо&shy;ва функ&shy;ція:</strong> f = ${
    f || '0'
  } → ${type}</div>`;
  html += `<div style="margin-top:6px"><strong>Обме&shy;жен&shy;ня:</strong></div>`;
  html += '<div style="margin-top:4px">';

  for (let i = 0; i < m; i++) {
    let row = '';
    for (let j = 0; j < n; j++) row += term(getA(i, j), `x<sub>${j + 1}</sub>`);
    if (row.startsWith('+')) row = row.slice(1);
    html += `<div>${row || '0'} ${getS(i)} ${getB(i)}</div>`;
  }
  html += '</div>';

  const boundSelects = Array.from(
    coeffForms.querySelectorAll('[data-role="varbound"]')
  );

  if (boundSelects.length > 0) {
    const pieces = boundSelects.map((select, index) => {
      const varIndex = index + 1;
      const value = select.value;

      if (value === '>=0') {
        return `x<sub>${varIndex}</sub> ≥ 0`;
      } else if (value === '<=0') {
        return `x<sub>${varIndex}</sub> ≤ 0`;
      } else if (value === 'free') {
        return `x<sub>${varIndex}</sub> - необмежена`;
      }
      return '';
    });

    html += `<div style="margin-top:4px">${pieces
      .filter(p => p)
      .join(', ')}</div>`;
  }

  box.innerHTML = html;
}
