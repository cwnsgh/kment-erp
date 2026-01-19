export function buildExcelFilename(prefix: string) {
  const date = new Date().toISOString().slice(0, 10);
  return `${prefix}-${date}.xlsx`;
}

export async function downloadExcel(url: string, filename: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      let message = "엑셀 다운로드에 실패했습니다.";
      try {
        const data = await response.json();
        if (data?.error) {
          message = data.error;
        }
      } catch {
        // ignore
      }
      alert(message);
      return;
    }

    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(objectUrl);
  } catch (error) {
    console.error("엑셀 다운로드 오류:", error);
    alert("엑셀 다운로드 중 오류가 발생했습니다.");
  }
}

export default downloadExcel;
 
