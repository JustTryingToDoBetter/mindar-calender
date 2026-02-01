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
    joinBtn.addEventListener("click", () => {
      const message = "Hi! I found Maski and want to join the Maskiverse! 🎉";
      const whatsappUrl = `https://wa.me/27720910388?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank");
    });
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
          ? '<strong>First spot!</strong> Welcome to the Maskiverse 🎉' 
          : `You've found Maski <strong>${count} times</strong>! 🚀`
        }
      </div>
    `;
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
