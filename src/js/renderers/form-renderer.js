import { getCurrentFormData, restoreFormData } from '../problem/form-data.js';
import { th, td } from '../utils/helpers.js';

export function buildForm(
  numVarsEl,
  numConsEl,
  coeffForms,
  attachPreviewHandlers,
  renderProblemPreview
) {
  const oldData = getCurrentFormData(coeffForms);

  const n = parseInt(numVarsEl.value, 10);
  const m = parseInt(numConsEl.value, 10);
  const wrapper = document.createElement('div');
  wrapper.className = 'coeff-matrix';
  const table = document.createElement('table');
  table.className = 'coeff-table';
  const thead = document.createElement('thead');
  const hrow = document.createElement('tr');
  const thRowCol = th('Рядок/Стов&shy;пець');
  thRowCol.classList.add('js-header-row-col');
  hrow.appendChild(thRowCol);
  for (let j = 1; j <= n; j++) hrow.appendChild(th(`x<sub>${j}</sub>`));
  hrow.appendChild(th('Знак'));
  hrow.appendChild(th('β'));
  thead.appendChild(hrow);
  const tbody = document.createElement('tbody');
  const of = document.createElement('tr');
  const tdObjFunc = td('<strong>Цільова<br>функція</strong>', true);
  tdObjFunc.classList.add('js-cell-obj-func');
  of.appendChild(tdObjFunc);
  for (let j = 1; j <= n; j++)
    of.appendChild(
      td(
        `<input type="number" step="any" value="0" data-role="c" data-j="${
          j - 1
        }" />`,
        true
      )
    );
  of.appendChild(td('max / min', true));
  of.appendChild(td('—', true));
  tbody.appendChild(of);
  for (let i = 1; i <= m; i++) {
    const tr = document.createElement('tr');
    tr.appendChild(td(`<strong>Обм. ${i}</strong>`, true));
    for (let j = 1; j <= n; j++)
      tr.appendChild(
        td(
          `<input type="number" value="0" data-role="a" data-i="${
            i - 1
          }" data-j="${j - 1}" />`,
          true
        )
      );
    tr.appendChild(
      td(
        `<select data-role="sign" data-i="${
          i - 1
        }"><option value="<=">≤</option><option value=">=">≥</option><option value="=">=</option></select>`,
        true
      )
    );
    tr.appendChild(
      td(
        `<input type="number" step="any" value="0" data-role="b" data-i="${
          i - 1
        }" />`,
        true
      )
    );
    tbody.appendChild(tr);
  }
  table.appendChild(thead);
  table.appendChild(tbody);
  wrapper.appendChild(table);
  const vb = document.createElement('div');
  vb.style.marginTop = '10px';
  const vbTable = document.createElement('table');
  vbTable.className = 'coeff-table';
  const vbHead = document.createElement('thead');
  const vbHRow = document.createElement('tr');
  vbHRow.appendChild(th('Змінна'));
  vbHRow.appendChild(th('Обме&shy;жен&shy;ня на змі&shy;нну'));
  vbHead.appendChild(vbHRow);
  const vbBody = document.createElement('tbody');
  for (let j = 1; j <= n; j++) {
    const tr = document.createElement('tr');
    tr.appendChild(td(`<strong>x<sub>${j}</sub></strong>`, true));
    tr.appendChild(
      td(
        `<select data-role="varbound" data-j="${
          j - 1
        }"><option value=">=0">≥ 0</option><option value="<=0">≤ 0</option><option value="free">без обмежень</option></select>`,
        true
      )
    );
    vbBody.appendChild(tr);
  }
  vbTable.appendChild(vbHead);
  vbTable.appendChild(vbBody);
  vb.appendChild(vbTable);
  coeffForms.innerHTML = '';
  coeffForms.appendChild(wrapper);
  coeffForms.appendChild(vb);
  restoreFormData(oldData, coeffForms);
  attachPreviewHandlers();
  renderProblemPreview();
}
