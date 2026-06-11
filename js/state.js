let appState = {
            currentProjectId: "", 
            projects: {} 
        };

        let currentDensity = 'normal'; // 'narrow', 'normal', 'wide'

        const DEFAULT_PROJECT_ID = "p_1";
        const demoData = {
            currentProjectId: DEFAULT_PROJECT_ID,
            projects: {
                "p_1": {
                    company: "(합)유일건설",
                    representative: "김민지",
                    year: 2026,
                    month: 4,
                    projectName: "원주 캠프통 문화체육공원 조성사업 중 조경·시설물공사(하도급)",
                    workType: "조경시설물공사",
                    labors: [
                        {
                            id: "l_1",
                            name: "홍길동",
                            job: "보통인부",
                            ssn: "820512-1000000", 
                            phone: "010-3333-4444", 
                            bank: "국민은행",
                            account: "110-384-592812",
                            safetyEdu: true,
                            address: "강원특별자치도 원주시 무실동 123-4",
                            price: 180000,
                            visa: "대한민국",
                            manualDays: null, 
                            attendance: {
                                1: 1, 2: 1, 3: 1, 4: 0, 5: 0, 6: 1, 7: 1, 8: 1, 9: 1, 10: 1,
                                11: 0, 12: 0, 13: 1, 14: 1, 15: 1, 16: 1, 17: 1, 18: 0, 19: 0, 20: 1,
                                21: 1, 22: 1, 23: 1, 24: 1, 25: 0, 26: 0, 27: 1, 28: 1, 29: 1, 30: 1, 31: 0
                            }
                        },
                        {
                            id: "l_2",
                            name: "김철수",
                            job: "기공(조경)",
                            ssn: "750403-1000000",
                            phone: "010-5555-6666",
                            bank: "농협은행",
                            account: "352-1234-5678-91",
                            safetyEdu: true,
                            address: "강원특별자치도 원주시 단계동 아파트 101동",
                            price: 210000,
                            visa: "대한민국",
                            manualDays: null,
                            attendance: {
                                1: 1, 2: 1, 3: 0, 4: 0, 5: 1, 6: 1, 7: 1, 8: 0, 9: 0, 10: 0,
                                11: 0, 12: 0, 13: 1, 14: 1, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 1,
                                21: 1, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 1, 31: 0
                            }
                        },
                        {
                            id: "l_3",
                            name: "이순구 (고령자)",
                            job: "보통인부",
                            ssn: "600215-1000000",
                            phone: "010-7777-8888",
                            bank: "신한은행",
                            account: "110-482-948512",
                            safetyEdu: true,
                            address: "서울특별시 서초구 서초대로 45",
                            price: 150000,
                            visa: "대한민국",
                            manualDays: null,
                            attendance: {
                                1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 1, 7: 1, 8: 1, 9: 1, 10: 0,
                                11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0,
                                21: 0, 22: 0, 23: 1, 24: 1, 25: 1, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0
                            }
                        }
                    ]
                }
            }
        };

        // 주민등록번호를 파싱하여 프로젝트 귀속 시점 기준 만 나이를 연산하는 핵심 함수
        // 동일 인자에 대한 반복 호출 비용 절감을 위해 메모이제이션 적용
        // [수정] 나이 계산 시 월(month)뿐만 아니라 일(day)까지 비교하여 정확한 만 나이 산출
        