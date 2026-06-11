function calculateDeductions(labor, daysCount) {
            const proj = appState.projects[appState.currentProjectId];
            const effectiveDays = (labor.manualDays !== null && labor.manualDays !== undefined) ? labor.manualDays : daysCount;
            const totalWages = Math.floor(labor.price * effectiveDays);
            
            // 귀속 연도 및 귀속월 기준 정확한 '만 나이' 기반 세제 혜택 판정
            // [수정] 귀속월 말일 기준으로 나이 계산 — 해당 월 중 생일이 지났으면 면제 혜택 반영
            const lastDayOfMonth = new Date(proj.year, proj.month, 0).getDate();
            const { age, isPensionExempt, isEmploymentExempt } = getExactInsuranceAge(labor.ssn, proj.year, proj.month, lastDayOfMonth);

            let pension = 0;
            let health = 0;
            let care = 0;
            let employment = 0;
            let incomeTax = 0;
            let localTax = 0;

            if (totalWages > 0) {
                // 고용보험 (실업급여): 근로자부 요율 0.9% 전체 적용 (법적 고용보험 만65세 이상 취득자는 실업급여부 면제)
                if (!isEmploymentExempt) {
                    employment = Math.floor(totalWages * 0.009);
                }

                // 국민, 건강, 장기요양 (월 8일 이상 근로 시 정규 취득 대상이 됨)
                if (effectiveDays >= 8) {
                    // 국민연금: 근로자 요율 4.5% 적용 (법적 국민연금 만60세 이상은 납부 예외)
                    if (!isPensionExempt) {
                        pension = Math.floor(totalWages * 0.045);
                    }
                    health = Math.floor(totalWages * 0.03545);
                    care = Math.floor(health * 0.1295);
                }

                // 2026 일용직 소득세 일별 소액부징수 법령 정밀 준수
                // (일당 - 15만원 비과세 공제 후 원천세율 2.7% 적용 시, 일별 소득세액이 1,000원 미만이면 전액 0원 징수 제외)
                if (labor.price > 150000) {
                    const dailyCalculatedTax = Math.floor((labor.price - 150000) * 0.027);
                    
                    if (dailyCalculatedTax >= 1000) {
                        const dailyLocalTax = Math.floor(dailyCalculatedTax * 0.1);
                        incomeTax = dailyCalculatedTax * effectiveDays;
                        localTax = dailyLocalTax * effectiveDays;
                    }
                }
            }

            const totalDeduction = pension + health + care + employment + incomeTax + localTax;
            const netPay = totalWages - totalDeduction;

            return {
                effectiveDays,
                totalWages,
                pension,
                health,
                care,
                employment,
                incomeTax,
                localTax,
                totalDeduction,
                netPay
            };
        }

        // 현장 대장 수정 모달 열기/닫기
        