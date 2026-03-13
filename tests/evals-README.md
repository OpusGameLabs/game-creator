# Game Creator Skill Evals

## Target Metrics (from Anthropic's Skill Guide)

- Trigger recall on relevant queries: >= 90%
- False positives on unrelated queries: <= 10%
- End-to-end flow success: >= 8/10
- Failed API calls per workflow: 0
- Median clarifying questions: <= 2

## How to Test

### Trigger Tests
1. Open Claude Code with game-creator plugin installed
2. For each line in `trigger-positive.txt`, paste the query and verify the relevant skill loads
3. For each line in `trigger-negative.txt`, verify NO game-creator skill loads
4. Track: loaded/total for positive, loaded/total for negative

### Flow Tests
1. Follow each flow in `flows/` step by step
2. Check each success criterion checkbox
3. Note any failures, clarifying questions, or deviations

## Performance Baseline

Track these metrics for each flow test, with and without the skill enabled:

| Metric | Without Skill | With Skill | Target |
|--------|--------------|------------|--------|
| Clarifying questions | — | — | <= 2 |
| Failed tool calls | — | — | 0 |
| Total tool calls | — | — | Fewer |
| Tokens consumed | — | — | Fewer |
| Time to completion | — | — | Faster |
| Output quality (1-10) | — | — | >= 8 |

Run each flow 3 times and average. Record results in `tests/results/` (not committed).

## Iteration
After testing, use results to refine skill descriptions:
- Undertriggering: add keywords/phrases to description
- Overtriggering: add negative triggers ("Do NOT use for...")
- Flow failures: improve instructions or add troubleshooting entries
