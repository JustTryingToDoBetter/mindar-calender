export function loadNote(key) {
  try {
    return localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

export function saveNote(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

export function clearNote(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}
