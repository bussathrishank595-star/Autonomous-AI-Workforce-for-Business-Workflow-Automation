# Contributing to AgentOS

We welcome contributions to AgentOS! Please read these guidelines to ensure a smooth collaboration process.

## Code of Conduct
By participating, you agree to uphold our [Code of Conduct](CODE_OF_CONDUCT.md).

## How Can I Contribute?

### Reporting Bugs
- Open an issue describing the bug.
- Include steps to reproduce, actual behavior, and expected behavior.
- Attach system logs or Vercel inspect deployment traces if applicable.

### Suggesting Enhancements
- Open a feature request issue.
- Explain why the feature is useful and how it should work.

### Pull Requests
1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/my-new-feature`.
3. Commit your changes: `git commit -m 'Add some feature'`.
4. Push to the branch: `git push origin feature/my-new-feature`.
5. Submit a Pull Request.

## Code Style
- Use TypeScript for all logic.
- Ensure all parameters have explicit type definitions (avoid implicit `any` compiler conflicts).
- Run `npm run lint` and `npx prisma generate` before pushing.
