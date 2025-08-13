# Town Econ

A modern TypeScript project built with Vite, featuring strict type safety, comprehensive testing, and automated quality gates.

## 🚀 Quick Start

### Prerequisites
- **Node.js** 20+
- **pnpm** (recommended) or npm

### Installation & Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd town-econ

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The app will be available at [http://localhost:5173](http://localhost:5173)

## 📚 Available Scripts

### Development
- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build locally

### Quality Assurance
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm lint` - Run ESLint on all files
- `pnpm lint:fix` - Auto-fix ESLint issues
- `pnpm format` - Format code with Prettier
- `pnpm format:check` - Check code formatting

### Testing
- `pnpm test` - Run test suite once
- `pnpm test:watch` - Run tests in watch mode
- `pnpm coverage` - Generate coverage report

## 🏗️ Project Structure

```
town-econ/
├── .github/workflows/     # GitHub Actions CI
├── .husky/               # Git hooks (pre-commit, pre-push)
├── .vscode/              # VS Code configuration
├── src/
│   ├── lib/              # Utility functions and business logic
│   │   ├── hello.ts      # Example function
│   │   └── hello.spec.ts # Tests
│   └── main.ts           # Application entry point
├── dist/                 # Build output (generated)
├── coverage/             # Test coverage reports (generated)
├── index.html            # Main HTML file
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite build configuration
├── vitest.config.ts      # Test configuration
├── eslint.config.js      # ESLint rules
├── .prettierrc           # Prettier formatting rules
└── package.json          # Dependencies and scripts
```

## 🔧 Development Workflow

### Code Quality Gates
This project enforces strict quality standards through automated checks:

1. **Pre-commit Hook**: Automatically fixes ESLint issues and formats code
2. **Pre-push Hook**: Runs type checking and tests before pushing
3. **CI Pipeline**: Full validation on every push and pull request

### Git Hooks
- **Pre-commit**: Runs `lint-staged` to fix and format staged TypeScript files
- **Pre-push**: Runs `pnpm typecheck` and `pnpm test` to ensure quality

### Commit Message Convention
Use clear, descriptive commit messages:
```
feat: add new user authentication system
fix: resolve memory leak in data processing
docs: update API documentation
test: add unit tests for user service
```

## 🎯 TypeScript Configuration

### Strict Mode Enabled
- **No implicit any**: All types must be explicit
- **Strict equality**: `===` required, `==` forbidden
- **Unused variables**: Caught at compile time
- **Indexed access**: Requires explicit bounds checking

### Path Aliases
- `@/*` → `src/*` for clean imports

## 🧪 Testing Strategy

### Test Framework
- **Vitest**: Fast, modern testing framework
- **Coverage**: V8 coverage provider with HTML reports
- **Thresholds**: Enforced minimum coverage (85% lines/functions, 75% branches)

### Running Tests
```bash
# Run all tests
pnpm test

# Watch mode for development
pnpm test:watch

# Generate coverage report
pnpm coverage
```

## 📝 Code Style

### ESLint Rules
- **TypeScript**: Strict type checking and best practices
- **Import/Export**: Organized imports with alphabetical sorting
- **Code Quality**: No unused variables, consistent formatting

### Prettier Configuration
- **Single quotes**: `'string'` instead of `"string"`
- **Trailing commas**: Always enabled for cleaner diffs
- **Line length**: 100 characters maximum
- **End of line**: LF (Unix) for cross-platform compatibility

## 🌍 Environment & Compatibility

### Operating Systems
- **Windows**: Full support with Git Bash
- **macOS**: Native support
- **Linux**: Native support

### Line Endings
- **Git**: Automatically converts CRLF to LF
- **Editor**: Configured for LF line endings
- **CI**: Runs on Ubuntu with LF endings

## 🚨 Troubleshooting

### Common Issues

#### "Command not found: pnpm"
```bash
# Install pnpm globally
npm install -g pnpm

# Or use npm instead
npm install
npm run dev
```

#### TypeScript errors
```bash
# Check for type issues
pnpm typecheck

# Ensure all dependencies are installed
pnpm install
```

#### Linting errors
```bash
# Auto-fix issues
pnpm lint:fix

# Format code
pnpm format
```

#### Test failures
```bash
# Run tests with verbose output
pnpm test --reporter=verbose

# Check coverage for specific files
pnpm coverage
```

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** thoroughly: `pnpm test && pnpm typecheck && pnpm lint`
5. **Commit** with clear messages
6. **Push** to your branch
7. **Create** a pull request

## 📄 License

[Add your license here]

## 🆘 Support

For questions or issues:
- Check the troubleshooting section above
- Review the CI logs for build errors
- Ensure your environment matches the prerequisites
