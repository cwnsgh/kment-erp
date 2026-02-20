"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { getContractDetail } from "@/app/actions/contract";
import { ContractDetailPanel, type ContractDetailData } from "./contract-detail-panel";
import styles from "./contract-status-view.module.css";

type StatusData = {
  monthLabel: string;
  monthContractCount: number;
  monthSales: number;
  quarterLabel: string;
  quarterSales: number;
  monthlyDetail: Array<{
    id: string;
    contract_date: string;
    business_registration_number: string;
    client_name: string;
    ceo_name: string;
    primary_contact_name: string | null;
    payment_progress: string;
    contract_type_name: string;
    contract_amount: number;
    remaining: number;
  }>;
  yearlyMonthlySales: {
    totalAmount: number;
    totalCount: number;
    byMonth: Record<number, number>;
  };
};

type ContractStatusViewProps = {
  data: StatusData;
  year: number;
  month: number;
};

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("ko-KR").format(amount);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function progressLabel(progress: string): "정상" | "미납" {
  return progress === "paid" || progress === "installment" ? "정상" : "미납";
}

export function ContractStatusView({ data, year, month }: ContractStatusViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [customYear, setCustomYear] = useState(year);
  const [customMonth, setCustomMonth] = useState(month);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<ContractDetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const openDetail = useCallback(async (contractId: string) => {
    setDetailOpen(true);
    setDetailData(null);
    setDetailLoading(true);
    const result = await getContractDetail(contractId);
    setDetailLoading(false);
    if (result.success && result.detail) {
      setDetailData(result.detail);
    } else {
      alert(result.error ?? "계약 상세를 불러올 수 없습니다.");
      setDetailOpen(false);
    }
  }, []);

  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth() + 1;
  const lastMonth = thisMonth === 1 ? 12 : thisMonth - 1;
  const lastMonthYear = thisMonth === 1 ? thisYear - 1 : thisYear;

  const setPeriod = useCallback(
    (y: number, m: number) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.set("year", String(y));
      params.set("month", String(m));
      router.push(`/contracts/status?${params.toString()}`);
    },
    [router, searchParams],
  );

  const isThisMonth = year === thisYear && month === thisMonth;
  const isLastMonth = year === lastMonthYear && month === lastMonth;

  const monthNames = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  return (
    <div className={styles.wrap}>
      {/* 필터 */}
      <div className={styles.filterBar}>
        <button type="button" onClick={() => setPeriod(thisYear, thisMonth)} className={`${styles.filterBtn} ${isThisMonth ? styles.filterBtnPrimary : styles.filterBtnDefault}`}>
          이번달
        </button>
        <button type="button" onClick={() => setPeriod(lastMonthYear, lastMonth)} className={`${styles.filterBtn} ${isLastMonth ? styles.filterBtnPrimary : styles.filterBtnDefault}`}>
          지난달
        </button>
        <span className={styles.filterLabel}>직접선택</span>
        <select value={customYear} onChange={(e) => setCustomYear(parseInt(e.target.value, 10))} className={styles.filterSelect}>
          {[thisYear, thisYear - 1, thisYear - 2].map((y) => (
            <option key={y} value={y}>
              {y}년
            </option>
          ))}
        </select>
        <select value={customMonth} onChange={(e) => setCustomMonth(parseInt(e.target.value, 10))} className={styles.filterSelect}>
          {monthNames.map((m) => (
            <option key={m} value={m}>
              {m}월
            </option>
          ))}
        </select>
        <button type="button" onClick={() => setPeriod(customYear, customMonth)} className={` btn btn_lg primary`}>
          조회
        </button>
      </div>

      {/* KPI 카드 3개 */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <p className={styles.kpiCardLabel}>이번달 계약 건수</p>
          <p className={styles.kpiCardPeriod}>{data.monthLabel}</p>
          <p className={styles.kpiCardValue}>
            {data.monthContractCount}
            <span>건</span>
          </p>
        </div>
        <div className={styles.kpiCard}>
          <p className={styles.kpiCardLabel}>이번달 매출액</p>
          <p className={styles.kpiCardPeriod}>{data.monthLabel}</p>
          <p className={styles.kpiCardValue}>
            {formatAmount(data.monthSales)}
            <span>원</span>
          </p>
        </div>
        <div className={styles.kpiCard}>
          <p className={styles.kpiCardLabel}>분기 매출</p>
          <p className={styles.kpiCardPeriod}>{data.quarterLabel}</p>
          <p className={styles.kpiCardValue}>
            {formatAmount(data.quarterSales)}
            <span>원</span>
          </p>
        </div>
      </div>

      {/* 월별 상세 계약건 테이블 */}
      <section className={styles.tableSection}>
        <div className={styles.tableSectionHeader}>
          <h2 className={styles.tableSectionTitle}>
            월별 상세 계약건 <span className={styles.tableSectionTitleSub}>{data.monthLabel}</span>
          </h2>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>계약일</th>
                <th>사업자 등록 번호</th>
                <th>회사명</th>
                <th>대표자명</th>
                <th>담당자</th>
                <th>진행상태</th>
                <th>계약종목</th>
                <th>계약금액 (잔금)</th>
              </tr>
            </thead>
            <tbody>
              {data.monthlyDetail.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.tableEmpty}>
                    해당 기간 계약이 없습니다.
                  </td>
                </tr>
              ) : (
                data.monthlyDetail.map((row) => (
                  <tr key={row.id} onClick={() => openDetail(row.id)} className={styles.tableRowClickable}>
                    <td>{formatDate(row.contract_date)}</td>
                    <td>{row.business_registration_number}</td>
                    <td>{row.client_name}</td>
                    <td>{row.ceo_name}</td>
                    <td>{row.primary_contact_name ?? "-"}</td>
                    <td>
                      <span className={`${styles.badge} ${progressLabel(row.payment_progress) === "정상" ? styles.badgeNormal : styles.badgeUnpaid}`}>{progressLabel(row.payment_progress)}</span>
                    </td>
                    <td>{row.contract_type_name || "-"}</td>
                    <td>
                      {formatAmount(row.contract_amount)} ({formatAmount(row.remaining)})
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 월별 매출 - 1~6월 / 7~12월 두 묶음 */}
      <section className={styles.monthlySection}>
        <div className={styles.monthlySectionHeader}>
          <h2 className={styles.monthlySectionTitle}>월별 매출</h2>
          <p className={styles.monthlyTotal}>
            총 매출합계 <span className={styles.monthlyTotalAmount}>{formatAmount(data.yearlyMonthlySales.totalAmount)}원</span> <span className={styles.monthlyTotalCount}>({data.yearlyMonthlySales.totalCount}건)</span>
          </p>
        </div>
        <div className={styles.monthlyTwoCol}>
          <div className={styles.monthlyCol}>
            {monthNames.slice(0, 6).map((m) => {
              const amount = data.yearlyMonthlySales.byMonth[m] ?? 0;
              return (
                <div key={m} className={styles.monthlyCell}>
                  <span className={styles.monthlyCellLeft}>{m}월</span>
                  <span className={`${styles.monthlyCellRight} ${amount > 0 ? "" : styles.noData}`}>{amount > 0 ? `${formatAmount(amount)}원` : "데이터 없음"}</span>
                </div>
              );
            })}
          </div>
          <div className={styles.monthlyCol}>
            {monthNames.slice(6, 12).map((m) => {
              const amount = data.yearlyMonthlySales.byMonth[m] ?? 0;
              return (
                <div key={m} className={styles.monthlyCell}>
                  <span className={styles.monthlyCellLeft}>{m}월</span>
                  <span className={`${styles.monthlyCellRight} ${amount > 0 ? "" : styles.noData}`}>{amount > 0 ? `${formatAmount(amount)}원` : "데이터 없음"}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <ContractDetailPanel isOpen={detailOpen} onClose={() => setDetailOpen(false)} detail={detailData} isLoading={detailLoading} />
    </div>
  );
}
