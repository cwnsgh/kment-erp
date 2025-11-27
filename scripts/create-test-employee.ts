/**
 * 테스트용 직원 계정 생성 스크립트
 * 
 * 사용법:
 *   npx tsx scripts/create-test-employee.ts
 * 
 * 또는 package.json에 스크립트 추가 후:
 *   npm run create-test-employee
 */

import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// .env.local 파일 로드
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 확인하세요.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'erp',
  },
});

interface TestEmployee {
  email: string;
  password: string;
  name: string;
  phone?: string;
  roleLevel: number; // 역할 레벨 (1=사장, 2=과장, 3=대리, 4=주임, 5=프로)
}

const testEmployees: TestEmployee[] = [
  {
    email: 'admin@kment.co.kr',
    password: 'admin123',
    name: '관리자',
    phone: '010-1234-5678',
    roleLevel: 1, // 사장
  },
  {
    email: 'manager@kment.co.kr',
    password: 'manager123',
    name: '과장',
    phone: '010-2345-6789',
    roleLevel: 2, // 과장
  },
  {
    email: 'staff@kment.co.kr',
    password: 'staff123',
    name: '직원',
    phone: '010-3456-7890',
    roleLevel: 3, // 대리
  },
];

async function createTestEmployees() {
  console.log('🚀 테스트용 직원 계정 생성 시작...\n');

  try {
    // 1. 역할 정보 조회
    console.log('📋 역할 정보 조회 중...');
    const { data: roles, error: rolesError } = await supabase
      .from('role')
      .select('id, level, name')
      .order('level', { ascending: true });

    if (rolesError) {
      throw new Error(`역할 조회 실패: ${rolesError.message}`);
    }

    if (!roles || roles.length === 0) {
      throw new Error('역할 정보가 없습니다. 먼저 employee-schema.sql을 실행하세요.');
    }

    console.log('✅ 역할 정보 조회 완료:\n');
    roles.forEach((role) => {
      console.log(`   - 레벨 ${role.level}: ${role.name} (ID: ${role.id})`);
    });
    console.log('');

    // 2. 각 테스트 직원 계정 생성
    for (const employee of testEmployees) {
      console.log(`👤 직원 계정 생성 중: ${employee.email} (${employee.name})`);

      // 역할 ID 찾기
      const role = roles.find((r) => r.level === employee.roleLevel);
      if (!role) {
        console.error(`   ❌ 역할 레벨 ${employee.roleLevel}을 찾을 수 없습니다.`);
        continue;
      }

      // 비밀번호 해싱
      const passwordHash = await bcrypt.hash(employee.password, 10);

      // 직원 계정 생성 (중복 시 업데이트)
      const { data: existingEmployee } = await supabase
        .from('employee')
        .select('id')
        .eq('email', employee.email)
        .single();

      if (existingEmployee) {
        // 기존 계정 업데이트
        const { error: updateError } = await supabase
          .from('employee')
          .update({
            password_hash: passwordHash,
            name: employee.name,
            phone: employee.phone,
            role_id: role.id,
            is_active: true,
          })
          .eq('id', existingEmployee.id);

        if (updateError) {
          console.error(`   ❌ 업데이트 실패: ${updateError.message}`);
          continue;
        }

        console.log(`   ✅ 기존 계정 업데이트 완료`);
        console.log(`      - 이메일: ${employee.email}`);
        console.log(`      - 비밀번호: ${employee.password}`);
        console.log(`      - 이름: ${employee.name}`);
        console.log(`      - 역할: ${role.name} (레벨 ${role.level})`);
      } else {
        // 새 계정 생성
        const { data: newEmployee, error: insertError } = await supabase
          .from('employee')
          .insert({
            email: employee.email,
            password_hash: passwordHash,
            name: employee.name,
            phone: employee.phone,
            role_id: role.id,
            is_active: true,
          })
          .select()
          .single();

        if (insertError) {
          console.error(`   ❌ 생성 실패: ${insertError.message}`);
          continue;
        }

        console.log(`   ✅ 계정 생성 완료`);
        console.log(`      - 이메일: ${employee.email}`);
        console.log(`      - 비밀번호: ${employee.password}`);
        console.log(`      - 이름: ${employee.name}`);
        console.log(`      - 역할: ${role.name} (레벨 ${role.level})`);
      }

      console.log('');
    }

    console.log('✨ 테스트용 직원 계정 생성 완료!\n');
    console.log('📝 로그인 테스트:');
    console.log('   - 관리자: admin@kment.co.kr / admin123');
    console.log('   - 과장: manager@kment.co.kr / manager123');
    console.log('   - 직원: staff@kment.co.kr / staff123');
    console.log('');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

// 스크립트 실행
createTestEmployees();






