function getDayOfWeekColorClass(year, month, day) {
            const date = new Date(year, month - 1, day);
            const dayOfWeek = date.getDay();
            const today = new Date();
            const isToday = today.getFullYear() === year && (today.getMonth() + 1) === month && today.getDate() === day;

            let classes = "";
            if (isToday) {
                classes += "bg-amber-100 ring-2 ring-amber-400 ring-inset font-bold ";
            }

            if (dayOfWeek === 6) {
                return classes + "text-blue-600 font-extrabold bg-blue-50/50 print:text-blue-600";
            } else if (dayOfWeek === 0) {
                return classes + "text-red-500 font-extrabold bg-red-50/50 print:text-red-500";
            }
            return classes;
        }

        function updateHeaderAndTable() {
            const proj = appState.projects[appState.currentProjectId];
            if (!proj) return;

            document.getElementById('viewCompany').innerText = proj.company;
            const daysInMonth = new Date(proj.year, proj.month, 0).getDate();
            document.getElementById('viewPeriod').innerText = `${proj.year % 100}.${String(proj.month).padStart(2, '0')}.01 ~ ${proj.year % 100}.${String(proj.month).padStart(2, '0')}.${daysInMonth}`;
            document.getElementById('viewProjectName').innerText = `[${proj.workType}] ${proj.projectName}`;

            const daysOfWeekHeader = document.getElementById('daysOfWeekHeader');
            daysOfWeekHeader.innerHTML = "";
            const weekDays = ["일", "월", "화", "수", "목", "금", "토"];
            
            for (let d = 1; d <= 31; d++) {
                if (d <= daysInMonth) {
                    const dayName = weekDays[new Date(proj.year, proj.month - 1, d).getDay()];
                    const colorClass = getDayOfWeekColorClass(proj.year, proj.month, d);
                    daysOfWeekHeader.innerHTML += `
                        <th class="w-6 border-r border-slate-200 p-0.5 print:border-black ${colorClass}">
                            <div class="text-[8px] opacity-75">${dayName}</div>
                            <div>${d}</div>
                        </th>
                    `;
                } else {
                    daysOfWeekHeader.innerHTML += `<th class="w-6 border-r border-slate-200 p-0.5 bg-slate-100/50 print:border-black"></th>`;
                }
            }

            renderTableBody(proj, daysInMonth);
        }

        // 테이블 목록 동적 렌더링 (스마트 필터링 및 법정 공제 배지 적용)
        function renderTableBody(proj, daysInMonth) {
            const tbody = document.getElementById('laborList');
            tbody.innerHTML = "";

            const searchKeyword = document.getElementById('searchFilter').value.trim().toLowerCase();
            const insuranceFilterVal = document.getElementById('insuranceFilter').value;

            if (!proj.labors || proj.labors.length === 0) {
                tbody.innerHTML = `<tr><td colspan="46" class="p-8 text-center text-slate-400 font-semibold">등록된 근로자 내역이 없습니다. 좌측 서식에서 등록해 주세요.</td></tr>`;
                updateDashboardStats(0, 0, 0, 0);
                renderTotalRow([], daysInMonth);
                return;
            }

            // 1차 텍스트 필터링
            let targetLabors = proj.labors.filter(l => {
                const nameMatch = l.name.toLowerCase().includes(searchKeyword);
                const jobMatch = (l.job || '').toLowerCase().includes(searchKeyword);
                const ssnMatch = l.ssn.includes(searchKeyword);
                return nameMatch || jobMatch || ssnMatch;
            });

            // 2차 사회보험 조건별 필터링
            if (insuranceFilterVal !== "all") {
                targetLabors = targetLabors.filter(l => {
                    const { isPensionExempt, isEmploymentExempt } = getExactInsuranceAge(l.ssn, proj.year, proj.month);
                    let autoDays = 0;
                    for (let d = 1; d <= 31; d++) {
                        if (d <= daysInMonth && l.attendance[d]) autoDays += Number(l.attendance[d]);
                    }
                    const finalDays = (l.manualDays !== null && l.manualDays !== undefined) ? l.manualDays : autoDays;

                    if (insuranceFilterVal === "pensionExempt") {
                        return isPensionExempt;
                    } else if (insuranceFilterVal === "employmentExempt") {
                        return isEmploymentExempt;
                    } else if (insuranceFilterVal === "insuranceTarget") {
                        return finalDays >= 8;
                    }
                    return true;
                });
            }

            if (targetLabors.length === 0) {
                tbody.innerHTML = `<tr><td colspan="46" class="p-8 text-center text-slate-400 font-semibold">조건에 맞는 근로자가 대장에 존재하지 않습니다.</td></tr>`;
                updateDashboardStats(0, 0, 0, 0);
                renderTotalRow([], daysInMonth);
                return;
            }

            const computedRowsData = [];
            const pad = getPaddingClass();

            targetLabors.forEach((labor, idx) => {
                let autoDays = 0;
                for (let d = 1; d <= 31; d++) {
                    if (d <= daysInMonth && labor.attendance[d]) {
                        autoDays += Number(labor.attendance[d]);
                    }
                }

                const calc = calculateDeductions(labor, autoDays);
                computedRowsData.push({ labor, autoDays, calc });

                const tr = document.createElement('tr');
                tr.className = "hover:bg-slate-50 border-b border-slate-200 text-center text-slate-700 print:text-black print:border-black";

                const hasManualDays = (labor.manualDays !== null && labor.manualDays !== undefined);
                const { age, isPensionExempt, isEmploymentExempt } = getExactInsuranceAge(labor.ssn, proj.year, proj.month);

                // 외국인 체류 만료 경고 배지
                let visaBadge = '';
                if (labor.visaType && labor.visaExpiry) {
                    const today = new Date();
                    const expiry = new Date(labor.visaExpiry);
                    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
                    if (diffDays < 0) {
                        visaBadge = `<span class="block text-[8px] bg-red-500 text-white font-bold px-1 rounded mt-0.5">체류만료!</span>`;
                    } else if (diffDays <= 30) {
                        visaBadge = `<span class="block text-[8px] bg-orange-400 text-white font-bold px-1 rounded mt-0.5">${diffDays}일 남음</span>`;
                    } else if (diffDays <= 90) {
                        visaBadge = `<span class="block text-[8px] bg-amber-400 text-white font-bold px-1 rounded mt-0.5">${labor.visaType}</span>`;
                    } else {
                        visaBadge = `<span class="block text-[8px] text-orange-500 font-bold">🌏${labor.visaType}</span>`;
                    }
                }

                let html = `
                    <td class="${pad} border-r border-slate-200 bg-slate-100 font-bold sticky left-0 z-10 print:bg-white print:border-black">${idx + 1}</td>
                    <td class="${pad} border-r border-slate-200 font-black text-blue-600 cursor-pointer sticky left-[40px] bg-slate-50 hover:underline z-10 print:bg-white print:text-black print:border-black" onclick="openDetailModal('${labor.id}')">
                        <span class="block">${labor.name}</span>
                        <span class="block text-[8px] text-slate-400 font-normal">만 ${age}세</span>
                        ${visaBadge}
                    </td>
                    <td class="${pad} border-r border-slate-200 font-mono text-[10px] tracking-wider print:border-black">${labor.ssn}</td>
                    <td class="${pad} border-r border-slate-200 text-slate-600 print:border-black">${labor.job || '보통인부'}</td>
                `;

                // 1일 ~ 31일 입력 필드 구성
                for (let d = 1; d <= 31; d++) {
                    const isDayValid = d <= daysInMonth;
                    const val = isDayValid ? (labor.attendance[d] || 0) : "";
                    
                    if (isDayValid) {
                        const colorClass = getDayOfWeekColorClass(proj.year, proj.month, d);
                        html += `
                            <td class="border-r border-slate-200 p-0 print:border-black ${colorClass}">
                                <input type="text" value="${val ? val : ''}" 
                                    onchange="toggleAttendance('${labor.id}', ${d}, this.value)" 
                                    data-labor-id="${labor.id}"
                                    data-day-index="${d}"
                                    title="${labor.name} - ${d}일 출역"
                                    class="attendance-cell-input w-full h-full text-center font-bold bg-transparent border-0 focus:ring-1 focus:ring-blue-500 py-1 cursor-pointer select-none"
                                    placeholder="."
                                >
                            </td>
                        `;
                    } else {
                        html += `<td class="border-r border-slate-200 p-0 bg-slate-100/50 print:border-black"></td>`;
                    }
                }

                // 법적 면제 안내 배지 처리
                const pensionBadge = isPensionExempt ? `<span class="block text-[11px] text-white bg-rose-500 font-bold rounded px-1 mt-0.5 leading-tight">연금면제</span>` : '';
                const employBadge = isEmploymentExempt ? `<span class="block text-[11px] text-white bg-orange-500 font-bold rounded px-1 mt-0.5 leading-tight">고용면제</span>` : '';
                const incomeTaxBadge = (calc.incomeTax === 0 && labor.price > 150000) ? `<span class="block text-[10px] text-white bg-blue-400 font-bold rounded px-1 mt-0.5 leading-tight">소액부징수</span>` : '';

                html += `
                    <td class="p-0 border-r border-slate-200 bg-amber-50/50 print:border-black print:bg-white">
                        <input type="number" step="0.1" value="${calc.effectiveDays}" 
                            onchange="updateLaborDays('${labor.id}', this.value)" 
                            class="w-full text-center font-extrabold bg-transparent border border-transparent hover:border-slate-300 rounded px-0.5 py-0.5 focus:ring-1 focus:ring-amber-500 ${hasManualDays ? 'text-amber-700 ring-1 ring-amber-400 bg-amber-100/50' : ''}"
                        >
                    </td>
                    <td class="p-0 border-r border-slate-200 print:border-black">
                        <input type="text" value="${commaFormatter(labor.price)}" 
                            onfocus="this.value = this.value.replace(/[^0-9]/g, '')"
                            onblur="this.value = this.value ? parseInt(this.value).toLocaleString() : ''"
                            onchange="updateLaborPrice('${labor.id}', this.value)" 
                            class="w-full text-right bg-transparent border border-transparent hover:border-slate-300 font-extrabold rounded px-1 py-0.5 font-mono text-slate-800"
                        >
                    </td>
                    <td class="${pad} border-r border-slate-200 text-right font-extrabold text-slate-900 font-mono print:border-black print:text-black" data-result-labor="${labor.id}" data-result-field="totalWages">${commaFormatter(calc.totalWages)}</td>
                    
                    <td class="${pad} border-r border-slate-200 text-right font-mono print:border-black text-slate-600">
                        <span class="block font-semibold" data-result-labor="${labor.id}" data-result-field="incomeTax">${commaFormatter(calc.incomeTax)}</span>
                        <span class="text-[8px] text-slate-400 block" data-result-labor="${labor.id}" data-result-field="localTax">${commaFormatter(calc.localTax)}</span>
                        ${incomeTaxBadge}
                    </td>
                    <td class="${pad} border-r border-slate-200 text-right font-mono print:border-black text-slate-600">
                        <span class="block" data-result-labor="${labor.id}" data-result-field="employment">${commaFormatter(calc.employment)}</span>
                        ${employBadge}
                    </td>
                    <td class="${pad} border-r border-slate-200 text-right font-mono print:border-black text-slate-600">
                        <span class="block font-semibold" data-result-labor="${labor.id}" data-result-field="health">${commaFormatter(calc.health)}</span>
                        <span class="text-[8px] text-slate-400 block" data-result-labor="${labor.id}" data-result-field="care">${commaFormatter(calc.care)}</span>
                    </td>
                    <td class="${pad} border-r border-slate-200 text-right font-mono print:border-black text-slate-600">
                        <span class="block" data-result-labor="${labor.id}" data-result-field="pension">${commaFormatter(calc.pension)}</span>
                        ${pensionBadge}
                    </td>
                    
                    <td class="${pad} border-r border-slate-200 text-right font-bold text-red-600 font-mono print:border-black print:text-black" data-result-labor="${labor.id}" data-result-field="totalDeduction">${commaFormatter(calc.totalDeduction)}</td>
                    <td class="${pad} border-r border-slate-200 text-right font-black text-blue-700 bg-blue-50/20 font-mono print:border-black print:text-black" data-result-labor="${labor.id}" data-result-field="netPay">${commaFormatter(calc.netPay)}</td>
                    
                    <td class="p-1 no-print flex items-center justify-center gap-1">
                        <button onclick="printContractInNewTab('${labor.id}')" class="text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-500 rounded px-1 py-0.5 font-bold text-[9.5px] transition-all" title="표준 일용 근로 계약서">
                            계약
                        </button>
                        <button onclick="printReceiptInNewTab('${labor.id}')" class="text-emerald-600 hover:text-white hover:bg-emerald-600 border border-emerald-500 rounded px-1 py-0.5 font-bold text-[9.5px] transition-all" title="임금지급명세서 및 영수확인서">
                            명세
                        </button>
                        <button onclick="printSafetyInNewTab('${labor.id}')" class="text-purple-600 hover:text-white hover:bg-purple-600 border border-purple-500 rounded px-1 py-0.5 font-bold text-[9.5px] transition-all" title="안전보건교육 일지">
                            일지
                        </button>
                        <button onclick="printRosterInNewTab('${labor.id}')" class="text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-500 rounded px-1 py-0.5 font-bold text-[9.5px] transition-all" title="필수서류 명단 양식 발급">
                            명단
                        </button>
                        <button onclick="duplicateLabor('${labor.id}')" class="text-amber-600 hover:text-white hover:bg-amber-600 border border-amber-500 rounded px-1 py-0.5 font-bold text-[9.5px] transition-all" title="이 근로자 정보 복제하기">
                            복사
                        </button>
                        <button onclick="deleteLabor('${labor.id}')" class="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded" title="삭제">
                            <i data-lucide="trash-2" class="w-3 h-3"></i>
                        </button>
                    </td>
                `;

                tr.innerHTML = html;
                tbody.appendChild(tr);
            });

            renderTotalRow(computedRowsData, daysInMonth);
            calculateAndDisplaySummary(computedRowsData);
            renderPrintTable(proj, daysInMonth, targetLabors, computedRowsData);
            lucide.createIcons();
            
            applyZoom(document.getElementById('zoomSlider').value);
        }

        // 근로자 상세 정보 조회 및 수정 트리거 모달 핸들러
        