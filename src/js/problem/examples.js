export function loadTestTask(
  numVarsEl,
  numConsEl,
  problemTypeEl,
  buildForm,
  coeffForms,
  renderProblemPreview
) {
  numVarsEl.value = 2;
  numConsEl.value = 3;
  problemTypeEl.value = 'max';

  buildForm();

  const a = [
    [7, 5],
    [-5, 4],
    [1, 2],
  ];
  const b = [28, 7, 5];
  const c = [1, 1];
  const s = ['<=', '<=', '>='];

  coeffForms.querySelectorAll('[data-role="a"]').forEach(inp => {
    inp.value = a[+inp.dataset.i][+inp.dataset.j];
  });
  coeffForms.querySelectorAll('[data-role="b"]').forEach((inp, i) => {
    inp.value = b[i];
  });
  coeffForms.querySelectorAll('[data-role="sign"]').forEach((sel, i) => {
    sel.value = s[i];
  });
  coeffForms.querySelectorAll('[data-role="c"]').forEach((inp, j) => {
    inp.value = c[j];
  });

  renderProblemPreview();
}
