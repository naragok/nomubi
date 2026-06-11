function openCarryOverModal() {
            const currentProj = appState.projects[appState.currentProjectId];
            if (!currentProj || !currentProj.labors || currentProj.labors.length === 0) {
                showCustomAlert("이월할 근로자가 없습니다.");
                return;
            }

            const sel = document.getElementById('carryOverTargetProject');
            sel.innerHTML = '';

            // 현재 대장 제외한 다른 대장 목록
            let hasOther = false;
            Object.entries(appState.projects).forEach(([id, p]) => {
                if (id === appState.currentProjectId) return;
                const opt = document.createElement('option');
                opt.value = id;
                opt.textContent = `${p.company} · ${p.year}년 ${p.month}월 · ${p.projectName.substring(0, 20)}`;
                sel.appendChild(opt);
                hasOther = true;
            });

            if (!hasOther) {
                sel.innerHTML = '<option value="">이월 가능한 다른 대장 없음 — 먼저 신규 등록 필요</option>';
            }

            document.getElementById('carryOverPreview').textContent =
                `현재 대장 근로자 ${currentProj.labors.length}명을 이월합니다.`;

            document.getElementById('carryOverModal').classList.remove('hidden');
            lucide.createIcons();
        }

        function closeCarryOverModal() {
            document.getElementById('carryOverModal').classList.add('hidden');
        }

        function executeCarryOver() {
            const targetId = document.getElementById('carryOverTargetProject').value;
            if (!targetId) {
                showCustomAlert("이월할 대상 대장을 선택해주세요. 먼저 신규 현장을 등록하세요.");
                return;
            }

            const srcProj = appState.projects[appState.currentProjectId];
            const tgtProj = appState.projects[targetId];
            if (!srcProj || !tgtProj) return;

            showCustomConfirm(
                `[${tgtProj.company} ${tgtProj.year}년 ${tgtProj.month}월] 대장으로 근로자 ${srcProj.labors.length}명을 이월하겠습니까? 이미 동일 인원이 있으면 건너뜁니다.`,
                () => {
                    let added = 0, skipped = 0;
                    srcProj.labors.forEach(l => {
                        const dup = tgtProj.labors.some(t => t.name === l.name && t.ssn === l.ssn);
                        if (dup) { skipped++; return; }
                        const newLabor = {
                            ...JSON.parse(JSON.stringify(l)),
                            id: 'l_carry_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                            manualDays: null,
                            attendance: {}
                        };
                        for (let d = 1; d <= 31; d++) newLabor.attendance[d] = 0;
                        tgtProj.labors.push(newLabor);
                        added++;
                    });

                    saveToLocalStorage();
                    closeCarryOverModal();
                    let msg = `✅ 이월 완료: ${added}명 등록`;
                    if (skipped > 0) msg += ` (${skipped}명 중복 제외)`;
                    showToast(msg);
                }
            );
        }

        // ============================================================
        // ============================================================
        