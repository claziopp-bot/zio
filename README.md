# ✈️ 우리 여행 체크리스트

친구들끼리 여행 갈 때 생각날 때마다 장소를 추가하고, 네이버 지도 검색 연동으로 바로 핀을 찍어주는
공유 체크리스트입니다. 로그인 없이 이름만 입력하고 바로 쓸 수 있어요.

- **누가 추가했는지** 표시
- **네이버 지역 검색 연동** → 장소 이름 검색하면 주소/카테고리 자동으로 채워짐
- **지도에 핀 표시** (네이버 지도 v3)
- **맛집 / 카페 / 체험 / 기타** 카테고리 분류
- **실시간 동기화** → 친구가 추가하면 내 화면에도 바로 뜸 (Supabase Realtime)
- 체크(완료), 삭제 기능

---

## 1. 준비물 만들기 (계정 3개 필요)

전부 무료 플랜으로 충분합니다.

### 1) Supabase (데이터 저장)
1. https://supabase.com 가입 → **New project** 생성 (이름/비밀번호는 아무거나, Region은 Northeast Asia(Seoul) 추천)
2. 프로젝트 생성 후 왼쪽 메뉴 **SQL Editor** 클릭 → 아래 SQL 붙여넣고 실행(Run)

```sql
create table items (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  category text not null default '기타',
  address text,
  place_url text,
  lat double precision,
  lng double precision,
  added_by text not null,
  checked boolean default false,
  created_at timestamptz default now()
);

-- 로그인 없이 누구나 읽고 쓸 수 있게 허용 (친구들끼리 쓰는 용도라 단순하게)
alter table items enable row level security;

create policy "anyone can read" on items for select using (true);
create policy "anyone can insert" on items for insert with check (true);
create policy "anyone can update" on items for update using (true);
create policy "anyone can delete" on items for delete using (true);
```

3. 왼쪽 메뉴 **Database > Replication** (또는 Table Editor에서 items 테이블 옆 톱니바퀴) 에서
   **Realtime**을 `items` 테이블에 대해 켜주세요. (친구가 추가한 게 바로 보이려면 필요)
4. 왼쪽 메뉴 **Settings > API** 에서 `Project URL`과 `anon public` 키를 복사해두세요. (나중에 환경변수에 사용)

### 2) 네이버 지도 (지도 표시용)
1. https://www.ncloud.com (네이버 클라우드 플랫폼) 가입/로그인
2. **Console > Services > Application Services > Maps** 이동 → Application 등록
3. 사용할 API 중 **Dynamic Map**과 **Web Dynamic Map** 체크
4. 등록한 애플리케이션의 **서비스 환경 등록**에 배포할 도메인 추가
   - 로컬 테스트용: `http://localhost:3000`
   - 배포 후: `https://내프로젝트.vercel.app` (Vercel 배포하고 나서 주소 나오면 추가로 등록)
5. **Client ID** 복사해두기

### 3) 네이버 검색 오픈API (장소 검색용)
1. https://developers.naver.com 가입/로그인 → **Application 등록**
2. 사용 API에서 **검색** 체크
3. 비로그인 오픈 API 서비스 환경에 `http://localhost:3000`, `https://내프로젝트.vercel.app` 등록
4. **Client ID / Client Secret** 복사해두기

> 참고: 지도(2번)와 검색(3번)은 서로 다른 네이버 서비스라 키가 따로 나옵니다. 헷갈리지 않게 잘 구분해서 저장해두세요.

---

## 2. 로컬에서 실행해보기

터미널(명령 프롬프트/터미널 앱)을 열고:

```bash
# 압축 푼 폴더로 이동
cd travel-checklist

# 패키지 설치 (Node.js 18 이상 필요, https://nodejs.org 에서 설치)
npm install

# 환경변수 파일 만들기
cp .env.local.example .env.local
```

`.env.local` 파일을 열어서 위에서 복사해둔 값들을 채워 넣으세요:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxxxxx
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=xxxxxxxx
NAVER_SEARCH_CLIENT_ID=xxxxxxxx
NAVER_SEARCH_CLIENT_SECRET=xxxxxxxx
```

실행:

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속해서 확인하세요.

---

## 3. GitHub에 올리기

```bash
git init
git add .
git commit -m "여행 체크리스트 초기 버전"
```

GitHub에서 새 저장소(New repository)를 만든 뒤 (Public/Private 상관없음, README 등 자동 생성 옵션은 체크하지 말 것):

```bash
git remote add origin https://github.com/내아이디/저장소이름.git
git branch -M main
git push -u origin main
```

`.env.local`은 `.gitignore`에 포함돼 있어서 자동으로 GitHub에 올라가지 않습니다. (키 노출 걱정 없음)

---

## 4. Vercel로 배포하기

1. https://vercel.com 가입 (GitHub 계정으로 로그인하면 편함)
2. **Add New > Project** → 방금 올린 GitHub 저장소 선택 → Import
3. **Environment Variables**에 `.env.local`에 적었던 5개 값을 그대로 하나씩 추가
4. **Deploy** 클릭 → 1~2분 뒤 `https://프로젝트이름.vercel.app` 주소 생성됨
5. 이 주소를 위 1-2), 1-3) 단계의 네이버 콘솔 두 곳(지도, 검색)에 다시 가서 **서비스 URL로 등록**해주세요.
   (등록 안 하면 배포된 사이트에서 지도/검색이 안 먹힙니다)
6. 친구들에게 이 링크만 보내주면 끝! 로그인 없이 이름만 입력하고 바로 씁니다.

이후 코드를 수정하고 `git push` 하면 Vercel이 자동으로 재배포해줍니다.

---

## 앞으로 추가하면 좋을 기능 아이디어

- 여행 날짜별 탭 (1일차 / 2일차 …)
- 장소에 투표(👍) / 댓글
- 예산대(₩/₩₩/₩₩₩) 표시
- 지도에서 카테고리별로 마커 색 다르게
- 완료된 곳 vs 안 간 곳 필터
