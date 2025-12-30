import { fmt, th, td } from '../utils/helpers.js';

export function logToTableau(html, topBorder = false, tableauContainer) {
  const logEntry = document.createElement('div');
  logEntry.className = 'log-entry';
  logEntry.style.padding = '10px';
  logEntry.style.borderBottom = '1px solid #444';
  if (topBorder) {
    logEntry.style.borderTop = '1px solid #444';
  }
  logEntry.innerHTML = html;
  tableauContainer.appendChild(logEntry);
}

export function renderTableau(state, options, tableauContainer) {
  const opts = options || {};
  const { tableau, m, nTotal, base, pivot, nonBasicOrder, currentStage } =
    state;
  const table = document.createElement('table');
  table.className = 'tableau';
  const thead = document.createElement('thead');
  const hr1 = document.createElement('tr');

  if (currentStage === 'gauss') {
    hr1.appendChild(th('Матриця'));
    for (let j = 1; j <= nTotal; j++) hr1.appendChild(th(`x<sub>${j}</sub>`));
    hr1.appendChild(th('β'));
  } else {
    const th1 = th('Бази&shy;сні змі&shy;нні');
    th1.setAttribute('rowspan', '2');
    hr1.appendChild(th1);
    const th2 = th('Неба&shy;зисні змі&shy;нні');
    th2.setAttribute('colspan', String(nonBasicOrder.length));
    hr1.appendChild(th2);
    const th3 = th('Віль&shy;ні чле&shy;ни');
    th3.setAttribute('rowspan', '2');
    hr1.appendChild(th3);
  }
  thead.appendChild(hr1);

  if (currentStage !== 'gauss') {
    const hr2 = document.createElement('tr');
    for (const varIndex of nonBasicOrder) {
      hr2.appendChild(th(`-x<sub>${varIndex + 1}</sub>`));
    }
    thead.appendChild(hr2);
  }

  const tbody = document.createElement('tbody');
  for (let i = 0; i < m; i++) {
    const tr = document.createElement('tr');
    if (currentStage === 'gauss') {
      tr.appendChild(td(`<strong>Рядок ${i + 1}</strong>`, true));
      for (let j = 0; j <= nTotal; j++) tr.appendChild(td(fmt(tableau[i][j])));
    } else {
      tr.appendChild(td(`x<sub>${base[i] + 1}</sub>`, true));
      for (const varIndex of nonBasicOrder)
        tr.appendChild(td(fmt(tableau[i][varIndex])));
      tr.appendChild(td(fmt(tableau[i][nTotal]))).classList.add('rhs');
    }
    tbody.appendChild(tr);
  }

  if (currentStage !== 'gauss') {
    const trObj = document.createElement('tr');
    trObj.classList.add('obj-row');
    trObj.appendChild(td('Коефіцієнти цільової функції'));
    for (const varIndex of nonBasicOrder)
      trObj.appendChild(td(fmt(tableau[m][varIndex]))).classList.add('obj');
    trObj.appendChild(td(fmt(tableau[m][nTotal]))).classList.add('rhs');
    tbody.appendChild(trObj);
  }

  table.appendChild(thead);
  table.appendChild(tbody);

  const wrap = document.createElement('div');
  wrap.className = 'tableau-wrap';
  wrap.appendChild(table);

  const snap = document.createElement('div');
  snap.className = 'tableau-snapshot';

  const caption = document.createElement('div');
  caption.className = 'status';
  if (opts.caption) caption.innerHTML = opts.caption;

  snap.appendChild(wrap);
  snap.appendChild(caption);

  tableauContainer.appendChild(snap);

  if (pivot && currentStage !== 'gauss') {
    const { row, col } = pivot;
    const rows = table.querySelectorAll('tbody tr');

    if (rows[row] !== undefined) {
      rows[row].querySelectorAll('td').forEach((c, j) => {
        if (j > 0) c.classList.add('pivot-row');
      });

      const colIdx = nonBasicOrder.indexOf(col) + 1;

      if (colIdx > 0) {
        rows.forEach(r => {
          const cells = r.querySelectorAll('td');
          if (cells[colIdx]) cells[colIdx].classList.add('pivot-col');
        });

        rows[row].querySelectorAll('td')[colIdx]?.classList.add('pivot-elem');
      }
    }
  }
}
