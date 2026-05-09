from dataclasses import dataclass

@dataclass(frozen=True)
class LLMResult:
    text: str
    input_tokens: int = 0
    output_tokens: int = 0
    total_tokens: int = 0
    model: str = ""