# ClinePass 통합 분석 노트

이 문서는 Smart Composer(업스트림)를 ClinePass 전용 Obsidian 플러그인으로
개조할 때 확인한 구조와, 실제로 수정한 지점을 정리한 것입니다.

## 1. 업스트림 구조 요약

```
src/
├─ core/llm/
│  ├─ base.ts                  # BaseLLMProvider 추상 클래스
│  │                           #   generateResponse / streamResponse / getEmbedding
│  ├─ manager.ts               # provider.type → 구현체 매핑 (switch)
│  ├─ openaiMessageAdapter.ts  # OpenAI 요청/응답 변환 + 스트리밍 파싱
│  └─ *Provider.ts             # 제공자별 구현 (openai, anthropic, gemini, …)
├─ types/
│  ├─ provider.types.ts        # zod discriminated union (provider.type)
│  ├─ chat-model.types.ts      # zod discriminated union (model.providerType)
│  └─ embedding-model.types.ts # zod discriminated union (임베딩 모델)
├─ settings/schema/
│  ├─ setting.types.ts         # 전체 설정 스키마 (providers/chatModels/embeddingModels)
│  └─ migrations/*.ts          # 버전별 설정 마이그레이션 (현재 v17)
├─ core/rag/                   # PGlite 벡터 DB + 임베딩 기반 유사도 검색
└─ components/settings/        # PROVIDER_TYPES_INFO 기반으로 UI 자동 생성
```

핵심 포인트: **UI와 설정 스키마가 `PROVIDER_TYPES_INFO` + zod union에서 파생**되므로,
새 제공자는 (1) 스키마 (2) 상수 (3) manager switch (4) 구현체 (5) 마이그레이션
다섯 곳만 건드리면 됩니다. 별도 화면 코드를 새로 작성할 필요가 없습니다.

## 2. ClinePass를 외부에서 쓰는 방법 (검증된 사실)

Cline 공식 문서 기준:

- ClinePass는 **월 $9.99 정액 구독**이며, 별도 API가 아니라 **Cline API**로 노출됩니다.
- 엔드포인트: `POST https://api.cline.bot/api/v1/chat/completions` (OpenAI 호환)
- 인증: `Authorization: Bearer <Cline API 키>` (app.cline.bot → Settings → API Keys)
- 모델: `cline-pass/<model>` 슬러그 (예: `cline-pass/kimi-k3`)
- 비스트리밍 응답은 `X-Response-Format: openai` 헤더가 없으면 `data` 아래에 중첩되어
  OpenAI SDK가 파싱하지 못합니다. (스트리밍은 영향 없음)
- 추론 모델은 `delta.reasoning`, 일부는 `delta.reasoning_details`(암호화 블록)를 반환
- **`/api/v1/embeddings`는 존재하지 않음(404)** → 임베딩은 다른 제공자 필요

실측 확인:

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://api.cline.bot/api/v1/models   # 200 (공개)
curl -s -o /dev/null -w '%{http_code}\n' https://api.cline.bot/api/v1/embeddings # 404
```

### CORS 제약 (실측, 중요)

```bash
curl -i -X OPTIONS https://api.cline.bot/api/v1/chat/completions \
  -H 'Origin: app://obsidian.md' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: authorization,content-type,x-response-format'
# → HTTP 204 이지만 Access-Control-Allow-Origin 헤더 없음
```

`vary: Origin`만 있고 ACAO가 없으므로 Obsidian(Electron/WebView)의 `fetch`는 차단됩니다.
그래서 이 포크는 OpenAI SDK 대신 **Obsidian `requestUrl`** 로 호출합니다.
`requestUrl`은 SSE를 소비할 수 없어, 응답을 한 번에 받고 청크로 재생하는 방식으로
프로그레시브 렌더링을 유지합니다.

## 3. 실제 변경 지점

| 파일 | 내용 |
| --- | --- |
| `src/types/provider.types.ts` | `cline-pass` variant 추가 (apiKey는 optional 유지 — 기본 제공자 객체가 키 없이 생성되므로 필수로 만들면 설정 배열 전체가 무효화됨) |
| `src/types/chat-model.types.ts` | `cline-pass` 모델 variant 추가 |
| `src/types/llm/request.ts`, `response.ts` | `providerMetadata.clinePass.reasoningDetails` 추가 |
| `src/core/llm/clinePassProvider.ts` | Obsidian `requestUrl`(CORS 우회)로 Cline API 호출. SSE 미지원 → 응답을 받은 뒤 청크 재생(추론/도구 호출 포함). `stream:false` 명시(Cline 기본값이 true). 401/402/429 오류 매핑 |
| `src/core/llm/clinePassMessageAdapter.ts` | `delta.reasoning` → `reasoning`, `reasoning_details` 저장/재주입 |
| `src/core/llm/manager.ts` | `case 'cline-pass'` 등록 |
| `src/constants.ts` | `CLINEPASS_API_BASE_URL`, `CLINEPASS_MODEL_IDS`(15종), `CLINEPASS_CHAT_MODELS`, `CLINEPASS_PRICES`, 기본 제공자/모델, `PROVIDER_TYPES_INFO` |
| `src/utils/llm/price-calculator.ts` | `cline-pass` 참조 단가 계산 |
| `src/components/settings/modals/AddEmbeddingModelModal.tsx` | 첫 기본 제공자가 ClinePass가 되면서 임베딩 기본 제공자를 “임베딩 지원 제공자”로 변경 |
| `src/components/settings/modals/ProviderFormModal.tsx` | ClinePass 선택 시 API 키/Base URL 안내 문구 |
| `src/settings/schema/migrations/16_to_17.ts` | v17: ClinePass 제공자/모델 병합 + 기본 채팅/Apply 모델 전환 |
| `manifest.json`, `package.json`, `src/main.ts` | 플러그인 id/이름/리본 라벨 |

### 왜 “ClinePass 전용”인데 다른 제공자를 지우지 않았나

채팅은 ClinePass만으로 충분하지만, **임베딩을 ClinePass로 대체할 수 없습니다**.
따라서 다른 제공자 코드/기본 항목은 남겨두고 다음 원칙으로 동작합니다.

- 기본 채팅/Apply 모델: ClinePass (키만 넣으면 바로 사용)
- RAG(볼트 유사도 검색): 별도 임베딩 제공자(Ollama/LM Studio/OpenAI-compatible 등) 필요
- 임베딩 모델 추가 UI에는 ClinePass가 노출되지 않음(`supportEmbedding: false`)

완전히 ClinePass만 남기고 싶다면 `PROVIDER_TYPES_INFO`와 `DEFAULT_PROVIDERS`에서
다른 항목을 제거하면 되지만, 그 경우 `embeddingModelId` 기본값이 가리키는
제공자가 사라져 채팅 뷰 초기화 시 RAG 엔진 생성이 실패합니다.
(그래서 기본 구성에서는 제거하지 않았습니다.)

## 4. 검증 절차

```bash
npm ci
npx tsc --noEmit -skipLibCheck   # 타입
npm test                         # 설정/마이그레이션 테스트
npm run build                    # esbuild 번들 (main.js)
```

런타임 확인 포인트:

1. 설정 → Providers 에 `ClinePass`가 첫 항목으로 보이고 API Key 입력란이 노출되는지
2. 잘못된 키로 요청 시 401 에러가 사용자에게 표시되는지
3. 스트리밍 응답에서 본문 + 추론(thinking) 블록이 함께 표시되는지
4. `@파일` 멘션 + Apply 편집이 동작하는지 (임베딩 불필요)
5. “Vault search” 사용 시 임베딩 미설정 안내가 뜨는지

## 5. 리스크 / 유의사항

| 리스크 | 설명 | 대응 |
| --- | --- | --- |
| 약관/쿼터 | ClinePass는 Cline 계정 구독이며 5시간/주간/월 한도가 있습니다. 서드파티 클라이언트 사용은 Cline 문서가 허용하는 “API 키” 경로를 사용합니다. | 개인 사용 범위 유지, 자동화 남용 금지 |
| 모델 목록 변경 | Cline이 모델을 추가/폐기하면 프리셋이 낡습니다. | `CLINEPASS_MODEL_IDS`만 갱신 (마이그레이션은 신규 설치자에게만 영향) |
| 키 저장 | API 키가 플러그인 `data.json`에 평문 저장 | 개인 볼트 전용, 동기화/공유 주의 |
| 업스트림 병합 | 업스트림이 활발하지 않지만 릴리스가 있습니다. | `git remote add upstream …; git merge upstream/main` 후 `constants.ts`/`manager.ts` 충돌만 수동 해결 |
| RAG 미지원 | Cline API에 임베딩 없음 | 로컬 Ollama 등 별도 임베딩 제공자 문서화 |

## 6. 다음에 할 수 있는 개선

1. **모델 목록 자동 동기화**: `GET /api/v1/models`에서 `cline-pass/` 접두사만 필터해
   설정 화면에 “모델 새로고침” 버튼 추가 (현재는 상수 프리셋)
2. **구독 상태 표시**: Cline 대시보드의 사용량 API가 공개되면 5시간/주간/월 잔여량 표시
3. **OAuth 로그인**: Cline CLI의 계정 토큰을 재사용하는 브라우저 로그인 플로우
   (현재는 API 키 입력 방식 — 문서화된 공식 경로)
4. **임베딩 폴백**: 임베딩이 없을 때 BM25/키워드 기반 검색으로 자동 폴백
