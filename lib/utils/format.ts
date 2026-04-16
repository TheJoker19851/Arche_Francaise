export function formatCompactNumber(value: number): string {
  if (value < 1000) return value.toString();

  const units = ["k", "M", "B"];
  let unitIndex = -1;
  let num = value;

  while (num >= 1000 && unitIndex < units.length - 1) {
    num /= 1000;
    unitIndex++;
  }

  return `${parseFloat(num.toPrecision(3))}${units[unitIndex]}`;
}
