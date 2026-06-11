const _insuranceAgeCache = new Map();
        function getExactInsuranceAge(ssn, projectYear, projectMonth, projectDay) {
            // projectDay 미전달 시 해당 월의 1일 기준으로 보수적 계산 (면제 혜택 불이익 방지)
            const refDay = projectDay || 1;
            const cacheKey = `${ssn}|${projectYear}|${projectMonth}|${refDay}`;
            if (_insuranceAgeCache.has(cacheKey)) return _insuranceAgeCache.get(cacheKey);
            if (!ssn) return { age: 30, birthYear: 1996, isPensionExempt: false, isEmploymentExempt: false };
            const clean = ssn.replace(/[^0-9]/g, '');
            if (clean.length < 7) return { age: 30, birthYear: 1996, isPensionExempt: false, isEmploymentExempt: false };

            const yyStr = clean.substring(0, 2);
            const mmStr = clean.substring(2, 4);
            const ddStr = clean.substring(4, 6); // [수정] 생일 '일(day)' 파싱 추가
            const gStr  = clean.substring(6, 7);

            const yy = parseInt(yyStr, 10);
            const mm = parseInt(mmStr, 10);
            const dd = parseInt(ddStr, 10); // [수정] 생일 '일' 변수 추가
            const g  = parseInt(gStr,  10);

            let birthYear = 1900 + yy;
            if (g === 3 || g === 4 || g === 7 || g === 8) {
                birthYear = 2000 + yy;
            } else if (g === 0 || g === 9) {
                birthYear = 1800 + yy;
            } else if (g === 1 || g === 2 || g === 5 || g === 6) {
                birthYear = 1900 + yy;
            } else {
                birthYear = (yy <= 30) ? 2000 + yy : 1900 + yy;
            }

            // [수정] 연·월·일 모두 비교하여 정확한 만 나이 산출
            // 예: 생일 4월 15일, 기준일 4월 10일 → 아직 생일 미도래 → 1살 차감
            let exactAge = projectYear - birthYear;
            if (projectMonth < mm) {
                exactAge -= 1; // 기준월이 생월보다 이전 → 생일 미도래
            } else if (projectMonth === mm && refDay < dd) {
                exactAge -= 1; // 같은 달이지만 기준일이 생일 이전 → 생일 미도래
            }

            // 만 60세 이상은 국민연금 징수 대상에서 법적 제외
            const isPensionExempt = exactAge >= 60;
            // 만 65세 이상은 고용보험(근로자부 실업급여 0.9%) 징수 대상에서 법적 제외
            const isEmploymentExempt = exactAge >= 65;

            const result = {
                age: exactAge,
                birthYear,
                isPensionExempt,
                isEmploymentExempt
            };
            _insuranceAgeCache.set(cacheKey, result);
            return result;
        }

        // 커스텀 알림/컨펌창 헬퍼 함수
        function showCustomConfirm(message, onConfirm, onCancel = null) {
            const modal = document.getElementById('customAlertModal');
            const msgEl = document.getElementById('alertMessage');
            const confirmBtn = document.getElementById('alertConfirmBtn');
            const cancelBtn = document.getElementById('alertCancelBtn');

            msgEl.innerText = message;
            cancelBtn.classList.remove('hidden');
            modal.classList.remove('hidden');

            const handleConfirm = () => {
                cleanup();
                if (onConfirm) onConfirm();
            };
            const handleCancel = () => {
                cleanup();
                if (onCancel) onCancel();
            };

            const cleanup = () => {
                confirmBtn.removeEventListener('click', handleConfirm);
                cancelBtn.removeEventListener('click', handleCancel);
                modal.classList.add('hidden');
            };

            confirmBtn.addEventListener('click', handleConfirm);
            cancelBtn.addEventListener('click', handleCancel);
        }

        function showCustomAlert(message) {
            const modal = document.getElementById('customAlertModal');
            const msgEl = document.getElementById('alertMessage');
            const confirmBtn = document.getElementById('alertConfirmBtn');
            const cancelBtn = document.getElementById('alertCancelBtn');

            msgEl.innerText = message;
            cancelBtn.classList.add('hidden');
            modal.classList.remove('hidden');

            const handleConfirm = () => {
                modal.classList.add('hidden');
                confirmBtn.removeEventListener('click', handleConfirm);
            };
            confirmBtn.addEventListener('click', handleConfirm);
        }

        // 주민등록번호 하이픈(-) 필터링 (외국인 등록번호 호환)
        function ssnHyphenFilter(val) {
            let num = val.replace(/[^0-9]/g, '');
            if (num.length <= 6) {
                return num;
            } else {
                return num.slice(0, 6) + '-' + num.slice(6, 13);
            }
        }

        // 연락처 하이픈(-) 필터링
        function phoneHyphenFilter(val) {
            let num = val.replace(/[^0-9]/g, '');
            if (num.length < 4) return num;
            if (num.length < 7) {
                return num.slice(0, 3) + '-' + num.slice(3);
            } else if (num.length < 11) {
                return num.slice(0, 3) + '-' + num.slice(3, 6) + '-' + num.slice(6);
            } else {
                return num.slice(0, 3) + '-' + num.slice(3, 7) + '-' + num.slice(7, 11);
            }
        }

        // 계좌번호 필터링
        function accountHyphenFilter(val) {
            return val.replace(/[^0-9\-]/g, '');
        }

        // 천단위 금액 포맷터
        function commaFormatter(val) {
            if (val === undefined || val === null || isNaN(val)) return "0";
            return Math.floor(val).toLocaleString();
        }

        // 포맷터 이벤트 리스너 바인딩
        function bindFormatters() {
            const newSsn = document.getElementById('newSsn');
            const newPhone = document.getElementById('newPhone');
            const newAccount = document.getElementById('newAccount');
            const newPrice = document.getElementById('newPrice');

            newSsn.addEventListener('input', function(e) {
                e.target.value = ssnHyphenFilter(e.target.value);
            });
            newPhone.addEventListener('input', function(e) {
                e.target.value = phoneHyphenFilter(e.target.value);
            });
            newAccount.addEventListener('input', function(e) {
                e.target.value = accountHyphenFilter(e.target.value);
            });
            newPrice.addEventListener('input', function(e) {
                let clean = e.target.value.replace(/[^0-9]/g, '');
                e.target.value = clean ? parseInt(clean).toLocaleString() : '';
            });

            const detailSsn = document.getElementById('detailSsn');
            const detailPhone = document.getElementById('detailPhone');
            const detailAccount = document.getElementById('detailAccount');

            detailSsn.addEventListener('input', function(e) {
                e.target.value = ssnHyphenFilter(e.target.value);
            });
            detailPhone.addEventListener('input', function(e) {
                e.target.value = phoneHyphenFilter(e.target.value);
            });
            detailAccount.addEventListener('input', function(e) {
                e.target.value = accountHyphenFilter(e.target.value);
            });

            // 복수 추가용 단가 콤마 자동 바인딩
            const bulkPrice = document.getElementById('bulkPrice');
            bulkPrice.addEventListener('input', function(e) {
                let clean = e.target.value.replace(/[^0-9]/g, '');
                e.target.value = clean ? parseInt(clean).toLocaleString() : '';
            });
        }

        // 초기기동
        window.onload = function() {
            initApp();
            bindFormatters();
            applyZoom(95); 
            applyDensity('normal'); 
            setupKeyboardNavigation();
            setupDragRangeListeners(); // 드래그 범위 기입 이벤트 등록
        };

        