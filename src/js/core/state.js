let state = null;

export function getState() {
  return state;
}

export function setState(newState) {
  state = newState;
}

export function resetState() {
  state = null;
}
