# 넘버 스네이크

초등 1~2학년용 모바일 웹 수학 학습 Snake 게임입니다.

## 기능
- 모바일 스와이프 / 데스크톱 방향키 조작
- 덧셈/뺄셈 문제 생성
- 정답 1개 + 오답 5개 숫자 선택지
- 생명 3개, 길이 22칸 달성 시 단계 클리어
- 총 5단계 난이도
- 단계별 배경 테마
- 아이템 시스템
- 문제 음성 읽기(Web Speech API)
- 정답/오답/아이템/클리어 효과음(Web Audio API)
- 최고 점수 저장(localStorage)
- 상태 배너와 튜토리얼 힌트
- 콤보 표시와 진행도 바
- 부드러운 이동 보간과 반응형 보드 연출
- PWA 설치 지원(manifest + service worker)

## 실행 방법
### 방법 1: 파일 직접 열기
`index.html`을 브라우저에서 열면 실행됩니다.

### 방법 2: 로컬 서버 실행
```bash
cd snake-math
python3 -m http.server 8000
```
그 뒤 브라우저에서 `http://localhost:8000` 접속.

## 폴더 구조
```text
snake-math/
  index.html
  README.md
  styles/main.css
  src/
    main.js
    config.js
    utils.js
    problem-generator.js
    choice-generator.js
    item-system.js
    audio-system.js
```

## 주요 구조
- `main.js`: 게임 상태, 루프, 렌더링, 입력, 화면 전환
- `problem-generator.js`: 단계별 수학 문제 생성
- `choice-generator.js`: 정답/오답 숫자 6개 생성
- `item-system.js`: 아이템 생성/소멸/소비 관리
- `audio-system.js`: 문제 음성 읽기
- `config.js`: 상수와 단계/아이템 설정

## 조작
- 모바일: 스와이프
- 데스크톱: 방향키
- 일시정지 / 음소거 / 현재 단계 재시작 버튼 제공

## 향후 개선 포인트
- 효과음 및 배경음 추가
- 최고 점수 저장(localStorage)
- 튜토리얼/온보딩 강화
- 아트 리소스 고도화
- StageClear/GameOver 연출 강화
- Phaser.js 버전으로 리팩터링

## 참고
- 현재 버전은 번들러 없는 정적 웹앱이라 바로 실행이 쉽습니다.
- 음성은 브라우저 정책상 사용자 상호작용 이후 더 안정적으로 동작합니다.
