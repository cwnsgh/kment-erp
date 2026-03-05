/** 재직 상태 코드 → 한글 라벨 (클라이언트/서버 공용) */
const EMPLOYMENT_STATUS_MAP: Record<string, string> = {
  employed: "재직",
  on_leave: "휴직",
  left: "퇴사",
};

export function formatEmploymentStatus(status: string | null): string {
  if (!status) return "-";
  return EMPLOYMENT_STATUS_MAP[status] ?? status;
}

/** 휴대폰 번호를 010-xxxx-xxxx 형식으로 표시 (숫자만 있으면 하이픈 삽입) */
export function formatPhoneDisplay(value: string | null | undefined): string {
  if (value == null || value === "") return "";
  const digits = String(value).replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}
