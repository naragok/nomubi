let aiScanData = null;
        let aiSelectedFile = null;
        // [수정] Gemini API 키를 sessionStorage 대신 메모리 변수에만 보관
        // — 브라우저 스토리지에 저장되지 않아 XSS 탈취 위험 차단, 페이지 이탈 시 자동 소멸
        let _geminiApiKeyMemory = '';

        function openAiScanModal() {
            aiScanData = null;
            aiSelectedFile = null;
            document.getElementById('aiScanModal').classList.remove('hidden');
            document.getElementById('aiFileInfo').classList.add('hidden');
            document.getElementById('aiLoadingArea').classList.add('hidden');
            document.getElementById('aiResultArea').classList.add('hidden');
            document.getElementById('aiErrorArea').classList.add('hidden');
            document.getElementById('aiRegisterBtn').classList.add('hidden');
            document.getElementById('aiResultEditArea').classList.add('hidden');
            document.getElementById('aiFileInput').value = '';
            document.getElementById('aiExtraInstruction').value = '';
            // [수정] 메모리 변수에서 API 키 복원 (스토리지 미사용)
            document.getElementById('geminiApiKey').value = _geminiApiKeyMemory;
            lucide.createIcons();
        }

        function closeAiScanModal() {
            document.getElementById('aiScanModal').classList.add('hidden');
        }

        function toggleApiKeyVisibility() {
            const input = document.getElementById('geminiApiKey');
            const btn = input.nextElementSibling;
            if (input.type === 'password') {
                input.type = 'text';
                btn.textContent = '숨김';
            } else {
                input.type = 'password';
                btn.textContent = '표시';
            }
        }

        function handleAiFileDrop(event) {
            event.preventDefault();
            document.getElementById('aiDropZone').classList.remove('border-emerald-500', 'bg-emerald-50');
            const file = event.dataTransfer.files[0];
            if (file) processAiFile(file);
        }

        function handleAiFileSelect(event) {
            const file = event.target.files[0];
            if (file) processAiFile(file);
        }

        function processAiFile(file) {
            const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                showAiError('지원하지 않는 파일 형식입니다. PDF, PNG, JPG, JPEG, WEBP 파일만 지원합니다.');
                return;
            }
            if (file.size > 20 * 1024 * 1024) {
                showAiError('파일 크기가 20MB를 초과합니다.');
                return;
            }
            aiSelectedFile = file;
            document.getElementById('aiFileName').textContent = file.name;
            document.getElementById('aiFileSize').textContent = (file.size / 1024).toFixed(1) + ' KB';
            const ext = file.name.split('.').pop().toLowerCase();
            document.getElementById('aiFileIcon').textContent = ext === 'pdf' ? '📄' : '🖼️';
            document.getElementById('aiFileInfo').classList.remove('hidden');
            document.getElementById('aiResultArea').classList.add('hidden');
            document.getElementById('aiErrorArea').classList.add('hidden');
            document.getElementById('aiRegisterBtn').classList.add('hidden');
            lucide.createIcons();
        }

        function clearAiFile() {
            aiSelectedFile = null;
            document.getElementById('aiFileInput').value = '';
            document.getElementById('aiFileInfo').classList.add('hidden');
            document.getElementById('aiResultArea').classList.add('hidden');
            document.getElementById('aiErrorArea').classList.add('hidden');
            document.getElementById('aiRegisterBtn').classList.add('hidden');
        }

        function showAiError(msg) {
            document.getElementById('aiErrorMsg').textContent = msg;
            document.getElementById('aiErrorArea').classList.remove('hidden');
            document.getElementById('aiLoadingArea').classList.add('hidden');
            lucide.createIcons();
        }

        async function startAiScan() {
            const apiKey = document.getElementById('geminiApiKey').value.trim();
            if (!apiKey) {
                showAiError('Google Gemini API 키를 입력해주세요. (https://aistudio.google.com/apikey 에서 무료 발급)');
                return;
            }
            if (!apiKey.startsWith('AIza')) {
                showAiError('API 키 형식이 올바르지 않습니다. "AIza"로 시작하는 키를 입력해주세요. (https://aistudio.google.com/apikey)');
                return;
            }
            if (!aiSelectedFile) {
                showAiError('먼저 분석할 파일을 선택해주세요.');
                return;
            }

            // [수정] API 키를 메모리 변수에만 저장 (sessionStorage 미사용)
            _geminiApiKeyMemory = apiKey;

            document.getElementById('aiLoadingArea').classList.remove('hidden');
            document.getElementById('aiResultArea').classList.add('hidden');
            document.getElementById('aiErrorArea').classList.add('hidden');
            document.getElementById('aiRegisterBtn').classList.add('hidden');
            document.getElementById('aiScanBtn').disabled = true;

            const loadingMsgs = [
                'AI가 문서를 분석하고 있습니다...',
                '근로자 정보를 추출하는 중...',
                '주민번호 및 연락처 인식 중...',
                '명세서 등록 준비 중...'
            ];
            let msgIdx = 0;
            const loadingInterval = setInterval(() => {
                msgIdx = (msgIdx + 1) % loadingMsgs.length;
                const el = document.getElementById('aiLoadingText');
                if (el) el.textContent = loadingMsgs[msgIdx];
            }, 1800);

            try {
                // 파일 → base64
                const base64Data = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result.split(',')[1]);
                    reader.onerror = () => reject(new Error('파일 읽기 실패'));
                    reader.readAsDataURL(aiSelectedFile);
                });

                const mimeType = aiSelectedFile.type;
                const extraInstruction = document.getElementById('aiExtraInstruction').value.trim();

                const prompt = `이 문서에서 모든 근로자(인부, 기공, 작업자 등) 정보를 추출하여 JSON 배열로만 응답하세요. 마크다운 코드블록 없이 순수 JSON만.

응답 형식:
[{"name":"홍길동","ssn":"820512-1000000","job":"보통인부","phone":"010-1234-5678","address":"강원도 원주시 무실동 123","bank":"국민은행","account":"110-384-592812","price":180000}]

규칙:
- name: 성명 (필수)
- ssn: 주민등록번호 XXXXXX-XXXXXXX 형식 (없으면 "000000-0000000")
- job: 직종 (없으면 "보통인부")
- phone: 연락처 (없으면 "")
- address: 주소 (없으면 "")
- bank: 은행명 (없으면 "")
- account: 계좌번호 (없으면 "")
- price: 일당 단가 숫자 (없으면 180000)
${extraInstruction ? '\n추가 지시사항: ' + extraInstruction : ''}

JSON 배열만 응답. 설명 없이.`;

                // Gemini API 호출 (gemini-2.5-flash-preview-05-20)
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{
                                parts: [
                                    { inline_data: { mime_type: mimeType, data: base64Data } },
                                    { text: prompt }
                                ]
                            }],
                            generationConfig: { temperature: 0.1, maxOutputTokens: 4096 }
                        })
                    }
                );

                clearInterval(loadingInterval);

                if (!response.ok) {
                    const errData = await response.json();
                    const errMsg = errData.error?.message || `API 오류 (${response.status})`;
                    if (response.status === 400 && errMsg.includes('API_KEY')) {
                        throw new Error('API 키가 올바르지 않습니다. aistudio.google.com/apikey 에서 확인해주세요.');
                    }
                    throw new Error(errMsg);
                }

                const data = await response.json();
                const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

                if (!rawText) throw new Error('AI 응답이 비어있습니다. 다시 시도해주세요.');

                // JSON 파싱 (코드블록 제거)
                let parsed;
                try {
                    const cleaned = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
                    // 배열 부분만 추출
                    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
                    if (!jsonMatch) throw new Error('JSON 배열을 찾을 수 없습니다.');
                    parsed = JSON.parse(jsonMatch[0]);
                } catch (e) {
                    throw new Error('AI 응답 파싱 실패: ' + rawText.substring(0, 300));
                }

                if (!Array.isArray(parsed) || parsed.length === 0) {
                    throw new Error('문서에서 근로자 정보를 찾지 못했습니다. 명단이 포함된 파일인지 확인해주세요.');
                }

                aiScanData = parsed;
                renderAiPreview(parsed);

            } catch (err) {
                clearInterval(loadingInterval);
                showAiError(err.message || '알 수 없는 오류가 발생했습니다.');
            } finally {
                document.getElementById('aiLoadingArea').classList.add('hidden');
                document.getElementById('aiScanBtn').disabled = false;
            }
        }

        function renderAiPreview(list) {
            const tbody = document.getElementById('aiPreviewBody');
            tbody.innerHTML = '';
            list.forEach((p, i) => {
                const tr = document.createElement('tr');
                tr.className = 'hover:bg-slate-50';
                tr.innerHTML = `
                    <td class="p-2 border-r border-slate-200 font-bold text-slate-500">${i + 1}</td>
                    <td class="p-2 border-r border-slate-200 font-bold text-blue-700">${p.name || '-'}</td>
                    <td class="p-2 border-r border-slate-200 font-mono text-[10px]">${p.ssn || '-'}</td>
                    <td class="p-2 border-r border-slate-200">${p.job || '보통인부'}</td>
                    <td class="p-2 border-r border-slate-200 font-mono text-[10px]">${p.phone || '-'}</td>
                    <td class="p-2 border-r border-slate-200 text-slate-500 text-[10px]">${p.address ? p.address.substring(0, 15) + (p.address.length > 15 ? '...' : '') : '-'}</td>
                    <td class="p-2 font-mono font-bold text-emerald-700">${p.price ? Number(p.price).toLocaleString() + '원' : '미정'}</td>
                `;
                tbody.appendChild(tr);
            });

            document.getElementById('aiResultCount').textContent = `${list.length}명 인식됨`;
            document.getElementById('aiResultArea').classList.remove('hidden');
            document.getElementById('aiRegisterBtn').classList.remove('hidden');
            lucide.createIcons();
        }

        function editAiResult() {
            const editArea = document.getElementById('aiResultEditArea');
            const jsonArea = document.getElementById('aiResultJson');
            if (editArea.classList.contains('hidden')) {
                jsonArea.value = JSON.stringify(aiScanData, null, 2);
                editArea.classList.remove('hidden');
            } else {
                editArea.classList.add('hidden');
            }
        }

        function applyEditedResult() {
            try {
                const parsed = JSON.parse(document.getElementById('aiResultJson').value);
                if (!Array.isArray(parsed)) throw new Error('배열 형식이어야 합니다.');
                aiScanData = parsed;
                renderAiPreview(parsed);
                document.getElementById('aiResultEditArea').classList.add('hidden');
                showToast('편집 내용이 반영되었습니다.');
            } catch (e) {
                showAiError('JSON 형식 오류: ' + e.message);
            }
        }

        function registerAiResults() {
            if (!aiScanData || aiScanData.length === 0) {
                showAiError('등록할 근로자 데이터가 없습니다.');
                return;
            }
            const proj = appState.projects[appState.currentProjectId];
            if (!proj) {
                showAiError('활성화된 현장 대장이 없습니다.');
                return;
            }

            let added = 0, skipped = 0;
            aiScanData.forEach(p => {
                const name = (p.name || '미상').trim();
                const ssn = (p.ssn || '000000-0000000').replace(/[^0-9\-]/g, '');
                const isDuplicate = proj.labors.some(l => l.name === name && l.ssn === ssn);
                if (isDuplicate) { skipped++; return; }

                const newLabor = {
                    id: 'l_ai_' + (crypto.randomUUID ? crypto.randomUUID() : Date.now() + '_' + Math.random().toString(36).substr(2, 9)),
                    name, job: p.job || '보통인부', ssn,
                    phone: p.phone || '', bank: p.bank || '',
                    account: p.account || '', safetyEdu: false,
                    address: p.address || '',
                    price: parseInt(p.price) || 180000,
                    visa: '대한민국', manualDays: null, attendance: {}
                };
                for (let d = 1; d <= 31; d++) newLabor.attendance[d] = 0;
                proj.labors.push(newLabor);
                added++;
            });

            saveToLocalStorage();
            updateHeaderAndTable();
            closeAiScanModal();

            let toastMsg = `🤖 AI 인식 완료: ${added}명 대장 등록`;
            if (skipped > 0) toastMsg += ` (${skipped}명 중복 제외)`;
            showToast(toastMsg);
        }
