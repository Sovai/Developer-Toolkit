# Developer Toolkit Browser Extension

A unified set of developer tools in a convenient browser extension, including:

1. **Timestamp Converter** - Convert and format timestamps from various formats
2. **UAT Credentials Manager** - Store and manage credentials for testing environments
3. **PX ↔ VW Converter** - Convert between pixels and viewport width units for responsive design

## Features

### Timestamp Converter

- Convert timestamps from various formats (Unix, ISO, date strings)
- Support for multiple output formats
- Timezone control
- Copy results to clipboard

### UAT Credentials Manager

- Store username/password pairs for testing environments
- Search functionality to quickly find credentials
- Password visibility toggle
- Edit and delete existing credentials

### PX ↔ VW Converter

- Convert from pixels to viewport width units and vice versa
- Persistent values and settings
- Copy results to clipboard
- Customizable viewport width

### Global Features

- Dark/Light theme toggle
- Unified navigation bar
- Data stored locally in the browser

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension directory

## Usage

### Timestamp Converter

1. Enter one or more timestamps (one per line)
2. Select output format
3. Toggle timezone settings if needed
4. Click "Convert" to see results

### UAT Credentials Manager

1. Click "New" to add credentials
2. Enter username and password
3. Use search to filter stored credentials
4. Click eye icon to show/hide passwords

### PX ↔ VW Converter

1. Enter a pixel value and viewport width
2. Click "Convert to VW" to calculate
3. Use the toggle button to switch between PX → VW and VW → PX modes

## Privacy

All data is stored locally in your browser. No data is sent to external servers.

## Development

Built with vanilla JavaScript, HTML, and CSS. No external dependencies required.
