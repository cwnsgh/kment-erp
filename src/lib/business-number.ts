export function normalizeBusinessNumber(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatBusinessNumberInput(value: string): string {
  const normalized = normalizeBusinessNumber(value).slice(0, 10);
  if (normalized.length <= 3) {
    return normalized;
  }
  if (normalized.length <= 5) {
    return `${normalized.slice(0, 3)}-${normalized.slice(3)}`;
  }
  return `${normalized.slice(0, 3)}-${normalized.slice(3, 5)}-${normalized.slice(5)}`;
}

export function formatBusinessNumber(value: string): string {
  const normalized = normalizeBusinessNumber(value);
  if (normalized.length !== 10) {
    return value;
  }
  return normalized.replace(/^(\d{3})(\d{2})(\d{5})$/, "$1-$2-$3");
}

