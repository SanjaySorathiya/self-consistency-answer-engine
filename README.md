# self-consistency-answer-engine
Production-oriented multi LLM provider GenAI orchestration engine with structured outputs, independent model generation, LLM-as-a-judge synthesis, prompt-injection mitigation, capability-based authorization boundaries, retries, failure isolation and reusable TypeScript core architecture.

Application flow:
User Prompt
     │
     ▼
Input Guardrails
     │
     ├─────────────┬──────────────┐
     ▼             ▼              ▼
 OpenAI         Claude         Gemini
     │             │              │
     └─────────────┴──────────────┘
                   │
                   ▼
           Zod Candidate Objects
                   │
                   ▼
            Claude Synthesizer
                   │
                   ▼
            Zod Final Object
                   │
                   ▼
        Semantic Output Guardrails
                   │
                   ▼
          Similarity Protection
                   │
                   ▼
             CLI Final Answer