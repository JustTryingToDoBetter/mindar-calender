// AR scene: keep it lightweight. MindAR tracks; we render a small branded accent.

function makeGlassOverlay(def) {
  const g = document.createElement("a-entity");

  // A subtle frosted glass accent (not a full UI)
  const glass = document.createElement("a-plane");
  glass.setAttribute("position", "0 0 0.01");
  glass.setAttribute("width", "1.02");
  glass.setAttribute("height", "1.42");
  glass.setAttribute(
    "material",
    "color: #0b0b12; opacity: 0.18; transparent: true;"
  );
  g.appendChild(glass);

  const border = document.createElement("a-plane");
  border.setAttribute("position", "0 0 0.012");
  border.setAttribute("width", "1.04");
  border.setAttribute("height", "1.44");
  border.setAttribute(
    "material",
    "color: #ffffff; opacity: 0.05; transparent: true;"
  );
  g.appendChild(border);

  // Title chip
  const chip = document.createElement("a-plane");
  chip.setAttribute("position", "-0.22 0.62 0.02");
  chip.setAttribute("width", "0.62");
  chip.setAttribute("height", "0.16");
  chip.setAttribute(
    "material",
    "color: #11111a; opacity: 0.62; transparent: true;"
  );
  g.appendChild(chip);

  const title = document.createElement("a-text");
  title.setAttribute("value", def.label);
  title.setAttribute("color", "#ffffff");
  title.setAttribute("wrap-count", "22");
  title.setAttribute("position", "-0.50 0.62 0.03");
  title.setAttribute("scale", "0.55 0.55 0.55");
  g.appendChild(title);

  return g;
}

export function initAR({ targets, onFound, onLost }) {
  const root = document.getElementById("targetsRoot");
  if (!root) throw new Error("Missing #targetsRoot");

  const seen = new Set();

  function addTargets(nextTargets) {
    nextTargets.forEach((def) => {
      if (!def || typeof def.i !== "number") return;
      if (seen.has(def.i)) return;
      seen.add(def.i);

      const t = document.createElement("a-entity");
      t.setAttribute("mindar-image-target", `targetIndex: ${def.i}`);

      // Keep AR content minimal
      t.appendChild(makeGlassOverlay(def));

      t.addEventListener("targetFound", () => onFound(def));
      t.addEventListener("targetLost", () => onLost(def));

      root.appendChild(t);
    });
  }

  addTargets(targets);

  // Return an API so main.js can append new targets later.
  return { addTargets };
}
