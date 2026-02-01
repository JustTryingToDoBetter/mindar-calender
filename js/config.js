export const PUBLIC_HOLIDAYS = [
  "1 January — New Year’s Day",
  "21 March — Human Rights Day",
  "3 April — Good Friday",
  "6 April — Family Day",
  "27 April — Freedom Day",
  "1 May — Workers’ Day",
  "15 June — Special School Holiday",
  "16 June — Youth Day",
  "9 August — National Women’s Day",
  "10 August — Public Holiday",
  "24 September — Heritage Day",
  "16 December — Day of Reconciliation",
  "25 December — Christmas Day",
  "26 December — Day of Goodwill",
];

export const SCHOOL_TERMS = [
  "Term 1: 14 January – 27 March",
  "Term 2: 8 April – 26 June",
  "Term 3: 21 July – 23 September",
  "Term 4: 6 October – 9 (11) December",
];

export const LINK_ACTIONS = [
  { key: "playground", label: "Playground", url: "https://playground.maski.co.za/" },
  { key: "mml", label: "MML", url: "https://www.mml.co.za/" },
  { key: "maski", label: "Maski", url: "https://maski.co.za/" },
  { key: "yt", label: "YouTube", url: "https://www.youtube.com/@AskMaski" },
  { key: "wa", label: "WhatsApp", url: "https://wa.me/27720910388" },
];

// Optional additional MindAR target packs.
// Drop compiled .mind files into /public and they will be appended at runtime.
// NOTE: These files are not required for the planner to work.
export const EXTRA_TARGET_PACKS = [
  {
    id: "mml-products",
    label: "MML Products",
    url: "./public/mml-products.mind",
    type: "product",
  },
];

// targetIndex is the upload order in the MindAR compiler (0-based)
export const TARGETS = [
  { i: 0, label: "Cover" },
  { i: 1, label: "Year at a glance" },
  { i: 2, label: "Holidays/terms/contact" },
  { i: 3, label: "Term 1 notes" },
  { i: 4, label: "Maski get started" },

  // Months (two pages each)
  { i: 5, label: "Jan (Mon–Thu)", month: "2026-01", layout: "mon-thu" },
  { i: 6, label: "Jan (Fri–Sun)", month: "2026-01", layout: "fri-sun" },

  { i: 7, label: "Feb (Mon–Thu)", month: "2026-02", layout: "mon-thu" },
  { i: 8, label: "Feb (Fri–Sun)", month: "2026-02", layout: "fri-sun" },

  { i: 9, label: "Mar (Mon–Thu)", month: "2026-03", layout: "mon-thu" },
  { i: 10, label: "Mar (Fri–Sun)", month: "2026-03", layout: "fri-sun" },

  { i: 11, label: "Term 2 notes" },
  { i: 12, label: "Maski TV promo" },

  { i: 13, label: "Apr (Mon–Thu)", month: "2026-04", layout: "mon-thu" },
  { i: 14, label: "Apr (Fri–Sun)", month: "2026-04", layout: "fri-sun" },

  { i: 15, label: "May (Mon–Thu)", month: "2026-05", layout: "mon-thu" },
  { i: 16, label: "May (Fri–Sun)", month: "2026-05", layout: "fri-sun" },

  { i: 17, label: "Jun (Mon–Thu)", month: "2026-06", layout: "mon-thu" },
  { i: 18, label: "Jun (Fri–Sun)", month: "2026-06", layout: "fri-sun" },

  { i: 19, label: "Term 3 notes" },
  { i: 20, label: "Maski Playground promo" },

  { i: 21, label: "Jul (Mon–Thu)", month: "2026-07", layout: "mon-thu" },
  { i: 22, label: "Jul (Fri–Sun)", month: "2026-07", layout: "fri-sun" },

  { i: 23, label: "Aug (Mon–Thu)", month: "2026-08", layout: "mon-thu" },
  { i: 24, label: "Aug (Fri–Sun)", month: "2026-08", layout: "fri-sun" },

  { i: 25, label: "Sep (Mon–Thu)", month: "2026-09", layout: "mon-thu" },
  { i: 26, label: "Sep (Fri–Sun)", month: "2026-09", layout: "fri-sun" },

  { i: 27, label: "Term 4 notes" },
  { i: 28, label: "Crack the Maths Code promo" },

  { i: 29, label: "Oct (Mon–Thu)", month: "2026-10", layout: "mon-thu" },
  { i: 30, label: "Oct (Fri–Sun)", month: "2026-10", layout: "fri-sun" },

  { i: 31, label: "Nov (Mon–Thu)", month: "2026-11", layout: "mon-thu" },
  { i: 32, label: "Nov (Fri–Sun)", month: "2026-11", layout: "fri-sun" },

  { i: 33, label: "Dec (Mon–Thu)", month: "2026-12", layout: "mon-thu" },
  { i: 34, label: "Dec (Fri–Sun)", month: "2026-12", layout: "fri-sun" },

  { i: 35, label: "Emergency & useful numbers", type: "emergency" },
];
