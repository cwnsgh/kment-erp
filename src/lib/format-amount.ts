/**
 * 금액 입력 필드용: 숫자만 추출 (콤마 제거)
 */
export function parseAmountInput(value: string): string {
  return (value ?? "").replace(/\D/g, "");
}

/**
 * 금액 입력 필드용: 화면 표시용 콤마 포맷 (예: 40,000,000)
 */
export function formatAmountInput(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const digits = typeof value === "number" ? String(Math.floor(value)) : String(value).replace(/\D/g, "");
  if (digits === "") return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
