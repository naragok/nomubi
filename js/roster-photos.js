function printRosterInNewTab(laborId) {
            const proj = appState.projects[appState.currentProjectId];
            const labor = proj.labors.find(l => l.id === laborId);
            if (!labor) return;

            const printWindow = window.open("", "_blank");
            if (!printWindow) {
                showCustomAlert("팝업 차단이 설정되어 있습니다. 팝업 허용 후 다시 시도해 주세요.");
                return;
            }

            printWindow.document.write(`<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>필수서류 명단 - ${labor.name}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght=300;400;500;700;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: 'Noto Sans KR', sans-serif;
            background: #f1f5f9;
            color: #1e293b;
            font-size: 12px;
        }

        /* 상단 조작 바 (화면 전용) */
        .top-bar {
            background: #1e293b; color: white;
            padding: 10px 16px;
            display: flex; justify-content: space-between; align-items: center;
            position: sticky; top: 0; z-index: 100;
        }
        .top-bar span { font-size: 11px; }
        .btn-print {
            background: #dc2626; color: white; border: none;
            padding: 6px 16px; border-radius: 4px;
            font-weight: bold; cursor: pointer; font-family: inherit; font-size: 12px;
        }
        .btn-print:hover { background: #b91c1c; }

        /* 화면: 스크롤 가능한 문서 래퍼 */
        .screen-wrap { padding: 24px; display: flex; justify-content: center; }

        /* A4 문서 카드 (화면) */
        .doc-card {
            width: 210mm;
            background: white;
            box-shadow: 0 4px 24px rgba(0,0,0,0.12);
            border-radius: 4px;
            padding: 14mm 12mm 14mm 12mm;
        }

        /* 인적사항 테이블 */
        .info-table { width: 100%; border-collapse: collapse; }
        .info-table th, .info-table td {
            border: 1px solid #374151;
            padding: 6px 8px;
            text-align: center;
            font-size: 11px;
        }
        .info-table th { background: #f3f4f6; font-weight: 700; letter-spacing: 0.08em; }
        .info-table td.addr { text-align: left; font-size: 10px; }

        /* 서류 섹션 */
        .doc-section { border: 1px solid #374151; border-top: none; }
        .doc-section-title {
            background: #f3f4f6;
            padding: 7px 0;
            text-align: center;
            font-weight: 700;
            letter-spacing: 0.35em;
            font-size: 12px;
            border-bottom: 1px solid #374151;
        }
        /* 각 섹션 본문: 사진이 꽉 차게 */
        .doc-section-body {
            padding: 10px;
            display: flex;
            align-items: stretch;
            justify-content: center;
            gap: 10px;
        }

        /* 사진 슬롯: 섹션 높이에 맞게 flex로 늘어남 */
        .photo-slot {
            flex: 1;
            min-height: 190px;
            border: 2px dashed #9ca3af;
            border-radius: 6px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 6px;
            cursor: pointer;
            position: relative;
            overflow: hidden;
            background: #fafafa;
            transition: border-color 0.2s, background 0.2s;
        }
        .photo-slot:hover { border-color: #3b82f6; background: #eff6ff; }
        .photo-slot input[type=file] {
            position: absolute; inset: 0; opacity: 0;
            cursor: pointer; width: 100%; height: 100%;
        }
        .photo-slot img {
            position: absolute; inset: 0;
            width: 100%; height: 100%;
            object-fit: contain;
        }
        .photo-slot .slot-label {
            font-size: 10px; color: #6b7280; font-weight: 600;
            text-align: center; z-index: 1; pointer-events: none;
        }
        .photo-slot .slot-icon { font-size: 30px; z-index: 1; pointer-events: none; }
        .photo-slot .remove-btn {
            position: absolute; top: 5px; right: 5px;
            background: rgba(239,68,68,0.9); color: white;
            border: none; border-radius: 50%;
            width: 22px; height: 22px;
            font-size: 12px; cursor: pointer;
            display: none; align-items: center; justify-content: center;
            font-weight: bold; z-index: 20; line-height: 1;
        }
        .photo-slot.has-image .remove-btn { display: flex; }
        .photo-slot.has-image .slot-label,
        .photo-slot.has-image .slot-icon { display: none; }

        /* ── 인쇄 전용 ── */
        @media print {
            html, body { background: white !important; }
            .top-bar { display: none !important; }
            .screen-wrap { padding: 0 !important; display: block; }

            /* A4 꽉채움: 여백·크기 완전 제어 */
            @page {
                size: A4 portrait;
                margin: 10mm 15mm;
            }

            .doc-card {
                width: 100%;
                box-shadow: none !important;
                border-radius: 0 !important;
                padding: 0 !important;
                /* 인쇄 영역을 꽉 채우기 위해 높이를 페이지에 맞춤 */
                height: calc(297mm - 20mm);
                display: flex;
                flex-direction: column;
            }

            /* 3개 섹션이 나머지 높이를 균등 배분 */
            .info-table { flex-shrink: 0; }
            .doc-section { flex: 1; display: flex; flex-direction: column; }
            .doc-section-title { flex-shrink: 0; }
            .doc-section-body { flex: 1; }

            .photo-slot {
                border: 1px solid #9ca3af !important;
                min-height: unset;
            }
            .photo-slot .remove-btn { display: none !important; }
            .photo-slot input[type=file] { display: none !important; }
            /* 사진 없는 슬롯: 안내 텍스트 숨김 */
            .photo-slot:not(.has-image) .slot-icon,
            .photo-slot:not(.has-image) .slot-label { display: none !important; }
        }
    </style>
</head>
<body>
    <div class="top-bar">
        <span>📋 필수서류 명단 — ${labor.name} | ${proj.company} ${proj.year}년 ${proj.month}월</span>
        <button class="btn-print" onclick="window.print()">🖨️ 인쇄하기</button>
    </div>

    <div class="screen-wrap">
    <div class="doc-card">

        <!-- 인적사항 테이블 -->
        <table class="info-table">
            <thead>
                <tr>
                    <th style="width:68px">직 종</th>
                    <th style="width:64px">성 명</th>
                    <th style="width:128px">주민번호</th>
                    <th style="width:116px">전화번호</th>
                    <th>주 소</th>
                    <th style="width:56px">비 고</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${labor.job || '보통인부'}</td>
                    <td style="font-weight:700">${labor.name}</td>
                    <td style="font-family:monospace;font-size:11px">${labor.ssn || ''}</td>
                    <td style="font-family:monospace">${labor.phone || ''}</td>
                    <td class="addr">${labor.address || ''}</td>
                    <td></td>
                </tr>
            </tbody>
        </table>

        <!-- 주민등록증 (앞면 1장) -->
        <div class="doc-section">
            <div class="doc-section-title">주 민 등 록 증</div>
            <div class="doc-section-body">
                <div class="photo-slot" id="slot-id-front" onclick="triggerUpload('slot-id-front')">
                    <span class="slot-icon">🪪</span>
                    <span class="slot-label">앞면 사진 추가<br><small style="font-weight:400;color:#9ca3af">클릭하여 업로드</small></span>
                    <input type="file" accept="image/*" onchange="loadPhoto(this,'slot-id-front','img-id-front')" onclick="event.stopPropagation()">
                    <img id="img-id-front" style="display:none">
                    <button class="remove-btn" onclick="removePhoto(event,'slot-id-front','img-id-front')">✕</button>
                </div>
            </div>
        </div>

        <!-- 통장 사본 -->
        <div class="doc-section">
            <div class="doc-section-title">통 장 사 본</div>
            <div class="doc-section-body">
                <div class="photo-slot" id="slot-bank" onclick="triggerUpload('slot-bank')">
                    <span class="slot-icon">🏦</span>
                    <span class="slot-label">통장 사본 사진 추가<br><small style="font-weight:400;color:#9ca3af">클릭하여 업로드</small></span>
                    <input type="file" accept="image/*" onchange="loadPhoto(this,'slot-bank','img-bank')" onclick="event.stopPropagation()">
                    <img id="img-bank" style="display:none">
                    <button class="remove-btn" onclick="removePhoto(event,'slot-bank','img-bank')">✕</button>
                </div>
            </div>
        </div>

        <!-- 기초안전보건교육 이수증 -->
        <div class="doc-section">
            <div class="doc-section-title">기초안전보건교육 이수증</div>
            <div class="doc-section-body">
                <div class="photo-slot" id="slot-safety" onclick="triggerUpload('slot-safety')">
                    <span class="slot-icon">🦺</span>
                    <span class="slot-label">이수증 사진 추가<br><small style="font-weight:400;color:#9ca3af">클릭하여 업로드</small></span>
                    <input type="file" accept="image/*" onchange="loadPhoto(this,'slot-safety','img-safety')" onclick="event.stopPropagation()">
                    <img id="img-safety" style="display:none">
                    <button class="remove-btn" onclick="removePhoto(event,'slot-safety','img-safety')">✕</button>
                </div>
            </div>
        </div>

    </div><!-- /doc-card -->
    </div><!-- /screen-wrap -->

    <script>
        // ── 저장 키: 근로자 ID 기반으로 부모 창 appState에 사진 데이터 보관 ──
        const LABOR_ID = '${labor.id}';
        const PHOTO_KEYS = ['id-front', 'bank', 'safety'];

        // 부모 창 appState에서 사진 불러오기
        function getPhotoStore() {
            try {
                const parent = window.opener;
                if (!parent || !parent.appState) return {};
                const proj = parent.appState.projects[parent.appState.currentProjectId];
                if (!proj) return {};
                const labor = proj.labors.find(l => l.id === LABOR_ID);
                return (labor && labor.rosterPhotos) ? labor.rosterPhotos : {};
            } catch(e) { return {}; }
        }

        // 부모 창 appState에 사진 저장
        function savePhotoToStore(key, dataUrl) {
            try {
                const parent = window.opener;
                if (!parent || !parent.appState) return;
                const proj = parent.appState.projects[parent.appState.currentProjectId];
                if (!proj) return;
                const labor = proj.labors.find(l => l.id === LABOR_ID);
                if (!labor) return;
                if (!labor.rosterPhotos) labor.rosterPhotos = {};
                if (dataUrl) {
                    labor.rosterPhotos[key] = dataUrl;
                } else {
                    delete labor.rosterPhotos[key];
                }
                // 부모 창 localStorage에도 반영
                if (parent.saveToLocalStorage) parent.saveToLocalStorage();
            } catch(e) {}
        }

        // 슬롯에 이미지 표시
        function applyPhoto(slotId, imgId, dataUrl) {
            const slot = document.getElementById(slotId);
            const img = document.getElementById(imgId);
            if (!slot || !img) return;
            if (dataUrl) {
                img.src = dataUrl;
                img.style.display = 'block';
                slot.classList.add('has-image');
            } else {
                img.src = '';
                img.style.display = 'none';
                slot.classList.remove('has-image');
            }
        }

        // 페이지 로드 시 저장된 사진 복원
        window.addEventListener('load', function() {
            const store = getPhotoStore();
            if (store['id-front']) applyPhoto('slot-id-front', 'img-id-front', store['id-front']);
            if (store['bank'])     applyPhoto('slot-bank',     'img-bank',     store['bank']);
            if (store['safety'])  applyPhoto('slot-safety',   'img-safety',   store['safety']);
        });

        function triggerUpload(slotId) {
            const slot = document.getElementById(slotId);
            if (!slot) return;
            slot.querySelector('input[type=file]').click();
        }

        function loadPhoto(input, slotId, imgId) {
            const file = input.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(e) {
                const dataUrl = e.target.result;
                applyPhoto(slotId, imgId, dataUrl);
                // 키 추출: slot-id-front → id-front
                const key = slotId.replace('slot-', '');
                savePhotoToStore(key, dataUrl);
            };
            reader.readAsDataURL(file);
        }

        function removePhoto(event, slotId, imgId) {
            event.stopPropagation();
            const slot = document.getElementById(slotId);
            if (slot) {
                const inp = slot.querySelector('input[type=file]');
                if (inp) inp.value = '';
            }
            applyPhoto(slotId, imgId, null);
            const key = slotId.replace('slot-', '');
            savePhotoToStore(key, null);
        }
    <\/script>
</body>
</html>`);
            printWindow.document.close();
        }

        // 신규 현장 개설 모달 열기/닫기
        