function openNewProjectModal() {
            document.getElementById('projectModal').classList.remove('hidden');
        }

        function closeNewProjectModal() {
            document.getElementById('projectModal').classList.add('hidden');
        }

        function saveNewProject() {
            const company = document.getElementById('modalCompany').value.trim();
            const representative = document.getElementById('modalRepresentative').value.trim() || "김민지";
            const year = parseInt(document.getElementById('modalYear').value);
            const month = parseInt(document.getElementById('modalMonth').value);
            const projectName = document.getElementById('modalProjectName').value.trim();
            const workType = document.getElementById('modalWorkType').value.trim();

            if (!company || isNaN(year) || isNaN(month) || !projectName || !workType) {
                showCustomAlert("비어 있는 입력 항목이 있는지 상세 확인 후 기록하여 주십시오.");
                return;
            }

            const newId = "p_" + Date.now();
            appState.projects[newId] = {
                company,
                representative,
                year,
                month,
                projectName,
                workType,
                labors: []
            };

            appState.currentProjectId = newId;
            saveToLocalStorage();
            populateDropdowns();
            onProjectChange();
            closeNewProjectModal();
            showToast("신규 현장 대장이 성공적으로 구축 및 선택되었습니다.");

            document.getElementById('modalCompany').value = "";
            document.getElementById('modalRepresentative').value = "";
            document.getElementById('modalProjectName').value = "";
            document.getElementById('modalWorkType').value = "";
        }

        // 대장 데이터 XLS 내보내기 (Excel XML 포맷 — 서식/병합/색상 포함)
        