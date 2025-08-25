# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Test-Driven Development (TDD) Methodology

**CRITICAL: This project strictly follows TDD practices. All code changes must follow this process:**

### TDD Process (Red-Green-Refactor)
1. **Red Phase**: Write failing unit tests first
   - For new features: Create all failing unit tests before any implementation
   - For bug fixes: Create failing unit tests that reproduce the bug
   - Verify tests fail and understand why they're failing

2. **Green Phase**: Make tests pass
   - Implement minimal code to make tests pass
   - Run tests frequently during implementation

3. **Refactor Phase**: Improve code quality
   - Add edge case tests for scenarios discovered during implementation
   - Refactor code while keeping tests green

### Testing Commands
```bash
# Run comprehensive test suite (must pass before any commits)
node chrome-extension/tests/run-all-domain-tag-tests.js

# Tests cover: domain tag colors, animations, accessibility, contrast ratios
```

## Project Architecture

### High-Level Overview
Third-Party Domain Monitor Chrome extension that displays tracking domains as animated visual tags for privacy awareness. This is a defensive security tool that helps users understand their browsing privacy footprint.

### Core Architecture Pattern
- **Producer-Consumer Queue**: Eliminates race conditions in domain processing
- **Service Worker + Content Script**: Background monitoring with UI rendering
- **Single-threaded Processing**: Chrome runtime handles synchronization

### Key Components

#### background.js (Service Worker)
- Network request monitoring via WebRequest API
- Third-party tracking domain detection using pattern matching
- Known tracking domain database (Google Analytics, Facebook, etc.)
- Message passing to content scripts for UI updates

#### content.js (ThirdPartyDomainTracker Class)
- Producer-consumer architecture for domain event processing
- Real-time domain tag rendering with 5-second display duration
- Smart domain grouping (consolidates subdomains under base domains)
- Favicon loading and caching system
- 4-color palette with hash-based consistent color assignment

#### Domain Processing Logic
```javascript
// Key methods in ThirdPartyDomainTracker:
processDomainEvent()     // Synchronous consumer processing
updateExistingDomain()   // Updates counters and resets timeouts  
createNewDomain()        // Creates new visual tags with animations
removeDomain()           // Handles tag removal with animations
```

### Color System
- **4-color palette**: Orange (#FF8400), Vista Bleu (#8FA0D8), Amande (#F9DFC6), Bleu Oxford (#0B0829)
- **Hash-based assignment**: Ensures consistent colors per domain
- **Accessibility considerations**: Proper contrast ratios for text visibility
- **Animation compatibility**: Colors work with hover and pulse effects

### Manifest v3 Configuration
- Required permissions: webRequest, webNavigation, activeTab, storage
- Content Security Policy configured for favicon loading
- Host permissions for all URLs to monitor tracking requests

## Build and Release Process

### GitHub Actions Workflow
- **Unit Test Gate**: All tests must pass before release
- **Automated Versioning**: Patch version auto-increment on main branch pushes
- **Package Creation**: ZIP files ready for Chrome Web Store distribution
- **Quality Gates**: Build fails if unit tests don't pass

### Development Workflow
1. Write failing tests for new feature/bug fix
2. Verify tests fail and understand failure reasons
3. Implement code to make tests pass
4. Add edge case tests during implementation
5. Run full test suite: `node chrome-extension/tests/run-all-domain-tag-tests.js`
6. Commit only when all tests pass

## Security Considerations
- **Defensive Purpose**: Monitors outgoing requests to identify tracking domains
- **No Data Collection**: All processing happens locally in browser
- **Privacy Focused**: Helps users understand their browsing privacy footprint
- **Pattern-based Detection**: Uses known tracking patterns and domain lists

## Technical Implementation Notes
- **Race Condition Prevention**: Producer-consumer queue ensures thread-safe domain processing
- **Performance Optimization**: Favicon caching, timeout management, efficient DOM updates
- **User Experience**: Non-intrusive bottom-right corner placement with smooth animations
- **Resource Management**: Automatic cleanup of timeouts and DOM elements