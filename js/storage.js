function initApp() {
            // [수정] 구버전 localStorage 키 정리 — v1~v3 잔여 데이터 자동 삭제하여 스토리지 낭비 방지
            const LEGACY_KEYS = [
                'labor_payment_system_data_v1',
                'labor_payment_system_data_v2',
                'labor_payment_system_data_v3'
            ];
            LEGACY_KEYS.forEach(key => {
                if (localStorage.getItem(key) !== null) {
                    localStorage.removeItem(key);
                }
            });

            const saved = localStorage.getItem('labor_payment_system_data_v4');
            if (saved) {
                try {
                    appState = JSON.parse(saved);
                } catch (e) {
                    appState = demoData;
                }
            } else {
                appState = demoData;
                saveToLocalStorage();
            }
            
            populateDropdowns();
            onProjectChange();
            lucide.createIcons();
        }

        function saveToLocalStorage() {
            try {
                localStorage.setItem('labor_payment_system_data_v4', JSON.stringify(appState));
            } catch (e) {
                if (e.name === 'QuotaExceededError' || e.code === 22) {
                    // 사진 데이터가 커서 용량 초과인 경우 사진만 제외하고 저장 시도
                    try {
                        const stateWithoutPhotos = JSON.parse(JSON.stringify(appState));
                        Object.values(stateWithoutPhotos.projects).forEach(proj => {
                            if (proj.labors) {
                                proj.labors.forEach(l => { delete l.rosterPhotos; });
                            }
                        });
                        localStorage.setItem('labor_payment_system_data_v4', JSON.stringify(stateWithoutPhotos));
                        showToast('⚠️ 저장 공간 부족으로 첨부 사진 데이터가 제외되어 저장되었습니다. 불필요한 사진을 삭제해 주세요.');
                    } catch (e2) {
                        showCustomAlert('저장 공간이 부족합니다. 백업 후 데이터를 정리해 주세요.');
                    }
                }
            }
        }

        // 대장 테이블 배율 확대/축소
        