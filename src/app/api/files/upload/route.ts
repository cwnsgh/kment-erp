import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseStorageClient } from '@/lib/supabase-server';

/**
 * ============================================
 * 파일 관리 API: 파일 업로드
 * ============================================
 * 
 * 클라이언트 첨부파일(사업자등록증, 서명 등)을 Supabase Storage에 업로드합니다.
 * 
 * @route POST /api/files/upload
 * @body FormData {
 *   file: File - 업로드할 파일
 *   folder: 'business-registration' | 'signature' - 저장할 폴더
 * }
 * @returns {Object} 업로드 결과
 * 
 * @example
 * const formData = new FormData();
 * formData.append('file', file);
 * formData.append('folder', 'business-registration');
 * 
 * const response = await fetch('/api/files/upload', {
 *   method: 'POST',
 *   body: formData,
 * });
 * 
 * Response: {
 *   success: true,
 *   url: 'https://...',
 *   fileName: 'original-name.pdf'
 * }
 * 
 * @throws {400} 파일이 없거나 폴더가 잘못된 경우
 * @throws {400} 파일 크기가 30MB를 초과하는 경우
 * @throws {500} 업로드 실패
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string;

    // 입력 검증
    if (!file) {
      return NextResponse.json(
        { success: false, error: '파일이 없습니다.' },
        { status: 400 }
      );
    }

    if (!folder || (folder !== 'business-registration' && folder !== 'signature')) {
      return NextResponse.json(
        { success: false, error: '올바른 폴더를 지정해주세요. (business-registration 또는 signature)' },
        { status: 400 }
      );
    }

    // 파일 크기 제한 체크 (30MB = 30 * 1024 * 1024 bytes)
    const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `파일 크기가 너무 큽니다. 최대 ${MAX_FILE_SIZE / 1024 / 1024}MB까지 업로드 가능합니다. (현재: ${(file.size / 1024 / 1024).toFixed(2)}MB)`,
        },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseStorageClient();

    // 파일명 생성 (타임스탬프 + URL-safe 파일명으로 중복 방지)
    const timestamp = Date.now();
    
    // 파일명을 URL-safe하게 변환 (한글 및 특수문자 처리)
    const originalFileName = file.name;
    const fileExtension = originalFileName.split('.').pop() || '';
    const fileNameWithoutExt = originalFileName.substring(0, originalFileName.lastIndexOf('.')) || originalFileName;
    
    // 한글 및 특수문자를 제거하고 영문/숫자/하이픈/언더스코어만 사용
    const sanitizedFileName = fileNameWithoutExt
      .replace(/[^a-zA-Z0-9_-]/g, '_') // 한글 및 특수문자를 언더스코어로 변환
      .substring(0, 50); // 파일명 길이 제한
    
    const safeFileName = `${sanitizedFileName}.${fileExtension}`;
    const fileName = `${folder}/${timestamp}-${safeFileName}`;

    // 파일을 ArrayBuffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    // Supabase Storage에 업로드
    const { data, error } = await supabase.storage
      .from('client-attachments')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false, // 중복 시 덮어쓰지 않음
      });

    if (error) {
      console.error('Supabase Storage 업로드 오류:', error);
      
      // 버킷이 존재하지 않는 경우
      if (error.message?.includes('Bucket not found') || error.message?.includes('The resource was not found')) {
        throw new Error(
          'Storage 버킷이 존재하지 않습니다. Supabase 대시보드에서 "client-attachments" 버킷을 생성해주세요.\n\n' +
          '설정 방법:\n' +
          '1. Supabase 대시보드 > Storage로 이동\n' +
          '2. "New bucket" 클릭\n' +
          '3. 버킷 이름: "client-attachments"\n' +
          '4. Public bucket: 체크 (공개 버킷으로 설정)\n' +
          '5. 생성 완료'
        );
      }
      
      // 권한 오류
      if (error.message?.includes('new row violates row-level security') || error.message?.includes('permission denied')) {
        throw new Error(
          'Storage 버킷 권한이 설정되지 않았습니다. Supabase 대시보드에서 버킷 권한을 설정해주세요.'
        );
      }
      
      throw error;
    }

    // 공개 URL 생성
    const { data: urlData } = supabase.storage
      .from('client-attachments')
      .getPublicUrl(data.path);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      fileName: originalFileName, // 원본 파일명 반환
      storedFileName: safeFileName, // 저장된 파일명 (디버깅용)
    });
  } catch (error) {
    console.error('파일 업로드 오류:', error);
    console.error('에러 상세:', JSON.stringify(error, null, 2));
    
    let errorMessage = '파일 업로드에 실패했습니다.';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null) {
      // Supabase 에러 객체 처리
      const supabaseError = error as any;
      if (supabaseError.message) {
        errorMessage = supabaseError.message;
      } else if (supabaseError.error) {
        errorMessage = supabaseError.error;
      }
    }
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined,
      },
      { status: 500 }
    );
  }
}






