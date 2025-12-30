import Fraction from 'fraction.js';

let displayAsFractions = true;

export function setFractionDisplay(shouldDisplayFractions) {
  displayAsFractions = shouldDisplayFractions;
}
export function fmt(x) {
  if (x === undefined || x === null) return '';
  if (Number.isNaN(x) || !Number.isFinite(x)) return String(x);

  const epsilon = 1e-9;
  if (Math.abs(x) < epsilon) return '0';

  if (displayAsFractions) {
    try {
      const f = new Fraction(x);
      const simplified = f.simplify();

      const sign = simplified.s < 0 ? '-' : '';

      if (String(simplified.d) === '1') {
        return sign + Math.abs(simplified.n).toString();
      }

      return `${sign}${simplified.n}/${simplified.d}`;
    } catch (e) {
      return Number(x.toFixed(3));
    }
  } else {
    const s = Math.abs(x) < 1e-10 ? 0 : x;
    const v = Number(Number(s).toFixed(3));
    return v;
  }
}

export function th(html) {
  const e = document.createElement('th');
  e.innerHTML = html;
  return e;
}

export function td(html, raw) {
  const e = document.createElement('td');
  if (raw) e.innerHTML = html;
  else e.textContent = html;
  return e;
}
