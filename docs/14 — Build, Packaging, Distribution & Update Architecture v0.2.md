# Document 14 — Build, Packaging, Distribution & Update Architecture

**Product:** EDA Workbench  
**Document ID:** 14  
**Version:** 0.2  
**Status:** Draft for Review — Revised for Review (WP-23)

> **Revision note (WP-23):** Adds IN-F gate ownership cross-references. Header status reflects review revision and does not claim final approval.
**Scope:** Build system, runtime packaging, platform distribution, release management, application updates, rollback, migration, and supply-chain security.

---

## 1. Purpose

This document defines how EDA Workbench is built, packaged, distributed, installed, updated, and recovered across Windows, macOS, and Linux.

The architecture must guarantee:

- Reproducible and verifiable application builds.
    
- Consistent runtime behavior across supported platforms.
    
- Reliable packaging of Python, React, PyWebView, and native dependencies.
    
- Secure dependency and release management.
    
- Controlled application and plugin compatibility.
    
- Safe project migrations.
    
- Recoverability from failed installation and updates.
    
- Preservation of user data throughout the application lifecycle.
    

The distribution architecture must preserve EDA Workbench's local-first operating model.

## 2. Architecture Principles

|Principle|Requirement|
|---|---|
|Reproducible builds|Locked dependencies and controlled build environments|
|Platform-aware packaging|Platform-specific builds and verification|
|Offline-capable|Local workflows must not require internet access|
|Immutable releases|Published artifacts cannot be silently modified|
|Explicit updates|Installation requires user approval|
|Safe migrations|Backups, validation, and recovery are mandatory|
|Dependency isolation|No dependency on global Python or Node.js|
|Supply-chain integrity|Signed artifacts and traceable dependencies|
|Graceful recovery|Failed updates must preserve user data|

## 3. Build Architecture

### 3.1 Build Pipeline

```
flowchart TD
    A[Source Repository] --> B[CI Validation]
    B --> C[Resolve Locked Dependencies]
    C --> D[Build React Frontend]
    C --> E[Package Python Backend]
    D --> F[Application Assembly]
    E --> F
    F --> G[Platform-Specific Packaging]
    G --> H[Automated Verification]
    H --> I[Manual Release Approval]
    I --> J[Code Signing]
    J --> K[Release Publication]
```

### 3.2 Build Environment

Requirements:

- Pin Python and Node.js versions.
    
- Commit dependency lockfiles.
    
- Record native compiler and build-tool versions.
    
- Separate development and production dependencies.
    
- Avoid uncontrolled dependency downloads during final packaging.
    
- Build independently for every supported OS and architecture.
    

### 3.3 Build Reproducibility

Adopt a hybrid reproducibility policy:

**Mandatory: Functional Reproducibility**

- Same source commit.
    
- Same locked dependencies.
    
- Same declared build configuration.
    
- Equivalent application behavior and verification results.
    

**Progressive: Bit-for-Bit Reproducibility**

- Pursue identical binary artifacts where toolchains permit.
    
- Prioritize deterministic components.
    
- Account for signing, timestamps, native packaging, and platform-specific metadata.
    

Every build records:

- Source commit SHA.
    
- Dependency lockfile fingerprints.
    
- Build environment and toolchain versions.
    
- Target platform and architecture.
    
- Build configuration.
    
- Artifact checksums.
    
- Build provenance.
    

## 4. Runtime Packaging Architecture

### 4.1 Production Package

```
EDA Workbench
├── Desktop Host
│   ├── PyWebView
│   ├── Application Lifecycle
│   └── IPC Bridge
├── Bundled Python Runtime
│   ├── Application Modules
│   ├── Domain Services
│   ├── Analytics Engines
│   └── Infrastructure
├── Frontend Assets
│   ├── React Application
│   ├── JavaScript Bundles
│   └── CSS and Resources
├── Core Dependencies
└── Runtime Configuration
```

The production application must not depend on globally installed Python or Node.js.

Frontend assets are served through the trusted PyWebView runtime, not `file://`.

### 4.2 Python Packaging

**Approved baseline: PyInstaller.**

Requirements:

- Bundle an application-controlled Python runtime.
    
- Include required production dependencies.
    
- Preserve native library compatibility.
    
- Exclude development-only packages.
    
- Avoid modifying system Python environments.
    
- Validate packaging on every supported platform and architecture.
    

Mandatory native dependency validation includes:

- PyWebView.
    
- DuckDB.
    
- Polars.
    
- Apache Arrow.
    

PyInstaller remains the MVP baseline, subject to successful cross-platform validation.

### 4.3 Frontend Packaging

React, TypeScript, and Vite production assets must:

- Be compiled before desktop packaging.
    
- Exclude development server dependencies.
    
- Use production-compatible asset paths.
    
- Follow restrictive Content Security Policy.
    
- Remain compatible with the bundled backend release.
    

### 4.4 Plugin Runtime Separation

Core application dependencies and plugin environments remain separate.

Third-party plugins continue using isolated environments according to Document 09.

Application updates must not silently modify plugin environments.

## 5. Platform Distribution

### 5.1 Supported Platforms

|Platform|Distribution|CPU Architecture|Minimum OS|
|---|---|---|---|
|Windows|`.exe` installer|x64|Windows 10 22H2|
|macOS|`.dmg`|ARM64, Intel x64|macOS 13 Ventura|
|Linux|AppImage|x64, ARM64|Ubuntu 22.04 LTS validation baseline|

Ubuntu 22.04 is the Linux baseline validation environment, not an exclusive distribution requirement.

Broader Linux compatibility is determined by native library, glibc, and WebKitGTK requirements.

### 5.2 Windows Runtime

Use **Microsoft Evergreen WebView2 Runtime**.

Requirements:

- Do not bundle a fixed-version WebView2 runtime.
    
- Detect runtime availability during installation or startup.
    
- Provide installation guidance or an installation path if missing.
    
- Allow Microsoft-managed WebView2 security updates.
    

### 5.3 macOS Runtime

Use the native WebKit framework provided by macOS.

Requirements:

- Do not bundle a separate browser engine.
    
- Build separately for Apple Silicon and Intel.
    
- Validate native dependencies for each architecture.
    
- Apply Developer ID signing and notarization.
    

### 5.4 Linux Runtime

Use a hybrid dependency strategy:

- AppImage bundles the application and compatible native libraries where safe.
    
- Required system libraries may remain external.
    
- WebKitGTK dependencies must be explicitly validated.
    
- Define minimum runtime requirements.
    
- Provide actionable diagnostics when dependencies are missing.
    

## 6. Dependency Management

### 6.1 Dependency Categories

|Category|Management|
|---|---|
|Core Python|Locked and bundled|
|Frontend|Locked and bundled|
|Native libraries|Platform-specific and verified|
|Official plugins|Managed official environments|
|Third-party plugins|Isolated environments|
|Development tools|Excluded from production|

### 6.2 Dependency Security

- Pin direct and transitive dependencies.
    
- Maintain production lockfiles.
    
- Scan known vulnerabilities.
    
- Review license compatibility.
    
- Generate SBOM.
    
- Record dependency provenance.
    
- Control dependency updates.
    

## 7. Release Management

### 7.1 Release Channels

|Channel|Purpose|Default|
|---|---|---|
|Stable|Production-ready releases|Yes|
|Beta|Pre-release validation|No|
|Development|Experimental builds|No|

Channel switching is explicit and user-controlled.

Each channel has independent release metadata and update policies.

### 7.2 Versioning

Use Semantic Versioning:

`MAJOR.MINOR.PATCH`

Version domains are independent:

- Application version.
    
- IPC protocol version.
    
- Project format version.
    
- Plugin SDK version.
    
- Analysis method version.
    

### 7.3 Release Artifacts

Every release publishes:

- Platform installer.
    
- Release notes.
    
- SHA-256 checksums.
    
- Digital signatures.
    
- Software Bill of Materials (SBOM).
    
- Build provenance.
    
- Compatibility manifest.
    

Published release artifacts are immutable.

## 8. Release Integrity & Supply-Chain Security

### 8.1 Signing Strategy

|Platform|Security mechanism|
|---|---|
|Windows|Authenticode code signing|
|macOS|Developer ID signing and notarization|
|Linux|Cryptographic signatures and checksums|

### 8.2 Mandatory Security Controls

- Dependency vulnerability scanning.
    
- License scanning.
    
- SBOM generation.
    
- Build provenance.
    
- Protected release branches.
    
- Restricted CI/CD release permissions.
    
- Protected signing credentials.
    
- Signature and checksum verification.
    
- Release publication audit trail.
    

A checksum alone does not prove publisher authenticity. A trusted signature or equivalent authenticated mechanism is required.

### 8.3 Verification Before Installation

The application must verify:

1. Artifact integrity.
    
2. Authorized publisher identity.
    
3. Target OS and architecture.
    
4. Application compatibility.
    
5. Release status and revocation information.
    

Unverified packages must never be installed.

## 9. Update Architecture

### 9.1 Update Components

- Update Checker.
    
- Release Metadata Client.
    
- Signature Verifier.
    
- Download Manager.
    
- Compatibility Validator.
    
- Update Installer.
    
- Recovery Manager.
    

### 9.2 Update Distribution

**Approved baseline: Centralized Official Release Repository.**

For MVP:

- One official repository provides release metadata and packages.
    
- Release metadata identifies version, channel, OS, architecture, and compatibility.
    
- Private/custom repositories are deferred.
    
- Architecture must permit additional update sources in future versions.
    

The update service must not receive project datasets or analytical content.

### 9.3 Update Policy

**Approved baseline: User-Approved Updates.**

- Update checks may run automatically.
    
- Notifications inform users when updates are available.
    
- Installation requires explicit user approval.
    
- Downloading must not interrupt active analysis.
    
- Installation waits for a safe application lifecycle state.
    
- Critical persistence operations must complete before installation.
    
- Restart is required when applicable.
    

### 9.4 Staged Update Lifecycle

```
flowchart TD
    A[Check Update] --> B[Retrieve Release Metadata]
    B --> C[Verify Metadata]
    C --> D{Update Available?}
    D -->|No| E[Continue Normally]
    D -->|Yes| F[Notify User]
    F --> G[Explicit Approval]
    G --> H[Download Package]
    H --> I[Verify Signature and Checksum]
    I --> J[Validate Compatibility]
    J --> K[Create Recovery Point]
    K --> L[Stage Installation]
    L --> M[Restart and Install]
    M --> N[Startup Health Check]
    N -->|Success| O[Commit Update]
    N -->|Failure| P[Rollback]
```

## 10. Installation, Rollback & Recovery

### 10.1 Installation Strategy

1. Download package.
    
2. Verify signature and integrity.
    
3. Validate platform and version.
    
4. Check permissions and disk space.
    
5. Prepare rollback information.
    
6. Stage new application version.
    
7. Switch application version using platform-appropriate mechanisms.
    
8. Run startup health checks.
    
9. Commit update only after successful validation.
    

### 10.2 Rollback

If installation or startup fails:

- Restore previous application version where possible.
    
- Preserve user configuration.
    
- Preserve project data.
    
- Record failure details.
    
- Prevent repeated installation of the same failed release.
    
- Provide recovery guidance.
    

Application rollback and project data rollback are separate operations.

## 11. Project Migration & Compatibility

### 11.1 Hybrid Migration Policy

|Migration category|Policy|
|---|---|
|Backward-safe and non-destructive|Automatic after backup and validation|
|Potentially destructive or materially data-changing|Explicit user approval|
|Unsafe or unverifiable|Block migration|

Every migration must define:

- Source and target schema versions.
    
- Preconditions.
    
- Operations.
    
- Postconditions.
    
- Failure behavior.
    
- Recovery strategy.
    

### 11.2 Migration Lifecycle

1. Detect current schema version.
    
2. Validate project integrity.
    
3. Create recoverable backup.
    
4. Check required disk space.
    
5. Run migration.
    
6. Validate schema and data integrity.
    
7. Record completion.
    

### 11.3 Project Compatibility Policy

|Project condition|Behavior|
|---|---|
|Same version|Open normally|
|Older compatible version|Migrate if required|
|Newer unsupported format|Block with compatibility explanation|
|Unsupported legacy format|Offer recovery/migration if available|

No silent downgrade or uncontrolled format mutation is allowed.

Application rollback must never automatically downgrade project data.

## 12. Plugin Compatibility

After an application update, validate:

- Plugin API version.
    
- Plugin SDK version.
    
- Python version and ABI.
    
- OS and architecture.
    
- Dependency compatibility.
    
- Required capabilities.
    

Incompatible plugins must be marked accordingly.

Preserve plugin configuration and environments unless an explicitly approved migration is required.

## 13. Release Compatibility Manifest

Every release must publish a mandatory machine-readable manifest.

It includes:

- Application version.
    
- Release channel.
    
- Supported OS and CPU architectures.
    
- Minimum OS version.
    
- Python runtime compatibility.
    
- Plugin SDK compatibility.
    
- IPC protocol compatibility.
    
- Project format compatibility.
    
- Migration requirements.
    
- Package checksum.
    
- Signature references.
    
- Release status: Active, Withdrawn, or Revoked.
    

The manifest is the authoritative input for:

- Update Manager.
    
- Compatibility Validator.
    
- Release recovery workflow.
    

## 14. Release Recovery Policy

Adopt Hybrid Release Recovery.

If a release contains a critical defect:

1. Mark the release Withdrawn or Revoked.
    
2. Stop offering it through the update service.
    
3. Protect users who have not installed it.
    
4. Notify affected users and recommend a fixed release.
    
5. Offer application downgrade only if safe.
    
6. Never automatically downgrade project data.
    
7. Record all recovery actions in the release audit trail.
    

## 15. CI/CD & Release Automation

### 15.1 Hybrid CI/CD

Build, test, packaging, and verification are automated.

Signing and publication require explicit manual release approval.

Workflow:

`Commit → CI Tests → Platform Builds → Package Verification → Release Approval → Signing → Publication`

### 15.2 Release Gates

A release must not proceed if:

- Critical automated tests fail.
    
- Native dependencies fail verification.
    
- Package integrity checks fail.
    
- Signing verification fails.
    
- Compatibility metadata is incomplete.
    
- Required platform smoke tests fail.

**Gate ownership (IN-F, WP-16):** This section owns packaging, signing, and platform release gates. Doc13 owns test-execution gates and Doc15 owns reliability gates. A release requires all three layers to pass; no layer may waive another layer's gate.
    

### 15.3 Platform Build Matrix

The MVP requires:

|OS|Architecture|
|---|---|
|Windows|x64|
|macOS|ARM64 and Intel x64|
|Linux|x64 and ARM64|

Each target requires platform-specific build and smoke-test validation.

## 16. Offline & User Data Preservation

### 16.1 Offline Behavior

Local workflows remain functional without internet connectivity.

- Application startup does not require update service access.
    
- Existing projects remain accessible.
    
- Local analysis remains available.
    
- Update checks fail gracefully.
    
- No unauthorized cloud fallback is introduced.
    

### 16.2 User Data Preservation

|Data|Upgrade behavior|
|---|---|
|Application binaries|Replaceable|
|Application runtime|Version-controlled|
|User settings|Preserved|
|Project files|Preserved|
|Plugin environments|Preserved|
|Logs|Retained according to policy|
|Cache|Rebuildable|
|Exported reports|Preserved|

Uninstallation must not delete project data or user settings by default.

Destructive cleanup requires explicit confirmation.

## 17. Testing & Verification

### Build Testing

- Dependency lock validation.
    
- Reproducibility checks.
    
- Native dependency loading.
    
- Missing resource detection.
    
- Package integrity verification.
    

### Installation Testing

- Clean installation.
    
- Upgrade from supported versions.
    
- Uninstallation.
    
- Insufficient disk space.
    
- Interrupted installation.
    
- Corrupted package.
    
- Invalid signature.
    

### Migration Testing

- Supported schema versions.
    
- Empty and populated projects.
    
- Large metadata databases.
    
- Interrupted migrations.
    
- Backup restoration.
    
- Migration failures.
    

### Cross-Platform Testing

- Startup.
    
- Native WebView.
    
- Analysis smoke tests.
    
- Update and rollback.
    
- Project opening.
    
- Architecture-specific dependency validation.
    

Critical platform-specific test failures block release.

## 18. MVP Scope & Deferred Capabilities

### Required for MVP

- Platform-specific automated builds.
    
- Bundled Python runtime.
    
- PyInstaller baseline.
    
- Locked dependencies.
    
- Windows `.exe`, macOS `.dmg`, Linux AppImage.
    
- Supported CPU architecture matrix.
    
- Stable/Beta/Development channels.
    
- Signed release artifacts.
    
- SBOM and build provenance.
    
- Centralized official release repository.
    
- User-approved staged updates.
    
- Startup health checks and rollback.
    
- Versioned project migrations and backups.
    
- Plugin compatibility validation.
    
- Offline-capable operation.
    
- Mandatory Release Compatibility Manifest.
    
- Cross-platform installation and upgrade testing.
    

### Deferred

- Fully automatic background installation.
    
- Delta and differential updates.
    
- Private enterprise update repositories.
    
- Advanced enterprise deployment management.
    
- Marketplace automatic plugin updates.
    
- Automatic project format downgrade.
    
- Advanced anti-rollback infrastructure.
    

## 19. Architecture Decisions

|ID|Approved Decision|
|---|---|
|BUILD-001|Platform-specific builds|
|BUILD-002|Bundled application-controlled Python runtime|
|BUILD-003|Bundled React frontend assets served through PyWebView|
|BUILD-004|Locked Python and frontend dependencies|
|BUILD-005|Semantic Versioning|
|BUILD-006|Stable, Beta, Development release channels|
|BUILD-007|User-approved staged updates|
|BUILD-008|Verify update artifacts before installation|
|BUILD-009|Staged installation and rollback|
|BUILD-010|Backup and validation before project migration|
|BUILD-011|Application and project rollback are separate|
|BUILD-012|Revalidate plugin compatibility after upgrades|
|BUILD-013|Offline local workflows|
|BUILD-014|SBOM, checksums, and build provenance|
|BUILD-015|No global Python or Node.js dependency|
|BUILD-016|PyInstaller baseline for MVP|
|BUILD-017|Windows `.exe`, macOS `.dmg`, Linux AppImage|
|BUILD-018|Signed releases|
|BUILD-019|Centralized official release repository|
|BUILD-020|Hybrid risk-based project migration|
|BUILD-021|Broader MVP CPU architecture matrix|
|BUILD-022|Explicit project compatibility policy|
|BUILD-023|Hybrid Linux runtime dependencies|
|BUILD-024|Native macOS WebKit|
|BUILD-025|Windows Evergreen WebView2|
|BUILD-026|Hybrid build reproducibility|
|BUILD-027|Hybrid CI/CD with manual release approval|
|BUILD-028|Minimum supported OS baselines|
|BUILD-029|Hybrid release recovery policy|
|BUILD-030|Mandatory Release Compatibility Manifest|

## 20. Dependencies on Other Architecture Documents

|Document|Relationship|
|---|---|
|02 — System Architecture|Desktop runtime and deployment|
|04 — Data & Persistence|Database backup, migration, project storage|
|06 — Application & IPC|Protocol compatibility and lifecycle|
|09 — Plugin Architecture|Plugin SDK and runtime compatibility|
|10 — AI Architecture|Local/cloud runtime compatibility|
|11 — Security Architecture|Signing, integrity, secrets, supply chain|
|12 — Reporting & Export|Export compatibility and preservation|
|13 — Testing Architecture|Build, installation, migration, release verification|

## 21. Completion Criteria

Document 14 is implementable when:

1. Every supported platform has a validated build and packaging process.
    
2. Runtime dependencies are isolated and version-controlled.
    
3. Release artifacts can be authenticated and traced to source.
    
4. Installation, update, and rollback are tested.
    
5. Project migration is recoverable and integrity-checked.
    
6. Plugin compatibility is validated after application updates.
    
7. Offline local workflows remain functional.
    
8. CI/CD includes release verification and approval gates.
    
9. User data is preserved throughout installation and recovery.
    
10. Every release publishes a valid Release Compatibility Manifest.
    

---

**Document 14 Status: APPROVED BASELINE v0.1**