function openEditProjectModal() {
            const proj = appState.projects[appState.currentProjectId];
            if (!proj) {
                showCustomAlert("수정할 현장 대장이 선택되어 있지 않습니다.");
                return;
            }
            document.getElementById('editModalCompany').value = proj.company || "";
            document.getElementById('editModalRepresentative').value = proj.representative || "";
            document.getElementById('editModalYear').value = proj.year || new Date().getFullYear();
            document.getElementById('editModalMonth').value = proj.month || 1;
            document.getElementById('editModalProjectName').value = proj.projectName || "";
            document.getElementById('editModalWorkType').value = proj.workType || "";
            document.getElementById('editProjectModal').classList.remove('hidden');
        }

        function closeEditProjectModal() {
            document.getElementById('editProjectModal').classList.add('hidden');
        }

        function saveEditedProject() {
            const proj = appState.projects[appState.currentProjectId];
            if (!proj) return;

            const company = document.getElementById('editModalCompany').value.trim();
            const representative = document.getElementById('editModalRepresentative').value.trim();
            const year = parseInt(document.getElementById('editModalYear').value);
            const month = parseInt(document.getElementById('editModalMonth').value);
            const projectName = document.getElementById('editModalProjectName').value.trim();
            const workType = document.getElementById('editModalWorkType').value.trim();

            if (!company || isNaN(year) || isNaN(month) || !projectName || !workType) {
                showCustomAlert("비어 있는 입력 항목이 있는지 상세 확인 후 기록하여 주십시오.");
                return;
            }

            proj.company = company;
            proj.representative = representative || proj.representative;
            proj.year = year;
            proj.month = month;
            proj.projectName = projectName;
            proj.workType = workType;

            saveToLocalStorage();
            populateDropdowns();
            onProjectChange();
            closeEditProjectModal();
            showToast("현장 대장 정보가 수정되었습니다.");
        }

        // 4. 필수서류 명단 양식 출력 (명단.pdf 양식 정확히 재현 + 사진 첨부)
        