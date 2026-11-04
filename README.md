# ☁ 힐링 월드 (Healing World)

🌐 **https://asmr-healingworld.com/**

귀여운 3D 미니어처 캐릭터들이 사는 디오라마 공간을 둘러보며 ASMR 사운드를 믹싱해 듣는 힐링 웹 앱 (MVP).

- **React 18 + TypeScript + Vite**
- **Three.js + React Three Fiber + drei**: 모든 캐릭터와 오브젝트는 코드로 만든 3D 형태 (외부 모델 파일 없음)
- **Web Audio API**: 여러 루프 동시 재생, 개별 볼륨, 페이드 인/아웃, 전체 음소거

## 기능 (v2)

로그인 없이 동작하며, 개인 데이터는 이 브라우저(localStorage)에만 저장됩니다. 서버 비용 0원.

| 분류 | 기능 |
|---|---|
| 쉬는 시간 | ⏰ 수면 타이머(마지막 1분 페이드아웃) · 🍅 집중 타이머(25/5, 50/10) · 🌬️ 호흡 가이드(편안한/4-7-8/상자) · 🌙 수면 모드 · 🧭 월드 여행 모드 |
| 나만의 공간 | ♥ 즐겨찾기 · 최근 월드 · 💾 믹스 프리셋 · 🔗 믹스 공유 링크(`#/world/<id>/mix/<코드>`) · 🧸 내 캐릭터 꾸미기(월드에 함께 등장) · 📅 힐링 기록/연속 방문/월드 스탬프 · 💌 오늘의 한마디 · 🙂 기분 체크인 → 추천 월드 |
| 재미 | 📸 장면 사진 카드(1080×1920) · 🔍 월드마다 숨은 친구 · 🍂 계절 효과(낙엽/눈/벚꽃) · 🌅 시간대별 하늘(메인·월드맵) |
| 앱처럼 | 📱 홈 화면 설치(PWA) + 오프라인 · 잠금화면 재생 컨트롤(Media Session) · 소리만 듣기(저사양 모드) · 익명 방문자 통계 자리(`src/config.ts`) |

화면 주소: `#/` 메인 · `#/map` 월드맵 · `#/world/<id>` 월드 · `#/me` 마이 힐링 (`/avatar`, `/settings`)

## 실행 방법

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # dist/ 에 프로덕션 빌드
npm run preview    # 빌드 결과 미리보기
```

## GitHub Pages 로 무료 배포

1. GitHub 에 **Public** 저장소를 만들고 이 코드를 `main` 브랜치에 push 합니다.
2. 저장소 **Settings → Pages → Build and deployment → Source** 를 **GitHub Actions** 로 바꿉니다.
3. 1~2분 뒤 `https://<아이디>.github.io/<저장소이름>/` 에서 열립니다.
   저장소 이름을 `<아이디>.github.io` 로 지으면 `https://<아이디>.github.io/` 로 바로 열립니다 (이 저장소가 그 방식).
   이후에는 `main` 에 push 할 때마다 `.github/workflows/deploy.yml` 이 자동으로 다시 배포합니다.

## 화면 구성

| 화면 | 경로 | 내용 |
|---|---|---|
| 메인 | `#/` | 떠 있는 섬 위의 대표 캐릭터, 로고, 소개 문구, “힐링하러 가기” |
| 월드맵 | `#/map` | 6개 월드를 미니어처 섬으로 한눈에 보기 (데스크톱 3×2 격자). 마우스를 올리면 섬이 떠오르고, 클릭하면 이동. 모바일에서는 스와이프 캐러셀 |
| 월드 상세 | `#/world/:id` | 큰 3D 공간, 캐릭터 애니메이션, 사운드 믹서, 이전/다음 월드 이동 |

## 사운드

`src/data/worlds.ts` 에 사운드마다 `src`(실제 파일 경로)와 `synth`(대체 사운드 종류)가 정의돼 있습니다.

1. `public/sounds/<월드>/<사운드>.mp3` 를 먼저 불러오고
2. 파일이 없거나 디코딩에 실패하면 `src/audio/synth.ts` 가 만든 **절차적 ASMR 사운드**로 자동 대체합니다.

그래서 실제 녹음 파일을 폴더에 넣기만 하면 코드 수정 없이 교체됩니다. 필요한 파일 목록은 `public/sounds/README.md` 를 참고하세요.

## 인터랙션

- 캐릭터를 탭하면 콩 뛰면서 이모지가 떠오름
- 모닥불을 탭하면 장작이 들어가며 불꽃이 커지고 불티가 튐
- 물고기를 탭하면 휙 달아나고, 해파리는 딸랑
- 서점의 책을 탭하면 책이 쏙 빠졌다가 들어가고, 고양이는 꼬리를 흔듦
- 구름 섬의 윈드차임은 크게 흔들리며 딸랑, 새는 짹짹, 하늘을 지나는 구름 버스는 빵
- 이끼 정원의 요정·토끼·딱따구리·대나무 풍경이 반응
- 기차역의 기차는 36초마다 도착 → 문 열림 → 출발을 반복하고, 탭하면 기적 소리. 역 시계의 초침은 실제 시간으로 똑딱
- 드래그로 공간 회전, 휠/핀치로 확대

## 파일 구조

```
healing-world/
├─ index.html
├─ public/sounds/              # 실제 음원을 넣는 곳 (없으면 자동 대체)
└─ src/
   ├─ main.tsx / App.tsx       # 진입점, 해시 라우팅 + 화면 전환 커튼
   ├─ types.ts                 # WorldDef, SoundDef 등 공용 타입
   ├─ data/worlds.ts           # ★ 월드/사운드 데이터 (문구, 테마 색, 카메라, 사운드 목록)
   ├─ audio/
   │  ├─ AudioEngine.ts        # 멀티 루프 믹서 (파일 → 절차적 사운드 대체, 페이드, 음소거, 효과음)
   │  └─ synth.ts              # 32종 ASMR 루프 + 효과음 절차적 생성기
   ├─ hooks/
   │  ├─ useSoundStore.tsx     # 재생/음소거/월드별 믹스 상태 (localStorage 저장) → 엔진 동기화
   │  ├─ useHashRoute.ts       # 의존성 없는 해시 라우터
   │  └─ useMediaQuery.ts
   ├─ three/
   │  ├─ Character.tsx         # 이등신 캐릭터 (헤어스타일·의상·포즈·소품·스노클, 탭 반응)
   │  ├─ common.tsx            # 섬 바닥, 구름, 카메라 인트로, 재질, 이모지 팝 등
   │  ├─ creatures.tsx         # 새, 요정, 토끼
   │  └─ props.tsx             # 나무, 덤불, 바위, 버섯, 꽃, 떠다니는 빛
   ├─ worlds/
   │  ├─ registry.ts           # ★ 월드 id → 3D 씬 매핑
   │  ├─ CampfireWorld.tsx     # WORLD 01 별빛 아래 모닥불
   │  ├─ OceanWorld.tsx        # WORLD 02 파란빛이 머무는 바닷속
   │  ├─ BookstoreWorld.tsx    # WORLD 03 오후 네 시의 작은 서점
   │  ├─ CloudWorld.tsx        # WORLD 04 구름 위 낮잠 정거장
   │  ├─ MossWorld.tsx         # WORLD 05 비밀의 이끼 정원
   │  └─ StationWorld.tsx      # WORLD 06 달빛 기차역
   ├─ scenes/
   │  ├─ HomeScene.tsx         # 메인 화면 3D
   │  └─ MapScene.tsx          # 월드맵 3D (미니어처 섬 3개)
   ├─ screens/                 # HomeScreen / WorldMapScreen / WorldDetailScreen
   ├─ components/              # SoundMixer, MuteButton, Icons
   └─ styles/global.css
```

## 새 월드 추가하기

1. `src/worlds/MyWorld.tsx` 에 `MyDiorama`(공간)와 `MyEnvironment`(배경·조명)를 만듭니다.
2. `src/worlds/registry.ts` 에 `{ mine: { Diorama, Environment, mapScale } }` 를 등록합니다.
3. `src/data/worlds.ts` 의 `WORLDS` 에 제목, 테마 색, 카메라, 사운드 목록을 추가합니다.
4. 음원은 `public/sounds/mine/` 에 넣습니다. 없으면 기존 `synth` 종류 중 하나를 지정하면 됩니다.

월드맵, 이전/다음 이동, 믹서는 데이터를 읽어 자동으로 늘어납니다.
