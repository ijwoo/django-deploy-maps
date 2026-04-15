# 중간지점 찾기

여러 명의 출발지를 입력하면 딱 중간에 있는 지하철역을 찾아주는 웹 서비스입니다.

## 주요 기능

- **중간지점 계산** — 최대 5개 출발지 입력 후 중간 좌표 계산, 가장 가까운 지하철역 자동 탐색
- **대중교통 경로** — 각 출발지에서 중간역까지 소요시간 · 요금 표시 (T맵 API)
- **지도 클릭 입력** — 지도를 클릭하면 해당 위치 주소가 자동으로 입력칸에 채워짐
- **현재 위치 추가** — GPS로 내 위치를 자동으로 주소 변환 후 입력
- **장소 검색** — 키워드로 장소 검색 후 클릭하면 출발지로 바로 지정

## 기술 스택

| 구분 | 기술 |
|---|---|
| Backend | Python 3.11, Django 4.2 |
| Frontend | HTML5, CSS3, Vanilla JS |
| Map | Kakao Maps SDK |
| Transit | T맵 대중교통 API |
| Infra | Vercel |

## 로컬 실행

```bash
# 가상환경 활성화
source myvenv/bin/activate  # Windows: myvenv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 서버 실행
python manage.py runserver
```

접속: `http://localhost:8000`

## 배포 (Vercel)

Vercel에 GitHub 레포를 연결하면 push 시 자동 배포됩니다.

- `vercel.json` — 빌드 및 라우팅 설정
- `build_files.sh` — 빌드 시 `collectstatic` 실행 및 정적 파일 복사
- 환경변수 `SECRET_KEY` 는 Vercel 프로젝트 Settings → Environment Variables에서 설정

## 구조

```
django-deploy-maps/
├── maps/
│   ├── static/js/
│   │   ├── midpoint.js   # 중간지점 계산, 지도 클릭 입력
│   │   ├── search.js     # 장소 검색, 출발지 지정
│   │   └── address.js    # 입력 관리, 현재 위치
│   └── templates/maps/
│       └── kakao_maps.html
├── myproject/
│   └── settings.py
├── vercel.json
└── build_files.sh
```

---

Made by ijwoo · 2023
