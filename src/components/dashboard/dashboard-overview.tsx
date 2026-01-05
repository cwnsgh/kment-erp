"use client";

import Image from "next/image";
import Link from "next/link";
import styles from "./dashboard-overview.module.css";

type DashboardOverviewProps = {
  employeeName: string;
};

const quickActions = [
  { label: "거래처 등록", href: "/clients/new" },
  { label: "계약 등록", href: "/contracts/new" },
  { label: "일정 등록", href: "/schedule" },
  { label: "관리 고객등록", href: "/operations/clients" },
  { label: "업무 등록 (관리고객)", href: "/operations/new" },
  { label: "업무 등록 (계약고객)", href: "/operations/tasks" },
  { label: "직원 등록", href: "/staff" },
  { label: "연차 신청", href: "/vacations" },
  { label: "연차 신청 조회", href: "/vacations" },
];

const summary = [
  {
    title: "연차 신청 현황",
    total: "5",
    totalUnit: "건",
    period: "2025.10",
    items: [
      { label: "승인", value: "3" },
      { label: "대기", value: "1" },
      { label: "반려", value: "0" },
    ],
  },
  {
    title: "이번달 상담/계약 현황",
    total: "4",
    totalUnit: "건",
    period: "2025.10",
    items: [
      { label: "신규 상담 등록", value: "3" },
      { label: "신규 거래처 등록", value: "1" },
      { label: "미납 거래처", value: "0" },
      { label: "계약 고객 등록", value: "3" },
      { label: "관리 고객 등록", value: "1" },
      { label: "총 매출", value: "10,000,000원" },
    ],
  },
];

// 일정 데이터 예시
const scheduleData = [
  {
    date: 30,
    day: "Wed",
    events: ["오성정밀화학 오픈", "TBK 시안 완료"],
  },
  {
    date: 31,
    day: "Thu",
    events: [],
  },
];

export function DashboardOverview({ employeeName }: DashboardOverviewProps) {
  const today = new Date();
  const currentMonth = `${today.getFullYear()}.${String(
    today.getMonth() + 1
  ).padStart(2, "0")}`;

  return (
    <section className={styles.mainSection}>
      {/* 환영 메시지 */}
      <div className={styles.pageTitle}>
        <h1>
          <span>{employeeName}</span>님, 안녕하세요!
        </h1>
      </div>

      {/* 일정 섹션 */}
      <div className={styles.mainSchedule}>
        <div className={styles.scheduleTop}>
          <h4 className={styles.today}>{currentMonth}</h4>
          <div className={styles.rightControl}>
            <div className={styles.arrowL}>
              <Image
                src="/images/arrow_icon.svg"
                alt="이전"
                width={12}
                height={12}
              />
            </div>
            <div className={styles.arrowR}>
              <Image
                src="/images/arrow_icon.svg"
                alt="다음"
                width={12}
                height={12}
              />
            </div>
            <div className={styles.plusIcon}>
              <Image
                src="/images/plus_icon.svg"
                alt="추가"
                width={12}
                height={12}
              />
            </div>
          </div>
        </div>
        <div className={styles.scheduleContent}>
          {scheduleData.map((schedule, idx) => (
            <div
              key={idx}
              className={`${styles.scheduleBox} ${
                schedule.events.length === 0 ? styles.noSchedule : ""
              }`}
            >
              <div className={styles.dateBox}>
                <span className={styles.day}>{schedule.day}</span>
                <span className={styles.date}>{schedule.date}</span>
              </div>
              {idx === 0 && schedule.events.length > 1 && (
                <div className={styles.totalCount}>
                  +{schedule.events.length}
                </div>
              )}
              <ul className={styles.scheduleList}>
                {schedule.events.length > 0 ? (
                  schedule.events.map((event, eventIdx) => (
                    <li key={eventIdx}>{event}</li>
                  ))
                ) : (
                  <li>일정이 없습니다.</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* 빠른 액세스 카드들 */}
      <div className={styles.mainList}>
        {quickActions.map((action) => (
          <div key={action.label} className={styles.cardBox}>
            <h3>{action.label}</h3>
            <div className={styles.mainBtn}>
              <Link href={action.href}>
                <Image
                  src="/images/arrow_icon2.svg"
                  alt="이동"
                  width={10}
                  height={10}
                />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* 요약 위젯들 */}
      <div className={styles.managerList}>
        <div className={`${styles.cardBox} ${styles.left}`}>
          <div className={styles.mainBtn}>
            <Link href="#">
              <Image
                src="/images/arrow_icon2.svg"
                alt="이동"
                width={10}
                height={10}
              />
            </Link>
          </div>
          <h3>
            {summary[0].title}
            <span className={styles.date}>{summary[0].period}</span>
          </h3>
          <div className={styles.numArea}>
            <p className={styles.num}>{summary[0].total}</p>
            <p>{summary[0].totalUnit}</p>
          </div>
          <div className={styles.listGroup}>
            <ul className={styles.detailList}>
              {summary[0].items.map((item) => (
                <li key={item.label}>
                  <span>{item.label}</span>
                  <span className={styles.num}>{item.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className={`${styles.cardBox} ${styles.right}`}>
          <div className={styles.mainBtn}>
            <Link href="#">
              <Image
                src="/images/arrow_icon2.svg"
                alt="이동"
                width={10}
                height={10}
              />
            </Link>
          </div>
          <h3>
            {summary[1].title}
            <span className={styles.date}>{summary[1].period}</span>
          </h3>
          <div className={styles.numArea}>
            <p className={styles.num}>{summary[1].total}</p>
            <p>{summary[1].totalUnit}</p>
          </div>
          <div className={styles.listGroup}>
            <ul className={styles.detailList}>
              {summary[1].items.slice(0, 3).map((item) => (
                <li key={item.label}>
                  <span>{item.label}</span>
                  <span className={styles.num}>{item.value}</span>
                </li>
              ))}
            </ul>
            <ul className={styles.detailList}>
              {summary[1].items.slice(3).map((item) => (
                <li key={item.label}>
                  <span>{item.label}</span>
                  <span className={styles.num}>{item.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
