function updateLaborDays(laborId, val) {
            const proj = appState.projects[appState.currentProjectId];
            const labor = proj.labors.find(l => l.id === laborId);
            if (labor) {
                const numeric = parseFloat(val);
                if (isNaN(numeric) || numeric < 0) {
                    labor.manualDays = null;
                } else {
                    labor.manualDays = numeric;
                }
                saveToLocalStorage();
                updateHeaderAndTable();
                showToast("출역 일수가 수동 보정되었습니다.");
            }
        }

        // 지급 단가 직접 수정
        function updateLaborPrice(laborId, val) {
            const proj = appState.projects[appState.currentProjectId];
            const labor = proj.labors.find(l => l.id === laborId);
            if (labor) {
                let cleanVal = val.replace(/[^0-9]/g, '');
                const numeric = parseInt(cleanVal);
                if (!isNaN(numeric) && numeric >= 0) {
                    labor.price = numeric;
                    saveToLocalStorage();
                    updateHeaderAndTable();
                    showToast("지급 단가가 수정되었습니다.");
                }
            }
        }

        // 수동 기입 체킹 핸들러
        function toggleAttendance(laborId, day, value) {
            const proj = appState.projects[appState.currentProjectId];
            const labor = proj.labors.find(l => l.id === laborId);
            if (labor) {
                const numericValue = parseFloat(value);
                if (isNaN(numericValue) || numericValue <= 0) {
                    labor.attendance[day] = 0;
                } else {
                    labor.attendance[day] = numericValue;
                }
                labor.manualDays = null; 
                saveToLocalStorage();
                updateRowOnly(labor);        // 해당 행만 갱신
                updateSummaryAndFooter();    // 요약 및 합계행 갱신
            }
        }

        // 특정 근로자 행의 계산 결과 셀만 갱신 (전체 재렌더링 방지)
        function updateRowOnly(labor) {
            const proj = appState.projects[appState.currentProjectId];
            const daysInMonth = new Date(proj.year, proj.month, 0).getDate();
            let autoDays = 0;
            for (let d = 1; d <= daysInMonth; d++) {
                if (labor.attendance[d]) autoDays += Number(labor.attendance[d]);
            }
            const calc = calculateDeductions(labor, autoDays);
            const hasManualDays = (labor.manualDays !== null && labor.manualDays !== undefined);

            // 해당 행의 일수 입력 셀 업데이트
            const daysInput = document.querySelector(`input[onchange*="updateLaborDays('${labor.id}'"]`);
            if (daysInput) daysInput.value = calc.effectiveDays;

            // 해당 행의 계산 결과 셀들을 data-labor-id로 찾아 갱신
            const resultCells = document.querySelectorAll(`[data-result-labor="${labor.id}"]`);
            if (resultCells.length > 0) {
                resultCells.forEach(el => {
                    const field = el.getAttribute('data-result-field');
                    if (field === 'totalWages') el.textContent = commaFormatter(calc.totalWages);
                    else if (field === 'incomeTax') el.textContent = commaFormatter(calc.incomeTax);
                    else if (field === 'localTax') el.textContent = commaFormatter(calc.localTax);
                    else if (field === 'employment') el.textContent = commaFormatter(calc.employment);
                    else if (field === 'health') el.textContent = commaFormatter(calc.health);
                    else if (field === 'care') el.textContent = commaFormatter(calc.care);
                    else if (field === 'pension') el.textContent = commaFormatter(calc.pension);
                    else if (field === 'totalDeduction') el.textContent = commaFormatter(calc.totalDeduction);
                    else if (field === 'netPay') el.textContent = commaFormatter(calc.netPay);
                });
            } else {
                // data-result-labor 속성이 없는 구형 렌더링 폴백 — 전체 재렌더링
                updateHeaderAndTable();
            }
        }

        // 요약 통계 및 합계행만 갱신
        function updateSummaryAndFooter() {
            const proj = appState.projects[appState.currentProjectId];
            if (!proj) return;
            const daysInMonth = new Date(proj.year, proj.month, 0).getDate();
            const searchKeyword = document.getElementById('searchFilter').value.trim().toLowerCase();
            const insuranceFilterVal = document.getElementById('insuranceFilter').value;

            let targetLabors = proj.labors.filter(l => {
                const nameMatch = l.name.toLowerCase().includes(searchKeyword);
                const jobMatch = (l.job || '').toLowerCase().includes(searchKeyword);
                const ssnMatch = l.ssn.includes(searchKeyword);
                return nameMatch || jobMatch || ssnMatch;
            });
            if (insuranceFilterVal !== "all") {
                targetLabors = targetLabors.filter(l => {
                    const { isPensionExempt, isEmploymentExempt } = getExactInsuranceAge(l.ssn, proj.year, proj.month);
                    let autoDays = 0;
                    for (let d = 1; d <= daysInMonth; d++) {
                        if (d <= daysInMonth && l.attendance[d]) autoDays += Number(l.attendance[d]);
                    }
                    const finalDays = (l.manualDays !== null && l.manualDays !== undefined) ? l.manualDays : autoDays;
                    if (insuranceFilterVal === "pensionExempt") return isPensionExempt;
                    if (insuranceFilterVal === "employmentExempt") return isEmploymentExempt;
                    if (insuranceFilterVal === "insuranceTarget") return finalDays >= 8;
                    return true;
                });
            }

            const computedRowsData = targetLabors.map(labor => {
                let autoDays = 0;
                for (let d = 1; d <= daysInMonth; d++) {
                    if (labor.attendance[d]) autoDays += Number(labor.attendance[d]);
                }
                const calc = calculateDeductions(labor, autoDays);
                return { labor, autoDays, calc };
            });

            renderTotalRow(computedRowsData, daysInMonth);
            calculateAndDisplaySummary(computedRowsData);
        }

        // 스프레드시트 방식의 방향키 및 엔터 네비게이션 제어
        function setupKeyboardNavigation() {
            document.addEventListener('keydown', function(e) {
                const target = e.target;
                if (!target.classList.contains('attendance-cell-input')) return;

                const laborId = target.getAttribute('data-labor-id');
                const dayIdx = parseInt(target.getAttribute('data-day-index'));
                const proj = appState.projects[appState.currentProjectId];
                if (!proj) return;
                const daysInMonth = new Date(proj.year, proj.month, 0).getDate();

                const visibleInputs = Array.from(document.querySelectorAll('.attendance-cell-input'));
                const currentIndex = visibleInputs.indexOf(target);
                if (currentIndex === -1) return;

                let targetInput = null;

                if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    let nextDay = dayIdx + 1;
                    if (nextDay > daysInMonth) {
                        const nextRowFirstInput = visibleInputs.find(input => {
                            return input.getAttribute('data-day-index') === "1" && 
                                   visibleInputs.indexOf(input) > currentIndex;
                        });
                        if (nextRowFirstInput) targetInput = nextRowFirstInput;
                    } else {
                        targetInput = visibleInputs.find(input => {
                            return input.getAttribute('data-labor-id') === laborId && 
                                   parseInt(input.getAttribute('data-day-index')) === nextDay;
                        });
                    }
                } else if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    let prevDay = dayIdx - 1;
                    if (prevDay < 1) {
                        // reverse() 는 원본 배열을 변경하므로 복사본에서 탐색
                        const reversedInputs = [...visibleInputs].reverse();
                        const revCurrentIndex = reversedInputs.indexOf(target);
                        targetInput = reversedInputs.find((input, idx) => {
                            return parseInt(input.getAttribute('data-day-index')) === daysInMonth &&
                                   idx > revCurrentIndex;
                        });
                    } else {
                        targetInput = visibleInputs.find(input => {
                            return input.getAttribute('data-labor-id') === laborId && 
                                   parseInt(input.getAttribute('data-day-index')) === prevDay;
                        });
                    }
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    targetInput = visibleInputs.find(input => {
                        return input.getAttribute('data-day-index') === String(dayIdx) && 
                               visibleInputs.indexOf(input) > currentIndex;
                    });
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    const tempArr = [...visibleInputs].reverse();
                    const revCurrentIndex = tempArr.indexOf(target);
                    targetInput = tempArr.find(input => {
                        return input.getAttribute('data-day-index') === String(dayIdx) && 
                               tempArr.indexOf(input) > revCurrentIndex;
                    });
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    let nextDay = dayIdx + 1;
                    if (nextDay > daysInMonth) {
                        const nextRowFirstInput = visibleInputs.find(input => {
                            return input.getAttribute('data-day-index') === "1" && 
                                   visibleInputs.indexOf(input) > currentIndex;
                        });
                        if (nextRowFirstInput) targetInput = nextRowFirstInput;
                    } else {
                        targetInput = visibleInputs.find(input => {
                            return input.getAttribute('data-labor-id') === laborId && 
                                   parseInt(input.getAttribute('data-day-index')) === nextDay;
                        });
                    }
                } else {
                    return; 
                }

                if (targetInput) {
                    targetInput.focus();
                    targetInput.select();
                }
            });
        }

        // ─── 드래그 범위 출역 기입 모드 ───────────────────────────────
        let dragRangeActive = false;      // 모드 ON/OFF
        let isDragging = false;           // 현재 드래그 중 여부
        let dragCells = new Set();        // 드래그로 덮인 셀 집합

        function toggleDragRangeMode() {
            dragRangeActive = !dragRangeActive;
            const btn = document.getElementById('dragRangeBtn');
            if (dragRangeActive) {
                btn.classList.add('bg-orange-100', 'border-orange-400', 'text-orange-700');
                document.getElementById('dragRangePanel').classList.remove('hidden');
                updateDragLabels();
            } else {
                btn.classList.remove('bg-orange-100', 'border-orange-400', 'text-orange-700');
                document.getElementById('dragRangePanel').classList.add('hidden');
            }
        }

        function closeDragRangeModal() {
            dragRangeActive = false;
            isDragging = false;
            dragCells.clear();
            document.getElementById('dragRangeBtn').classList.remove('bg-orange-100','border-orange-400','text-orange-700');
            document.getElementById('dragRangePanel').classList.add('hidden');
            document.getElementById('dragRangeStatus').classList.add('hidden');
            clearDragHighlight();
        }

        function getDragValue() {
            return parseFloat((document.querySelector('input[name="dragValue"]:checked') || {}).value ?? 1);
        }

        // 라디오 선택에 따라 레이블 색상 갱신
        function updateDragLabels() {
            const val = getDragValue();
            const map = { '1': 'dragLbl1', '0.5': 'dragLbl05', '0': 'dragLbl0' };
            Object.entries(map).forEach(([v, id]) => {
                const el = document.getElementById(id);
                if (!el) return;
                if (parseFloat(v) === val) {
                    el.classList.add('bg-orange-100', 'border-orange-400', 'text-orange-700');
                } else {
                    el.classList.remove('bg-orange-100', 'border-orange-400', 'text-orange-700');
                }
            });
        }

        function clearDragHighlight() {
            document.querySelectorAll('.drag-highlight').forEach(el => el.classList.remove('drag-highlight'));
        }

        // 드래그 이벤트를 attendance 셀에 위임
        function setupDragRangeListeners() {
            const tbody = document.getElementById('laborList');

            tbody.addEventListener('mousedown', function(e) {
                if (!dragRangeActive) return;
                const input = e.target.closest('.attendance-cell-input');
                if (!input) return;
                e.preventDefault();
                isDragging = true;
                dragCells.clear();
                clearDragHighlight();
                dragCells.add(input);
                input.classList.add('drag-highlight');
                document.getElementById('dragRangeStatus').classList.remove('hidden');
                document.getElementById('dragRangeCount').textContent = dragCells.size;
            });

            tbody.addEventListener('mouseover', function(e) {
                if (!dragRangeActive || !isDragging) return;
                const input = e.target.closest('.attendance-cell-input');
                if (!input || dragCells.has(input)) return;
                dragCells.add(input);
                input.classList.add('drag-highlight');
                document.getElementById('dragRangeCount').textContent = dragCells.size;
            });

            document.addEventListener('mouseup', function(e) {
                if (!dragRangeActive || !isDragging) return;
                isDragging = false;
                if (dragCells.size === 0) return;

                const val = getDragValue();
                const proj = appState.projects[appState.currentProjectId];
                if (!proj) return;

                const count = dragCells.size; // size는 clear() 전에 저장
                dragCells.forEach(input => {
                    const laborId = input.getAttribute('data-labor-id');
                    const day = parseInt(input.getAttribute('data-day-index'));
                    const labor = proj.labors.find(l => l.id === laborId);
                    if (labor) {
                        labor.attendance[day] = val;
                        labor.manualDays = null;
                    }
                });

                saveToLocalStorage();
                updateHeaderAndTable();
                clearDragHighlight();
                dragCells.clear();
                document.getElementById('dragRangeStatus').classList.add('hidden');
                showToast(`${count}칸에 출역값 ${val} 기입 완료`);
            });
        }
        // ─────────────────────────────────────────────────────────────
        