## ADDED Requirements

### Requirement: Agent instruction scanner

The system SHALL scan project directories for agent instruction files without modifying files during the scan phase.

#### Scenario: Scan development projects

- **WHEN** Codex scans `/Users/fishtv/Development`
- **THEN** the scanner SHALL find repositories containing `AGENTS.md`, `CLAUDE.md`, or both
- **THEN** the scanner SHALL ignore `node_modules`, `.git`, `.next`, `dist`, `build`, `.turbo`, and archived dependency folders
- **THEN** the scanner SHALL produce a project-level inventory with file paths and line counts

#### Scenario: Empty scan result

- **WHEN** the scan root contains no `AGENTS.md` or `CLAUDE.md`
- **THEN** the scanner SHALL report an empty inventory
- **THEN** the scanner SHALL NOT create new files

#### Scenario: Permission or unreadable path

- **WHEN** a candidate path cannot be read
- **THEN** the scanner SHALL record the path as unreadable
- **THEN** the scanner SHALL continue scanning other projects

### Requirement: Agent instruction classification

The system SHALL classify each project before migration.

#### Scenario: Project has long monolithic instructions

- **WHEN** a project contains `AGENTS.md` or `CLAUDE.md` longer than 150 lines with multiple domains or workflows
- **THEN** the classifier SHALL mark the project as `migrate`
- **THEN** the classifier SHALL include proposed domain and workflow files

#### Scenario: Project already uses progressive loading

- **WHEN** a project contains a short `AGENTS.md` with a routing table and `docs/agents/` references
- **THEN** the classifier SHALL mark the project as `keep`
- **THEN** the classifier SHALL recommend validation only

#### Scenario: Project has no agent instructions

- **WHEN** a repository has no `AGENTS.md` and no `CLAUDE.md`
- **THEN** the classifier SHALL mark the project as `create`
- **THEN** the classifier SHALL recommend a minimal `AGENTS.md` only if project metadata is available

#### Scenario: Ambiguous or tool-specific instructions

- **WHEN** `CLAUDE.md` appears to contain tool-specific or unclear instructions that cannot be safely mapped
- **THEN** the classifier SHALL mark the project as `manual-review`
- **THEN** the classifier SHALL NOT migrate the project automatically

### Requirement: Progressive loading migration

The system SHALL migrate eligible projects to a progressive-loading agent docs structure while preserving project-specific rules.

#### Scenario: Migrate one eligible project

- **WHEN** a project is classified as `migrate`
- **THEN** the migrator SHALL create or update `AGENTS.md` as the short entrypoint
- **THEN** the migrator SHALL create focused files under `docs/agents/`
- **THEN** the migrator SHALL preserve non-negotiable rules in `AGENTS.md`
- **THEN** the migrator SHALL move detailed domain and workflow guidance into focused files

#### Scenario: Preserve project source of truth

- **WHEN** the original instructions reference specs, ADRs, or product docs
- **THEN** the migrator SHALL link to those files instead of copying their full contents
- **THEN** the migrator SHALL NOT duplicate complete spec text into `docs/agents/`

#### Scenario: Existing user changes

- **WHEN** the project worktree contains unrelated modified files
- **THEN** the migrator SHALL only touch agent docs files required for the migration
- **THEN** the migrator SHALL NOT revert unrelated changes

### Requirement: Agent docs validation

The system SHALL validate migrated agent docs with a deterministic command.

#### Scenario: Validate migrated project

- **WHEN** a project contains progressive-loading agent docs
- **THEN** the verifier SHALL check that routed `docs/agents/` files exist
- **THEN** the verifier SHALL check that `AGENTS.md` includes a Progressive Loading Policy
- **THEN** the verifier SHALL check that `AGENTS.md` includes a Task Routing section
- **THEN** the verifier SHALL exit with status code 0 on success

#### Scenario: Missing routed file

- **WHEN** `AGENTS.md` references a missing `docs/agents/` file
- **THEN** the verifier SHALL exit with non-zero status
- **THEN** the verifier SHALL list the missing file path

### Requirement: Global skill reuse

The global `agent-progressive-loading` skill SHALL define the reusable method for future Codex sessions without storing project-specific business rules.

#### Scenario: Future project asks for agent docs optimization

- **WHEN** the user asks Codex to optimize `AGENTS.md`, `CLAUDE.md`, project agent docs, or future Codex project startup behavior
- **THEN** Codex SHALL use the `agent-progressive-loading` skill
- **THEN** Codex SHALL scan and classify before editing multiple projects
- **THEN** Codex SHALL apply project-specific migration only after identifying a safe migration path

#### Scenario: Avoid cross-project contamination

- **WHEN** Codex updates the global skill
- **THEN** the skill SHALL contain reusable workflow guidance
- **THEN** the skill SHALL NOT contain AIRE product rules, client details, or domain-specific facts
