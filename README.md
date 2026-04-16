# 중간지점 찾기

여러 명의 출발지를 입력하면 딱 중간에 있는 지하철역·기차역·버스터미널을 찾아주는 웹 서비스입니다.

## 주요 기능

- **중간지점 계산** — 최대 5개 출발지의 좌표 평균으로 중간 지점 산출
- **교통 거점 탐색** — 중간 지점 10km 이내에서 지하철역 → 기차역 → 버스터미널 순으로 탐색
- **근거리 예외 처리** — 모든 출발지가 2km 이내로 가까우면 "근처에서 만나세요" 안내
- **대중교통 경로** — 각 출발지 → 중간 거점까지 소요시간·요금 표시 (SK T맵 API)
- **모달 장소 검색** — 출발지 입력칸 클릭 시 카카오 장소 검색 모달로 빠르게 선택
- **현재 위치 추가** — GPS로 내 위치를 자동으로 주소 변환 후 입력
- **사이드바 장소 검색** — 키워드 검색 후 "출발지로 지정" 버튼으로 바로 추가
- **모바일 최적화** — 하단 시트 패널, 터치 타겟 44px, iOS 입력 줌 방지

## 기술 스택

| 구분 | 기술 |
|---|---|
| Backend | Python 3.11, Django 4.2 |
| Frontend | HTML5, CSS3, Vanilla JS |
| Map | Kakao Maps SDK |
| Search | Kakao Local API |
| Transit | SK T맵 대중교통 API |
| Static | WhiteNoise |
| Infra | Vercel |

## 로컬 실행

```bash
# 가상환경 활성화
myvenv\Scripts\activate  # Windows

# 의존성 설치
pip install -r requirements.txt

# 정적 파일 수집
python manage.py collectstatic --noinput

# 서버 실행
python manage.py runserver
```

접속: `http://localhost:8000`

## 배포 (Vercel)

GitHub 레포를 Vercel에 연결하면 `master` 브랜치 push 시 자동 배포됩니다.

- `vercel.json` — 빌드 및 라우팅 설정
- `build_files.sh` — 빌드 시 `collectstatic` 실행
- 환경변수 `SECRET_KEY` — Vercel 프로젝트 Settings → Environment Variables에서 설정

> **주의:** WhiteNoise가 `staticfiles/` 를 직접 서빙하므로, 정적 파일 변경 시 반드시 `collectstatic` 후 `staticfiles/` 를 함께 커밋해야 반영됩니다.

## 구조

```
django-deploy-maps/
├── maps/
│   ├── static/
│   │   ├── js/
│   │   │   ├── midpoint.js   # 지도 초기화, 중간지점 계산, 경로 탐색
│   │   │   ├── address.js    # 출발지 입력 관리, 모달 검색, 현재 위치
│   │   │   └── search.js     # 사이드바 장소 검색
│   │   └── css/
│   │       └── styles.css
│   └── templates/maps/
│       └── kakao_maps.html
├── staticfiles/              # collectstatic 결과물 (git 추적)
├── myproject/
│   └── settings.py
├── vercel.json
└── build_files.sh
```

---

Made by ijwoo · 2025
