/**
 * Saves and restores window scroll position per tab path.
 * Call saveScroll() before navigating away, restoreScroll() after arriving.
 */
const scrollPositions = {};

export function saveScrollPosition(path) {
  scrollPositions[path] = window.scrollY;
}

export function restoreScrollPosition(path) {
  const y = scrollPositions[path] ?? 0;
  // Use requestAnimationFrame to wait for paint
  requestAnimationFrame(() => {
    window.scrollTo({ top: y, behavior: "instant" });
  });
}