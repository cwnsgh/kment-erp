import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';

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

    const supabase = await getSupabaseServerClient();

    // 파일명 생성 (타임스탬프 + 원본 파일명으로 중복 방지)
    const timestamp = Date.now();
    const fileName = `${folder}/${timestamp}-${file.name}`;

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

    if (error) throw error;

    // 공개 URL 생성
    const { data: urlData } = supabase.storage
      .from('client-attachments')
      .getPublicUrl(data.path);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      fileName: file.name,
    });
  } catch (error) {
    console.error('파일 업로드 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '파일 업로드에 실패했습니다.',
      },
      { status: 500 }
    );
  }
}





