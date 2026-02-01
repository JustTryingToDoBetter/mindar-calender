import { LINK_ACTIONS } from "./config.js";

const URL_BY_KEY = new Map(LINK_ACTIONS.map((a) => [a.key, a.url]));

export function navigateToKey(key) {
  const url = URL_BY_KEY.get(key);
  if (!url) return;
  // Avoid pop-up blockers: navigate in same tab
  window.location.assign(url);
}

export function openMaskiHelpQuery(query) {
  const url = `https://maski.co.za/?q=${encodeURIComponent(query)}`;
  window.location.assign(url);
}
