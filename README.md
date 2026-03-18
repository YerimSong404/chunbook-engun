#  독서모임 관리 앱 (Chun-book In-gun)

천북인권 독서모임 관리 앱은 독서모임의 일정, 발제자, 발제 내용, 멤버들의 답변을 효율적으로 기록하고 관리할 수 있도록 돕는 웹 애플리케이션입니다.

## 주요 기능

- **홈 (투데이)**: 다가오는 다음 독서모임 정보(날짜, 책 표지, 발제자)를 가장 직관적으로 확인합니다.
- **내서재 (이전 모임)**: 이제까지 진행했던 모든 독서모임 기록을 한눈에 모아보고, 연도별/발제자별/최신순 정렬 등 세부 필터링이 가능합니다.
- **피드 (발제자 현황)**: 멤버별 발제 횟수를 자동으로 추적하고, 현재 진행 중인 발제 로테이션(회차) 현황을 한눈에 파악합니다.
- **기록 (서기 기록)**: 모임 당일, 다수의 멤버가 남긴 답변을 각 발제(문항)별로 한 번에 입력하고 간편하게 일괄 저장합니다.
- **관리**: 멤버를 추가/삭제하거나 전체 모임 목록을 제어하고, 독서모임을 새롭게 추가하거나 모임 세부 정보(도서명, 날짜, 표지 사진, 발제 내용 등)를 편집할 수 있습니다.

## 설치 및 실행 방법

본 프로젝트는 [Next.js](https://nextjs.org/)를 기반으로 작성되었습니다.

### 1단계: 패키지 설치
\`\`\`bash
npm install
# 또는
yarn install
# 또는
pnpm install
\`\`\`

### 2단계: 개발 서버 실행
\`\`\`bash
npm run dev
# 또는
yarn dev
# 또는
pnpm dev
\`\`\`

브라우저를 열고 [http://localhost:3000](http://localhost:3000) 에 접속하여 앱을 확인할 수 있습니다.

## 모바일 테스트 (Expo)

모바일 앱은 `mobile` 폴더의 Expo(React Native) 프로젝트입니다. 웹과 같은 Firebase를 사용하므로 Firebase 설정이 모바일에서도 필요합니다.

**1. 의존성 설치 및 개발 서버 실행**
```bash
cd mobile
npm install
npm start
```
터미널에 QR 코드와 함께 Metro 번들러가 실행됩니다.

**2. 실기기에서 테스트 (Expo Go)**

- 스마트폰에 **Expo Go** 앱 설치 ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779))
- PC와 휴대폰을 **같은 Wi‑Fi**에 연결
- `npm start` 후 나온 **QR 코드** 스캔  
  - Android: Expo Go 앱에서 QR 스캔  
  - iOS: 카메라로 QR 스캔 후 "Expo Go에서 열기" 선택
- 앱이 로드되면 사용자 선택 후 마이페이지·발제자·서기 등 기능을 실기기에서 확인

**3. 에뮬레이터/시뮬레이터**

- **Android**: Android Studio로 AVD 생성 후 `npm run android` 또는 `npm start` 후 터미널에서 `a` 입력
- **iOS** (Mac만): `npm run ios` 또는 `npm start` 후 터미널에서 `i` 입력

실기기 테스트 시 PC와 휴대폰이 같은 네트워크에 있어야 하며, 방화벽에서 19000·19001 포트가 막혀 있지 않아야 합니다.

## 모바일 앱 빌드 (설치 파일 만들기)

Expo **EAS Build**로 APK(Android) 또는 IPA(iOS)를 만들어 설치할 수 있습니다.

### 사전 준비

1. [Expo 계정](https://expo.dev) 가입
2. EAS CLI 설치 (한 번만)
   ```bash
   npm install -g eas-cli
   ```
3. 로그인
   ```bash
   eas login
   ```

### Android APK (내부 테스트용, 스토어 없이 설치)

설치 파일(.apk) 하나로 팀원에게 배포할 때 적합합니다.

```bash
cd mobile
eas build --platform android --profile preview
```

빌드가 끝나면 [expo.dev](https://expo.dev) 대시보드에서 **APK 다운로드 링크**를 받을 수 있습니다. 링크를 휴대폰으로 보내 받아 설치하면 됩니다.

### Android AAB (Google Play 스토어 제출용)

스토어에 올릴 때는 다음 명령으로 AAB를 만듭니다.

```bash
cd mobile
eas build --platform android --profile production
```

생성된 `.aab` 파일을 Google Play Console에 업로드해 앱을 배포합니다.

### iOS (Apple 기기)

Apple Developer 계정이 필요합니다.

```bash
cd mobile
eas build --platform ios --profile production
```

### 프로필 정리 (eas.json 기준)

| 프로필 | 용도 | Android | iOS |
|--------|------|---------|-----|
| `preview` | 내부 테스트용 APK | APK | - |
| `production` | 스토어/정식 배포 | AAB | IPA |

빌드 진행 상황과 로그는 [expo.dev](https://expo.dev) 대시보드에서 확인할 수 있습니다.

## 기술 스택

- **프레임워크**: [Next.js 14+](https://nextjs.org/) (App Router 기반)
- **언어**: TypeScript
- **스타일링**: CSS Modules / Global CSS 변수 (바닐라 CSS 기반 다크모드 및 토큰 시스템 설계)
- **데이터베이스/저장소**: 클라이언트 사이드 스토리지 (IndexedDB) 활용 (`lib/db.ts` 참조)

## 책 표지 검색 (선택)

모임 등록 시 책 제목·저자로 표지를 검색할 수 있습니다.

- **한국 도서**: [알라딘 API 키 발급](https://www.aladin.co.kr/ttb/wblog_manage.aspx)에서 사용할 URL을 등록한 뒤 발급받은 **TTBKey**를 `.env.local`에 추가하면 **알라딘 책 검색**이 우선 사용됩니다.
  ```env
  ALADIN_TTB_KEY=발급받은_TTB키
  ```
- **미설정 시**: API 키 없이 Open Library 검색만 사용됩니다(해외 도서 위주).

## 향후 개선 사항

- 외부 클라우드 데이터베이스(Supabase, Firebase 등)를 연동한 실시간 동기화 지원
- 독서 모임 참여자별 개별 로그인 및 소셜 로그인 연동
- 모임 후기 및 사진첩(갤러리) 공유 기능 도입
