/**
 * Maskiverse signup flow - triggered when users "Spot Maski" in the wild
 */

export function createMaskiverseController() {
  const signupCard = document.getElementById("maskiverseCard");
  const closeBtn = signupCard?.querySelector(".card-close");
  const joinBtn = signupCard?.querySelector(".join-maskiverse-btn");
  const spotsList = signupCard?.querySelector(".spots-collected");

  // Track user's collected spots (stored locally)
  let spotsCollected = loadSpots();

  if (closeBtn) {
    closeBtn.addEventListener("click", () => hide());
  }

  if (joinBtn) {
    joinBtn.addEventListener("click", handleJoinMaskiverse);
  }

  function show(detectionData) {
    if (!signupCard) return;

    // Record this spot
    const spot = {
      timestamp: detectionData.timestamp || Date.now(),
      confidence: detectionData.confidence || 1,
      location: detectionData.location || "Unknown", // Add geolocation later
    };

    spotsCollected.push(spot);
    saveSpots(spotsCollected);

    // Update UI
    updateSpotsDisplay();

    signupCard.classList.remove("hidden");
  }

  function hide() {
    if (!signupCard) return;
    signupCard.classList.add("hidden");
  }

  function updateSpotsDisplay() {
    if (!spotsList) return;

    spotsList.innerHTML = `
      <div class="spots-count">
        🎯 You've spotted Maski <strong>${spotsCollected.length}</strong> ${
      spotsCollected.length === 1 ? "time" : "times"
    }!
      </div>
      <div class="spots-recent">
        ${spotsCollected
          .slice(-3)
          .reverse()
          .map(
            (s) => `
          <div class="spot-item">
            <span class="spot-icon">📍</span>
            <span class="spot-time">${formatSpotTime(s.timestamp)}</span>
          </div>
        `
          )
          .join("")}
      </div>
    `;
  }

  function handleJoinMaskiverse() {
    // Build signup URL with spot count as context
    const spotCount = spotsCollected.length;
    const message = encodeURIComponent(
      `Hi Maski! 👋 I spotted you ${spotCount} ${
        spotCount === 1 ? "time" : "times"
      } and want to join the Maskiverse!`
    );

    const signupUrl = `https://wa.me/27720910388?text=${message}`;

    // Open in new tab (gesture-safe)
    try {
      const w = window.open(signupUrl, "_blank");
      if (!w) {
        window.location.href = signupUrl;
      }
    } catch {
      window.location.href = signupUrl;
    }
  }

  function formatSpotTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);

    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
  }

  function loadSpots() {
    try {
      const saved = localStorage.getItem("maskiverse-spots");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  function saveSpots(spots) {
    try {
      localStorage.setItem("maskiverse-spots", JSON.stringify(spots));
    } catch (err) {
      console.warn("Could not save spots:", err);
    }
  }

  return { show, hide, getSpotsCount: () => spotsCollected.length };
}
