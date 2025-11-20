'use client';

import { useEffect, useRef } from 'react';

type AddressSearchProps = {
  onComplete: (data: {
    zonecode: string; // 우편번호
    address: string; // 도로명 주소
    addressEnglish?: string; // 영문 주소
    addressType: 'R' | 'J'; // R: 도로명, J: 지번
    bname?: string; // 법정동명
    buildingName?: string; // 건물명
  }) => void;
  className?: string;
  children?: React.ReactNode;
};

/**
 * 다음(Daum) 주소 검색 컴포넌트
 * 
 * 사용법:
 * <AddressSearch onComplete={(data) => {
 *   setPostalCode(data.zonecode);
 *   setAddress(data.address);
 * }}>
 *   <button>주소검색</button>
 * </AddressSearch>
 */
export default function AddressSearch({
  onComplete,
  className,
  children,
}: AddressSearchProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // 다음 주소 API 스크립트 로드
    const script = document.createElement('script');
    script.src =
      '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      // 컴포넌트 언마운트 시 스크립트 제거 (선택사항)
      // document.head.removeChild(script);
    };
  }, []);

  const handleClick = () => {
    if (typeof window === 'undefined' || !(window as any).daum) {
      alert('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    new (window as any).daum.Postcode({
      oncomplete: function (data: any) {
        // 선택한 주소 정보를 콜백으로 전달
        onComplete({
          zonecode: data.zonecode,
          address: data.roadAddress || data.jibunAddress,
          addressEnglish: data.addressEnglish,
          addressType: data.userSelectedType === 'R' ? 'R' : 'J',
          bname: data.bname,
          buildingName: data.buildingName,
        });
      },
      width: '100%',
      height: '100%',
    }).open();
  };

  // children이 있으면 children을 클릭 가능하게, 없으면 기본 버튼 렌더링
  if (children) {
    return (
      <div className={className} onClick={handleClick}>
        {children}
      </div>
    );
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleClick}
      className={className}
    >
      주소검색
    </button>
  );
}





