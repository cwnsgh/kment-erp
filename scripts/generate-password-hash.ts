/**
 * 비밀번호 해시 생성 스크립트
 * 
 * 사용법:
 *   npx tsx scripts/generate-password-hash.ts <비밀번호>
 * 
 * 예시:
 *   npx tsx scripts/generate-password-hash.ts password123
 *   npx tsx scripts/generate-password-hash.ts "MyPassword123!"
 */

import bcrypt from 'bcryptjs';

const password = process.argv[2];

if (!password) {
  console.error('❌ 사용법: npx tsx scripts/generate-password-hash.ts <비밀번호>');
  console.error('예시: npx tsx scripts/generate-password-hash.ts password123');
  process.exit(1);
}

async function generateHash() {
  try {
    const hash = await bcrypt.hash(password, 10);
    console.log('\n✅ 비밀번호 해시 생성 완료!\n');
    console.log('원본 비밀번호:', password);
    console.log('해시값:', hash);
    console.log('\n📋 SQL에 사용할 수 있는 형식:');
    console.log(`'${hash}'`);
    console.log('\n');
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

generateHash();

