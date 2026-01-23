"use client";

import { useState, useEffect } from "react";
import { getAllEmployeesForPermission, getMenuPermissions, saveMenuPermissions } from "@/app/actions/permission";
import styles from "./permission-management.module.css";

type Employee = {
  id: string;
  name: string;
  role_id: number;
  role: {
    id: number;
    name: string;
    level: number;
  };
};

type MenuPermission = {
  id: string;
  menu_key: string;
  employee_id: string;
  allowed: boolean;
};

// 메뉴 정의 (navigation.ts와 동일한 구조)
const MENU_CONFIG = [
  { key: "dashboard", label: "대시보드" },
  { key: "clients", label: "거래처 관리" },
  { key: "consultation", label: "상담 관리" },
  { key: "contracts", label: "계약 관리" },
  { key: "schedule", label: "일정 관리" },
  { key: "operations", label: "관리 업무" },
  { key: "staff", label: "직원 관리" },
  { key: "vacations", label: "연차 관리" },
  { key: "admin", label: "관리자 페이지" },
];

export function PermissionManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [permissions, setPermissions] = useState<MenuPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 관리자(role_id: 1) 제외한 직원만 필터링
  const filteredEmployees = employees.filter((emp) => emp.role_id !== 1);

  // 초기 데이터 로드
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const employeesResult = await getAllEmployeesForPermission();

      if (employeesResult.success) {
        setEmployees(employeesResult.data || []);
      }

      // 직원 정보를 먼저 로드한 후 권한 정보 로드
      const permissionsResult = await getMenuPermissions();
      if (permissionsResult.success && employeesResult.success) {
        // 관리자(role_id: 1) 제외하고 로드
        const filtered = (permissionsResult.data || []).filter((p) => {
          const emp = employeesResult.data?.find((e) => e.id === p.employee_id);
          return emp && emp.role_id !== 1;
        });
        setPermissions(filtered);
      }
    } catch (error) {
      console.error("데이터 로드 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  // 권한 체크박스 변경
  const handlePermissionChange = (menuKey: string, employeeId: string, allowed: boolean) => {
    setPermissions((prev) => {
      const existing = prev.find(
        (p) => p.menu_key === menuKey && p.employee_id === employeeId
      );

      if (existing) {
        // 기존 권한 업데이트
        return prev.map((p) =>
          p.menu_key === menuKey && p.employee_id === employeeId
            ? { ...p, allowed }
            : p
        );
      } else {
        // 새 권한 추가
        return [
          ...prev,
          {
            id: "",
            menu_key: menuKey,
            employee_id: employeeId,
            allowed,
          },
        ];
      }
    });
  };

  // 권한 저장
  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveMessage(null);

      // 관리자(role_id: 1) 제외하고 저장
      const permissionsToSave = permissions
        .filter((p) => {
          const emp = employees.find((e) => e.id === p.employee_id);
          return emp && emp.role_id !== 1;
        })
        .map((p) => ({
          menuKey: p.menu_key,
          employeeId: p.employee_id,
          allowed: p.allowed,
        }));

      const result = await saveMenuPermissions(permissionsToSave);

      if (result.success) {
        setSaveMessage({ type: "success", text: "권한이 저장되었습니다." });
        // 데이터 다시 로드
        await loadData();
      } else {
        setSaveMessage({ type: "error", text: result.error || "저장에 실패했습니다." });
      }
    } catch (error) {
      console.error("권한 저장 오류:", error);
      setSaveMessage({ type: "error", text: "저장 중 오류가 발생했습니다." });
    } finally {
      setSaving(false);
    }
  };

  // 특정 메뉴/직원의 권한 확인
  const getPermission = (menuKey: string, employeeId: string): boolean => {
    const permission = permissions.find(
      (p) => p.menu_key === menuKey && p.employee_id === employeeId
    );
    return permission ? permission.allowed : false;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>로딩 중...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>메뉴 권한 관리</h1>
        <p className={styles.description}>
          각 메뉴에 접근할 수 있는 직원을 개별적으로 설정할 수 있습니다.
        </p>
      </div>

      {saveMessage && (
        <div
          className={`${styles.message} ${
            saveMessage.type === "success" ? styles.success : styles.error
          }`}
        >
          {saveMessage.text}
        </div>
      )}

      <div className={styles.infoBox}>
        <p className={styles.infoText}>
          💡 <strong>사장(관리자)</strong>은 모든 메뉴에 접근 가능하므로 권한 설정에서 제외됩니다.
        </p>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.menuColumn}>메뉴</th>
              {filteredEmployees.map((employee) => (
                <th key={employee.id} className={styles.employeeColumn}>
                  <div className={styles.employeeHeader}>
                    <div className={styles.employeeName}>{employee.name}</div>
                    <div className={styles.employeeRole}>{employee.role?.name || ""}</div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MENU_CONFIG.map((menu) => (
              <tr key={menu.key}>
                <td className={styles.menuCell}>{menu.label}</td>
                {filteredEmployees.map((employee) => (
                  <td key={employee.id} className={styles.checkboxCell}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={getPermission(menu.key, employee.id)}
                        onChange={(e) =>
                          handlePermissionChange(menu.key, employee.id, e.target.checked)
                        }
                        className={styles.checkbox}
                      />
                      <span className={styles.checkmark}></span>
                    </label>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.actions}>
        <button
          onClick={handleSave}
          disabled={saving}
          className={styles.saveButton}
        >
          {saving ? "저장 중..." : "저장"}
        </button>
        <button
          onClick={loadData}
          disabled={saving}
          className={styles.cancelButton}
        >
          취소
        </button>
      </div>
    </div>
  );
}
