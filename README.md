# ClinePass Composer for Obsidian

[ClinePass](https://docs.cline.bot/getting-started/clinepass) 전용으로 개조한
[Smart Composer](https://github.com/glowingjade/obsidian-smart-composer) 포크입니다.
Obsidian 볼트의 노트를 컨텍스트로 넣어 대화하고, 선택 영역을 원클릭으로 편집합니다.

- 원본: Smart Composer v1.2.9 (MIT License, © Heesu Suh and contributors)
- 이 포크: ClinePass 구독 하나로 동작하도록 모델/프로바이더 계층을 교체

## 무엇이 바뀌었나

| 항목 | 변경 내용 |
| --- | --- |
| 프로바이더 | `cline-pass` 타입 추가 (`src/core/llm/clinePassProvider.ts`) |
| API | `https://api.cline.bot/api/v1` (OpenAI 호환) + `X-Response-Format: openai` |
| 모델 | ClinePass 포함 모델 15종 프리셋 (`CLINEPASS_MODEL_IDS`) |
| 기본값 | 채팅/Apply 기본 모델 = `cline-pass/deepseek-v4.1-flash-1017` |
| 추론 표시 | `delta.reasoning` / `reasoning_details` 를 어댑터에서 매핑 |
| 단가 표시 | ClinePass 참조 단가(정액 구독이므로 참고용) |
| 설정 스키마 | v17 마이그레이션 추가 (기존 설정 유지 + ClinePass 병합) |
| 브랜딩 | 플러그인 id/이름: `clinepass-composer` / ClinePass Composer |

기술적인 변경 지점과 업스트림 동기화 방법은 [docs/CLINEPASS_INTEGRATION.md](docs/CLINEPASS_INTEGRATION.md)를 참고하세요.

## 요구사항

1. **ClinePass 구독** ($9.99/월) — https://app.cline.bot/dashboard/subscription
   (ClinePass 없이도 Cline API 크레딧을 쓰는 유료 모델은 동일 엔드포인트로 사용할 수 있습니다.)
2. **Cline API 키** — https://app.cline.bot → Settings → API Keys → Create API Key
3. Obsidian 0.15.0 이상 (데스크톱/모바일)

## 설치

### 수동 설치 (빌드 산출물)

```bash
git clone https://github.com/moojittokki/Clinepass_note.git
cd Clinepass_note
npm ci
npm run build
# main.js, manifest.json, styles.css 를 볼트의 아래 경로에 복사
# <vault>/.obsidian/plugins/clinepass-composer/
```

Obsidian → 설정 → 커뮤니티 플러그인 → **ClinePass Composer** 활성화.

### 개발 모드

```bash
npm run dev     # esbuild watch (main.js 갱신)
npm test        # jest
npm run lint:check
```

## 설정

1. Obsidian 설정 → **ClinePass Composer** → **Providers**
2. `ClinePass` 프로바이더의 연필 아이콘 → **API Key** 에 `app.cline.bot`에서 만든 키 입력
   (Base URL 은 비워두면 `https://api.cline.bot/api/v1` 사용)
3. **Models** 에서 사용할 모델 선택 (기본: `cline-pass/deepseek-v4.1-flash-1017`)
4. 채팅 뷰(`Cmd/Ctrl+P` → “ClinePass Composer: Open chat”)에서 `@파일명`으로 컨텍스트 추가

## 포함된 모델

| 모델 | Model ID |
| --- | --- |
| DeepSeek V4.1 Flash 1017 | `cline-pass/deepseek-v4.1-flash-1017` |
| DeepSeek V4.1 Flash | `cline-pass/deepseek-v4.1-flash` |
| DeepSeek V4 Pro | `cline-pass/deepseek-v4-pro` |
| GLM 5.3 Flash | `cline-pass/glm-5.3-flash` |
| GLM 5.3 | `cline-pass/glm-5.3` |
| Kimi K3.1 Pro | `cline-pass/kimi-k3.1-pro` |
| Kimi K3 | `cline-pass/kimi-k3` |
| Muse Spark 1.3 Contributor | `cline-pass/muse-spark-1.3-contributor` |
| MiniMax M3.1 Flash | `cline-pass/minimax-m3.1-flash` |
| MiniMax M3 | `cline-pass/minimax-m3` |
| MiMo V2.6 Pro | `cline-pass/mimo-v2.6-pro` |
| MiMo V2.6 Flash | `cline-pass/mimo-v2.6-flash` |
| Qwen3.7 Max | `cline-pass/qwen3.7-max` |
| Qwen3.7 Plus | `cline-pass/qwen3.7-plus` |
| Qwen3.8 Max | `cline-pass/qwen3.8-max` |

모델 목록/ID는 Cline 문서 변경 시 `src/constants.ts`의 `CLINEPASS_MODEL_IDS`와
`src/settings/schema/migrations/16_to_17.ts`를 함께 갱신하세요.

## 알아둘 점 (중요)

- **임베딩/RAG는 ClinePass로 불가**: Cline API에는 `/embeddings` 엔드포인트가 없습니다.
  볼트 전체 유사도 검색(“Vault search”)을 쓰려면 설정 → RAG 에서 **별도 임베딩 제공자**
  (Ollama, LM Studio, OpenAI, Gemini, OpenAI-compatible)를 추가해야 합니다.
  `@파일`/`@폴더` 멘션, 현재 노트 컨텍스트, Apply 편집은 임베딩 없이 동작합니다.
- **CORS 우회(중요)**: `api.cline.bot`은 `Access-Control-Allow-Origin` 헤더를 보내지 않습니다.
  Obsidian은 Electron/WebView(브라우저 환경)이므로 일반 `fetch`(OpenAI SDK)는 차단됩니다.
  그래서 이 포크는 Obsidian의 `requestUrl`(네이티브 HTTP, CORS 없음)로 요청합니다.
- **스트리밍 방식**: `requestUrl`은 SSE를 지원하지 않아, 응답을 한 번에 받은 뒤 타이핑 효과로
  청크를 재생합니다(추론/도구 호출 포함). 실시간 토큰 스트리밍은 아니며, 생성 중 `Stop`은
  다음 청크에서 중단됩니다.
- **정액 구독**: ClinePass는 월 정액이지만, 응답에 표시되는 비용은 Cline 문서의
  참조 단가로 계산한 추정치입니다.
- **API 키 취급**: 키는 Obsidian 플러그인 데이터(`data.json`)에 평문 저장됩니다.
  개인 볼트에서만 사용하고, 볼트를 공유/동기화할 때 주의하세요.
- **모바일**: iOS/Android Obsidian에서도 동일하게 동작합니다. RAG용 PGlite 벡터 DB는
  모바일에서 초기화가 실패할 수 있는데, 이 경우에도 채팅은 정상 동작하고 RAG만 비활성화됩니다.

## 라이선스

MIT License. 원본 저작권 고지는 [LICENSE](LICENSE)에 그대로 유지되어 있습니다.
원본 프로젝트: https://github.com/glowingjade/obsidian-smart-composer
