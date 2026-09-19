/**
 * Local persistence will use IndexedDB.
 * This service is a seam for that work and must not write to localStorage as a substitute.
 */
export async function loadState() {
  return null
}

export async function saveState(_snapshot) {
  return false
}
