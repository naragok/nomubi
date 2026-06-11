function exportToXLS() {
            const proj = appState.projects[appState.currentProjectId];
            if (!proj || !proj.labors || proj.labors.length === 0) {
                showToast("내보낼 대장 데이터가 비어 있습니다.");
                return;
            }

            const daysInMonth = new Date(proj.year, proj.month, 0).getDate();
            const weekDays = ['일','월','화','수','목','금','토'];

            function dowName(d) {
                return weekDays[new Date(proj.year, proj.month - 1, d).getDay()];
            }
            function isSun(d) { return new Date(proj.year, proj.month - 1, d).getDay() === 0; }
            function isSat(d) { return new Date(proj.year, proj.month - 1, d).getDay() === 6; }

            // 공제 계산
            const rows = proj.labors.map((l, idx) => {
                let autoDays = 0;
                for (let d = 1; d <= daysInMonth; d++) {
                    if (l.attendance[d]) autoDays += Number(l.attendance[d]);
                }
                const calc = calculateDeductions(l, autoDays);
                return { l, calc, idx };
            });

            // 합계
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

            // ── 스타일 정의 ──
            const styles = `
  <Style ss:ID="title"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:Bold="1" ss:Size="13"/><Interior ss:Color="#1e293b" ss:Pattern="Solid"/><Font ss:Color="#ffffff" ss:Bold="1" ss:Size="13"/></Style>
  <Style ss:ID="hdr"><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Font ss:Bold="1" ss:Size="8"/><Interior ss:Color="#e2e8f0" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
  <Style ss:ID="hdrSun"><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Font ss:Bold="1" ss:Size="8" ss:Color="#dc2626"/><Interior ss:Color="#fff5f5" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
  <Style ss:ID="hdrSat"><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Font ss:Bold="1" ss:Size="8" ss:Color="#1d4ed8"/><Interior ss:Color="#eff6ff" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
  <Style ss:ID="cell"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:Size="8"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
  <Style ss:ID="cellName"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:Bold="1" ss:Size="8"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
  <Style ss:ID="cellSun"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:Size="8" ss:Color="#dc2626"/><Interior ss:Color="#fff5f5" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
  <Style ss:ID="cellSat"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:Size="8" ss:Color="#1d4ed8"/><Interior ss:Color="#eff6ff" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
  <Style ss:ID="cellEmpty"><Interior ss:Color="#f1f5f9" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
  <Style ss:ID="total"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:Bold="1" ss:Size="8"/><Interior ss:Color="#dbeafe" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2"/></Borders></Style>
  <Style ss:ID="totalSun"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:Bold="1" ss:Size="8" ss:Color="#dc2626"/><Interior ss:Color="#dbeafe" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2"/></Borders></Style>
  <Style ss:ID="totalSat"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:Bold="1" ss:Size="8" ss:Color="#1d4ed8"/><Interior ss:Color="#dbeafe" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2"/></Borders></Style>
  <Style ss:ID="money"><Alignment ss:Horizontal="Right" ss:Vertical="Center"/><Font ss:Size="8"/><NumberFormat ss:Format="#,##0"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
  <Style ss:ID="moneyBold"><Alignment ss:Horizontal="Right" ss:Vertical="Center"/><Font ss:Bold="1" ss:Size="8"/><NumberFormat ss:Format="#,##0"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
  <Style ss:ID="moneyTotal"><Alignment ss:Horizontal="Right" ss:Vertical="Center"/><Font ss:Bold="1" ss:Size="8"/><NumberFormat ss:Format="#,##0"/><Interior ss:Color="#dbeafe" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2"/></Borders></Style>`;

            // 셀 헬퍼
            function C(val, styleId, mergeAcross, mergeDown, type) {
                let attrs = `ss:StyleID="${styleId}"`;
                if (mergeAcross) attrs += ` ss:MergeAcross="${mergeAcross}"`;
                if (mergeDown)   attrs += ` ss:MergeDown="${mergeDown}"`;
                const t = type || (typeof val === 'number' ? 'Number' : 'String');
                const safeVal = String(val).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
                return `<Cell ${attrs}><Data ss:Type="${t}">${safeVal}</Data></Cell>`;
            }
            function EMPTY(styleId) { return `<Cell ss:StyleID="${styleId}"><Data ss:Type="String"></Data></Cell>`; }
            function dayStyle(d, isHdr, isTotal) {
                if (d > daysInMonth) return isHdr ? 'hdr' : 'cellEmpty';
                if (isSun(d)) return isTotal ? 'totalSun' : isHdr ? 'hdrSun' : 'cellSun';
                if (isSat(d)) return isTotal ? 'totalSat' : isHdr ? 'hdrSat' : 'cellSat';
                return isTotal ? 'total' : isHdr ? 'hdr' : 'cell';
            }

            // ── 행 생성 ──
            let xlsRows = '';

            // 타이틀 행 (회사명/현장명)
            const totalCols = 4 + 31 + 9; // NO+성명+주민번호+직종 + 1~31 + 우측9개
            xlsRows += `<Row ss:Height="22">${C(`${proj.company} — ${proj.projectName} (${proj.year}년 ${proj.month}월 노무비 지급명세)`, 'title', totalCols - 1, 0, 'String')}</Row>`;

            // 헤더 행 1: 고정셀(rowspan=2용 MergeDown=1) + 1~16일 + 우측셀(MergeDown=1)
            xlsRows += `<Row ss:Height="28">`;
            xlsRows += C('NO',       'hdr', 0, 1);
            xlsRows += C('성  명',   'hdr', 0, 1);
            xlsRows += C('주민등록번호','hdr', 0, 1);
            xlsRows += C('직  종',   'hdr', 0, 1);
            for (let d = 1; d <= 16; d++) {
                xlsRows += C(d <= daysInMonth ? `${String(d).padStart(2,'0')}\n${dowName(d)}` : '', dayStyle(d, true, false));
            }
            xlsRows += C('일수',     'hdr', 0, 1);
            xlsRows += C('단가',     'hdr', 0, 1);
            xlsRows += C('총액',     'hdr', 0, 1);
            xlsRows += C('소득세\n지방세', 'hdr', 0, 1);
            xlsRows += C('고용보험', 'hdr', 0, 1);
            xlsRows += C('건강\n장기요양', 'hdr', 0, 1);
            xlsRows += C('국민연금', 'hdr', 0, 1);
            xlsRows += C('공제합계', 'hdr', 0, 1);
            xlsRows += C('실지급액', 'hdr', 0, 1);
            xlsRows += `</Row>`;

            // 헤더 행 2: 17~31일 (고정셀/우측셀은 MergeDown으로 이미 병합됨)
            xlsRows += `<Row ss:Height="28">`;
            // 앞 4개 고정셀 skip → Index로 17번째 셀부터 시작
            xlsRows += `<Cell ss:Index="5"`;
            // 17~31
            for (let d = 17; d <= 31; d++) {
                if (d === 17) {
                    xlsRows += `ss:StyleID="${dayStyle(d, true, false)}"><Data ss:Type="String">${d <= daysInMonth ? String(d).padStart(2,'0') + '\n' + dowName(d) : ''}</Data></Cell>`;
                } else {
                    xlsRows += C(d <= daysInMonth ? `${String(d).padStart(2,'0')}\n${dowName(d)}` : '', dayStyle(d, true, false));
                }
            }
            xlsRows += `</Row>`;

            // 근로자 행 (1명 = 2행)
            rows.forEach(({ l, calc, idx }) => {
                // 행1: 1~16일
                xlsRows += `<Row ss:Height="16">`;
                xlsRows += C(idx + 1,           'cell',     0, 1);
                xlsRows += C(l.name,             'cellName', 0, 1);
                xlsRows += C(l.ssn || '',        'cell',     0, 1);
                xlsRows += C(l.job || '보통인부','cell',     0, 1);
                for (let d = 1; d <= 16; d++) {
                    const v = d <= daysInMonth && l.attendance[d] && Number(l.attendance[d]) > 0 ? Number(l.attendance[d]) : '';
                    xlsRows += v !== '' ? C(v, dayStyle(d,false,false), 0, 0, 'Number') : EMPTY(dayStyle(d,false,false));
                }
                xlsRows += C(calc.effectiveDays, 'cell',      0, 1, 'Number');
                xlsRows += C(l.price,            'money',     0, 1, 'Number');
                xlsRows += C(calc.totalWages,    'moneyBold', 0, 1, 'Number');
                xlsRows += C(calc.incomeTax + calc.localTax, 'money', 0, 1, 'Number');
                xlsRows += C(calc.employment,    'money',     0, 1, 'Number');
                xlsRows += C(calc.health + calc.care, 'money', 0, 1, 'Number');
                xlsRows += C(calc.pension,       'money',     0, 1, 'Number');
                xlsRows += C(calc.totalDeduction,'money',     0, 1, 'Number');
                xlsRows += C(calc.netPay,        'moneyBold', 0, 1, 'Number');
                xlsRows += `</Row>`;

                // 행2: 17~31일
                xlsRows += `<Row ss:Height="16"><Cell ss:Index="5">`;
                for (let d = 17; d <= 31; d++) {
                    const v = d <= daysInMonth && l.attendance[d] && Number(l.attendance[d]) > 0 ? Number(l.attendance[d]) : '';
                    const s = dayStyle(d, false, false);
                    if (d === 17) {
                        xlsRows += `ss:StyleID="${s}"><Data ss:Type="${v !== '' ? 'Number' : 'String'}">${v}</Data></Cell>`;
                    } else {
                        xlsRows += v !== '' ? C(v, s, 0, 0, 'Number') : EMPTY(s);
                    }
                }
                xlsRows += `</Row>`;
            });

            // 합계 행1: 1~16
            xlsRows += `<Row ss:Height="18">`;
            xlsRows += C('합   계', 'total', 3, 1);  // colspan 4 → MergeAcross=3
            for (let d = 1; d <= 16; d++) {
                const v = d <= daysInMonth && dailyCounts[d] > 0 ? dailyCounts[d] : '';
                xlsRows += v !== '' ? C(v, dayStyle(d,false,true), 0, 0, 'Number') : EMPTY(dayStyle(d,false,true));
            }
            xlsRows += C(sumDays,   'total',      0, 1, 'Number');
            xlsRows += C('-',       'total',      0, 1);
            xlsRows += C(sumWages,  'moneyTotal', 0, 1, 'Number');
            xlsRows += C(sumIncome + sumLocal, 'moneyTotal', 0, 1, 'Number');
            xlsRows += C(sumEmp,    'moneyTotal', 0, 1, 'Number');
            xlsRows += C(sumHealth + sumCare, 'moneyTotal', 0, 1, 'Number');
            xlsRows += C(sumPension,'moneyTotal', 0, 1, 'Number');
            xlsRows += C(sumDeduct, 'moneyTotal', 0, 1, 'Number');
            xlsRows += C(sumNet,    'moneyTotal', 0, 1, 'Number');
            xlsRows += `</Row>`;

            // 합계 행2: 17~31
            xlsRows += `<Row ss:Height="18"><Cell ss:Index="5">`;
            for (let d = 17; d <= 31; d++) {
                const v = d <= daysInMonth && dailyCounts[d] > 0 ? dailyCounts[d] : '';
                const s = dayStyle(d, false, true);
                if (d === 17) {
                    xlsRows += `ss:StyleID="${s}"><Data ss:Type="${v !== '' ? 'Number' : 'String'}">${v}</Data></Cell>`;
                } else {
                    xlsRows += v !== '' ? C(v, s, 0, 0, 'Number') : EMPTY(s);
                }
            }
            xlsRows += `</Row>`;

            // 열 너비 설정
            let colDefs = `
  <Column ss:Width="20"/>
  <Column ss:Width="40"/>
  <Column ss:Width="60"/>
  <Column ss:Width="30"/>`;
            for (let d = 1; d <= 31; d++) {
                colDefs += `\n  <Column ss:Width="${d <= daysInMonth ? 18 : 14}"/>`;
            }
            colDefs += `
  <Column ss:Width="22"/>
  <Column ss:Width="40"/>
  <Column ss:Width="52"/>
  <Column ss:Width="45"/>
  <Column ss:Width="38"/>
  <Column ss:Width="45"/>
  <Column ss:Width="38"/>
  <Column ss:Width="48"/>
  <Column ss:Width="55"/>`;

            // ── XML 조립 ──
            const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:x="urn:schemas-microsoft-com:office:excel">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>${proj.company} ${proj.year}년 ${proj.month}월 노무비명세서</Title>
 </DocumentProperties>
 <ExcelWorkbook xmlns="urn:schemas-microsoft-com:office:excel">
  <WindowHeight>8000</WindowHeight><WindowWidth>18000</WindowWidth>
 </ExcelWorkbook>
 <Styles>${styles}
 </Styles>
 <Worksheet ss:Name="${proj.month}월 노무대장">
  <Table>${colDefs}
${xlsRows}
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <PageSetup><Layout x:Orientation="Landscape"/><PageMargins x:Bottom="0.4" x:Left="0.3" x:Right="0.3" x:Top="0.4"/></PageSetup>
   <FitToPage/><Print><FitWidth>1</FitWidth><FitHeight>0</FitHeight></Print>
   <FreezePanes/><SplitHorizontal>3</SplitHorizontal><TopRowBottomPane>3</TopRowBottomPane>
   <ActivePane>2</ActivePane>
  </WorksheetOptions>
 </Worksheet>
</Workbook>`;

            const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' });
            const url  = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href  = url;
            link.setAttribute('download', `노무비명세서_${proj.company}_${proj.year}년_${proj.month}월.xls`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            showToast(`XLS 저장 완료 — 노무비명세서_${proj.company}_${proj.year}년_${proj.month}월.xls`);
        }

        // 전체 데이터 백업 및 복구
        function triggerBackup() {
            const dataStr = JSON.stringify(appState, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `노무관리_통합데이터백업_${new Date().toISOString().slice(0, 10)}.json`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast("전체 데이터의 백업 완료 파일이 작성되었습니다.");
        }

        function restoreBackup(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const parsed = JSON.parse(e.target.result);
                    // 구조 유효성 검사
                    if (!parsed || typeof parsed !== 'object') throw new Error('객체 형식 오류');
                    if (typeof parsed.projects !== 'object' || parsed.projects === null) throw new Error('projects 필드 오류');
                    if (typeof parsed.currentProjectId !== 'string') throw new Error('currentProjectId 필드 오류');
                    // 프로젝트 각 항목 기본 검증
                    for (const [pid, proj] of Object.entries(parsed.projects)) {
                        if (typeof proj !== 'object' || proj === null) throw new Error(`프로젝트 [${pid}] 형식 오류`);
                        if (typeof proj.company !== 'string') throw new Error(`프로젝트 [${pid}] company 필드 오류`);
                        if (!Array.isArray(proj.labors)) throw new Error(`프로젝트 [${pid}] labors 필드 오류`);
                    }
                    appState = parsed;
                    saveToLocalStorage();
                    populateDropdowns();
                    onProjectChange();
                    showToast("백업 데이터 파일이 전체 복구 처리되었습니다.");
                } catch (err) {
                    showCustomAlert("복구 실패: " + (err.message || "유효하지 않은 백업 파일입니다."));
                    // 복구 실패 시 파일 입력 초기화
                    event.target.value = '';
                }
            };
            reader.readAsText(file);
        }

        // 안내 토스트 유틸리티
        function showToast(msg) {
            const toast = document.getElementById('toast');
            document.getElementById('toastMessage').innerText = msg;
            toast.classList.remove('translate-y-10', 'opacity-0');
            setTimeout(() => {
                toast.classList.add('translate-y-10', 'opacity-0');
            }, 3000);
        }

        // ============================================================
        // 📋 4대보험 취득신고서 기능
        // ============================================================
        function openInsuranceReportModal() {
            const proj = appState.projects[appState.currentProjectId];
            if (!proj || !proj.labors || proj.labors.length === 0) {
                showCustomAlert("현재 대장에 등록된 근로자가 없습니다.");
                return;
            }

            const daysInMonth = new Date(proj.year, proj.month, 0).getDate();
            // 8일 이상 근무자만 추출
            const targets = proj.labors.filter(l => {
                let days = 0;
                for (let d = 1; d <= daysInMonth; d++) days += Number(l.attendance[d] || 0);
                const effective = (l.manualDays !== null && l.manualDays !== undefined) ? l.manualDays : days;
                return effective >= 8;
            });

            document.getElementById('insuranceReportCount').textContent = `총 ${targets.length}명 (8일 이상 근무자)`;

            if (targets.length === 0) {
                document.getElementById('insuranceReportContent').innerHTML = `
                    <div class="text-center py-10 text-slate-400 font-semibold">
                        8일 이상 근무한 근로자가 없습니다.
                    </div>`;
                document.getElementById('insuranceReportModal').classList.remove('hidden');
                lucide.createIcons();
                return;
            }

            let rows = '';
            targets.forEach((l, i) => {
                let days = 0;
                for (let d = 1; d <= daysInMonth; d++) days += Number(l.attendance[d] || 0);
                const effective = (l.manualDays !== null && l.manualDays !== undefined) ? l.manualDays : days;
                const { age, isPensionExempt, isEmploymentExempt } = getExactInsuranceAge(l.ssn, proj.year, proj.month);
                const calc = calculateDeductions(l, effective);

                const insTypes = [];
                if (!isPensionExempt) insTypes.push('국민연금');
                insTypes.push('건강보험');
                insTypes.push('고용보험');
                if (!isEmploymentExempt) insTypes.push('산재보험');

                const visaInfo = l.visaType ? `<span class="text-orange-500">[${l.visaType}${l.nationality ? '·' + l.nationality : ''}]</span>` : '';

                rows += `
                    <tr class="border-b border-slate-200 hover:bg-slate-50 text-center text-[11px]">
                        <td class="p-2 border-r border-slate-200 font-bold">${i + 1}</td>
                        <td class="p-2 border-r border-slate-200 font-bold text-blue-700 text-left">${l.name} ${visaInfo}</td>
                        <td class="p-2 border-r border-slate-200 font-mono">${l.ssn}</td>
                        <td class="p-2 border-r border-slate-200">${l.job || '보통인부'}</td>
                        <td class="p-2 border-r border-slate-200 font-bold">${effective}일</td>
                        <td class="p-2 border-r border-slate-200 font-mono">${commaFormatter(calc.totalWages)}</td>
                        <td class="p-2 border-r border-slate-200 text-teal-700 font-bold text-[10px]">${insTypes.join(', ')}</td>
                        <td class="p-2 font-mono text-red-600">${commaFormatter(calc.totalDeduction)}</td>
                    </tr>`;
            });

            const totalWages = targets.reduce((s, l) => {
                let days = 0;
                for (let d = 1; d <= daysInMonth; d++) days += Number(l.attendance[d] || 0);
                const eff = (l.manualDays !== null && l.manualDays !== undefined) ? l.manualDays : days;
                return s + calculateDeductions(l, eff).totalWages;
            }, 0);

            document.getElementById('insuranceReportContent').innerHTML = `
                <div class="mb-4 p-3 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-800">
                    <strong>${proj.company}</strong> · ${proj.year}년 ${proj.month}월 · ${proj.projectName}
                    <span class="ml-3 font-bold">총 지급노무비: ${commaFormatter(totalWages)}원</span>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse border border-slate-300 text-xs" id="insuranceTable">
                        <thead class="bg-teal-700 text-white font-bold text-center">
                            <tr>
                                <th class="p-2 border-r border-teal-600 w-8">NO</th>
                                <th class="p-2 border-r border-teal-600">성명</th>
                                <th class="p-2 border-r border-teal-600">주민등록번호</th>
                                <th class="p-2 border-r border-teal-600">직종</th>
                                <th class="p-2 border-r border-teal-600">근무일</th>
                                <th class="p-2 border-r border-teal-600">총임금</th>
                                <th class="p-2 border-r border-teal-600">취득 보험 종류</th>
                                <th class="p-2">공제합계</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
                <div class="mt-3 text-[10px] text-slate-500 space-y-0.5">
                    <p>※ 국민연금: 만 60세 미만, 월 8일 이상 근무 시 취득 신고 대상</p>
                    <p>※ 건강보험: 월 8일 이상 근무 시 전 연령 취득 신고 대상</p>
                    <p>※ 고용보험: 만 65세 미만 근로자 전원 (일용직 별도 신고)</p>
                    <p>※ 산재보험: 모든 근로자 당연 적용 (별도 취득 신고 불필요)</p>
                </div>`;

            document.getElementById('insuranceReportModal').classList.remove('hidden');
            lucide.createIcons();
        }

        function closeInsuranceReportModal() {
            document.getElementById('insuranceReportModal').classList.add('hidden');
        }

        function printInsuranceReport() {
            const proj = appState.projects[appState.currentProjectId];
            const content = document.getElementById('insuranceReportContent').innerHTML;
            const printWindow = window.open('', '_blank');
            if (!printWindow) { showCustomAlert("팝업 차단을 해제해주세요."); return; }
            printWindow.document.write(`
                <!DOCTYPE html><html lang="ko"><head>
                <meta charset="UTF-8">
                <title>4대보험 취득신고서 - ${proj.company} ${proj.year}년 ${proj.month}월</title>
                
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

                    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght=400;700;900&display=swap');
                    body { font-family: 'Noto Sans KR', sans-serif; }
                    @media print { .no-print{display:none!important} @page{size:A4 landscape;margin:1cm} }
                </style>
                </head>
                <body class="p-6 bg-white">
                <div class="no-print mb-4 flex justify-between items-center bg-teal-50 p-3 rounded border border-teal-200 text-xs">
                    <span class="font-bold text-teal-800">4대보험 취득신고서 인쇄</span>
                    <button onclick="window.print()" class="bg-teal-600 text-white px-3 py-1 rounded font-bold">인쇄하기</button>
                </div>
                <h2 class="text-lg font-black text-center mb-4 tracking-widest">4대사회보험 취득 신고서</h2>
                ${content}
                </body></html>`);
            printWindow.document.close();
        }

        // ============================================================
        // 📅 월별 근로자 이월 기능
        // ============================================================
        