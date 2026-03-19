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
- TypeScript compilation (tsc --noEmit)
- ESLint with zero warnings
- Test suite with coverage
- Successful build

### Quality Gate Requirements

#### TypeScript/UI Service: batch-audit-ui

- **TypeScript check**: PASS (tsc --noEmit)
- **ESLint**: PASS (--max-warnings 0)
- **Tests**: PASS with coverage reporting
- **Build**: PASS (successful Vite compilation)

## Timeout Configurations

All long-running operations have strict timeouts to prevent hanging builds:

| Operation        | Timeout    | Rationale                      |
| ---------------- | ---------- | ------------------------------ |
| Global job       | 10 minutes | UI builds are typically faster |
| TypeScript check | 2 minutes  | Quick type validation          |
| ESLint           | 2 minutes  | Fast linting feedback          |
| Tests            | 5 minutes  | Comprehensive test suite       |
| Build            | 3 minutes  | Vite build compilation         |

## Enforcement Rules

### No Merge Conditions

Pull requests will be blocked from merging if:

- Any required status check fails
- TypeScript compilation errors exist
- ESLint warnings or errors found
- Tests fail
- Build process fails

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
# Full CI simulation
make ci-local

# Individual checks
npm run type-check  # TypeScript check
npm run lint        # ESLint
npm test            # Tests with coverage
npm run build       # Build application
```

This mirrors the exact CI checks and catches issues before pushing.

## Troubleshooting

### Common Issues

- **TypeScript errors**: Fix type definitions and imports
- **ESLint warnings**: Follow coding standards, fix unused variables
- **Test failures**: Ensure all components render correctly and logic works
- **Build failures**: Check for missing dependencies or incorrect imports

### Getting Help

- Check workflow logs in GitHub Actions tab
- Review specific error messages in PR comments
- Run individual npm scripts locally to isolate issues
- Check React component patterns and UI consistency
