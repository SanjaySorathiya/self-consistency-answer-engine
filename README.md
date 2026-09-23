# self-consistency-answer-engine
Production-oriented multi LLM provider GenAI orchestration engine with structured outputs, independent model generation, LLM-as-a-judge synthesis, prompt-injection mitigation, capability-based authorization boundaries, retries, failure isolation and reusable TypeScript core architecture.

Application flow:
                        SAME USER PROMPT
                              │
             ┌────────────────┼────────────────┐
             ▼                ▼                ▼
          OpenAI          Anthropic          Gemini
             │                │                │
             ▼                ▼                ▼
          Candidate        Candidate         Candidate
             │                │                │
             └────────────────┼────────────────┘
                              ▼
                     Claude Judge Model
                              │
                  ┌───────────┼───────────┐
                  ▼           ▼           ▼
              Agreement   Disagreement  Uncertainty
                              │
                              ▼
                    Fresh Final Answer