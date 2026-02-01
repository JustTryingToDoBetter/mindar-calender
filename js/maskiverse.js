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
    };

    spotsCollected.push(spot);
    saveSpots(spotsCollected);

    // Update UI
    updateSpotsDisplay();

    signupCard.classList.remove("hidden");
    
    // Scroll card into view
    setTimeout(() => signupCard.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
  }

  function hide() {
    if (!signupCard) return;
    signupCard.classList.add("hidden");
  }

  function updateSpotsDisplay() {
    if (!spotsList) return;

    const count = spotsCollected.length;
    const isFirst = count === 1;
    
    spotsList.innerHTML = `
      <div class="spots-count">
        ${isFirst 
          ? '<strong>First spot!</strong> Welcome to the Maskiverse hunt 🎉' 
          : `You've found Maski <strong>${count} times</strong>! Keep going! 🚀`
        }
      </div>
    `;
  }

  function handleJoinMaskiverse() {
    const spotCount = spotsCollected.length;
    const message = encodeURIComponent(
      `Hi! 👋 I found Maski ${spotCount}x and want to join the Maskiverse!`
    );

    const signupUrl = `https://wa.me/27720910388?text=${message}`;

    try {
      const w = window.open(signupUrl, "_blank");
      if (!w) window.location.href = signupUrl;
    } catch {
      window.location.href = signupUrl;
    }
    
    // Hide card after joining
    hide();
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
