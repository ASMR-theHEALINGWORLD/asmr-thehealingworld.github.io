# 사운드 파일 넣는 곳

아래 경로에 실제 음원(mp3/ogg/wav)을 넣으면 **자동으로 실제 파일이 우선 재생**됩니다.
파일이 없으면 앱이 Web Audio로 만든 절차적 대체 사운드를 재생합니다.

| 월드 | 파일 경로 | 내용 |
|---|---|---|
| campfire | `campfire/crackle.mp3` | 장작이 타닥타닥 타는 소리 |
| campfire | `campfire/sparks.mp3` | 불꽃이 튀는 소리 |
| campfire | `campfire/crickets.mp3` | 밤하늘의 풀벌레 소리 |
| campfire | `campfire/wind.mp3` | 바람에 나뭇잎이 흔들리는 소리 |
| campfire | `campfire/log.mp3` | 장작을 넣는 소리 |
| ocean | `ocean/deep.mp3` | 깊은 수중 울림 |
| ocean | `ocean/bubbles.mp3` | 보글보글 공기 방울 |
| ocean | `ocean/waves.mp3` | 잔잔한 물결 |
| ocean | `ocean/whale.mp3` | 멀리서 들리는 고래·돌고래 |
| ocean | `ocean/fish.mp3` | 물고기가 물을 가르는 소리 |
| bookstore | `bookstore/rain.mp3` | 창문을 두드리는 빗소리 |
| bookstore | `bookstore/page.mp3` | 책장 넘기는 소리 |
| bookstore | `bookstore/pencil.mp3` | 연필로 글씨 쓰는 소리 |
| bookstore | `bookstore/teacup.mp3` | 찻잔 내려놓는 소리 |
| bookstore | `bookstore/shelf.mp3` | 책을 꺼내고 꽂는 소리 |
| bookstore | `bookstore/steps.mp3` | 나무 바닥 발소리 |
| cloud | `cloud/wind.mp3` | 살랑살랑 높은 하늘의 바람 |
| cloud | `cloud/chime.mp3` | 은은한 풍경(윈드차임) |
| cloud | `cloud/birds.mp3` | 구름 사이 작은 새소리 |
| cloud | `cloud/cloth.mp3` | 바람에 펄럭이는 천 |
| cloud | `cloud/bell.mp3` | 멀리서 희미한 종소리 |
| moss | `moss/leaves.mp3` | 바스락 나뭇잎 |
| moss | `moss/crickets.mp3` | 풀벌레와 귀뚜라미 |
| moss | `moss/woodpecker.mp3` | 딱따구리 |
| moss | `moss/birds.mp3` | 작은 새들의 지저귐 |
| moss | `moss/steps.mp3` | 풀밭을 사박사박 걷는 발소리 |
| moss | `moss/bamboo.mp3` | 대나무·나무 풍경 |
| station | `station/train.mp3` | 멀리서 들리는 기차 주행 소리 |
| station | `station/rail.mp3` | 철로를 지나는 규칙적인 바퀴 소리 |
| station | `station/clock.mp3` | 역 시계 똑딱똑딱 |
| station | `station/steps.mp3` | 조용한 플랫폼 발걸음 |
| station | `station/announce.mp3` | 희미한 안내 방송 |
| station | `station/door.mp3` | 기차 문 열리고 닫히는 소리 |

- 루프 재생되므로 **이음새 없이 반복되는(seamless loop)** 음원을 권장합니다.
- 다른 확장자를 쓰려면 `src/data/worlds.ts` 의 `src` 값만 바꾸면 됩니다.
