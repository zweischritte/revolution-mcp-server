# Revolution MCP Server Concept PRD

**Version:** 0.2 (Refined Concept)
**Date:** 2025-09-30
**Owner:** Codex Systems Architect
**Status:** Draft for stakeholder alignment

---

## 1. Vision & Context
- **Vision:** Deliver a Model Context Protocol (MCP) server that exposes the full revolutionary knowledge base (`/workspaces/workspace-basic/themen/revolution`) so aligned LLMs can reliably access, synthesize, and operationalize revolutionary theory, implementation guides, and neural memory keys.
- **Problem:** The corpus spans 50+ curated markdown syntheses, 8+ PDFs, and 19 Flow Nexus memory keys with neural accuracy metadata; without a structured interface, new AI agents face opaque onboarding, brittle retrieval, and inconsistent citations.
- **Solution:** Stand up a standards-compliant MCP service (per detailed PRD in `docs/REVOLUTION-MCP-SERVER-PRD.md`) that virtualizes the repository as a set of tools covering theory access, memory replication, implementation guidance, strategic planning, synthesis, and system telemetry. Responses must remain citation-rich, latency-aware, and faithful to the original knowledge artifacts.

---

## 2. Goals & Non-Goals
**Aligned Goals**
- Surface 100% of the 19 memory keys and 50+ documents/PDFs via MCP tools, maintaining provenance and neural accuracy metadata.
- Support the 6 tool categories / 28 tools defined in the detailed PRD (Theory Access, Memory Key Access, Implementation Guides, Strategic Planning, Analysis & Synthesis, System Management).
- Achieve <500 ms average response time (p50) and maintain 90%+ satisfaction on response fidelity, as per Success Metrics section of the full PRD.
- Provide a read-only, citation-enforced interface that can be consumed over stdio for local agents and optionally HTTP for remote clients.
- Instrument adoption, usage, accuracy, and impact metrics in line with the comprehensive PRD (1,000+ active AI instances, 10k+ monthly queries, 100+ campaign uses by Month 12).

**Explicit Non-Goals (MVP / Phase 1)**
- No mutation of knowledge assets through the MCP interface; content governance remains manual and git-based.
- No autonomous execution beyond knowledge delivery (e.g., task automation, communications).
- No public multi-tenant SaaS offering until security, authentication, and governance models are proven in pilot deployments.

---

## 3. Target Users & Use Cases
**Primary Users**
- **AI Language Models & Agents** (Claude, GPT-4, LLaMA, etc.) enhanced through MCP to provide theory-grounded assistance.
- **Organizers & Educators** leveraging MCP-augmented copilots for campaign design, workshop curricula, and tactical planning.
- **Research Coordinators / Knowledge Stewards** monitoring corpus coverage, neural accuracy, and content gaps.

**Representative Use Cases** (grounded in detailed PRD scenarios)
1. Launch `revolution__generate_campaign_plan` for a housing justice campaign, weaving memory keys, strategic manuals, and power analysis templates.
2. Run `revolution__compare_theories` to contrast Marx, Federici, and Bookchin on reproductive labor with convergences/divergences.
3. Invoke `revolution__get_organizing_guide` for the 30-day mutual aid startup plan and associated resource lists.
4. Use `revolution__memory_diff` to track revisions between roadmap versions.
5. Retrieve neurological and consciousness frameworks through `revolution__get_memory_key` and `revolution__neural_accuracy` for personal transformation curricula.

---

## 4. Success Metrics (First 12 Months)
Adopt the comprehensive targets from `REVOLUTION-MCP-SERVER-PRD.md`:
- **Adoption:** 100 active AI instances by Month 3, 500 by Month 6, 1,000 by Month 12.
- **Usage:** 1k → 5k → 10k monthly queries across all tools (Months 3/6/12).
- **Integration Diversity:** ≥3 model families by Month 6, ≥5 by Month 12.
- **Accuracy & Satisfaction:** ≥90% helpfulness rating, ≥95% correct source attribution, maintain 94.8% neural accuracy on `alienation-synthesis-complete`.
- **Performance:** p50 latency <200 ms, p95 <500 ms, availability ≥99.5%.
- **Impact:** 100+ documented organizing campaign uses, 50 educational integrations, 5 publications citing the server.

---

## 5. System Overview (Aligned Architecture)
```
LLM Clients (Claude, GPT-4, LLaMA, etc.)
   │  MCP (stdio / HTTP JSON-RPC)
   ▼
Revolution MCP Server (Node.js 20, TypeScript 5, @modelcontextprotocol/sdk)
   ├─ Intent Classifier & Tool Router
   ├─ Theory Query Engine (hybrid search + synthesis)
   ├─ Memory Manager (Flow Nexus namespace `revolution`)
   ├─ Document Parser (Markdown, PDF, JSON) & Catalog
   ├─ Semantic Search Layer (ChromaDB / alternative vector store)
   ├─ Cache Layer (in-memory + Redis option)
   └─ Observability (Prometheus, structured logs)
         │
         ├─ Knowledge Base (`docs/`, `analysis/`, `organizing-guides/`, PDFs)
         ├─ Flow Nexus Memory Keys (19, with accuracy + timestamps)
         └─ Vector Embeddings Store (chunked 384-dim embeddings)
```

Key alignment points with detailed PRD:
- TypeScript/Node stack with MCP SDK.
- Hybrid retrieval pipeline (keyword FTS + semantic vectors) feeding the synthesis engine.
- Persistent catalog registry (SQLite + FTS5) indexing all artifacts with theorist/tradition tagging.
- Telemetry via Prometheus + Grafana, logs via Winston, optional OpenTelemetry tracing.

---

## 6. Tool Surface (Summary of 6 Categories / 28 Tools)
Referencing the detailed PRD, ensure MVP / Phase 2 covers:
- **Theory Access (8 tools):** `revolution__query_theory`, `revolution__compare_theories`, `revolution__get_author_works`, `revolution__explore_concept`, `revolution__get_historical_context`, `revolution__trace_influence`, `revolution__list_theorists`, `revolution__search_texts`.
- **Memory Key Access (6 tools):** `revolution__get_memory_key`, `revolution__list_memory_keys`, `revolution__search_memory`, `revolution__get_neural_accuracy`, `revolution__replicate_memory`, `revolution__memory_diff`.
- **Implementation Guides (6 tools):** `revolution__get_organizing_guide`, `revolution__get_implementation_roadmap`, `revolution__generate_campaign_plan`, `revolution__get_resource_list`, `revolution__get_tactics_manual`, `revolution__get_workshop_curriculum`.
- **Strategic Planning (4 tools):** `revolution__power_analysis`, `revolution__assess_conditions`, `revolution__coalition_strategy`, `revolution__scenario_planning`.
- **Analysis & Synthesis (3 tools):** `revolution__synthesize_theories`, `revolution__analyze_movement`, `revolution__predict_trajectory`.
- **System Management (1 tool):** `revolution__server_info`.

Each tool returns structured JSON containing synthesized answers, citations, confidence scores, and related queries, mirroring the schemas defined in the detailed PRD.

---

## 7. Data & Knowledge Model
- **Catalog Registry (SQLite):** Mirrors PRD structure with fields: `id`, `type`, `path`, `title`, `summary`, `theorists[]`, `traditions[]`, `tags[]`, `updated_at`, `checksum`, `embedding_id`.
- **Flow Nexus Mirror:** Local cache storing `key_name`, `content_checksum`, `created_at`, `accuracy`, `neural_model_id`, `related_keys[]` for fast diffing and offline fallback.
- **Embeddings Store:** Use ChromaDB (default) with 384-dim `all-MiniLM-L6-v2` embeddings; interface must allow swapping with Pinecone for higher scale per PRD recommendations.
- **Citation Schema:** `{ source_type: 'doc'|'memory'|'pdf', identifier: 'docs/FILE.md' or key name, excerpt: string, confidence: float }`; citations mandatory for theory/strategy outputs.

---

## 8. Security & Privacy
Align with detailed PRD safeguards:
- **Authentication Phases:**
  - Phase 1: Open access + usage tracking.
  - Phase 2: API keys for HTTP transport with tiered rate limits.
  - Phase 3: OAuth + role-based access if multi-tenant needs arise.
- **Rate Limiting:** Token bucket enforcing 100/500/5,000 queries per hour tiers (anonymous / free / paid) with standard limit headers.
- **Telemetry Hygiene:** Log tool usage, latency, and status; omit query content; retain anonymized metadata for ≤90 days; support opt-out.
- **Data Protection:** Git-backed content, encrypted backups, hash-based tamper checks, HTTPS/TLS 1.3 for HTTP transport, certificate pinning recommended.
- **Self-Hosting:** Provide deployment guides (Docker, Kubernetes) so organizers can keep sensitive data local; contact databases may require additional gating or exclusion pending governance decision.

---

## 9. Implementation Roadmap (Synchronized with Full PRD)
**Phase 1 – MVP (Months 1-3)**
1. **Foundation:** Project scaffolding, MCP SDK integration, catalog builder, Flow Nexus adapter with caching, Markdown ingestion.
2. **Core Tools:** Implement 10 foundational tools (`query_theory`, `get_memory_key`, `list_memory_keys`, `get_organizing_guide`, `list_theorists`, `search_texts`, `server_info`, etc.).
3. **Baseline Retrieval:** Keyword search, deterministic routing, initial response synthesizer with citation enforcement.
4. **Testing & Packaging:** Unit + integration tests (≥80% coverage), sample MCP client scripts, local stdio deployment guide.

**Phase 2 – Enhanced Features (Months 4-6)**
- Embedding pipeline + semantic search integration.
- PDF parsing and indexing for additional sources.
- Expand tool surface to full Theory, Implementation, Strategic planning sets.
- HTTP transport with API keys, rate limiting, monitoring dashboards, Docker distribution.

**Phase 3 – Scale & Optimization (Months 7-12)**
- Performance tuning (Redis cache, streaming responses, load testing).
- Advanced ML intent detection, multilingual support (ES/DE), scenario planning enhancer.
- Community contribution workflows, impact tracking, stable 1.0 release.

Milestones and success criteria mirror the comprehensive PRD, including beta testing and community outreach timelines.

---

## 10. Risks & Mitigations
| Risk | Alignment | Mitigation |
|------|-----------|------------|
| Retrieval hallucination / mis-citation | Matches PRD Risk 7 | Enforce citation schema, automated citation validation tests, include confidence metrics. |
| Flow Nexus downtime | PRD Risk 3 | Local cache with TTL, health checks, graceful degradation messaging. |
| Vector search accuracy/performance | PRD Risk 2 | Hybrid search fallback, configurable top-k, periodic evaluation of embedding quality. |
| Rate limit abuse / resource exhaustion | PRD Risk 5 | Token bucket limits, progressive backoff, IP/API key throttling, abuse monitoring. |
| Sensitive data exposure (e.g., contact lists) | PRD Risk 10/11 | Optional exclusion or gated access, encryption in transit, strict logging hygiene, encourage self-hosting. |
| Scope creep | PRD governance | Backlog management, stakeholder checkpoints each phase, ADRs for major changes. |

---

## 11. Open Questions (Carried Forward)
1. Should high-sensitivity artifacts like `REVOLUTIONARY-CONTACT-DATABASE-2025.md` be excluded or require elevated authorization even in self-hosted deployments?
2. What is the preferred method for Flow Nexus authentication for community operators (API token distribution vs local export sync)?
3. When should multilingual responses (Spanish, German) enter the roadmap—Phase 2 or Phase 3?
4. Do we need an offline bundle (catalog + embeddings) for air-gapped environments?
5. What governance process approves new tools that go beyond knowledge retrieval into prescriptive strategy generation?

---

## 12. Next Actions
1. Circulate refined concept alongside the detailed PRD for consolidated stakeholder feedback.
2. Confirm cross-functional team allocation (backend engineer, search engineer, knowledge curator, security reviewer).
3. Prototype ingestion + citation pipeline on a subset of docs to validate chunking and Flow Nexus sync assumptions.
4. Draft ADRs for key architectural choices (transport modes, vector DB, caching layer) to prevent divergence during implementation.
5. Schedule Phase 0 checkpoint to resolve open questions, finalize scope, and authorize build kickoff.

*This refined concept is intentionally synchronized with `docs/REVOLUTION-MCP-SERVER-PRD.md` so that future implementation moves from vision to execution without contradictory assumptions.*
