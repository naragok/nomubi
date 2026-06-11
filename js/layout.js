function applyZoom(zoomVal) {
            document.getElementById('zoomVal').innerText = `${zoomVal}%`;
            const zoomStyles = document.getElementById('zoomStyles');
            if (zoomStyles) {
                zoomStyles.innerHTML = `
                    #paymentTable th, 
                    #paymentTable td, 
                    #paymentTable input {
                        font-size: ${(zoomVal / 100) * 11}px !important;
                    }
                `;
            }
        }

        // 테이블 셀 밀도 제어
        function applyDensity(density) {
            currentDensity = density;
            ['narrow', 'normal', 'wide'].forEach(d => {
                const btn = document.getElementById(`btn-${d}`);
                if (btn) {
                    if (d === density) {
                        btn.className = "py-1 rounded text-center border font-bold transition-all bg-blue-50 border-blue-400 text-blue-700";
                    } else {
                        btn.className = "py-1 rounded text-center border font-bold transition-all bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100";
                    }
                }
            });

            const densityStyles = document.getElementById('densityStyles');
            if (densityStyles) {
                let padVal = "6px 4px";
                if (density === 'narrow') padVal = "3px 1px";
                if (density === 'wide') padVal = "11px 8px";
                
                densityStyles.innerHTML = `
                    #paymentTable th, 
                    #paymentTable td {
                        padding: ${padVal} !important;
                    }
                `;
            }
        }

        function getPaddingClass() {
            if (currentDensity === 'narrow') return 'p-0.5';
            if (currentDensity === 'wide') return 'p-2.5';
            return 'p-1.5';
        }

        // 상단 드롭다운 채우기
        function populateDropdowns() {
            const selectCompany = document.getElementById('selectCompany');
            const selectPeriod  = document.getElementById('selectPeriod');

            selectCompany.innerHTML = "";
            selectPeriod.innerHTML  = "";

            if (!appState.projects || Object.keys(appState.projects).length === 0) {
                appState = demoData;
                saveToLocalStorage();
            }

            const uniqueCompanies = [...new Set(Object.values(appState.projects).map(p => p.company))];
            uniqueCompanies.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c;
                opt.innerText = c;
                selectCompany.appendChild(opt);
            });

            // 현재 활성 프로젝트에 맞춰 회사 선택값 먼저 설정
            const activeProj = appState.projects[appState.currentProjectId];
            if (activeProj) {
                selectCompany.value = activeProj.company;
            } else {
                const firstProjId = Object.keys(appState.projects)[0];
                appState.currentProjectId = firstProjId;
                const firstProj = appState.projects[firstProjId];
                if (firstProj) selectCompany.value = firstProj.company;
            }

            // [수정] 기간 드롭다운을 선택된 회사에 해당하는 기간만 표시하도록 필터링
            _rebuildPeriodDropdown(selectCompany.value);

            if (activeProj) {
                selectPeriod.value = `${activeProj.year}년 ${activeProj.month}월`;
            }

            filterProjectsDropdown();
        }

        // [추가] 회사 선택 변경 시 기간 드롭다운을 해당 회사 기간으로 재구성
        function _rebuildPeriodDropdown(selectedCompany) {
            const selectPeriod = document.getElementById('selectPeriod');
            selectPeriod.innerHTML = "";
            const periodsForCompany = [...new Set(
                Object.values(appState.projects)
                    .filter(p => p.company === selectedCompany)
                    .map(p => `${p.year}년 ${p.month}월`)
            )];
            if (periodsForCompany.length === 0) {
                // 선택된 회사에 기간이 없으면 전체 기간 표시 (방어 로직)
                [...new Set(Object.values(appState.projects).map(p => `${p.year}년 ${p.month}월`))].forEach(p => {
                    const opt = document.createElement('option');
                    opt.value = p; opt.innerText = p;
                    selectPeriod.appendChild(opt);
                });
            } else {
                periodsForCompany.forEach(p => {
                    const opt = document.createElement('option');
                    opt.value = p; opt.innerText = p;
                    selectPeriod.appendChild(opt);
                });
            }
        }

        // 회사명 및 귀속월에 맞춰 프로젝트 목록 필터링
        // [수정] 매칭 없을 때 전체 현장을 무조건 표시하던 fallback 제거
        // 회사·기간 조합에 해당하는 프로젝트만 표시하며, 없을 경우 빈 안내 항목을 표시
        function filterProjectsDropdown() {
            const selectCompany = document.getElementById('selectCompany');
            const selectPeriod  = document.getElementById('selectPeriod');
            const selectProject = document.getElementById('selectProject');

            const selectedCompany = selectCompany.value;
            const selectedPeriod  = selectPeriod.value;

            selectProject.innerHTML = "";

            const matchingProjects = Object.entries(appState.projects).filter(([id, p]) => {
                const pPeriod = `${p.year}년 ${p.month}월`;
                return p.company === selectedCompany && pPeriod === selectedPeriod;
            });

            if (matchingProjects.length === 0) {
                // 일치하는 프로젝트 없음 — 전체 노출 대신 안내 항목만 표시
                const opt = document.createElement('option');
                opt.value = "";
                opt.innerText = "해당 조건의 현장이 없습니다";
                opt.disabled = true;
                selectProject.appendChild(opt);
                selectProject.value = "";
                return;
            }

            matchingProjects.forEach(([id, p]) => {
                const opt = document.createElement('option');
                opt.value = id;
                opt.innerText = `[${p.workType}] ${p.projectName}`;
                selectProject.appendChild(opt);
            });

            if (appState.projects[appState.currentProjectId] &&
                matchingProjects.some(([id]) => id === appState.currentProjectId)) {
                selectProject.value = appState.currentProjectId;
            } else if (selectProject.options.length > 0) {
                selectProject.value = selectProject.options[0].value;
                appState.currentProjectId = selectProject.value;
            }
        }

        // 회사 혹은 기간 변경 시 하위 콤보박스 및 데이터 리로드 연동
        // [수정] 회사 변경 시 해당 회사의 기간만 기간 드롭다운에 표시되도록 재구성
        function onCompanyOrPeriodChange(changedField) {
            if (changedField === 'company') {
                const selectedCompany = document.getElementById('selectCompany').value;
                _rebuildPeriodDropdown(selectedCompany);
            }
            filterProjectsDropdown();
            onProjectChange();
        }

        function onProjectChange() {
            const selectProject = document.getElementById('selectProject');
            if (selectProject && selectProject.value) {
                appState.currentProjectId = selectProject.value;
                saveToLocalStorage();
            }
            _insuranceAgeCache.clear(); // 프로젝트 변경 시 나이 캐시 초기화
            updateHeaderAndTable();
        }

        // 오늘 날짜 및 주말 요일 색상 판정
        