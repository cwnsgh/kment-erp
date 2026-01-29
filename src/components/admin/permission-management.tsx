"use client";

import { useState, useEffect, useMemo } from "react";
import { MoreVertical, ChevronRight, ChevronLeft } from "lucide-react";
import { 
  getAllEmployeesForPermission, 
  getAllMenuStructure,
  getMenuPermissionByKey,
  saveMenuPermissions 
} from "@/app/actions/permission";
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

type MenuStructure = {
  id: string;
  category_key: string;
  category_name: string;
  menu_key: string;
  menu_name: string;
  navigation_path: string;
  display_order: number;
  is_active: boolean;
};

type MenuPermission = {
  id: string;
  menu_key: string;
  employee_id: string;
  allowed: boolean;
};

type PermissionModalState = {
  menuKey: string;
  menuName: string;
  categoryName: string;
} | null;

export function PermissionManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [menuStructure, setMenuStructure] = useState<MenuStructure[]>([]);
  const [permissions, setPermissions] = useState<MenuPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [permissionModal, setPermissionModal] = useState<PermissionModalState>(null);

  // 관리자(role_id: 1) 제외한 직원만 필터링
  const filteredEmployees = employees.filter((emp) => emp.role_id !== 1);

  // 카테고리별로 그룹화된 메뉴 구조
  const groupedMenus = useMemo(() => {
    console.log("메뉴 구조 그룹화:", menuStructure);
    const grouped: Record<string, MenuStructure[]> = {};
    menuStructure.forEach((menu) => {
      if (!grouped[menu.category_key]) {
        grouped[menu.category_key] = [];
      }
      grouped[menu.category_key].push(menu);
    });
    console.log("그룹화된 메뉴:", grouped);
    return grouped;
  }, [menuStructure]);

  // 카테고리 목록
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(menuStructure.map((m) => m.category_key))
    );
    return uniqueCategories.map((key) => {
      const firstMenu = menuStructure.find((m) => m.category_key === key);
      return {
        key,
        name: firstMenu?.category_name || key,
      };
    });
  }, [menuStructure]);

  // 필터링된 메뉴 구조
  const filteredMenuStructure = useMemo(() => {
    if (selectedCategory === "all") {
      return menuStructure;
    }
    return menuStructure.filter((m) => m.category_key === selectedCategory);
  }, [menuStructure, selectedCategory]);

  // 초기 데이터 로드
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setSaveMessage(null);
      
      const [employeesResult, menuStructureResult] = await Promise.all([
        getAllEmployeesForPermission(),
        getAllMenuStructure(),
      ]);

      console.log("직원 조회 결과:", employeesResult);
      console.log("메뉴 구조 조회 결과:", menuStructureResult);

      if (!employeesResult.success) {
        setSaveMessage({ 
          type: "error", 
          text: `직원 조회 실패: ${employeesResult.error || "알 수 없는 오류"}` 
        });
      } else {
        setEmployees(employeesResult.data || []);
      }

      if (!menuStructureResult.success) {
        setSaveMessage({ 
          type: "error", 
          text: `메뉴 구조 조회 실패: ${menuStructureResult.error || "알 수 없는 오류"}` 
        });
      } else {
        setMenuStructure(menuStructureResult.data || []);
      }

      // 모든 권한 데이터 로드 (한 번에 조회)
      if (menuStructureResult.success && menuStructureResult.data && employeesResult.success) {
        try {
          // 모든 권한을 한 번에 조회
          const { getMenuPermissions } = await import("@/app/actions/permission");
          const allPermsResult = await getMenuPermissions();
          
          if (allPermsResult.success && allPermsResult.data) {
            // 관리자(role_id: 1) 제외하고 필터링
            const filtered = allPermsResult.data.filter((p) => {
              const emp = employeesResult.data?.find((e) => e.id === p.employee_id);
              return emp && emp.role_id !== 1;
            });
            setPermissions(filtered);
          }
        } catch (error) {
          console.error("권한 데이터 일괄 조회 오류:", error);
          // 실패 시 빈 배열로 설정
          setPermissions([]);
        }
      }
    } catch (error) {
      console.error("데이터 로드 오류:", error);
      setSaveMessage({ 
        type: "error", 
        text: `데이터 로드 중 오류가 발생했습니다: ${error instanceof Error ? error.message : "알 수 없는 오류"}` 
      });
    } finally {
      setLoading(false);
    }
  };

  // 특정 메뉴의 권한이 있는 직원 목록
  const getEmployeesWithPermission = (menuKey: string): string[] => {
    return permissions
      .filter((p) => p.menu_key === menuKey && p.allowed)
      .map((p) => p.employee_id);
  };

  // 특정 메뉴의 권한이 없는 직원 목록
  const getEmployeesWithoutPermission = (menuKey: string): string[] => {
    const withPermission = getEmployeesWithPermission(menuKey);
    return filteredEmployees
      .map((e) => e.id)
      .filter((id) => !withPermission.includes(id));
  };

  // 권한 모달 열기
  const openPermissionModal = (menu: MenuStructure) => {
    setPermissionModal({
      menuKey: menu.menu_key,
      menuName: menu.menu_name,
      categoryName: menu.category_name,
    });
  };

  // 권한 모달 닫기
  const closePermissionModal = () => {
    setPermissionModal(null);
  };

  // 권한 추가 (좌측 -> 우측)
  const addPermission = (employeeId: string) => {
    if (!permissionModal) return;

    const existing = permissions.find(
      (p) => p.menu_key === permissionModal.menuKey && p.employee_id === employeeId
    );

    if (!existing) {
      setPermissions((prev) => [
        ...prev,
        {
          id: "",
          menu_key: permissionModal.menuKey,
          employee_id: employeeId,
          allowed: true,
        },
      ]);
    } else {
      setPermissions((prev) =>
        prev.map((p) =>
          p.menu_key === permissionModal.menuKey && p.employee_id === employeeId
            ? { ...p, allowed: true }
            : p
        )
      );
    }
  };

  // 권한 제거 (우측 -> 좌측)
  const removePermission = (employeeId: string) => {
    if (!permissionModal) return;

    setPermissions((prev) =>
      prev.map((p) =>
        p.menu_key === permissionModal.menuKey && p.employee_id === employeeId
          ? { ...p, allowed: false }
          : p
      )
    );
  };

  // 권한 저장
  const handleSavePermission = async () => {
    if (!permissionModal) return;

    try {
      setSaving(true);
      setSaveMessage(null);

      // 현재 모달의 메뉴에 대한 모든 권한 저장
      const menuPermissions = permissions
        .filter((p) => p.menu_key === permissionModal.menuKey)
        .map((p) => ({
          menuKey: p.menu_key,
          employeeId: p.employee_id,
          allowed: p.allowed,
        }));

      // 권한이 없는 직원들도 명시적으로 false로 저장
      const employeesWithoutPermission = getEmployeesWithoutPermission(permissionModal.menuKey);
      employeesWithoutPermission.forEach((employeeId) => {
        menuPermissions.push({
          menuKey: permissionModal.menuKey,
          employeeId,
          allowed: false,
        });
      });

      const result = await saveMenuPermissions(menuPermissions);

      if (result.success) {
        // 저장된 데이터로 상태 업데이트 (전체 데이터 다시 로드하지 않음)
        if (result.data && result.data.length > 0) {
          setPermissions((prev) => {
            const updated = [...prev];
            result.data.forEach((savedPerm: any) => {
              const index = updated.findIndex(
                (p) => p.menu_key === savedPerm.menu_key && p.employee_id === savedPerm.employee_id
              );
              if (index >= 0) {
                updated[index] = savedPerm;
              } else {
                updated.push(savedPerm);
              }
            });
            return updated;
          });
        }
        
        setSaveMessage({ type: "success", text: "권한이 저장되었습니다." });
        setTimeout(() => {
          closePermissionModal();
          setSaveMessage(null);
        }, 1000);
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

  // 전체 저장 (모든 권한)
  const handleSaveAll = async () => {
    try {
      setSaving(true);
      setSaveMessage(null);

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

      // 권한이 없는 모든 조합도 명시적으로 false로 저장
      menuStructure.forEach((menu) => {
        const employeesWithoutPermission = getEmployeesWithoutPermission(menu.menu_key);
        employeesWithoutPermission.forEach((employeeId) => {
          const emp = employees.find((e) => e.id === employeeId);
          if (emp && emp.role_id !== 1) {
            permissionsToSave.push({
              menuKey: menu.menu_key,
              employeeId,
              allowed: false,
            });
          }
        });
      });

      const result = await saveMenuPermissions(permissionsToSave);

      if (result.success) {
        // 저장된 데이터로 상태 업데이트 (전체 데이터 다시 로드하지 않음)
        if (result.data && result.data.length > 0) {
          setPermissions((prev) => {
            const updated = [...prev];
            result.data.forEach((savedPerm: any) => {
              const index = updated.findIndex(
                (p) => p.menu_key === savedPerm.menu_key && p.employee_id === savedPerm.employee_id
              );
              if (index >= 0) {
                updated[index] = savedPerm;
              } else {
                updated.push(savedPerm);
              }
            });
            return updated;
          });
        }
        
        setSaveMessage({ type: "success", text: "모든 권한이 저장되었습니다." });
        setTimeout(() => {
          setSaveMessage(null);
        }, 2000);
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

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>로딩 중...</div>
      </div>
    );
  }

  // 데이터가 없을 때
  if (menuStructure.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>권한 설정</h1>
          <p className={styles.description}>
            페이지 별 권한 설정
          </p>
        </div>
        <div className={styles.message + " " + styles.error}>
          메뉴 구조 데이터가 없습니다. SQL 파일을 실행했는지 확인해주세요.
        </div>
        <button onClick={loadData} className={styles.saveButton}>
          다시 로드
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>권한 설정</h1>
        <p className={styles.description}>
          페이지 별 권한 설정
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

      {/* 카테고리 필터 */}
      <div className={styles.filterSection}>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className={styles.categorySelect}
        >
          <option value="all">전체</option>
          {categories.map((category) => (
            <option key={category.key} value={category.key}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* 디버깅 정보 */}
      {/* {process.env.NODE_ENV === 'development' && (
        <div style={{ padding: '10px', background: '#f0f0f0', marginBottom: '10px', fontSize: '12px' }}>
          <div>메뉴 구조 개수: {menuStructure.length}</div>
          <div>그룹화된 카테고리 개수: {Object.keys(groupedMenus).length}</div>
          <div>선택된 카테고리: {selectedCategory}</div>
          <div>필터링된 메뉴: {Object.entries(groupedMenus).filter(([key]) => selectedCategory === "all" || key === selectedCategory).length}</div>
        </div>
      )} */}

      {/* 메뉴 목록 테이블 */}
      {Object.keys(groupedMenus).length > 0 ? (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.categoryColumn}>분류명</th>
                <th className={styles.permissionColumn}>권한 설정</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedMenus)
                .filter(([key]) => selectedCategory === "all" || key === selectedCategory)
                .map(([categoryKey, menus]) => {
                  return (
                  <tr key={categoryKey}>
                    <td className={styles.categoryCell}>
                      {menus[0]?.category_name || categoryKey}
                    </td>
                    <td className={styles.permissionCell}>
                      <div className={styles.menuList}>
                        {menus.map((menu) => {
                          const employeesWithPermission = getEmployeesWithPermission(menu.menu_key);
                          return (
                            <div key={menu.menu_key} className={styles.menuItem}>
                              <span className={styles.menuName}>
                                {menu.category_name} &gt; {menu.menu_name}
                              </span>
                              <div className={styles.permissionTags}>
                                {employeesWithPermission.length > 0 ? (
                                  <>
                                    <span className={`${styles.tag} ${styles.adminTag}`}>관리자</span>
                                    {employeesWithPermission
                                      .slice(0, 3)
                                      .map((employeeId) => {
                                        const emp = employees.find((e) => e.id === employeeId);
                                        return (
                                          <span key={employeeId} className={styles.tag}>
                                            {emp?.name || employeeId}
                                          </span>
                                        );
                                      })}
                                    {employeesWithPermission.length > 3 && (
                                      <span className={styles.tag}>
                                        +{employeesWithPermission.length - 3}
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span className={styles.noPermission}>권한 없음</span>
                                )}
                              </div>
                              <button
                                onClick={() => openPermissionModal(menu)}
                                className={styles.moreButton}
                                aria-label="권한 설정"
                              >
                                <MoreVertical size={16} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.message + " " + styles.error}>
          표시할 메뉴가 없습니다. (메뉴 구조: {menuStructure.length}개, 그룹화: {Object.keys(groupedMenus).length}개)
          <br />
          카테고리 필터를 확인해주세요.
        </div>
      )}

      {/* 전체 저장 버튼 */}
      {/* <div className={styles.actions}>
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className={styles.saveButton}
        >
          {saving ? "저장 중..." : "전체 저장"}
        </button>
        <button
          onClick={loadData}
          disabled={saving}
          className={styles.cancelButton}
        >
          취소
        </button>
      </div> */}

      {/* 권한 설정 모달 */}
      {permissionModal && (
        <div className={styles.modalOverlay} onClick={closePermissionModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>권한 설정</h2>
              <button onClick={closePermissionModal} className={styles.closeButton}>
                ✕
              </button>
            </div>

            <div className={styles.modalContent}>
              <div className={styles.modalMenuInfo}>
                {permissionModal.categoryName} &gt; {permissionModal.menuName}
              </div>

              <div className={styles.modalSection}>
                <h3 className={styles.modalSectionTitle}>권한 관리</h3>
                <div className={styles.permissionLists}>
                  {/* 좌측: 권한 없는 직원 */}
                  <div className={styles.permissionList}>
                    <div className={styles.permissionListHeader}>
                      권한 없음 ({getEmployeesWithoutPermission(permissionModal.menuKey).length})
                    </div>
                    <div className={styles.permissionListContent}>
                      {getEmployeesWithoutPermission(permissionModal.menuKey).map((employeeId) => {
                        const emp = employees.find((e) => e.id === employeeId);
                        if (!emp) return null;
                        return (
                          <label key={employeeId} className={styles.permissionItem}>
                            <input
                              type="checkbox"
                              checked={false}
                              onChange={() => addPermission(employeeId)}
                            />
                            <span>{emp.name}</span>
                          </label>
                        );
                      })}
                      {getEmployeesWithoutPermission(permissionModal.menuKey).length === 0 && (
                        <div className={styles.emptyList}>모든 직원에게 권한이 있습니다.</div>
                      )}
                    </div>
                  </div>

                  {/* 우측: 권한 있는 직원 */}
                  <div className={styles.permissionList}>
                    <div className={styles.permissionListHeader}>
                      권한 있음 ({getEmployeesWithPermission(permissionModal.menuKey).length})
                    </div>
                    <div className={styles.permissionListContent}>
                      {getEmployeesWithPermission(permissionModal.menuKey).map((employeeId) => {
                        const emp = employees.find((e) => e.id === employeeId);
                        if (!emp) return null;
                        return (
                          <label key={employeeId} className={styles.permissionItem}>
                            <input
                              type="checkbox"
                              checked={true}
                              onChange={() => removePermission(employeeId)}
                            />
                            <span>{emp.name}</span>
                          </label>
                        );
                      })}
                      {getEmployeesWithPermission(permissionModal.menuKey).length === 0 && (
                        <div className={styles.emptyList}>권한이 있는 직원이 없습니다.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                onClick={handleSavePermission}
                disabled={saving}
                className={styles.modalSaveButton}
              >
                {saving ? "저장 중..." : "저장"}
              </button>
              <button
                onClick={closePermissionModal}
                disabled={saving}
                className={styles.modalCancelButton}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
