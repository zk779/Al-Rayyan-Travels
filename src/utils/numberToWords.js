// 4500 -> "Four Thousand Five Hundred Riyal Only"; 1234.5 -> "One Thousand Two Hundred Thirty Four Riyal and Fifty Halala Only"
const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
const SCALES = ["", "Thousand", "Million", "Billion"];

const below1000 = (n) => {
  const parts = [];
  if (n >= 100) {
    parts.push(`${ONES[Math.floor(n / 100)]} Hundred`);
    n %= 100;
  }
  if (n >= 20) {
    parts.push(TENS[Math.floor(n / 10)] + (n % 10 ? ` ${ONES[n % 10]}` : ""));
  } else if (n > 0) {
    parts.push(ONES[n]);
  }
  return parts.join(" ");
};

const wholeToWords = (n) => {
  if (n === 0) return "Zero";
  const groups = [];
  let scale = 0;
  while (n > 0) {
    const chunk = n % 1000;
    if (chunk) groups.unshift(`${below1000(chunk)}${SCALES[scale] ? ` ${SCALES[scale]}` : ""}`);
    n = Math.floor(n / 1000);
    scale += 1;
  }
  return groups.join(" ");
};

export function amountInWords(amount, { unit = "Riyal", sub = "Halala" } = {}) {
  const value = Math.round((Math.abs(Number(amount) || 0) + Number.EPSILON) * 100);
  const whole = Math.floor(value / 100);
  const fraction = value % 100;
  let out = `${wholeToWords(whole)} ${unit}`;
  if (fraction) out += ` and ${wholeToWords(fraction)} ${sub}`;
  return `${out} Only`;
}
