export function validateInputs(coeffForms) {
  const allNumberInputs = coeffForms.querySelectorAll('input[type="number"]');
  if (allNumberInputs.length === 0) return false;
  return Array.from(allNumberInputs).some(
    (inp) => parseFloat(inp.value || "0") !== 0
  );
}

export function getCurrentFormData(coeffForms) {
  const data = { a: [], b: [], c: [], sign: [], varbound: [] };
  if (!coeffForms.hasChildNodes()) return data;
  coeffForms.querySelectorAll('[data-role="c"]').forEach((inp) => {
    data.c[+inp.dataset.j] = inp.value;
  });
  coeffForms.querySelectorAll('[data-role="b"]').forEach((inp) => {
    data.b[+inp.dataset.i] = inp.value;
  });
  coeffForms.querySelectorAll('[data-role="sign"]').forEach((sel) => {
    data.sign[+sel.dataset.i] = sel.value;
  });
  coeffForms.querySelectorAll('[data-role="varbound"]').forEach((sel) => {
    data.varbound[+sel.dataset.j] = sel.value;
  });
  coeffForms.querySelectorAll('[data-role="a"]').forEach((inp) => {
    const i = +inp.dataset.i,
      j = +inp.dataset.j;
    if (!data.a[i]) data.a[i] = [];
    data.a[i][j] = inp.value;
  });
  return data;
}

export function restoreFormData(data, coeffForms) {
  if (!data) return;
  coeffForms.querySelectorAll('[data-role="c"]').forEach((inp) => {
    if (data.c && data.c[+inp.dataset.j] !== undefined)
      inp.value = data.c[+inp.dataset.j];
  });
  coeffForms.querySelectorAll('[data-role="b"]').forEach((inp) => {
    if (data.b && data.b[+inp.dataset.i] !== undefined)
      inp.value = data.b[+inp.dataset.i];
  });
  coeffForms.querySelectorAll('[data-role="sign"]').forEach((sel) => {
    if (data.sign && data.sign[+sel.dataset.i] !== undefined)
      sel.value = data.sign[+sel.dataset.i];
  });
  coeffForms.querySelectorAll('[data-role="varbound"]').forEach((sel) => {
    if (data.varbound && data.varbound[+sel.dataset.j] !== undefined)
      sel.value = data.varbound[+sel.dataset.j];
  });
  coeffForms.querySelectorAll('[data-role="a"]').forEach((inp) => {
    if (
      data.a &&
      data.a[+inp.dataset.i] &&
      data.a[+inp.dataset.i][+inp.dataset.j] !== undefined
    )
      inp.value = data.a[+inp.dataset.i][+inp.dataset.j];
  });
}

export function clearInputData(coeffForms, renderProblemPreview) {
  coeffForms.querySelectorAll('input[type="number"]').forEach((inp) => {
    inp.value = 0;
  });
  coeffForms.querySelectorAll('select[data-role="sign"]').forEach((sel) => {
    sel.value = "<=";
  });
  coeffForms.querySelectorAll('select[data-role="varbound"]').forEach((sel) => {
    sel.value = ">=0";
  });
  renderProblemPreview();
}
