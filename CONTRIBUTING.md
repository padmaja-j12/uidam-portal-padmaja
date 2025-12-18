# How to contribute

Support and contributions from the open source community are essential for keeping
`uidam-portal` up to date and always improving! There are a few guidelines that we need
contributors to follow to keep the project consistent, as well as allow us to keep
maintaining `uidam-portal` in a reasonable amount of time.

ECSP project welcomes contributions and suggestions. Please follow the below steps to be able to contribute to ECSP:
- Create an [Eclipse Foundation account](https://accounts.eclipse.org/).
- Review and Agree to [Eclipse Contributor Agreement](https://www.eclipse.org/legal/eca/).
- More details about contribution can be found in [Eclipse Project Handbook - Contributors](https://www.eclipse.org/projects/handbook/#contributing-contributors) section.

Please note that this project is released with a [Contributor Code of Conduct][coc].

By participating in this project you agree to abide by its terms.

[coc]: ./CODE_OF_CONDUCT.md

## Creating an Issue

Before you create a new Issue:

1. Please make sure there is no [open issue](https://github.com/eclipse-ecsp/uidam-portal/issues) yet.
2. If it is a bug report, include the steps to reproduce the issue and please create a reproducible test case.
3. If it is a feature request, please share the motivation for the new feature and how you would implement it.
4. Please include links to the corresponding GitHub documentation.

## Style Guidelines & Naming Conventions

### Code Style
- Follow the existing code style in the project
- Use ESLint and Prettier configurations provided in the repository
- Run `npm run lint` and `npm run format` before committing

### TypeScript
- Use strong typing; avoid `any` types when possible
- Define interfaces for component props and data structures
- Use TypeScript utility types when appropriate

### React Components
- Use functional components with hooks
- Follow the Single Responsibility Principle
- Keep components small and focused
- Use proper prop validation

### File Naming
- Component files: PascalCase (e.g., `UserManagement.tsx`)
- Utility files: camelCase (e.g., `apiHelpers.ts`)
- Test files: Add `.test` suffix (e.g., `UserManagement.test.tsx`)
- Style files: Add `.styles` suffix if using styled components

### Commit Messages
- Use clear and descriptive commit messages
- Start with a verb in present tense (e.g., "Add", "Fix", "Update", "Remove")
- Reference issue numbers when applicable (e.g., "Fix user login bug (#123)")

## Test Guidelines

All new features and bug fixes must include appropriate tests.

### Testing Requirements
- Write unit tests for all new functions and components
- Aim for high test coverage (minimum 80%)
- Test edge cases and error scenarios
- Use Testing Library best practices for component tests

### Running Tests
```bash
npm test                  # Run all tests
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Generate coverage report
```

### Test Structure
```typescript
describe('ComponentName', () => {
  it('should render correctly', () => {
    // Test implementation
  });
  
  it('should handle user interaction', () => {
    // Test implementation
  });
});
```

## Code Quality Checks

Before submitting a pull request, ensure all quality checks pass:

```bash
npm run lint              # Check for linting errors
npm run lint:fix          # Auto-fix linting issues
npm run format            # Format code with Prettier
npm run type-check        # TypeScript type checking
npm test                  # Run all tests
npm run build             # Ensure build succeeds
```

## Making Changes

- Create a topic branch from the main branch
- Check for unnecessary whitespace / changes with `git diff --check` before committing
- Keep git commit messages clear and appropriate
- Follow the commit message conventions described above

## Submitting the Pull Request

- Push your changes to your topic branch on your fork of the repo
- Submit a pull request from your topic branch to the [main](https://github.com/eclipse-ecsp/uidam-portal) branch on the `uidam-portal` repository
- Be sure to tag any issues your pull request is taking care of / contributing to
  - Adding "Closes #123" to a pull request description will auto close the issue once the pull request is merged in

### Pull Request Guidelines

- Fill in the pull request template completely
- Include screenshots for UI changes
- Update documentation if needed
- Ensure all CI checks pass
- Request review from maintainers
- Be responsive to feedback

## Merging a PR and Shipping a release (maintainers only)

- A PR can only be merged into main branch by a maintainer if: CI is passing, approved by another maintainer and is up-to-date with the default branch
- Ensure that the PR is tagged with related [issue](https://github.com/eclipse-ecsp/uidam-portal/issues) it intends to resolve
- Change log for all the PRs merged since the last release should be included in the release notes
- Automatically generated release notes is configured for the repo and must be used while creating a new release tag

## Development Workflow

### Setup Development Environment

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file from `.env.example`
4. Start development server: `npm run dev`

### Feature Development

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Implement your changes
3. Write/update tests
4. Run quality checks
5. Commit your changes
6. Push to your fork
7. Create a pull request

### Bug Fixes

1. Create a bugfix branch: `git checkout -b fix/bug-description`
2. Fix the issue
3. Add tests to prevent regression
4. Run quality checks
5. Commit and push
6. Create a pull request with "Fixes #issue-number"

## Questions?

If you have questions about contributing, please open an issue with the "question" label or reach out to the maintainers.

Thank you for contributing to UIDAM Portal!
