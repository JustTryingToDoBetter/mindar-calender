export function computeMonthMapping(year, monthIndexZeroBased) {
  const mapping = new Array(42).fill(null);
  const totalDays = new Date(year, monthIndexZeroBased + 1, 0).getDate();

  // JS getDay(): 0=Sun..6=Sat. Convert to Monday-first index (0=Mon)
  const jsFirst = new Date(year, monthIndexZeroBased, 1).getDay();
  const offset = (jsFirst + 6) % 7;

  let day = 1;
  for (let idx = offset; day <= totalDays && idx < mapping.length; idx++) {
    mapping[idx] = day++;
  }
  return mapping;
}

export function formatMonthTitle(ym /* YYYY-MM */) {
  const [y, m] = ym.split("-").map((x) => parseInt(x, 10));
  const d = new Date(y, m - 1, 1);
  return d.toLocaleString(undefined, { month: "long", year: "numeric" });
}
