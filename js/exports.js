function copyToClipboardForExcel() {
            const proj = appState.projects[appState.currentProjectId];
            if (!proj || !proj.labors || proj.labors.length === 0) {
                showToast("복사할 노무대장 정보가 없습니다.");
                return;
            }

            const daysInMonth = new Date(proj.year, proj.month, 0).getDate();
            const weekDays = ['일','월','화','수','목','금','토'];
            function dowName(d) { return weekDays[new Date(proj.year, proj.month - 1, d).getDay()]; }

            // 공제 계산
            const rows = proj.labors.map((l, idx) => {
                let autoDays = 0;
                for (let d = 1; d <= daysInMonth; d++) {
                    if (l.attendance[d]) autoDays += Number(l.attendance[d]);
                }
                const calc = calculateDeductions(l, autoDays);
                return { l, calc, idx };
            });

            // 합계 집계
            let sumDays=0, sumWages=0, sumIncome=0, sumLocal=0, sumEmp=0, sumHealth=0, sumCare=0, sumPension=0, sumDeduct=0, sumNet=0;
            const dailyCounts = Array(32).fill(0);
            rows.forEach(({ l, calc }) => {
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
                for (let d = 1; d <= daysInMonth; d++) {
                    if (l.attendance[d]) dailyCounts[d] += Number(l.attendance[d]);
                }
            });

            // ── 인쇄 테이블과 동일한 2행 레이아웃 TSV 구성 ──
            // 고정 좌측 4칸: NO / 성명 / 주민번호 / 직종
            // 날짜 1~16 → 우측 집계 (1행)
            // 날짜 17~31          (2행, 좌측 4칸 비움)

            const rightHdr = ['일수','단가','총액','소득세','지방세','고용보험','건강보험','요양보험','국민연금','공제합계','실지급액'];

            // 헤더 행1: NO·성명·주민번호·직종 + 1~16일(날짜/요일) + 우측
            let hdr1 = ['NO','성명','주민등록번호','직종'];
            for (let d = 1; d <= 16; d++) {
                hdr1.push(d <= daysInMonth ? `${String(d).padStart(2,'0')}(${dowName(d)})` : '');
            }
            hdr1 = hdr1.concat(rightHdr);

            // 헤더 행2: 빈칸×4 + 17~31일
            let hdr2 = ['','','',''];
            for (let d = 17; d <= 31; d++) {
                hdr2.push(d <= daysInMonth ? `${String(d).padStart(2,'0')}(${dowName(d)})` : '');
            }

            let tsv = hdr1.join('\t') + '\n' + hdr2.join('\t') + '\n';

            // 근로자 행 (1명 = 2행)
            rows.forEach(({ l, calc, idx }) => {
                // 행1: 1~16일
                let r1 = [idx + 1, l.name, l.ssn || '', l.job || '보통인부'];
                for (let d = 1; d <= 16; d++) {
                    const v = d <= daysInMonth && l.attendance[d] && Number(l.attendance[d]) > 0 ? Number(l.attendance[d]) : '';
                    r1.push(v);
                }
                r1 = r1.concat([
                    calc.effectiveDays, l.price, calc.totalWages,
                    calc.incomeTax, calc.localTax, calc.employment,
                    calc.health, calc.care, calc.pension,
                    calc.totalDeduction, calc.netPay
                ]);

                // 행2: 17~31일
                let r2 = ['','','',''];
                for (let d = 17; d <= 31; d++) {
                    const v = d <= daysInMonth && l.attendance[d] && Number(l.attendance[d]) > 0 ? Number(l.attendance[d]) : '';
                    r2.push(v);
                }

                tsv += r1.join('\t') + '\n' + r2.join('\t') + '\n';
            });

            // 합계 행 (2행)
            let t1 = ['합계','','',''];
            for (let d = 1; d <= 16; d++) {
                t1.push(d <= daysInMonth && dailyCounts[d] > 0 ? dailyCounts[d] : '');
            }
            t1 = t1.concat([sumDays.toFixed(1), '-', sumWages, sumIncome, sumLocal, sumEmp, sumHealth, sumCare, sumPension, sumDeduct, sumNet]);

            let t2 = ['','','',''];
            for (let d = 17; d <= 31; d++) {
                t2.push(d <= daysInMonth && dailyCounts[d] > 0 ? dailyCounts[d] : '');
            }

            tsv += t1.join('\t') + '\n' + t2.join('\t') + '\n';

            // 클립보드 복사
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(tsv)
                    .then(() => showToast("2행 날짜 구조로 복사 완료! 엑셀에서 바로 붙여넣기하세요."))
                    .catch(() => showCustomAlert("클립보드 복사 권한이 거부되었습니다. 브라우저 권한을 확인해주세요."));
            } else {
                const ta = document.createElement('textarea');
                ta.value = tsv;
                ta.style.cssText = 'position:fixed;opacity:0';
                document.body.appendChild(ta);
                ta.select();
                try {
                    document.execCommand('copy');
                    showToast("2행 날짜 구조로 복사 완료! 엑셀에서 바로 붙여넣기하세요.");
                } catch (err) {
                    showCustomAlert("클립보드 복사 중 에러가 발생하였습니다.");
                }
                document.body.removeChild(ta);
            }
        }

        // CSV 내보내기 (단순 데이터 추출용)
        function exportToCSV() {
            const proj = appState.projects[appState.currentProjectId];
            if (!proj || !proj.labors || proj.labors.length === 0) {
                showToast("내보낼 대장 데이터가 비어 있습니다.");
                return;
            }

            const daysInMonth = new Date(proj.year, proj.month, 0).getDate();
            let csv = "\uFEFF";
            csv += `상호명,${proj.company},지급귀속,${proj.year}년 ${proj.month}월,공종분류,${proj.workType}\n\n`;
            csv += "NO,직종,성명,주소,주민번호,";
            for (let d = 1; d <= daysInMonth; d++) { csv += `${d}일,`; }
            csv += "일수,단가,총액,소득세,지방세,고용보험,건강보험,요양보험,국민연금,공제계,실수령액,은행명,계좌번호\n";

            proj.labors.forEach((l, idx) => {
                let autoDays = 0;
                let attStr = "";
                for (let d = 1; d <= daysInMonth; d++) {
                    const v = l.attendance[d] || 0;
                    autoDays += Number(v);
                    attStr += `${v ? v : ''},`;
                }
                const calc = calculateDeductions(l, autoDays);
                const addr = '"' + (l.address || '').replace(/"/g, '""') + '"';
                csv += `${idx + 1},${l.job || '보통인부'},${l.name},${addr},'${l.ssn},${attStr}${calc.effectiveDays},${l.price},${calc.totalWages},${calc.incomeTax},${calc.localTax},${calc.employment},${calc.health},${calc.care},${calc.pension},${calc.totalDeduction},${calc.netPay},${l.bank || ''},'${l.account || ''}\n`;
            });

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `노무대장_${proj.company}_${proj.year}년_${proj.month}월.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            showToast("CSV 다운로드 완료");
        }

        // [실무 기능] 데이터 전체 영구 포맷
        // [수정] 포맷 전 현재 데이터를 자동 백업 파일로 다운로드 후 초기화
        function resetAllDatabase() {
            showCustomConfirm("경고! 현재 시스템에 등록된 모든 현장, 프로젝트 대장 및 근로자 데이터가 완전히 포맷되며 복구 불가능합니다. 초기화하시겠습니까?", () => {
                // 포맷 전 자동 백업 다운로드
                try {
                    const dataStr = JSON.stringify(appState, null, 2);
                    const blob = new Blob([dataStr], { type: 'application/json' });
                    const url  = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.setAttribute("download", `노무관리_포맷전_자동백업_${new Date().toISOString().slice(0, 10)}.json`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                } catch (e) {
                    // 백업 실패해도 포맷은 계속 진행
                }
                localStorage.removeItem('labor_payment_system_data_v4');
                appState = JSON.parse(JSON.stringify(demoData));
                saveToLocalStorage();
                populateDropdowns();
                onProjectChange();
                showToast("전체 데이터베이스가 완벽히 포맷되었습니다. 포맷 전 백업 파일이 자동 다운로드되었습니다.");
            });
        }

        // 출근 일수 수동 지정 조율
        