function getFirstAndLastAttendance(labor) {
            let firstDay = null;
            for (let d = 1; d <= 31; d++) {
                if (labor.attendance && labor.attendance[d] > 0) {
                    firstDay = d;
                    break;
                }
            }
            let lastDay = null;
            for (let d = 31; d >= 1; d--) {
                if (labor.attendance && labor.attendance[d] > 0) {
                    lastDay = d;
                    break;
                }
            }
            if (firstDay === null) firstDay = 1;
            if (lastDay === null) lastDay = 28; 
            return { firstDay, lastDay };
        }

        // 1. 표준일용근로계약서 출력 페이지 생성
        function printContractInNewTab(laborId) {
            const proj = appState.projects[appState.currentProjectId];
            const labor = proj.labors.find(l => l.id === laborId);
            if (!labor) return;

            const { firstDay } = getFirstAndLastAttendance(labor);
            const daysInMonth = new Date(proj.year, proj.month, 0).getDate();
            const startDate = `${proj.year}년 ${proj.month}월 ${firstDay}일`;
            const endDate = `${proj.year}년 ${proj.month}월 ${daysInMonth}일`;

            const printWindow = window.open("", "_blank");
            if (!printWindow) {
                showCustomAlert("팝업 차단이 설정되어 있습니다. 팝업 허용 후 다시 시도해 주세요.");
                return;
            }

            printWindow.document.write(`
                <!DOCTYPE html>
                <html lang="ko">
                <head>
                    <meta charset="UTF-8">
                    <title>표준일용근로계약서 - ${labor.name}</title>
                    
                    <style>
                        /* === 인쇄 팝업 공용 스타일 (CDN 불필요, 오프라인 안전) === */
                        *,::before,::after{box-sizing:border-box}
                        .bg-white{background:#fff}.bg-slate-50{background:#f8fafc}.bg-slate-100{background:#f1f5f9}
                        .bg-blue-50{background:#eff6ff}.bg-emerald-50{background:#ecfdf5}.bg-purple-50{background:#faf5ff}
                        .bg-teal-50{background:#f0fdfa}.bg-amber-50{background:#fffbeb}
                        .text-white{color:#fff}.text-slate-800{color:#1e293b}.text-slate-700{color:#334155}
                        .text-slate-600{color:#475569}.text-slate-500{color:#64748b}.text-slate-400{color:#94a3b8}
                        .text-blue-600{color:#2563eb}.text-blue-700{color:#1d4ed8}.text-blue-800{color:#1e40af}.text-blue-900{color:#1e3a8a}
                        .text-emerald-600{color:#059669}.text-emerald-700{color:#047857}.text-emerald-800{color:#065f46}
                        .text-red-600{color:#dc2626}.text-teal-700{color:#0f766e}.text-amber-800{color:#92400e}
                        .border{border:1px solid #e2e8f0}.border-slate-200{border-color:#e2e8f0}.border-slate-300{border-color:#cbd5e1}
                        .border-slate-400{border-color:#94a3b8}.border-black{border-color:#000}
                        .border-blue-200{border-color:#bfdbfe}.border-emerald-200{border-color:#a7f3d0}
                        .border-b{border-bottom:1px solid #e2e8f0}.border-t{border-top:1px solid #e2e8f0}
                        .border-b-2{border-bottom:2px solid #000}.border-2{border:2px solid #000}
                        .rounded{border-radius:.25rem}.rounded-lg{border-radius:.5rem}
                        .shadow-md{box-shadow:0 4px 6px -1px rgba(0,0,0,.1)}
                        .p-1{padding:.25rem}.p-2{padding:.5rem}.p-3{padding:.75rem}.p-4{padding:1rem}
                        .p-6{padding:1.5rem}.p-8{padding:2rem}.p-12{padding:3rem}
                        .px-3{padding-left:.75rem;padding-right:.75rem}.px-4{padding-left:1rem;padding-right:1rem}
                        .py-1{padding-top:.25rem;padding-bottom:.25rem}.py-2{padding-top:.5rem;padding-bottom:.5rem}
                        .mb-1{margin-bottom:.25rem}.mb-2{margin-bottom:.5rem}.mb-4{margin-bottom:1rem}
                        .mb-6{margin-bottom:1.5rem}.mb-8{margin-bottom:2rem}.mt-1{margin-top:.25rem}
                        .mt-2{margin-top:.5rem}.mt-4{margin-top:1rem}.mt-8{margin-top:2rem}.mt-12{margin-top:3rem}
                        .mx-auto{margin-left:auto;margin-right:auto}
                        .flex{display:flex}.grid{display:grid}.block{display:block}
                        .flex-col{flex-direction:column}.items-center{align-items:center}
                        .justify-between{justify-content:space-between}.justify-center{justify-content:center}
                        .gap-2{gap:.5rem}.gap-3{gap:.75rem}.gap-4{gap:1rem}.gap-8{gap:2rem}
                        .space-y-1>*+*{margin-top:.25rem}.space-y-2>*+*{margin-top:.5rem}.space-y-3>*+*{margin-top:.75rem}
                        .grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}
                        .w-full{width:100%}.max-w-\[19cm\]{max-width:19cm}.max-w-\[21cm\]{max-width:21cm}
                        .w-1\/4{width:25%}.w-1\/2{width:50%}
                        .text-xs{font-size:.75rem}.text-sm{font-size:.875rem}.text-base{font-size:1rem}
                        .text-xl{font-size:1.25rem}.text-2xl{font-size:1.5rem}
                        .font-normal{font-weight:400}.font-semibold{font-weight:600}.font-bold{font-weight:700}
                        .font-black{font-weight:900}.font-extrabold{font-weight:800}
                        .font-mono{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace}
                        .text-center{text-align:center}.text-left{text-align:left}.text-right{text-align:right}
                        .text-justify{text-align:justify}
                        .tracking-widest{letter-spacing:.1em}.leading-relaxed{line-height:1.625}
                        .underline{text-decoration:underline}
                        .overflow-hidden{overflow:hidden}.border-collapse{border-collapse:collapse}
                        .pt-2{padding-top:.5rem}.pt-4{padding-top:1rem}.pt-6{padding-top:1.5rem}
                        .pb-2{padding-bottom:.5rem}.border-l-4{border-left-width:4px}
                        .border-purple-600{border-color:#9333ea}.pl-2{padding-left:.5rem}
                        button{cursor:pointer;font-family:inherit;font-weight:700;border-radius:.25rem;border:none;padding:.25rem .75rem;font-size:.75rem;transition:background .15s}
                        table{border-collapse:collapse;width:100%}

                        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght=300;400;500;700;900&display=swap');
                        body { font-family: 'Noto Sans KR', sans-serif; }
                        @media print {
                            html, body { background: white !important; margin: 0 !important; padding: 0 !important; }
                            .no-print { display: none !important; }
                            .print-wrap { padding: 0 !important; background: white !important; }
                            .doc-body {
                                max-width: 100% !important;
                                box-shadow: none !important;
                                border: none !important;
                                border-radius: 0 !important;
                                padding: 0 !important;
                                font-size: 10.5px !important;
                            }
                            @page { size: A4 portrait; margin: 10mm 15mm; }
                        }
                    </style>
                </head>
                <body class="bg-slate-50 print-wrap">
                    <div class="max-w-[21cm] mx-auto mb-4 bg-blue-50 border border-blue-200 p-3 rounded text-xs text-blue-800 flex justify-between items-center no-print">
                        <div>🖨️ 표준일용근로계약서 — A4 세로 1페이지로 출력됩니다.</div>
                        <button onclick="window.print()" class="bg-blue-600 text-white px-3 py-1 rounded font-bold hover:bg-blue-700 transition-all">인쇄하기</button>
                    </div>

                    <div class="doc-body max-w-[21cm] mx-auto p-10 bg-white border border-slate-300 rounded shadow-md text-xs leading-relaxed text-slate-900">
                        <div class="text-center mb-10">
                            <h1 class="text-2xl font-black tracking-widest underline decoration-double underline-offset-8">표 준 일 용 근 로 계 약 서</h1>
                        </div>

                        <p class="mb-6 text-justify">
                            <strong>사업주 (이하 "갑"이라 한다)</strong>와 <strong>근로자 (이하 "을"이라 한다)</strong>는 근로기준법 및 관련 관계 법령을 준수하며, 상호 합의에 의거하여 다음과 같이 근로계약을 체결한다.
                        </p>

                        <div class="grid grid-cols-2 gap-4 border border-slate-300 p-4 rounded-lg mb-8">
                            <div class="space-y-1">
                                <h3 class="font-extrabold text-blue-800 mb-1">■ 사업주 ("갑")</h3>
                                <div><span class="text-slate-400">상호 / 회사명:</span> ${proj.company}</div>
                                <div><span class="text-slate-400">배치 현장명:</span> ${proj.projectName}</div>
                                <div><span class="text-slate-400">담당 공종명:</span> ${proj.workType}</div>
                            </div>
                            <div class="space-y-1">
                                <h3 class="font-extrabold text-blue-800 mb-1">■ 근로자 ("을")</h3>
                                <div><span class="text-slate-400">성 명:</span> ${labor.name}</div>
                                <div><span class="text-slate-400">직 종:</span> ${labor.job || '보통인부'}</div>
                                <div><span class="text-slate-400">주민등록번호:</span> ${labor.ssn}</div>
                            </div>
                        </div>

                        <div class="space-y-4 text-justify font-sans">
                            <p><strong>제 1 조 (근로계약기간 및 효력)</strong><br>
                            ① 본 계약은 일용 근로 계약이며, 근로 체결 개시일 <span class="font-bold underline">${startDate}</span>부터 종료 만료 예정일 <span class="font-bold underline">${endDate}</span>까지로 정하며 당일 종료 시 그 효력은 자동 소멸하는 것으로 정한다.</p>

                            <p><strong>제 2 조 (근무 구역 및 업무 영역)</strong><br>
                            ① 근무지: 갑이 지정 및 지시한 <span class="font-semibold">${proj.projectName}</span> 현장 작업장<br>
                            ② 담당업무: 현장 가공 지시에 따른 보통인부 및 수반 연계 직무</p>

                            <p><strong>제 3 조 (기본 약정 근로 및 휴게 시간)</strong><br>
                            ① 소정근로: 07:00 ~ 18:00 (현장 기상 여건 및 일정 상황에 따라 조율 가능)<br>
                            ② 휴게시간: 점심시간 및 안전조회 대기시간을 포함한 총 2시간을 현장 분할 수여한다.</p>

                            <p><strong>제 4 조 (임금 약정 지급 조건)</strong><br>
                            ① 일급 단가: <strong>일당 ${labor.price.toLocaleString()}원</strong>을 확정한다.<br>
                            ② 지급 수단 및 방식: 을이 지정한 본인명의 예금계좌 <strong>(${labor.bank || '미제공'} : ${labor.account || '계좌 정보 없음'})</strong>로 2026 원천공제 세율 및 사회보험 공제 기준을 적용한 차인 잔여액을 월 정기 정산 주기에 맞추어 송금한다.</p>

                            <p><strong>제 5 조 (기타 및 성실 약정)</strong><br>
                            ① 을은 현장 배치 전 채용안전 교육 및 산업안전 규칙을 필히 성실히 이행 및 탑재한다.</p>
                        </div>

                        <div class="text-center mt-8 mb-6 font-bold">
                            <p class="text-slate-800 text-sm">${proj.year}년 ${proj.month}월 ${firstDay}일</p>
                        </div>

                        <div class="grid grid-cols-2 gap-8 pt-4 border-t border-slate-300">
                            <div class="space-y-1">
                                <p class="font-bold text-slate-900 mb-1.5 text-sm">사업주 ("갑")</p>
                                <p>상 호: ${proj.company}</p>
                                <p>주 소: 현장 사무소 내</p>
                                <p class="pt-6 font-bold font-sans">대표자: <span class="underline">${proj.representative || '김민지'}</span> (서명/인)</p>
                            </div>
                            <div class="space-y-1">
                                <p class="font-bold text-slate-900 mb-1.5 text-sm">근로자 ("을")</p>
                                <p>성 명: ${labor.name}</p>
                                <p>주 소: ${labor.address || '현장 인근 또는 등록된 주소지'}</p>
                                <p class="pt-6 font-bold font-sans">근로자: <span class="underline">${labor.name}</span> (서명/인)</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `);
            printWindow.document.close();
        }

        // 2. 임금 지급 명세서 출력
        function printReceiptInNewTab(laborId) {
            const proj = appState.projects[appState.currentProjectId];
            const labor = proj.labors.find(l => l.id === laborId);
            if (!labor) return;

            let autoDays = 0;
            for (let d = 1; d <= 31; d++) {
                if (labor.attendance[d]) autoDays += Number(labor.attendance[d]);
            }
            const calc = calculateDeductions(labor, autoDays);

            const printWindow = window.open("", "_blank");
            if (!printWindow) {
                showCustomAlert("팝업 차단이 설정되어 있습니다. 팝업 허용 후 다시 시도해 주세요.");
                return;
            }

            printWindow.document.write(`
                <!DOCTYPE html>
                <html lang="ko">
                <head>
                    <meta charset="UTF-8">
                    <title>임금지급명세서 - ${labor.name}</title>
                    
                    <style>
                        /* === 인쇄 팝업 공용 스타일 (CDN 불필요, 오프라인 안전) === */
                        *,::before,::after{box-sizing:border-box}
                        .bg-white{background:#fff}.bg-slate-50{background:#f8fafc}.bg-slate-100{background:#f1f5f9}
                        .bg-blue-50{background:#eff6ff}.bg-emerald-50{background:#ecfdf5}.bg-purple-50{background:#faf5ff}
                        .bg-teal-50{background:#f0fdfa}.bg-amber-50{background:#fffbeb}
                        .text-white{color:#fff}.text-slate-800{color:#1e293b}.text-slate-700{color:#334155}
                        .text-slate-600{color:#475569}.text-slate-500{color:#64748b}.text-slate-400{color:#94a3b8}
                        .text-blue-600{color:#2563eb}.text-blue-700{color:#1d4ed8}.text-blue-800{color:#1e40af}.text-blue-900{color:#1e3a8a}
                        .text-emerald-600{color:#059669}.text-emerald-700{color:#047857}.text-emerald-800{color:#065f46}
                        .text-red-600{color:#dc2626}.text-teal-700{color:#0f766e}.text-amber-800{color:#92400e}
                        .border{border:1px solid #e2e8f0}.border-slate-200{border-color:#e2e8f0}.border-slate-300{border-color:#cbd5e1}
                        .border-slate-400{border-color:#94a3b8}.border-black{border-color:#000}
                        .border-blue-200{border-color:#bfdbfe}.border-emerald-200{border-color:#a7f3d0}
                        .border-b{border-bottom:1px solid #e2e8f0}.border-t{border-top:1px solid #e2e8f0}
                        .border-b-2{border-bottom:2px solid #000}.border-2{border:2px solid #000}
                        .rounded{border-radius:.25rem}.rounded-lg{border-radius:.5rem}
                        .shadow-md{box-shadow:0 4px 6px -1px rgba(0,0,0,.1)}
                        .p-1{padding:.25rem}.p-2{padding:.5rem}.p-3{padding:.75rem}.p-4{padding:1rem}
                        .p-6{padding:1.5rem}.p-8{padding:2rem}.p-12{padding:3rem}
                        .px-3{padding-left:.75rem;padding-right:.75rem}.px-4{padding-left:1rem;padding-right:1rem}
                        .py-1{padding-top:.25rem;padding-bottom:.25rem}.py-2{padding-top:.5rem;padding-bottom:.5rem}
                        .mb-1{margin-bottom:.25rem}.mb-2{margin-bottom:.5rem}.mb-4{margin-bottom:1rem}
                        .mb-6{margin-bottom:1.5rem}.mb-8{margin-bottom:2rem}.mt-1{margin-top:.25rem}
                        .mt-2{margin-top:.5rem}.mt-4{margin-top:1rem}.mt-8{margin-top:2rem}.mt-12{margin-top:3rem}
                        .mx-auto{margin-left:auto;margin-right:auto}
                        .flex{display:flex}.grid{display:grid}.block{display:block}
                        .flex-col{flex-direction:column}.items-center{align-items:center}
                        .justify-between{justify-content:space-between}.justify-center{justify-content:center}
                        .gap-2{gap:.5rem}.gap-3{gap:.75rem}.gap-4{gap:1rem}.gap-8{gap:2rem}
                        .space-y-1>*+*{margin-top:.25rem}.space-y-2>*+*{margin-top:.5rem}.space-y-3>*+*{margin-top:.75rem}
                        .grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}
                        .w-full{width:100%}.max-w-\[19cm\]{max-width:19cm}.max-w-\[21cm\]{max-width:21cm}
                        .w-1\/4{width:25%}.w-1\/2{width:50%}
                        .text-xs{font-size:.75rem}.text-sm{font-size:.875rem}.text-base{font-size:1rem}
                        .text-xl{font-size:1.25rem}.text-2xl{font-size:1.5rem}
                        .font-normal{font-weight:400}.font-semibold{font-weight:600}.font-bold{font-weight:700}
                        .font-black{font-weight:900}.font-extrabold{font-weight:800}
                        .font-mono{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace}
                        .text-center{text-align:center}.text-left{text-align:left}.text-right{text-align:right}
                        .text-justify{text-align:justify}
                        .tracking-widest{letter-spacing:.1em}.leading-relaxed{line-height:1.625}
                        .underline{text-decoration:underline}
                        .overflow-hidden{overflow:hidden}.border-collapse{border-collapse:collapse}
                        .pt-2{padding-top:.5rem}.pt-4{padding-top:1rem}.pt-6{padding-top:1.5rem}
                        .pb-2{padding-bottom:.5rem}.border-l-4{border-left-width:4px}
                        .border-purple-600{border-color:#9333ea}.pl-2{padding-left:.5rem}
                        button{cursor:pointer;font-family:inherit;font-weight:700;border-radius:.25rem;border:none;padding:.25rem .75rem;font-size:.75rem;transition:background .15s}
                        table{border-collapse:collapse;width:100%}

                        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght=300;400;500;700;900&display=swap');
                        body { font-family: 'Noto Sans KR', sans-serif; }
                        @media print {
                            html, body { background: white !important; margin: 0 !important; padding: 0 !important; }
                            .no-print { display: none !important; }
                            .print-wrap { padding: 0 !important; background: white !important; }
                            .doc-body {
                                max-width: 100% !important;
                                box-shadow: none !important;
                                border: none !important;
                                border-radius: 0 !important;
                                padding: 0 !important;
                                font-size: 10.5px !important;
                            }
                            @page { size: A4 portrait; margin: 10mm 15mm; }
                        }
                    </style>
                </head>
                <body class="bg-slate-50 print-wrap">
                    <div class="max-w-[19cm] mx-auto mb-4 bg-emerald-50 border border-emerald-200 p-3 rounded text-xs text-emerald-800 flex justify-between items-center no-print">
                        <div>🖨️ 근로기준법 및 2026 규정에 부합하는 일용임금지급명세서 — A4 세로 1페이지로 출력됩니다.</div>
                        <button onclick="window.print()" class="bg-emerald-600 text-white px-3 py-1 rounded font-bold hover:bg-emerald-700 transition-all">인쇄하기</button>
                    </div>

                    <div class="doc-body max-w-[19cm] mx-auto p-8 bg-white border border-slate-300 rounded shadow-md text-xs text-slate-800 leading-relaxed">
                        <div class="text-center mb-8">
                            <h1 class="text-2xl font-black tracking-widest border-b-2 border-black pb-2">${proj.month}월 일용직 임금 지급명세서</h1>
                            <p class="text-[10px] text-slate-400 mt-1">본 임금명세서는 근로기준법 제48조제2항 및 법정 규칙에 근거하여 상세 지급 내역을 명시합니다.</p>
                        </div>

                        <div class="grid grid-cols-2 gap-4 mb-6 border border-slate-200 p-3 bg-slate-50 rounded">
                            <div>
                                <p class="font-bold text-blue-800 mb-1">■ 근로자 인적사항</p>
                                <p>• <strong>성 명:</strong> ${labor.name}</p>
                                <p>• <strong>직 종:</strong> ${labor.job || '보통인부'}</p>
                                <p>• <strong>주민등록번호:</strong> ${labor.ssn}</p>
                            </div>
                            <div>
                                <p class="font-bold text-blue-800 mb-1">■ 사업장 현황</p>
                                <p>• <strong>상 호:</strong> ${proj.company}</p>
                                <p>• <strong>소속 현장:</strong> ${proj.projectName}</p>
                                <p>• <strong>지급 귀속분:</strong> ${proj.year}년 ${proj.month}월분</p>
                            </div>
                        </div>

                        <div class="border border-slate-300 rounded overflow-hidden mb-6">
                            <div class="grid grid-cols-2 bg-slate-100 font-bold text-center border-b border-slate-300 py-1.5">
                                <div class="border-r border-slate-300">지급 명세 (A)</div>
                                <div>법정 공제 내역 (B)</div>
                            </div>
                            <div class="grid grid-cols-2">
                                <div class="p-3 border-r border-slate-300 space-y-2">
                                    <div class="flex justify-between"><span>기본 일당액</span><span class="font-mono font-bold">${labor.price.toLocaleString()}원</span></div>
                                    <div class="flex justify-between"><span>출역 근무일수</span><span class="font-mono font-bold">${calc.effectiveDays}일</span></div>
                                    <div class="border-t border-slate-200 pt-1 flex justify-between text-blue-800 font-bold">
                                        <span>임금 합계 총액</span>
                                        <span class="font-mono">${calc.totalWages.toLocaleString()}원</span>
                                    </div>
                                </div>
                                <div class="p-3 space-y-1.5 text-[11px]">
                                    <div class="flex justify-between"><span>소득세(원천세)</span><span class="font-mono">${calc.incomeTax.toLocaleString()}원</span></div>
                                    <div class="flex justify-between"><span>지방소득세</span><span class="font-mono">${calc.localTax.toLocaleString()}원</span></div>
                                    <div class="flex justify-between"><span>고용보험료</span><span class="font-mono">${calc.employment.toLocaleString()}원</span></div>
                                    <div class="flex justify-between"><span>건강보험료</span><span class="font-mono">${calc.health.toLocaleString()}원</span></div>
                                    <div class="flex justify-between"><span>장기요양보험료</span><span class="font-mono">${calc.care.toLocaleString()}원</span></div>
                                    <div class="flex justify-between"><span>국민연금보험료</span><span class="font-mono">${calc.pension.toLocaleString()}원</span></div>
                                    <div class="border-t border-slate-200 pt-1 flex justify-between text-red-600 font-bold">
                                        <span>공제액 계</span>
                                        <span class="font-mono">${calc.totalDeduction.toLocaleString()}원</span>
                                    </div>
                                </div>
                            </div>
                            <div class="bg-blue-50 border-t border-slate-300 p-3 flex justify-between items-center text-sm">
                                <span class="font-black text-blue-900 font-sans">차인 지급 실 수령액 (A - B)</span>
                                <span class="text-base font-black text-blue-700 font-mono">${calc.netPay.toLocaleString()}원</span>
                            </div>
                        </div>

                        <div class="border border-slate-200 p-4 rounded bg-slate-50 text-center space-y-3">
                            <p class="text-justify text-[10.5px] text-slate-500 font-sans">
                                본인은 상기 명시된 노무 일당 지급 세부 내역을 정상적으로 설명받았으며, 기재된 실 수령액 총액을 본인 지정 금융계좌 <strong>(${labor.bank || '미명시'} : ${labor.account || '계좌번호 미등록'})</strong>로 정상 이체 수령하였음을 증명 확인합니다.
                            </p>
                            <div class="flex justify-between items-center pt-2">
                                <span class="text-slate-400">2026년 ${proj.month}월</span>
                                <strong class="text-slate-800 text-[11px] font-sans">성명: ${labor.name} (서명 / 인)</strong>
                            </div>
                        </div>

                        <div class="text-center text-[10px] text-slate-400 mt-8 font-sans">
                            ${proj.company} 귀중
                        </div>
                    </div>
                </body>
                </html>
            `);
            printWindow.document.close();
        }

        // 3. 신규채용자 안전보건 교육일지 출력
        function printSafetyInNewTab(laborId) {
            const proj = appState.projects[appState.currentProjectId];
            const labor = proj.labors.find(l => l.id === laborId);
            if (!labor) return;

            const { firstDay } = getFirstAndLastAttendance(labor);
            const eduDate = `${proj.year}년 ${proj.month}월 ${firstDay}일`;

            const printWindow = window.open("", "_blank");
            if (!printWindow) {
                showCustomAlert("팝업 차단이 설정되어 있습니다. 팝업 허용 후 다시 시도해 주세요.");
                return;
            }

            printWindow.document.write(`
                <!DOCTYPE html>
                <html lang="ko">
                <head>
                    <meta charset="UTF-8">
                    <title>신규채용자 안전교육 이수증 - ${labor.name}</title>
                    
                    <style>
                        /* === 인쇄 팝업 공용 스타일 (CDN 불필요, 오프라인 안전) === */
                        *,::before,::after{box-sizing:border-box}
                        .bg-white{background:#fff}.bg-slate-50{background:#f8fafc}.bg-slate-100{background:#f1f5f9}
                        .bg-blue-50{background:#eff6ff}.bg-emerald-50{background:#ecfdf5}.bg-purple-50{background:#faf5ff}
                        .bg-teal-50{background:#f0fdfa}.bg-amber-50{background:#fffbeb}
                        .text-white{color:#fff}.text-slate-800{color:#1e293b}.text-slate-700{color:#334155}
                        .text-slate-600{color:#475569}.text-slate-500{color:#64748b}.text-slate-400{color:#94a3b8}
                        .text-blue-600{color:#2563eb}.text-blue-700{color:#1d4ed8}.text-blue-800{color:#1e40af}.text-blue-900{color:#1e3a8a}
                        .text-emerald-600{color:#059669}.text-emerald-700{color:#047857}.text-emerald-800{color:#065f46}
                        .text-red-600{color:#dc2626}.text-teal-700{color:#0f766e}.text-amber-800{color:#92400e}
                        .border{border:1px solid #e2e8f0}.border-slate-200{border-color:#e2e8f0}.border-slate-300{border-color:#cbd5e1}
                        .border-slate-400{border-color:#94a3b8}.border-black{border-color:#000}
                        .border-blue-200{border-color:#bfdbfe}.border-emerald-200{border-color:#a7f3d0}
                        .border-b{border-bottom:1px solid #e2e8f0}.border-t{border-top:1px solid #e2e8f0}
                        .border-b-2{border-bottom:2px solid #000}.border-2{border:2px solid #000}
                        .rounded{border-radius:.25rem}.rounded-lg{border-radius:.5rem}
                        .shadow-md{box-shadow:0 4px 6px -1px rgba(0,0,0,.1)}
                        .p-1{padding:.25rem}.p-2{padding:.5rem}.p-3{padding:.75rem}.p-4{padding:1rem}
                        .p-6{padding:1.5rem}.p-8{padding:2rem}.p-12{padding:3rem}
                        .px-3{padding-left:.75rem;padding-right:.75rem}.px-4{padding-left:1rem;padding-right:1rem}
                        .py-1{padding-top:.25rem;padding-bottom:.25rem}.py-2{padding-top:.5rem;padding-bottom:.5rem}
                        .mb-1{margin-bottom:.25rem}.mb-2{margin-bottom:.5rem}.mb-4{margin-bottom:1rem}
                        .mb-6{margin-bottom:1.5rem}.mb-8{margin-bottom:2rem}.mt-1{margin-top:.25rem}
                        .mt-2{margin-top:.5rem}.mt-4{margin-top:1rem}.mt-8{margin-top:2rem}.mt-12{margin-top:3rem}
                        .mx-auto{margin-left:auto;margin-right:auto}
                        .flex{display:flex}.grid{display:grid}.block{display:block}
                        .flex-col{flex-direction:column}.items-center{align-items:center}
                        .justify-between{justify-content:space-between}.justify-center{justify-content:center}
                        .gap-2{gap:.5rem}.gap-3{gap:.75rem}.gap-4{gap:1rem}.gap-8{gap:2rem}
                        .space-y-1>*+*{margin-top:.25rem}.space-y-2>*+*{margin-top:.5rem}.space-y-3>*+*{margin-top:.75rem}
                        .grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}
                        .w-full{width:100%}.max-w-\[19cm\]{max-width:19cm}.max-w-\[21cm\]{max-width:21cm}
                        .w-1\/4{width:25%}.w-1\/2{width:50%}
                        .text-xs{font-size:.75rem}.text-sm{font-size:.875rem}.text-base{font-size:1rem}
                        .text-xl{font-size:1.25rem}.text-2xl{font-size:1.5rem}
                        .font-normal{font-weight:400}.font-semibold{font-weight:600}.font-bold{font-weight:700}
                        .font-black{font-weight:900}.font-extrabold{font-weight:800}
                        .font-mono{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace}
                        .text-center{text-align:center}.text-left{text-align:left}.text-right{text-align:right}
                        .text-justify{text-align:justify}
                        .tracking-widest{letter-spacing:.1em}.leading-relaxed{line-height:1.625}
                        .underline{text-decoration:underline}
                        .overflow-hidden{overflow:hidden}.border-collapse{border-collapse:collapse}
                        .pt-2{padding-top:.5rem}.pt-4{padding-top:1rem}.pt-6{padding-top:1.5rem}
                        .pb-2{padding-bottom:.5rem}.border-l-4{border-left-width:4px}
                        .border-purple-600{border-color:#9333ea}.pl-2{padding-left:.5rem}
                        button{cursor:pointer;font-family:inherit;font-weight:700;border-radius:.25rem;border:none;padding:.25rem .75rem;font-size:.75rem;transition:background .15s}
                        table{border-collapse:collapse;width:100%}

                        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght=300;400;500;700;900&display=swap');
                        body { font-family: 'Noto Sans KR', sans-serif; }
                        @media print {
                            html, body { background: white !important; margin: 0 !important; padding: 0 !important; }
                            .no-print { display: none !important; }
                            .print-wrap { padding: 0 !important; background: white !important; }
                            .doc-body {
                                max-width: 100% !important;
                                box-shadow: none !important;
                                border: none !important;
                                border-radius: 0 !important;
                                padding: 0 !important;
                                font-size: 10.5px !important;
                            }
                            @page { size: A4 portrait; margin: 10mm 15mm; }
                        }
                    </style>
                </head>
                <body class="bg-slate-50 print-wrap">
                    <div class="max-w-[21cm] mx-auto mb-4 bg-purple-50 border border-purple-200 p-3 rounded text-xs text-purple-800 flex justify-between items-center no-print">
                        <div>🖨️ 산업안전보건법 제29조에 부합하는 채용시 안전교육 이수 일지 — A4 세로 1페이지로 출력됩니다.</div>
                        <button onclick="window.print()" class="bg-purple-600 text-white px-3 py-1 rounded font-bold hover:bg-purple-700 transition-all">인쇄하기</button>
                    </div>

                    <div class="doc-body max-w-[21cm] mx-auto p-10 bg-white border border-slate-300 rounded shadow-md text-xs text-slate-800 leading-relaxed">
                        <div class="text-center mb-8">
                            <h1 class="text-xl font-black border-2 border-black p-3 inline-block">신 규 채 용 자 안 전 보 건 교 육 일 지</h1>
                        </div>

                        <table class="w-full border-collapse border border-slate-400 mb-6 text-center">
                            <tbody>
                                <tr>
                                    <td class="bg-slate-100 border border-slate-400 p-2 font-bold w-1/4">공 사 명</td>
                                    <td colspan="3" class="border border-slate-400 p-2 text-left">${proj.projectName}</td>
                                </tr>
                                <tr>
                                    <td class="bg-slate-100 border border-slate-400 p-2 font-bold">교육 일시</td>
                                    <td class="border border-slate-400 p-2 text-left">${eduDate} (08:00 ~ 09:00)</td>
                                    <td class="bg-slate-100 border border-slate-400 p-2 font-bold w-1/4">교육 장소</td>
                                    <td class="border border-slate-400 p-2 text-left">현장안전교육장</td>
                                </tr>
                                <tr>
                                    <td class="bg-slate-100 border border-slate-400 p-2 font-bold">교 육 강 사</td>
                                    <td class="border border-slate-400 p-2 text-left">현장소장 및 안전담당자</td>
                                    <td class="bg-slate-100 border border-slate-400 p-2 font-bold">교육 대상</td>
                                    <td class="border border-slate-400 p-2 text-left">${labor.name} (${labor.job || '보통인부'})</td>
                                </tr>
                            </tbody>
                        </table>

                        <h3 class="font-bold text-slate-900 border-l-4 border-purple-600 pl-2 mb-2 font-sans">1. 교육 핵심 내용</h3>
                        <table class="w-full border-collapse border border-slate-400 mb-6 text-left">
                            <tbody>
                                <tr class="border-b border-slate-300">
                                    <td class="p-2 bg-slate-100 font-bold w-1/4 text-center">현장내 위험 기인물</td>
                                    <td class="p-2">• 건설 기계 및 중장비(크레인, 굴삭기) 협착/충돌 방지 구획선 준수법 교육.<br>• 현장내 동선 확보 및 상하 동시 작업 금지 수칙 안내.</td>
                                </tr>
                                <tr class="border-b border-slate-300">
                                    <td class="p-2 bg-slate-100 font-bold text-center">보호구 장착 실습</td>
                                    <td class="p-2">• 안전모 턱끈 조임, 안전화 체결법 및 2m 이상 고소 작업 배치 시 안전벨트 구조선 연결 지침 실습.</td>
                                </tr>
                                <tr>
                                    <td class="p-2 bg-slate-100 font-bold text-center">MSDS 및 비상 대피</td>
                                    <td class="p-2">• 사용 도료 및 자재의 물질안전기준 고지, 이상상황 시 대피로 추종 및 집결 절차 안내.</td>
                                </tr>
                            </tbody>
                        </table>

                        <h3 class="font-bold text-slate-900 border-l-4 border-purple-600 pl-2 mb-2 font-sans">2. 피교육 근로자 자필 서명</h3>
                        <table class="w-full border-collapse border border-slate-400 mb-8 text-center font-sans">
                            <thead>
                                <tr class="bg-slate-100 font-bold">
                                    <th class="border border-slate-400 p-2">근로자명</th>
                                    <th class="border border-slate-400 p-2">생년월일(주민번호)</th>
                                    <th class="border border-slate-400 p-2">직종</th>
                                    <th class="border border-slate-400 p-2">교육이수 자필 확인란</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td class="border border-slate-400 p-3 font-bold">${labor.name}</td>
                                    <td class="border border-slate-400 p-3 font-mono">${labor.ssn}</td>
                                    <td class="border border-slate-400 p-3">${labor.job || '보통인부'}</td>
                                    <td class="border border-slate-400 p-3 text-slate-400 font-bold">________________ (서명/인)</td>
                                </tr>
                            </tbody>
                        </table>

                        <p class="text-slate-400 text-[10px] leading-relaxed mb-6 font-sans">
                            ※ 관련 조항: 산업안전보건법 시행규칙 제26조관련 일용근로자는 채용 시 최소 1시간의 특별 안전보건교육을 필수로 거친 후 배치되어야 하며, 본 기록지는 점검 시 정식 교육 대장으로 갈음합니다.
                        </p>

                        <div class="text-center font-bold text-slate-700">
                            ${eduDate}
                        </div>

                        <div class="flex justify-between items-center mt-6 pt-4 border-t border-slate-200">
                            <p class="font-bold font-sans">안전담당관(소장): ________________________ (인)</p>
                            <p class="font-bold font-sans">${proj.company} 대표</p>
                        </div>
                    </div>
                </body>
                </html>
            `);
            printWindow.document.close();
        }

        // 신규 일용직 근로자 추가
        