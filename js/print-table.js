function calculateAndDisplaySummary(rows) {
            let totalCount = rows.length;
            let totalWages = 0;
            let totalDeduction = 0;
            let netPay = 0;

            rows.forEach(r => {
                totalWages += r.calc.totalWages;
                totalDeduction += r.calc.totalDeduction;
                netPay += r.calc.netPay;
            });

            updateDashboardStats(totalCount, totalWages, totalDeduction, netPay);
        }

        function updateDashboardStats(count, wages, deduction, net) {
            document.getElementById('statTotalCount').innerText = `${count}명`;
            document.getElementById('statTotalWages').innerText = `${commaFormatter(wages)}원`;
            document.getElementById('statTotalDeduction').innerText = `${commaFormatter(deduction)}원`;
            document.getElementById('statNetPay').innerText = `${commaFormatter(net)}원`;
        }

        // 하단 합계행 구성
        // ─────────────────────────────────────────────
        // 인쇄 전용 2행 날짜 테이블 생성 (PDF 노무비명세서 양식과 동일한 레이아웃)
        // 근로자 1명 = 2행: 상단(1~16일) / 하단(17~31일)
        // ─────────────────────────────────────────────
        function renderPrintTable(proj, daysInMonth, labors, computedRowsData) {
            const tbl = document.getElementById('printTable');
            tbl.innerHTML = '';
            if (!labors || labors.length === 0) return;

            const weekDays = ['일','월','화','수','목','금','토'];

            function dowClass(d) {
                const dow = new Date(proj.year, proj.month - 1, d).getDay();
                return dow === 0 ? 'sun' : dow === 6 ? 'sat' : '';
            }
            function dowName(d) {
                return weekDays[new Date(proj.year, proj.month - 1, d).getDay()];
            }
            function dayCell(d, attendance, isHdr) {
                if (isHdr) {
                    if (d > daysInMonth) return `<th class="pt-day hdr empty-day"></th>`;
                    return `<th class="pt-day hdr ${dowClass(d)}">${String(d).padStart(2,'0')}<br><span style="font-size:5.5px">${dowName(d)}</span></th>`;
                } else {
                    if (d > daysInMonth) return `<td class="pt-day empty-day"></td>`;
                    const v = attendance[d];
                    const display = v && Number(v) > 0 ? Number(v) : '';
                    return `<td class="pt-day ${dowClass(d)}">${display}</td>`;
                }
            }

            // ── 헤더: 3행 구조 ──
            // 행1: NO, 성명, 주민번호, 직종(rowspan=3) | "출근일자" colspan=16 | 일수,단가,총액,공제들(rowspan=3)
            // 행2: 1~16일 날짜+요일
            // 행3: "출근일자" colspan=15 헤더 → 17~31
            // 행4: 17~31일 날짜+요일
            // → 더 간결하게: 행1=고정셀+1~16날짜헤더, 행2=17~31날짜헤더 (고정셀 rowspan=2)

            const thead = document.createElement('thead');
            const rightHdr = `
                <th rowspan="2" class="pt-days hdr">일수</th>
                <th rowspan="2" class="pt-price hdr">단가</th>
                <th rowspan="2" class="pt-total hdr">총액</th>
                <th rowspan="2" class="pt-tax hdr">소득세<br><span style="color:#64748b;font-weight:400">지방세</span></th>
                <th rowspan="2" class="pt-ins hdr">고용<br>보험</th>
                <th rowspan="2" class="pt-ins hdr">건강<br><span style="color:#64748b;font-weight:400">장기요양</span></th>
                <th rowspan="2" class="pt-ins hdr">국민<br>연금</th>
                <th rowspan="2" class="pt-deduct hdr">공제<br>합계</th>
                <th rowspan="2" class="pt-net hdr">실지급액</th>
            `;

            // 행1: 고정 left (rowspan=2) + 1~16
            let row1 = `<tr class="hdr">
                <th rowspan="2" class="pt-no hdr">NO</th>
                <th rowspan="2" class="pt-name hdr">성 명</th>
                <th rowspan="2" class="pt-ssn hdr">주민등록번호</th>
                <th rowspan="2" class="pt-job hdr">직 종</th>
            `;
            for (let d = 1; d <= 16; d++) row1 += dayCell(d, null, true);
            row1 += rightHdr + `</tr>`;

            // 행2: 17~31
            let row2 = `<tr class="hdr">`;
            for (let d = 17; d <= 31; d++) row2 += dayCell(d, null, true);
            row2 += `</tr>`;

            thead.innerHTML = row1 + row2;
            tbl.appendChild(thead);

            // ── tbody: 근로자 1명 = 2행 ──
            const tbody = document.createElement('tbody');

            const dailyCounts = Array(32).fill(0);
            let sumDays=0, sumWages=0, sumIncome=0, sumLocal=0, sumEmp=0, sumHealth=0, sumCare=0, sumPension=0, sumDeduct=0, sumNet=0;

            computedRowsData.forEach(({ labor, calc }, idx) => {
                // 합계 누적
                sumDays   += calc.effectiveDays;
                sumWages  += calc.totalWages;
                sumIncome += calc.incomeTax;
                sumLocal  += calc.localTax;
                sumEmp    += calc.employment;
                sumHealth += calc.health;
                sumCare   += calc.care;
                sumPension+= calc.pension;
                sumDeduct += calc.totalDeduction;
                sumNet    += calc.netPay;
                for (let d = 1; d <= 31; d++) {
                    if (labor.attendance[d]) dailyCounts[d] += Number(labor.attendance[d]);
                }

                // 상단행 (1~16일) — 고정셀 rowspan=2
                const tr1 = document.createElement('tr');
                let r1 = `
                    <td rowspan="2" class="pt-no">${idx + 1}</td>
                    <td rowspan="2" class="pt-name" style="font-weight:900">${labor.name}</td>
                    <td rowspan="2" class="pt-ssn">${labor.ssn || ''}</td>
                    <td rowspan="2" class="pt-job">${labor.job || '보통인부'}</td>
                `;
                for (let d = 1; d <= 16; d++) r1 += dayCell(d, labor.attendance, false);
                r1 += `
                    <td rowspan="2" class="pt-days">${calc.effectiveDays}</td>
                    <td rowspan="2" class="pt-price">${calc.effectiveDays > 0 ? labor.price.toLocaleString() : ''}</td>
                    <td rowspan="2" class="pt-total">${calc.totalWages > 0 ? calc.totalWages.toLocaleString() : ''}</td>
                    <td rowspan="2" class="pt-tax" style="font-size:6.5px">${calc.incomeTax.toLocaleString()}<br><span style="color:#64748b">${calc.localTax.toLocaleString()}</span></td>
                    <td rowspan="2" class="pt-ins">${calc.employment.toLocaleString()}</td>
                    <td rowspan="2" class="pt-ins" style="font-size:6.5px">${calc.health.toLocaleString()}<br><span style="color:#64748b">${calc.care.toLocaleString()}</span></td>
                    <td rowspan="2" class="pt-ins">${calc.pension.toLocaleString()}</td>
                    <td rowspan="2" class="pt-deduct">${calc.totalDeduction.toLocaleString()}</td>
                    <td rowspan="2" class="pt-net" style="font-weight:900">${calc.netPay.toLocaleString()}</td>
                `;
                tr1.innerHTML = r1;
                tbody.appendChild(tr1);

                // 하단행 (17~31일)
                const tr2 = document.createElement('tr');
                let r2 = '';
                for (let d = 17; d <= 31; d++) r2 += dayCell(d, labor.attendance, false);
                tr2.innerHTML = r2;
                // 근로자 구분선 강조
                tr2.style.borderBottom = '1px solid #374151';
                tbody.appendChild(tr2);
            });

            // ── 합계 행 (2행) ──
            const totalTr1 = document.createElement('tr');
            totalTr1.className = 'total-row';
            let t1 = `<td rowspan="2" colspan="4" style="text-align:right;padding-right:4px;font-size:8px">합 계</td>`;
            for (let d = 1; d <= 16; d++) {
                const v = d <= daysInMonth && dailyCounts[d] > 0 ? dailyCounts[d] : '';
                t1 += `<td class="pt-day ${d <= daysInMonth ? dowClass(d) : 'empty-day'}">${v}</td>`;
            }
            t1 += `
                <td rowspan="2" class="pt-days">${sumDays.toFixed(1)}</td>
                <td rowspan="2" class="pt-price">-</td>
                <td rowspan="2" class="pt-total">${sumWages.toLocaleString()}</td>
                <td rowspan="2" class="pt-tax" style="font-size:6.5px">${sumIncome.toLocaleString()}<br><span style="color:#64748b">${sumLocal.toLocaleString()}</span></td>
                <td rowspan="2" class="pt-ins">${sumEmp.toLocaleString()}</td>
                <td rowspan="2" class="pt-ins" style="font-size:6.5px">${sumHealth.toLocaleString()}<br><span style="color:#64748b">${sumCare.toLocaleString()}</span></td>
                <td rowspan="2" class="pt-ins">${sumPension.toLocaleString()}</td>
                <td rowspan="2" class="pt-deduct">${sumDeduct.toLocaleString()}</td>
                <td rowspan="2" class="pt-net">${sumNet.toLocaleString()}</td>
            `;
            totalTr1.innerHTML = t1;
            tbody.appendChild(totalTr1);

            const totalTr2 = document.createElement('tr');
            totalTr2.className = 'total-row';
            let t2 = '';
            for (let d = 17; d <= 31; d++) {
                const v = d <= daysInMonth && dailyCounts[d] > 0 ? dailyCounts[d] : '';
                t2 += `<td class="pt-day ${d <= daysInMonth ? dowClass(d) : 'empty-day'}">${v}</td>`;
            }
            totalTr2.innerHTML = t2;
            tbody.appendChild(totalTr2);

            tbl.appendChild(tbody);
        }

        function renderTotalRow(rows, daysInMonth) {
            const footer = document.getElementById('totalRow');
            if (rows.length === 0) {
                footer.innerHTML = `<td colspan="46" class="p-3 text-center">검색 결과 없음</td>`;
                return;
            }

            const proj = appState.projects[appState.currentProjectId];
            let sumDays = 0;
            let sumWages = 0;
            let sumIncomeTax = 0;
            let sumLocalTax = 0;
            let sumEmployment = 0;
            let sumHealth = 0;
            let sumCare = 0;
            let sumPension = 0;
            let sumDeduction = 0;
            let sumNetPay = 0;

            const dailyCounts = Array(32).fill(0);

            rows.forEach(r => {
                sumDays += r.calc.effectiveDays;
                sumWages += r.calc.totalWages;
                sumIncomeTax += r.calc.incomeTax;
                sumLocalTax += r.calc.localTax;
                sumEmployment += r.calc.employment;
                sumHealth += r.calc.health;
                sumCare += r.calc.care;
                sumPension += r.calc.pension;
                sumDeduction += r.calc.totalDeduction;
                sumNetPay += r.calc.netPay;

                for (let d = 1; d <= 31; d++) {
                    if (r.labor.attendance[d]) {
                        dailyCounts[d] += Number(r.labor.attendance[d]);
                    }
                }
            });

            const pad = getPaddingClass();

            let html = `
                <td colspan="4" class="${pad} border-r border-slate-300 text-right font-black text-slate-900 sticky left-0 bg-blue-100 z-15 print:border-black font-sans">출역인원 합계</td>
            `;

            for (let d = 1; d <= 31; d++) {
                const isDayValid = d <= daysInMonth;
                const bgClass = !isDayValid ? 'bg-slate-200/50' : '';
                const displayVal = (isDayValid && dailyCounts[d] > 0) ? dailyCounts[d] : '';
                const weekendClass = isDayValid ? getDayOfWeekColorClass(proj.year, proj.month, d) : "";
                
                html += `<td class="p-0.5 border-r border-slate-200 ${bgClass} ${weekendClass} text-center font-black text-[10px] print:border-black">${displayVal}</td>`;
            }

            html += `
                <td class="${pad} border-r border-slate-300 font-black text-slate-900 print:border-black">${sumDays.toFixed(1)}</td>
                <td class="${pad} border-r border-slate-300 font-bold print:border-black">-</td>
                <td class="${pad} border-r border-slate-300 text-right font-black text-slate-900 font-mono print:border-black">${commaFormatter(sumWages)}</td>
                
                <td class="${pad} border-r border-slate-300 text-right print:border-black text-[9px] font-mono">
                    <span class="block">${commaFormatter(sumIncomeTax)}</span>
                    <span class="text-[8px] text-slate-400 block">${commaFormatter(sumLocalTax)}</span>
                </td>
                <td class="${pad} border-r border-slate-300 text-right print:border-black font-mono text-slate-700">${commaFormatter(sumEmployment)}</td>
                <td class="${pad} border-r border-slate-300 text-right print:border-black text-[9px] font-mono">
                    <span class="block">${commaFormatter(sumHealth)}</span>
                    <span class="text-[8px] text-slate-400 block">${commaFormatter(sumCare)}</span>
                </td>
                <td class="${pad} border-r border-slate-300 text-right print:border-black font-mono text-slate-700">${commaFormatter(sumPension)}</td>
                
                <td class="${pad} border-r border-slate-300 text-right font-black text-red-600 font-mono print:border-black">${commaFormatter(sumDeduction)}</td>
                <td class="${pad} border-r border-slate-300 text-right font-black text-blue-700 font-mono print:border-black">${commaFormatter(sumNetPay)}</td>
                <td class="p-1 no-print bg-blue-100"></td>
            `;

            footer.innerHTML = html;
        }

        // 첫 출역일 및 마지막 출역일 추출 헬퍼
        