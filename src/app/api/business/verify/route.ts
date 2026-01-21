import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/env";

/**
 * 국세청 사업자등록정보 상태조회 API
 * POST /api/business/verify
 *
 * 요청: { businessNumber: "123-45-67890" } 또는 { businessNumbers: ["1234567890", "9876543210"] } (배치 처리)
 * 응답: { success: true, status: "approved" | "suspended" | "closed", statusText: "계속사업자" | "휴업자" | "폐업자" }
 *       또는 { success: true, results: [{ businessNumber, status, statusText }, ...] } (배치 처리)
 */
export async function POST(request: NextRequest) {
  try {
    const { businessNumber, businessNumbers } = await request.json();

    // API 키 가져오기
    const apiKey =
      process.env.PUBLIC_DATA_API_KEY || getEnv("PUBLIC_DATA_API_KEY");

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "국세청 API 키가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const normalizeBusinessNumber = (value: string) => value.replace(/-/g, "");
    const isValidBusinessNumber = (value: string) => {
      if (!/^\d{10}$/.test(value)) return false;
      const digits = value.split("").map((char) => Number(char));
      const weights = [1, 3, 7, 1, 3, 7, 1, 3, 5];
      let sum = 0;
      for (let i = 0; i < weights.length; i += 1) {
        sum += digits[i] * weights[i];
      }
      sum += Math.floor((digits[8] * 5) / 10);
      const checkDigit = (10 - (sum % 10)) % 10;
      return checkDigit === digits[9];
    };

    // 단일 또는 배치 처리
    if (businessNumber) {
      // 단일 사업자등록번호 처리
      const cleanBusinessNumber = normalizeBusinessNumber(businessNumber);
      if (!isValidBusinessNumber(cleanBusinessNumber)) {
        return NextResponse.json(
          { success: false, error: "유효하지 않은 사업자등록번호입니다." },
          { status: 400 }
        );
      }

      const apiUrl = `https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey=${encodeURIComponent(
        apiKey
      )}&returnType=JSON`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          b_no: [cleanBusinessNumber],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("국세청 API 오류:", errorText);
        return NextResponse.json(
          { success: false, error: `국세청 API 호출 실패: ${response.status}` },
          { status: response.status }
        );
      }

      const data = await response.json();

      // 응답 확인
      if (data.status_code !== "OK" || !data.data || data.data.length === 0) {
        return NextResponse.json(
          { success: false, error: "사업자등록번호를 확인할 수 없습니다." },
          { status: 404 }
        );
      }

      const businessInfo = data.data[0];

      // 사업자등록번호가 없거나 요청한 번호와 다른 경우 (잘못된 번호)
      if (
        !businessInfo.b_no ||
        businessInfo.b_no.replace(/-/g, "") !== cleanBusinessNumber
      ) {
        return NextResponse.json(
          { success: false, error: "유효하지 않은 사업자등록번호입니다." },
          { status: 404 }
        );
      }

      const statusCode = businessInfo.b_stt_cd;

      // 상태 코드가 없거나 유효하지 않은 경우 (잘못된 번호)
      if (
        !statusCode ||
        (statusCode !== "01" && statusCode !== "02" && statusCode !== "03")
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "사업자등록번호 상태를 확인할 수 없습니다.",
          },
          { status: 404 }
        );
      }

      // 상태 코드 매핑
      // 01: 계속사업자, 02: 휴업자, 03: 폐업자
      let status: "approved" | "suspended" | "closed";
      let statusText: string;

      switch (statusCode) {
        case "01":
          status = "approved";
          statusText = businessInfo.b_stt || "계속사업자";
          break;
        case "02":
          status = "suspended";
          statusText = businessInfo.b_stt || "휴업자";
          break;
        case "03":
          status = "closed";
          statusText = businessInfo.b_stt || "폐업자";
          break;
        default:
          // 이 경우는 위에서 이미 체크했지만, 타입 안전성을 위해 추가
          return NextResponse.json(
            {
              success: false,
              error: "사업자등록번호 상태를 확인할 수 없습니다.",
            },
            { status: 404 }
          );
      }

      return NextResponse.json({
        success: true,
        status,
        statusText,
        statusCode,
        businessInfo: {
          businessNumber: businessInfo.b_no,
          taxType: businessInfo.tax_type,
          endDate: businessInfo.end_dt,
        },
      });
    } else if (
      businessNumbers &&
      Array.isArray(businessNumbers) &&
      businessNumbers.length > 0
    ) {
      // 배치 처리 (최대 100개)
      const batchSize = 100;
      const batches: string[][] = [];
      for (let i = 0; i < businessNumbers.length; i += batchSize) {
        batches.push(businessNumbers.slice(i, i + batchSize));
      }

      const results: Array<{
        businessNumber: string;
        status: "approved" | "suspended" | "closed" | "unavailable";
        statusText: string;
        statusCode?: string;
      }> = [];

      for (const batch of batches) {
        const cleanBatch = batch.map((bn: string) => normalizeBusinessNumber(bn));
        const validBatch = cleanBatch.filter((bn) => isValidBusinessNumber(bn));
        const invalidBatch = cleanBatch.filter((bn) => !isValidBusinessNumber(bn));
        for (const invalidNumber of invalidBatch) {
          results.push({
            businessNumber: invalidNumber,
            status: "unavailable",
            statusText: "유효하지 않은 사업자등록번호",
          });
        }

        if (validBatch.length === 0) {
          continue;
        }
        const apiUrl = `https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey=${encodeURIComponent(
          apiKey
        )}&returnType=JSON`;

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            b_no: validBatch,
          }),
        });

        if (!response.ok) {
          console.error(`배치 API 호출 실패: ${response.status}`);
          continue;
        }

        const data = await response.json();

        if (data.status_code === "OK" && data.data) {
          for (const businessInfo of data.data) {
            // 사업자등록번호가 없거나 유효하지 않은 경우 건너뛰기
            if (!businessInfo.b_no) {
              continue;
            }

            const statusCode = businessInfo.b_stt_cd;

            // 상태 코드가 없거나 유효하지 않은 경우 건너뛰기
            if (
              !statusCode ||
              (statusCode !== "01" &&
                statusCode !== "02" &&
                statusCode !== "03")
            ) {
              continue;
            }

            let status: "approved" | "suspended" | "closed";
            let statusText: string;

            switch (statusCode) {
              case "01":
                status = "approved";
                statusText = businessInfo.b_stt || "계속사업자";
                break;
              case "02":
                status = "suspended";
                statusText = businessInfo.b_stt || "휴업자";
                break;
              case "03":
                status = "closed";
                statusText = businessInfo.b_stt || "폐업자";
                break;
              default:
                // 이 경우는 위에서 이미 체크했지만, 타입 안전성을 위해 건너뛰기
                continue;
            }

            results.push({
              businessNumber: businessInfo.b_no,
              status,
              statusText,
              statusCode,
            });
          }
        }
      }

      return NextResponse.json({
        success: true,
        results,
      });
    } else {
      return NextResponse.json(
        { success: false, error: "사업자등록번호가 필요합니다." },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("사업자 상태 확인 오류:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "사업자 상태 확인 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
