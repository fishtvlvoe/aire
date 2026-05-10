## ADDED Requirements

### Requirement: Safe LLM process invocation
Every LLM adapter that invokes a local CLI tool (Codex, Claude) SHALL use safe process spawning (spawn or execFile) with an argument array. Prompt content MUST NOT be concatenated into a shell command string. Prompts SHALL be passed via standard input (stdin) or temporary files to prevent shell injection.

#### Scenario: Prompt contains shell metacharacters
- **WHEN** a user provides a prompt containing backticks, semicolons, or command substitution syntax
- **THEN** the LLM adapter SHALL execute the CLI tool as a separate process without shell interpretation
- **THEN** the prompt SHALL be treated as literal data by the CLI tool

##### Example: Malicious prompt attempt
- **GIVEN** a prompt "Translate this; rm -rf /"
- **WHEN** the Codex adapter is invoked
- **THEN** the system spawns "codex" with arguments ["exec"]
- **THEN** the string "Translate this; rm -rf /" is written to the process stdin
- **THEN** the shell command "rm -rf /" is NEVER executed by the host system
