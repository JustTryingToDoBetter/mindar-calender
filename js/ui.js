import { PUBLIC_HOLIDAYS, SCHOOL_TERMS } from "./config.js";
import { computeMonthMapping, formatMonthTitle } from "./dateUtils.js";
import { loadNote, saveNote, clearNote } from "./storage.js";
import { navigateToKey, openMaskiHelpQuery } from "./routing.js";

export function createUIController() {
  const statusEl = document.getElementById("status");

  const dockEl = document.getElementById("cta");
  const dockButtons = Array.from(document.querySelectorAll(".dock-btn"));

  const monthCardEl = document.getElementById("monthCard");
  const monthTitleEl = document.getElementById("monthTitle");
  const monthGridEl = document.getElementById("monthGrid");
  const monthCollapseBtn = document.getElementById("monthCollapse");

  const pageCardEl = document.getElementById("pageCard");
  const pageTitleEl = document.getElementById("pageTitle");
  const pageCollapseBtn = document.getElementById("pageCollapse");
  const openPageNotesBtn = document.getElementById("openPageNotes");
  const quickHolidaysBtn = document.getElementById("quickHolidays");
  const quickTermsBtn = document.getElementById("quickTerms");

  const emergencyCardEl = document.getElementById("emergencyCard");
  const emergencyCollapseBtn = document.getElementById("emergencyCollapse");

  const productCardEl = document.getElementById("productCard");
  const productCollapseBtn = document.getElementById("productCollapse");
  const productJoinWaBtn = document.getElementById("productJoinWa");
  const productLearnMoreBtn = document.getElementById("productLearnMore");

  const panelEl = document.getElementById("panel");
  const panelTitleEl = document.getElementById("panelTitle");
  const panelSubtitleEl = document.getElementById("panelSubtitle");
  const noteEl = document.getElementById("note");
  const closeBtn = document.getElementById("closePanel");
  const saveBtn = document.getElementById("saveNote");
  const clearBtn = document.getElementById("clearNote");
  const needHelpBtn = document.getElementById("needHelp");
  const viewHolidaysBtn = document.getElementById("viewHolidays");
  const viewTermsBtn = document.getElementById("viewTerms");

  const waModalEl = document.getElementById("waModal");
  const waContinueBtn = document.getElementById("waContinue");
  const waCancelBtn = document.getElementById("waCancel");

  let activeStorageKey = null;
  let helpContext = null; // { month: 'YYYY-MM', day: number|null }

  const WHATSAPP_NUMBER = "27720910388";
  const WHATSAPP_PREFILL = "Hi, I'd like to join Maski updates.";

  function setStatus(text) {
    statusEl.textContent = text;
  }

  function showDock(show) {
    if (show) dockEl.classList.add("is-visible");
    else dockEl.classList.remove("is-visible");
  }

  function hideContextCards() {
    pageCardEl.classList.add("hidden");
    monthCardEl.classList.add("hidden");
    emergencyCardEl.classList.add("hidden");
    productCardEl?.classList.add("hidden");
  }

  function showPageCard(def) {
    monthCardEl.classList.add("hidden");
    emergencyCardEl.classList.add("hidden");
    productCardEl?.classList.add("hidden");
    pageCardEl.classList.remove("hidden");

    pageTitleEl.textContent = def?.label || "Page";

    const isReferencePage = def?.i === 2;
    quickHolidaysBtn.classList.toggle("hidden", !isReferencePage);
    quickTermsBtn.classList.toggle("hidden", !isReferencePage);

    openPageNotesBtn.onclick = () => {
      openNotePanel({
        title: def?.label || "Page Notes",
        subtitle: "Saved on this device",
        storageKey: `mindar:page:${def?.i ?? "unknown"}:note`,
        help: null,
      });
    };
  }

  function showMonthCard(def) {
    if (!def?.month) return;

    emergencyCardEl.classList.add("hidden");
    productCardEl?.classList.add("hidden");
    monthCardEl.classList.remove("hidden");
    monthTitleEl.textContent = formatMonthTitle(def.month);

    const [yearStr, monthStr] = def.month.split("-");
    const year = parseInt(yearStr, 10);
    const monthIndex = parseInt(monthStr, 10) - 1;
    const mapping = computeMonthMapping(year, monthIndex);

    monthGridEl.innerHTML = "";
    mapping.forEach((dayNum, cellIndex) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "day" + (dayNum ? "" : " is-empty");
      btn.textContent = dayNum ? String(dayNum) : "";
      btn.disabled = !dayNum;
      btn.setAttribute("role", "gridcell");

      if (dayNum) {
        btn.addEventListener("click", () => {
          openNotePanel({
            title: `${formatMonthTitle(def.month)} — ${dayNum}`,
            subtitle: "Saved on this device",
            storageKey: `mindar:${def.month}:${def.layout}:day:${dayNum}`,
            help: { month: def.month, day: dayNum },
          });
        });
      }

      monthGridEl.appendChild(btn);
    });
  }

  function showEmergencyCard() {
    monthCardEl.classList.add("hidden");
    productCardEl?.classList.add("hidden");
    emergencyCardEl.classList.remove("hidden");
  }

  function showProductCard(def) {
    monthCardEl.classList.add("hidden");
    emergencyCardEl.classList.add("hidden");
    pageCardEl.classList.add("hidden");
    productCardEl?.classList.remove("hidden");

    // Optionally: could customize copy using def.label later.
  }

  function openNotePanel({ title, subtitle, storageKey, help }) {
    activeStorageKey = storageKey;
    helpContext = help || null;

    panelTitleEl.textContent = title;
    panelSubtitleEl.textContent = subtitle;
    noteEl.value = loadNote(storageKey);

    // Only show Need Help for month/day context
    needHelpBtn.classList.toggle("hidden", !helpContext);

    panelEl.classList.remove("hidden");
  }

  function closeNotePanel() {
    panelEl.classList.add("hidden");
    activeStorageKey = null;
    helpContext = null;
  }

  function buildWhatsAppUrl() {
    const text = encodeURIComponent(WHATSAPP_PREFILL);
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
  }

  function openUrlFromGesture(url) {
    // Prefer new tab; fall back to same-tab if blocked.
    const w = window.open(url, "_blank", "noopener,noreferrer");
    if (!w) window.location.assign(url);
  }

  function showWhatsAppModal() {
    if (!waModalEl) {
      openUrlFromGesture(buildWhatsAppUrl());
      return;
    }
    waModalEl.classList.remove("hidden");
  }

  function hideWhatsAppModal() {
    waModalEl?.classList.add("hidden");
  }

  // Dock routing
  dockButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-go");
      if (!key) return;

      if (key === "wa") {
        showWhatsAppModal();
        return;
      }

      navigateToKey(key);
    });
  });

  waCancelBtn?.addEventListener("click", hideWhatsAppModal);
  waModalEl?.addEventListener("click", (e) => {
    if (e.target === waModalEl) hideWhatsAppModal();
  });
  waContinueBtn?.addEventListener("click", () => {
    hideWhatsAppModal();
    openUrlFromGesture(buildWhatsAppUrl());
  });

  // Month/emergency collapse
  pageCollapseBtn.addEventListener("click", () => pageCardEl.classList.add("hidden"));
  monthCollapseBtn.addEventListener("click", () => monthCardEl.classList.add("hidden"));
  emergencyCollapseBtn.addEventListener("click", () => emergencyCardEl.classList.add("hidden"));
  productCollapseBtn?.addEventListener("click", () => productCardEl?.classList.add("hidden"));

  productJoinWaBtn?.addEventListener("click", showWhatsAppModal);
  productLearnMoreBtn?.addEventListener("click", () => navigateToKey("maski"));

  // Panel controls
  closeBtn.addEventListener("click", closeNotePanel);

  saveBtn.addEventListener("click", () => {
    if (!activeStorageKey) return;
    saveNote(activeStorageKey, noteEl.value);
    closeNotePanel();
  });

  clearBtn.addEventListener("click", () => {
    if (!activeStorageKey) return;
    clearNote(activeStorageKey);
    noteEl.value = "";
  });

  needHelpBtn.addEventListener("click", () => {
    if (!helpContext) return;
    const query = `planner help ${helpContext.month} day ${helpContext.day}`;
    openMaskiHelpQuery(query);
  });

  viewHolidaysBtn.addEventListener("click", () => {
    alert("2026 Public Holidays:\n\n" + PUBLIC_HOLIDAYS.join("\n"));
  });

  viewTermsBtn.addEventListener("click", () => {
    alert("2026 School Terms:\n\n" + SCHOOL_TERMS.join("\n"));
  });

  // Page quick actions
  quickHolidaysBtn.addEventListener("click", () => {
    alert("2026 Public Holidays:\n\n" + PUBLIC_HOLIDAYS.join("\n"));
  });

  quickTermsBtn.addEventListener("click", () => {
    alert("2026 School Terms:\n\n" + SCHOOL_TERMS.join("\n"));
  });

  return {
    setStatus,
    showDock,
    hideContextCards,
    showPageCard,
    showMonthCard,
    showEmergencyCard,
    showProductCard,
    openNotePanel,
    closeNotePanel,
  };
}
