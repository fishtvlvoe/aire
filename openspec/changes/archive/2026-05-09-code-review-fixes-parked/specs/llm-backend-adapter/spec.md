## MODIFIED Requirements

### Requirement: CLI adapters use spawn with argv instead of shell exec

The codex and claude-code adapters SHALL use `spawn`/`execFile` with argument arrays and pass prompts via stdin, instead of `exec()` with string interpolation.

#### Scenario: Prompt with shell metacharacters

- **WHEN** a prompt contains backticks, $(), semicolons, or pipe characters
- **THEN** the prompt is passed safely via stdin without shell interpretation

#### Scenario: Prompt with quotes

- **WHEN** a prompt contains single and double quotes
- **THEN** the prompt is delivered verbatim to the CLI tool without escaping issues
