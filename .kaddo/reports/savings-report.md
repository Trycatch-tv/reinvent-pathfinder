# Kaddo Estimated Savings Report

Generated at: 2026-10-12T18:06:07.041Z
Project: pathfinder
Scope: all
Currency: USD

## Disclaimer

These are evidence-based estimates, not exact ROI. Adjust assumptions with real team data.

## Executive Summary

- Estimated time saved: 56.14 hours
- Estimated value: 2246 USD
- Confidence: Medium
- Using default assumptions. Run `kaddo savings init` to customize them.

## Assumptions

- Hourly cost: 40 USD
- Context preparation saved per Work Item: 30 min
- Review saved per Work Item with ownership: 20 min
- Clarification saved per Work Item with acceptance criteria: 25 min
- Onboarding saved per new contributor: 4 h
- Expected new contributors per month: 1
- Architecture discovery saved when graph is good: 3 h

## Evidence Used

- Knowledge Impact Score: 91/100
- Completed Work Items: 40
- Ownership coverage: 98%
- Work Items with Acceptance Criteria: 40/42
- Graph quality: partial
- Graph nodes: 170
- Graph edges: 310
- Context readiness: Very High
- Guard history: not available

## Estimated Savings

### Context Preparation

- Formula: 40 Work Items × 30 min
- Estimated: 20 h

### Review Effort

- Formula: 41 Work Items with ownership × 20 min
- Estimated: 13.67 h

### Clarification Reduction

- Formula: 40 Work Items with Acceptance Criteria × 25 min
- Estimated: 16.67 h

### Onboarding

- Formula: 1 contributor × 4 h × 1.00 readiness multiplier
- Estimated: 4 h

### Architecture Discovery

- Formula: 3 h × 0.60 graph multiplier
- Estimated: 1.8 h

### Drift Prevention

- Not available yet.
- Reason: Guard history is not persisted yet.

## Total

- Estimated time saved: 56.14 h
- Estimated value: 2246 USD

## Confidence

Confidence: Medium

Reason:
- Strong knowledge and graph evidence.
- Guard history is not persisted yet — avoided rework is not estimated.
- Savings assumptions are defaults and should be calibrated.

## Suggested Actions

1. Run `kaddo savings init` to customize assumptions.
2. Calibrate hourly cost and team assumptions with real team data.
3. Run `kaddo impact` to verify the underlying evidence quality.
4. Use this report as directional evidence, not accounting data.
5. Future: persist Guard history to estimate avoided rework.
