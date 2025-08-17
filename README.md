# Third-Party Domain Monitor Chrome Extension

A Chrome extension that monitors and displays third-party tracking domains as beautiful animated tags in the bottom-right corner of web pages.

## Features

- 🎯 **Focused Tracking Detection**: Identifies advertising, analytics, and marketing pixels
- 🎨 **Beautiful Visual Design**: Animated tags with custom color palette and domain favicons
- ⚡ **Real-time Monitoring**: Shows tracking domains as they're detected (5-second display)
- 🔄 **Smart Grouping**: Consolidates subdomains under main domains with combined counts
- 🎛️ **Toggle Control**: Easy on/off switch via extension popup
- 🌐 **Favicon Integration**: Real domain favicons for easy identification

## Installation

### From Release (Recommended)
1. Download the latest `.zip` file from [Releases](../../releases)
2. Extract the ZIP file
3. Open Chrome and go to `chrome://extensions/`
4. Enable "Developer mode" in the top right
5. Click "Load unpacked" and select the extracted folder

### From Source
1. Clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `chrome-extension` folder

## Development

### Project Structure
```
chrome-extension/
├── manifest.json           # Extension configuration
├── background.js          # Service worker for network monitoring  
├── content.js             # Content script for UI and domain tracking
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
├── styles.css            # Styling for domain tags
└── icons/                # Extension icons
```

### Color Palette
The extension uses a beautiful 4-color palette:
- **Orange** (#FF8400) with black text
- **Vista Bleu** (#8FA0D8) with white text  
- **Amande** (#F9DFC6) with black text
- **Bleu Oxford** (#0B0829) with white text

## Automated Builds

This project uses GitHub Actions for automated building and releasing:

### Workflow Features
- 🔄 **Auto-versioning**: Automatically increments patch version on each build
- 📦 **Package Creation**: Creates `.zip` packages ready for Chrome Web Store
- 🏷️ **Git Tagging**: Creates version tags (e.g., `v1.0.1`)
- 📋 **Release Notes**: Auto-generates release notes from commit messages
- 💾 **Artifact Storage**: Stores build artifacts for easy download

### Trigger Conditions
- Push to `main` branch
- Manual workflow dispatch

### Version Management
- Current version is read from `manifest.json`
- Patch version is auto-incremented (e.g., 1.0.0 → 1.0.1)
- Version is committed back to the repository
- Git tag is created matching the new version

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test the extension locally
5. Submit a pull request

## Security

This extension is designed for defensive security purposes:
- Monitors outgoing requests only
- No data collection or transmission
- Helps users understand their browsing privacy footprint
- All processing happens locally in the browser

## License

This project is open source and available under the MIT License.