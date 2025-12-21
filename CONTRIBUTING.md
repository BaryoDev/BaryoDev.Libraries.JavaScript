# Contributing to BaryoDev.Libraries.JavaScript

Thank you for your interest in contributing! This monorepo hosts zero-dependency, ultra-lightweight JavaScript utility libraries.

## Getting Started

1.  **Fork and Clone**:
    ```bash
    git clone https://github.com/your-username/BaryoDev.Libraries.JavaScript.git
    cd BaryoDev.Libraries.JavaScript
    ```

2.  **Install Dependencies**:
    We use [pnpm](https://pnpm.io/).
    ```bash
    pnpm install
    ```

3.  **Run Tests**:
    ```bash
    pnpm test
    ```

## Development Workflow

1.  Create a new branch for your feature or fix.
2.  Make your changes.
3.  Add tests for your changes. We aim for 100% test coverage including edge cases.
4.  Run `pnpm test` to ensure everything passes.
5.  If you modified a package's public API or behavior, create a changeset:
    ```bash
    pnpm changeset
    ```
6.  Commit and push your changes.
7.  Open a Pull Request.

## Code Style

- We use TypeScript for all packages.
- Follow the existing code style.
- Use `pnpm lint` to check for issues (if available).

## License

By contributing, you agree that your contributions will be licensed under its MIT License.
