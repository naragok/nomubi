function addLabor(e) {
            e.preventDefault();
            const proj = appState.projects[appState.currentProjectId];
            if (!proj) return;

            const name = document.getElementById('newName').value.trim();
            const ssn = document.getElementById('newSsn').value.trim();
            const job = document.getElementById('newJob').value.trim() || '보통인부';
            
            const priceRaw = document.getElementById('newPrice').value;
            const price = parseInt(priceRaw.replace(/[^0-9]/g, ''));

            const phone = document.getElementById('newPhone').value.trim();
            const bank = document.getElementById('newBank').value.trim();
            const account = document.getElementById('newAccount').value.trim();
            const address = document.getElementById('newAddress').value.trim();

            if (!name || ssn.replace(/[^0-9]/g, '').length !== 13 || isNaN(price)) {
                showCustomAlert("근로자 정보가 정확하지 않습니다. 성명 확인 및 13자리 주민번호를 정상 완성해 주세요.");
                return;
            }

            const newLabor = {
                id: "l_" + (crypto.randomUUID ? crypto.randomUUID() : Date.now() + '_' + Math.random().toString(36).substr(2, 9)),
                name,
                job,
                ssn,
                phone,
                bank,
                account,
                safetyEdu: false,
                address,
                price,
                visa: "대한민국",
                manualDays: null,
                attendance: {}
            };

            for (let d = 1; d <= 31; d++) {
                newLabor.attendance[d] = 0;
            }

            proj.labors.push(newLabor);
            saveToLocalStorage();
            updateHeaderAndTable();

            document.getElementById('newName').value = "";
            document.getElementById('newSsn').value = "";
            document.getElementById('newJob').value = "";
            document.getElementById('newPrice').value = "";
            document.getElementById('newPhone').value = "";
            document.getElementById('newBank').value = "";
            document.getElementById('newAccount').value = "";
            document.getElementById('newAddress').value = "";

            showToast(`${name} 신규 근로자가 대장에 추가되었습니다.`);
        }

        // 근로자 배제/삭제
        function deleteLabor(laborId) {
            const proj = appState.projects[appState.currentProjectId];
            if (!proj) return;

            showCustomConfirm("선택하신 근로자를 이번 달 대장에서 완전히 삭제하시겠습니까?", () => {
                proj.labors = proj.labors.filter(l => l.id !== laborId);
                saveToLocalStorage();
                updateHeaderAndTable();
                showToast("근로자가 대장에서 배제되었습니다.");
            });
        }

        // 일괄 전원 출근 기입기
        function bulkSetAttendance(val, excludeWeekends) {
            const proj = appState.projects[appState.currentProjectId];
            if (!proj || !proj.labors || proj.labors.length === 0) {
                showCustomAlert("일괄 처리할 근로자 데이터가 없습니다.");
                return;
            }

            const daysInMonth = new Date(proj.year, proj.month, 0).getDate();
            let msg = "";
            if (val === 1) {
                msg = excludeWeekends 
                    ? "현재 표시된 모든 근로자의 출역 기록을 [토/일요일 주말을 제외]하고 평일만 1.0(만출)으로 변경하시겠습니까?" 
                    : "현재 표시된 모든 근로자의 출역 기록을 전체 1.0(만출)으로 변경하시겠습니까?";
            } else {
                msg = "모든 근로자의 출역 기록을 0으로 비우시겠습니까?";
            }

            showCustomConfirm(msg, () => {
                const searchKeyword = document.getElementById('searchFilter').value.trim().toLowerCase();
                const insuranceFilterVal = document.getElementById('insuranceFilter').value;

                proj.labors.forEach(l => {
                    // 필터에 해당하는 근로자만 선별적으로 변경 적용
                    const nameMatch = l.name.toLowerCase().includes(searchKeyword);
                    const jobMatch = (l.job || '').toLowerCase().includes(searchKeyword);
                    if (nameMatch || jobMatch) {
                        l.manualDays = null;
                        for (let d = 1; d <= 31; d++) {
                            if (d <= daysInMonth) {
                                if (val === 1 && excludeWeekends) {
                                    const date = new Date(proj.year, proj.month - 1, d);
                                    const dayOfWeek = date.getDay();
                                    if (dayOfWeek === 0 || dayOfWeek === 6) {
                                        l.attendance[d] = 0; 
                                    } else {
                                        l.attendance[d] = 1;
                                    }
                                } else {
                                    l.attendance[d] = val;
                                }
                            } else {
                                l.attendance[d] = 0;
                            }
                        }
                    }
                });
                saveToLocalStorage();
                updateHeaderAndTable();
                showToast("출역 정보가 조건에 맞게 일괄 기입되었습니다.");
            });
        }

        // [신규 실무 도구] 4대보험 가입 회피용 평일 무작위 7일 채워넣기 기능
        function bulkAvoidInsurance() {
            const proj = appState.projects[appState.currentProjectId];
            if (!proj || !proj.labors || proj.labors.length === 0) {
                showCustomAlert("처리할 근로자 데이터가 없습니다.");
                return;
            }

            const daysInMonth = new Date(proj.year, proj.month, 0).getDate();
            showCustomConfirm("현재 테이블에 표시되어 있는 근로자들의 이번 달 근무일수를 국민연금/건강보험 가입 대상 아래(평일 무작위 7일 만출)로 신속 조율하시겠습니까?", () => {
                const searchKeyword = document.getElementById('searchFilter').value.trim().toLowerCase();

                proj.labors.forEach(l => {
                    const nameMatch = l.name.toLowerCase().includes(searchKeyword);
                    if (nameMatch) {
                        l.manualDays = null;
                        // 기존 출역 초기화
                        for (let d = 1; d <= 31; d++) l.attendance[d] = 0;

                        // 평일 일자 수집
                        let weekDays = [];
                        for (let d = 1; d <= daysInMonth; d++) {
                            const date = new Date(proj.year, proj.month - 1, d);
                            const dayOfWeek = date.getDay();
                            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                                weekDays.push(d);
                            }
                        }

                        // 무작위로 7일 골라 출근 세팅
                        let shuffled = weekDays.sort(() => 0.5 - Math.random());
                        let selectedDays = shuffled.slice(0, 7);

                        selectedDays.forEach(d => {
                            l.attendance[d] = 1;
                        });
                    }
                });

                saveToLocalStorage();
                updateHeaderAndTable();
                showToast("대상 근로자의 평일 출역이 7일 이하로 최적 세팅 완료되었습니다.");
            });
        }

        // [신규 실무 도구] 기입된 토/일 주말 출역만 일괄 클린 제거
        function clearWeekendsAttendance() {
            const proj = appState.projects[appState.currentProjectId];
            if (!proj || !proj.labors || proj.labors.length === 0) {
                showCustomAlert("처리할 대장 정보가 없습니다.");
                return;
            }

            const daysInMonth = new Date(proj.year, proj.month, 0).getDate();
            showCustomConfirm("기입 완료되어 있는 전체 근로자의 출역 내역 중에서 토요일 및 일요일(주말) 출역 데이터만 일괄 제거하시겠습니까?", () => {
                proj.labors.forEach(l => {
                    l.manualDays = null;
                    for (let d = 1; d <= daysInMonth; d++) {
                        const date = new Date(proj.year, proj.month - 1, d);
                        const dayOfWeek = date.getDay();
                        if (dayOfWeek === 0 || dayOfWeek === 6) {
                            l.attendance[d] = 0; // 주말 출근 초기화
                        }
                    }
                });
                saveToLocalStorage();
                updateHeaderAndTable();
                showToast("대장 내 주말 출역 데이터가 일괄 삭제되었습니다.");
            });
        }

        // 특정 일자 일괄 등록/수정 모달 관리 (근로자 다중 선택 + 날짜 다중 선택)
        function openSpecificDateModal() {
            const proj = appState.projects[appState.currentProjectId];
            if (!proj) return;

            // ── 근로자 목록 렌더 ──
            _renderLaborList(proj.labors, '');

            // ── 날짜 그리드 렌더 ──
            const daysInMonth = new Date(proj.year, proj.month, 0).getDate();
            const grid = document.getElementById('dayCheckboxGrid');
            grid.innerHTML = '';

            const dayNames = ['일','월','화','수','목','금','토'];
            const firstDow = new Date(proj.year, proj.month - 1, 1).getDay();

            dayNames.forEach((n, i) => {
                const h = document.createElement('div');
                h.className = 'text-center py-0.5 rounded text-[10px] font-bold ' +
                    (i === 0 ? 'text-rose-500' : i === 6 ? 'text-blue-500' : 'text-slate-400');
                h.textContent = n;
                grid.appendChild(h);
            });

            for (let i = 0; i < firstDow; i++) grid.appendChild(document.createElement('div'));

            for (let d = 1; d <= daysInMonth; d++) {
                const dow = new Date(proj.year, proj.month - 1, d).getDay();
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.dataset.day = d;
                btn.className = _dayBtnClass(false, dow === 0 || dow === 6, dow);
                btn.textContent = d;
                btn.addEventListener('click', () => {
                    const active = btn.dataset.selected === 'true';
                    btn.dataset.selected = active ? 'false' : 'true';
                    btn.className = _dayBtnClass(!active, dow === 0 || dow === 6, dow);
                    _updateSelectedCount();
                });
                grid.appendChild(btn);
            }

            _updateSelectedCount();
            document.getElementById('laborSearchInModal').value = '';
            document.getElementById('specificDateModal').classList.remove('hidden');
            lucide.createIcons();
        }

        // 근로자 체크박스 목록 렌더링
        function _renderLaborList(labors, keyword) {
            const list = document.getElementById('laborCheckboxList');
            list.innerHTML = '';
            const kw = keyword.trim().toLowerCase();
            const filtered = kw
                ? labors.filter(l => l.name.toLowerCase().includes(kw) || (l.job || '').toLowerCase().includes(kw))
                : labors;

            if (filtered.length === 0) {
                list.innerHTML = '<div class="p-3 text-slate-400 text-center text-xs">검색 결과 없음</div>';
                _updateSelectedLaborCount();
                return;
            }

            filtered.forEach(l => {
                const row = document.createElement('label');
                row.className = 'flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-purple-50 transition-colors';
                row.innerHTML = `
                    <input type="checkbox" data-labor-id="${l.id}" class="labor-check accent-purple-600 w-3.5 h-3.5 shrink-0" checked
                        onchange="_updateSelectedLaborCount()">
                    <span class="font-bold text-slate-700 truncate">${l.name}</span>
                    <span class="text-slate-400 shrink-0">${l.job || '보통인부'}</span>
                `;
                list.appendChild(row);
            });
            _updateSelectedLaborCount();
        }

        function filterLaborListInModal() {
            const proj = appState.projects[appState.currentProjectId];
            if (!proj) return;
            const kw = document.getElementById('laborSearchInModal').value;
            _renderLaborList(proj.labors, kw);
        }

        function _updateSelectedLaborCount() {
            const total   = document.querySelectorAll('#laborCheckboxList .labor-check').length;
            const checked = document.querySelectorAll('#laborCheckboxList .labor-check:checked').length;
            const el = document.getElementById('selectedLaborCount');
            el.textContent = total > 0 ? `(${checked}/${total}명 선택)` : '';
        }

        function selectAllLabors() {
            document.querySelectorAll('#laborCheckboxList .labor-check').forEach(cb => { cb.checked = true; });
            _updateSelectedLaborCount();
        }

        function deselectAllLabors() {
            document.querySelectorAll('#laborCheckboxList .labor-check').forEach(cb => { cb.checked = false; });
            _updateSelectedLaborCount();
        }

        function _dayBtnClass(selected, isWeekend, dow) {
            const base = 'rounded py-1 text-center text-[11px] font-bold transition-all border ';
            if (selected) return base + 'bg-purple-600 text-white border-purple-600';
            if (dow === 0) return base + 'text-rose-500 border-rose-100 hover:bg-rose-50';
            if (dow === 6) return base + 'text-blue-500 border-blue-100 hover:bg-blue-50';
            return base + 'text-slate-600 border-slate-200 hover:bg-slate-100';
        }

        function _updateSelectedCount() {
            const count = document.querySelectorAll('#dayCheckboxGrid button[data-selected="true"]').length;
            const el = document.getElementById('selectedDayCount');
            el.textContent = count > 0 ? `(${count}일 선택됨)` : '';
        }

        function selectAllDays() {
            const proj = appState.projects[appState.currentProjectId];
            document.querySelectorAll('#dayCheckboxGrid button[data-day]').forEach(btn => {
                const dow = new Date(proj.year, proj.month - 1, parseInt(btn.dataset.day)).getDay();
                btn.dataset.selected = 'true';
                btn.className = _dayBtnClass(true, dow === 0 || dow === 6, dow);
            });
            _updateSelectedCount();
        }

        function deselectAllDays() {
            const proj = appState.projects[appState.currentProjectId];
            document.querySelectorAll('#dayCheckboxGrid button[data-day]').forEach(btn => {
                const dow = new Date(proj.year, proj.month - 1, parseInt(btn.dataset.day)).getDay();
                btn.dataset.selected = 'false';
                btn.className = _dayBtnClass(false, dow === 0 || dow === 6, dow);
            });
            _updateSelectedCount();
        }

        function selectWeekdays() {
            const proj = appState.projects[appState.currentProjectId];
            document.querySelectorAll('#dayCheckboxGrid button[data-day]').forEach(btn => {
                const dow = new Date(proj.year, proj.month - 1, parseInt(btn.dataset.day)).getDay();
                const isWeekday = dow !== 0 && dow !== 6;
                btn.dataset.selected = isWeekday ? 'true' : 'false';
                btn.className = _dayBtnClass(isWeekday, !isWeekday, dow);
            });
            _updateSelectedCount();
        }

        function selectWeekends() {
            const proj = appState.projects[appState.currentProjectId];
            document.querySelectorAll('#dayCheckboxGrid button[data-day]').forEach(btn => {
                const dow = new Date(proj.year, proj.month - 1, parseInt(btn.dataset.day)).getDay();
                const isWeekend = dow === 0 || dow === 6;
                btn.dataset.selected = isWeekend ? 'true' : 'false';
                btn.className = _dayBtnClass(isWeekend, isWeekend, dow);
            });
            _updateSelectedCount();
        }

        function closeSpecificDateModal() {
            document.getElementById('specificDateModal').classList.add('hidden');
        }

        // 선택한 근로자 × 복수 일자 일괄 처리 엔진
        function saveSpecificDateAttendance() {
            const proj = appState.projects[appState.currentProjectId];
            if (!proj) return;

            // 선택된 근로자 ID 수집
            const selectedLaborIds = new Set(
                [...document.querySelectorAll('#laborCheckboxList .labor-check:checked')]
                    .map(cb => cb.dataset.laborId)
            );

            if (selectedLaborIds.size === 0) {
                showCustomAlert("적용할 근로자를 한 명 이상 선택해 주세요.");
                return;
            }

            // 선택된 날짜 수집
            const selectedDays = [...document.querySelectorAll('#dayCheckboxGrid button[data-selected="true"]')]
                .map(btn => parseInt(btn.dataset.day));

            if (selectedDays.length === 0) {
                showCustomAlert("적용할 날짜를 하나 이상 선택해 주세요.");
                return;
            }

            const value = parseFloat(document.getElementById('modalTargetValue').value);

            const targetLabors = proj.labors.filter(l => selectedLaborIds.has(l.id));

            targetLabors.forEach(l => {
                selectedDays.forEach(day => { l.attendance[day] = value; });
                l.manualDays = null;
            });

            saveToLocalStorage();
            updateHeaderAndTable();
            closeSpecificDateModal();

            const dayStr = selectedDays.length <= 10
                ? selectedDays.join(', ') + '일'
                : `${selectedDays[0]}~${selectedDays[selectedDays.length - 1]}일 등 ${selectedDays.length}개`;
            showToast(`${targetLabors.length}명 × ${dayStr} 출역 데이터가 일괄 변경되었습니다.`);
        }

        // 지급 단가 일괄 변경 도구
        function bulkSetPrice() {
            const proj = appState.projects[appState.currentProjectId];
            if (!proj || !proj.labors || proj.labors.length === 0) {
                showCustomAlert("단가를 변동할 대상 근로자가 없습니다.");
                return;
            }

            // 인라인 입력창을 포함한 커스텀 확인 모달 사용
            const modal = document.getElementById('customAlertModal');
            const msgEl = document.getElementById('alertMessage');
            const confirmBtn = document.getElementById('alertConfirmBtn');
            const cancelBtn = document.getElementById('alertCancelBtn');

            msgEl.innerHTML = `일괄 적용할 새로운 단가를 입력해 주세요.<br>
                <input type="text" id="bulkPriceInput" value="180,000"
                    class="mt-2 w-full border border-slate-300 rounded p-2 font-mono text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                    placeholder="예: 180000">`;
            cancelBtn.classList.remove('hidden');
            modal.classList.remove('hidden');

            // 입력 필드에 콤마 포맷터 적용
            setTimeout(() => {
                const inp = document.getElementById('bulkPriceInput');
                if (inp) {
                    inp.addEventListener('input', function(e) {
                        let clean = e.target.value.replace(/[^0-9]/g, '');
                        e.target.value = clean ? parseInt(clean).toLocaleString() : '';
                    });
                    inp.focus();
                    inp.select();
                }
            }, 50);

            const handleConfirm = () => {
                cleanup();
                const inp = document.getElementById('bulkPriceInput');
                const cleanPrice = parseInt((inp ? inp.value : '').replace(/[^0-9]/g, ''));
                if (isNaN(cleanPrice) || cleanPrice < 0) {
                    showCustomAlert("올바른 수치를 기재해 주십시오.");
                    return;
                }
                showCustomConfirm(`현재 검색/표시된 모든 대상의 단가를 일당 [${cleanPrice.toLocaleString()}원]으로 강제 변동시키겠습니까?`, () => {
                    const searchKeyword = document.getElementById('searchFilter').value.trim().toLowerCase();
                    proj.labors.forEach(l => {
                        const nameMatch = l.name.toLowerCase().includes(searchKeyword);
                        const jobMatch = (l.job || '').toLowerCase().includes(searchKeyword);
                        if (nameMatch || jobMatch) {
                            l.price = cleanPrice;
                        }
                    });
                    saveToLocalStorage();
                    updateHeaderAndTable();
                    showToast("대상자 단가가 일괄 적용 완료되었습니다.");
                });
            };
            const handleCancel = () => { cleanup(); };
            const cleanup = () => {
                confirmBtn.removeEventListener('click', handleConfirm);
                cancelBtn.removeEventListener('click', handleCancel);
                modal.classList.add('hidden');
            };
            confirmBtn.addEventListener('click', handleConfirm);
            cancelBtn.addEventListener('click', handleCancel);
        }

        // 근로자 복수 일괄 등록 모달 열기/닫기
        function openBulkUserModal() {
            document.getElementById('bulkUserModal').classList.remove('hidden');
            updateBulkPlaceholder();
        }

        function closeBulkUserModal() {
            document.getElementById('bulkUserModal').classList.add('hidden');
        }

        // 입력 모드별 컬럼 헤더 및 placeholder 갱신
        const BULK_MODES = {
            name_only:          { cols: ['이름'],                                                        ph: '홍길동\n이순신\n장보고' },
            name_ssn:           { cols: ['이름','주민번호'],                                              ph: '홍길동\t820512-1000000\n이순신\t750403-1000000' },
            name_ssn_phone:     { cols: ['이름','주민번호','연락처'],                                     ph: '홍길동\t820512-1000000\t010-1234-5678\n이순신\t750403-1000000\t010-5555-6666' },
            name_ssn_phone_addr:{ cols: ['이름','주민번호','연락처','주소'],                              ph: '홍길동\t820512-1000000\t010-1234-5678\t원주시 무실동 123\n이순신\t750403-1000000\t\t서울 종로구 1' },
            full:               { cols: ['이름','주민번호','연락처','주소','계좌번호'],                    ph: '홍길동\t820512-1000000\t010-1234-5678\t원주시 무실동 123\t110-384-592812\n이순신\t750403-1000000\t010-5555-6666\t\t352-1234-5678' },
        };

        function getBulkMode() {
            return (document.querySelector('input[name="bulkMode"]:checked') || {}).value || 'name_only';
        }

        function updateBulkPlaceholder() {
            const mode = getBulkMode();
            const cfg = BULK_MODES[mode];
            const ta = document.getElementById('bulkNames');
            ta.placeholder = cfg.ph;
            document.getElementById('bulkColumnHeader').textContent = '열 순서: ' + cfg.cols.map((c,i) => `[${i+1}] ${c}`).join('  →  ') + '  (열 구분: Tab 또는 콤마)';
            renderBulkPreview();
        }

        // 텍스트를 파싱하여 미리보기 테이블 갱신
        function parseBulkLines() {
            const mode = getBulkMode();
            const raw = document.getElementById('bulkNames').value;
            const lines = raw.split('\n').map(l => l.trim()).filter(l => l !== '');
            return lines.map(line => {
                // Tab 우선, 없으면 콤마로 분리
                const sep = line.includes('\t') ? '\t' : ',';
                const parts = line.split(sep).map(p => p.trim());
                const r = { name: parts[0] || '', ssn: '', phone: '', address: '', account: '' };
                if (mode === 'name_ssn' || mode === 'name_ssn_phone' || mode === 'name_ssn_phone_addr' || mode === 'full') r.ssn = parts[1] || '';
                if (mode === 'name_ssn_phone' || mode === 'name_ssn_phone_addr' || mode === 'full') r.phone = parts[2] || '';
                if (mode === 'name_ssn_phone_addr' || mode === 'full') r.address = parts[3] || '';
                if (mode === 'full') r.account = parts[4] || '';
                return r;
            }).filter(r => r.name);
        }

        function renderBulkPreview() {
            const rows = parseBulkLines();
            const area = document.getElementById('bulkPreviewArea');
            if (rows.length === 0) { area.classList.add('hidden'); return; }
            area.classList.remove('hidden');
            document.getElementById('bulkPreviewCount').textContent = `${rows.length}명`;

            const mode = getBulkMode();
            const cols = BULK_MODES[mode].cols;
            const head = document.getElementById('bulkPreviewHead');
            head.innerHTML = cols.map(c => `<th class="p-1.5 border-r border-slate-300 px-2 font-bold">${c}</th>`).join('');

            const body = document.getElementById('bulkPreviewBody');
            body.innerHTML = rows.map((r, i) => {
                const cells = [r.name];
                if (cols.includes('주민번호')) cells.push(r.ssn || '<span class="text-amber-500">임시생성</span>');
                if (cols.includes('연락처'))  cells.push(r.phone || '-');
                if (cols.includes('주소'))    cells.push(r.address || '-');
                if (cols.includes('계좌번호')) cells.push(r.account || '-');
                return `<tr class="${i%2?'bg-slate-50':'bg-white'}">` + cells.map(c=>`<td class="p-1.5 border-r border-slate-200 px-2">${c}</td>`).join('') + '</tr>';
            }).join('');
        }

        // 근로자 복수 기입 및 일괄 저장 처리
        function saveBulkUsers() {
            const proj = appState.projects[appState.currentProjectId];
            if (!proj) return;

            const job   = document.getElementById('bulkJob').value.trim() || '보통인부';
            const price = parseInt(document.getElementById('bulkPrice').value.replace(/[^0-9]/g, ''));
            const bank  = document.getElementById('bulkBank').value.trim();

            if (isNaN(price) || price < 0) {
                showCustomAlert("올바른 단가 수치를 기입해 주세요.");
                return;
            }

            const rows = parseBulkLines();
            if (rows.length === 0) {
                showCustomAlert("등록할 이름을 한 명 이상 기재해 주세요.");
                return;
            }

            let added = 0, skipped = 0;
            rows.forEach((r, i) => {
                const name = r.name;
                // 주민번호: 입력값 정제 후 길이 확인, 미입력이면 임시 생성
                let ssn = r.ssn.replace(/[^0-9\-]/g, '');
                const ssnDigits = ssn.replace(/[^0-9]/g, '');
                if (ssnDigits.length !== 13) {
                    const f = String(Math.floor(Math.random()*20)+75).padStart(2,'0')
                            + String(Math.floor(Math.random()*12)+1).padStart(2,'0')
                            + String(Math.floor(Math.random()*28)+1).padStart(2,'0');
                    ssn = f + '-' + (Math.floor(Math.random()*2)+1) + '000000';
                } else if (!ssn.includes('-')) {
                    ssn = ssn.slice(0,6) + '-' + ssn.slice(6);
                }

                // 중복 체크 (이름 + 주민번호)
                const isDuplicate = proj.labors.some(l => l.name === name && l.ssn === ssn);
                if (isDuplicate) { skipped++; return; }

                const newLabor = {
                    id: 'l_bulk_' + (crypto.randomUUID ? crypto.randomUUID() : Date.now() + '_' + i + '_' + Math.random().toString(36).substr(2, 9)),
                    name, job, ssn,
                    phone:   phoneHyphenFilter(r.phone.replace(/[^0-9]/g,'')),
                    bank:    bank || '',
                    account: r.account || '',
                    safetyEdu: false,
                    address: r.address || '',
                    price,
                    visa: '대한민국',
                    manualDays: null,
                    attendance: {}
                };
                for (let d = 1; d <= 31; d++) newLabor.attendance[d] = 0;
                proj.labors.push(newLabor);
                added++;
            });

            saveToLocalStorage();
            updateHeaderAndTable();
            closeBulkUserModal();
            document.getElementById('bulkNames').value = '';

            const hasDummy = rows.some(r => r.ssn.replace(/[^0-9]/g,'').length !== 13);
            let msg = `${added}명 등록 완료`;
            if (skipped > 0) msg += ` (${skipped}명 중복 제외)`;
            if (hasDummy) msg += ' — ⚠️ 주민번호 미입력 항목은 임시 번호가 생성되었습니다. 이름 클릭 후 수정해 주세요.';
            showToast(msg);
        }

        // 2026 사회보험료 및 원천공제 세액 계산기 (나이 및 일별 소액부징수 기준 고도화 적용)
        