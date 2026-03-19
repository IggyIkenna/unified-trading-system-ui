# Branch Protection Rules

## Main Branch Protection

Configure the following branch protection rules for the `main` branch:

### Required Settings

- **Require pull request reviews**: 1 approval minimum
- **Dismiss stale reviews on new commits**: Enabled
- **Require status checks to pass**: Enabled
  - Required checks: `quality-gates`
- **Require branches to be up to date**: Enabled
- **Include administrators**: Enabled (applies to all users)

### Status Check Requirements

The following status checks must pass before merging:

- `quality-gates` workflow completion
- All linting checks (Ruff for Python, ESLint for TypeScript)
- Type checking (basedpyright for Python, TypeScript compiler for UI)
- Test coverage thresholds met
- No security vulnerabilities found

### Quality Gate Requirements

#### Python Services

- **Ruff linting**: PASS (no E, F, W, I rule violations)
- **Basedpyright**: PASS (with 60s timeout to prevent hangs)
- **Tests**: PASS with minimum coverage threshold
- **Security scan**: PASS (pip-audit for dependencies)

#### TypeScript/UI Services

- **TypeScript check**: PASS (tsc --noEmit)
- **ESLint**: PASS (--max-warnings 0)
- **Tests**: PASS with coverage reporting
- **Build**: PASS (successful compilation)

## Timeout Configurations

All long-running operations have strict timeouts to prevent hanging builds:

| Operation        | Timeout                              | Rationale                         |
| ---------------- | ------------------------------------ | --------------------------------- |
| Global job       | 15 minutes (Python), 10 minutes (UI) | Prevents runaway builds           |
| Basedpyright     | 60 seconds                           | Critical: prevents infinite hangs |
| Tests            | 5 minutes                            | Ensures fast feedback             |
| TypeScript check | 2 minutes                            | Quick type validation             |
| ESLint           | 2 minutes                            | Fast linting feedback             |
| Build operations | 3-10 minutes                         | Reasonable compilation time       |

## Enforcement Rules

### No Merge Conditions

Pull requests will be blocked from merging if:

- Any required status check fails
- Code coverage falls below threshold
- Linting errors exist
- Type checking fails
- Security vulnerabilities detected
- Tests fail or timeout

### Emergency Procedures

In case of critical hotfixes:

1. Create emergency branch from `main`
2. Apply minimal fix with tests
3. Run local quality gates: `make ci-local`
4. Request expedited review
5. Merge only after all checks pass

## Local Testing

Before creating pull requests, run local quality gates:

```bash
# For Python services
make ci-local

# For TypeScript/UI services
npm run lint && npm run type-check && npm test && npm run build
```

This mirrors the exact CI checks and catches issues before pushing.

## Troubleshooting

### Common Issues

- **Basedpyright timeout**: Usually indicates complex types or circular imports
- **Coverage drops**: Add tests for new code paths
- **Linting failures**: Run auto-fix locally before pushing

### Getting Help

- Check workflow logs in GitHub Actions tab
- Review specific error messages in PR comments
- Run quality gates locally to reproduce issues
- Ask for assistance in team channels if blocked
