# Developer Toolkit Browser Extension

A unified set of developer tools in a convenient browser extension, including:

1. **Timestamp Converter** - Convert and format timestamps from various formats
2. **UAT Credentials Manager** - Store and manage credentials for testing environments
3. **PX ↔ VW Converter** - Convert between pixels and viewport width units for responsive design
4. **Natural TTS** - Text-to-speech for reading Chinese novels from Wuxiaworld using Google Cloud TTS (free tier) or OpenAI TTS

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

### Natural TTS (Text-to-Speech)

- Extract text content from web pages (optimized for Wuxiaworld novel chapters)
- **Two TTS providers supported:**
  - **Google Cloud Text-to-Speech** (Default, recommended) - Free tier: 1 million characters/month
  - **OpenAI TTS** - Paid service with premium voices
- Multiple voice options:
  - Google Cloud: Standard and Neural2 voices (high quality)
  - OpenAI: Alloy, Echo, Fable, Onyx, Nova, Shimmer
- Adjustable speech speed (0.75x to 1.5x)
- Audio playback controls (Play, Pause, Stop)
- Progress tracking and volume control
- Background playback support
- Custom CSS selectors for content extraction
- Chunked audio generation for long texts

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

### Natural TTS

1. **Setup**: Choose your TTS provider and enter the corresponding API key:
   - **Google Cloud TTS** (Recommended): 
     - Create an API key in [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
     - Enable the Text-to-Speech API for your project
     - Free tier provides 1 million characters per month
   - **OpenAI TTS**: 
     - Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
     - Paid service with premium voice quality
2. **Navigate**: Go to a Wuxiaworld chapter page (or any webpage with text content)
3. **Extract**: Click "Extract Text" to pull content from the page
   - The default selector `.chapter-content` works well for Wuxiaworld
   - You can customize the CSS selector for other websites
4. **Customize**: 
   - Choose a voice from the available options (varies by provider)
   - Adjust speech speed (0.75x - 1.5x)
   - Edit the extracted text if needed
5. **Play**: Click "Play" to generate and play the audio
   - Audio plays in the background, so you can browse other tabs
   - Use Pause/Stop controls as needed
   - Adjust volume with the slider

**Note**: You'll need an API key from your chosen provider. The extension stores your API key locally and only uses it for TTS requests.

## Privacy

All data is stored locally in your browser. The Natural TTS feature sends text to your chosen TTS provider's API for speech generation, but your API key and other data remain local.

## Development

Built with vanilla JavaScript, HTML, and CSS. No external dependencies required.
