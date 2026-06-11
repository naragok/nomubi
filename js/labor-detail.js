function openDetailModal(laborId) {
            const proj = appState.projects[appState.currentProjectId];
            if (!proj) return;
            const labor = proj.labors.find(l => l.id === laborId);
            if (!labor) return;

            // 헤더 타이틀: 이름 — N일
            const daysInMonth = new Date(proj.year, proj.month, 0).getDate();
            let autoDays = 0;
            for (let d = 1; d <= daysInMonth; d++) {
                if (labor.attendance[d]) autoDays += Number(labor.attendance[d]);
            }
            const effectiveDays = (labor.manualDays !== null && labor.manualDays !== undefined)
                ? labor.manualDays : autoDays;
            const titleEl = document.getElementById('detailModalTitle');
            if (titleEl) titleEl.textContent = `${labor.name}  —  ${effectiveDays}일 출역`;

            document.getElementById('detailLaborId').value = labor.id;
            document.getElementById('detailName').value = labor.name || "";
            document.getElementById('detailJob').value = labor.job || "";
            document.getElementById('detailSsn').value = labor.ssn || "";
            document.getElementById('detailPhone').value = labor.phone || "";
            document.getElementById('detailBank').value = labor.bank || "";
            document.getElementById('detailAccount').value = labor.account || "";
            document.getElementById('detailAddress').value = labor.address || "";
            document.getElementById('detailSafetyEdu').checked = !!labor.safetyEdu;
            // 외국인 근로자 필드
            document.getElementById('detailVisaType').value = labor.visaType || '';
            document.getElementById('detailVisaExpiry').value = labor.visaExpiry || '';
            document.getElementById('detailNationality').value = labor.nationality || '';

            document.getElementById('laborDetailModal').classList.remove('hidden');
            lucide.createIcons();
        }

        function closeDetailModal() {
            document.getElementById('laborDetailModal').classList.add('hidden');
        }

        // 신상정보 모달에서 날짜 일괄 기입으로 연동
        // — 해당 근로자 1명만 선택된 상태로 날짜 일괄 변경 모달을 열어줌
        function openSpecificDateModalForLabor(laborId) {
            if (!laborId) return;
            closeDetailModal();                 // 신상정보 모달 닫기
            openSpecificDateModal();            // 날짜 일괄 변경 모달 열기 (전체 근로자 렌더됨)

            // 전체 체크박스를 해제하고 해당 근로자만 선택
            document.querySelectorAll('#laborCheckboxList .labor-check').forEach(cb => {
                cb.checked = (cb.dataset.laborId === laborId);
            });
            _updateSelectedLaborCount();
        }

        function saveDetailInfo() {
            const proj = appState.projects[appState.currentProjectId];
            if (!proj) return;

            const laborId = document.getElementById('detailLaborId').value;
            const labor = proj.labors.find(l => l.id === laborId);
            if (!labor) return;

            const name = document.getElementById('detailName').value.trim();
            const ssn = document.getElementById('detailSsn').value.trim();

            if (!name || ssn.replace(/[^0-9]/g, '').length !== 13) {
                showCustomAlert("성명 기입 및 13자리 주민번호를 정확히 기입해주세요.");
                return;
            }

            labor.name = name;
            labor.job = document.getElementById('detailJob').value.trim();
            labor.ssn = ssn;
            labor.phone = document.getElementById('detailPhone').value.trim();
            labor.bank = document.getElementById('detailBank').value.trim();
            labor.account = document.getElementById('detailAccount').value.trim();
            labor.address = document.getElementById('detailAddress').value.trim();
            labor.safetyEdu = document.getElementById('detailSafetyEdu').checked;
            // 외국인 근로자 필드 저장
            labor.visaType = document.getElementById('detailVisaType').value;
            labor.visaExpiry = document.getElementById('detailVisaExpiry').value;
            labor.nationality = document.getElementById('detailNationality').value.trim();

            saveToLocalStorage();
            updateHeaderAndTable();
            closeDetailModal();
            showToast(`${name} 근로자의 상세정보 변경사항이 반영되었습니다.`);
        }

        // [실무 기능] 결재란 On/Off 기능 제어
        function toggleSignLineDisplay() {
            const checkbox = document.getElementById('toggleSignLine');
            const signBox = document.getElementById('signLineBox');
            if (checkbox.checked) {
                signBox.classList.remove('hidden');
            } else {
                signBox.classList.add('hidden');
            }
        }

        // [실무 기능] 근로자 데이터 간편 복사(복제)
        function duplicateLabor(laborId) {
            const proj = appState.projects[appState.currentProjectId];
            if (!proj) return;
            const labor = proj.labors.find(l => l.id === laborId);
            if (!labor) return;

            // 주민번호 기반 자리수 준수로 오류 방지
            const dummySsnFirst = labor.ssn.slice(0, 6);
            const dummySsnSecond = String(Math.floor(Math.random() * 2) + 1) + "000000";
            const mockSsn = `${dummySsnFirst}-${dummySsnSecond}`;

            const duplicated = {
                ...JSON.parse(JSON.stringify(labor)),
                id: "l_dup_" + (crypto.randomUUID ? crypto.randomUUID() : Date.now() + '_' + Math.random().toString(36).substr(2, 9)),
                name: labor.name + " (복사)",
                ssn: mockSsn,
                manualDays: null
            };

            proj.labors.push(duplicated);
            saveToLocalStorage();
            updateHeaderAndTable();
            // [수정] 복제된 주민번호는 임시값임을 명확히 안내
            showToast(`[${labor.name}] 근로자 설정이 복제 등록되었습니다. ⚠️ 주민번호가 임시값으로 생성되었습니다 — 이름을 클릭하여 반드시 수정해 주세요.`);
        }

        // [실무 기능] 엑셀 붙여넣기용 클립보드 복사 (Tab-Separated-Values)
        