// Settings panel toggle functionality
document.addEventListener('DOMContentLoaded', function() {
  const settingsToggle = document.getElementById('settingsToggle');
  const settingsPanel = document.getElementById('settingsPanel');

  if (settingsToggle && settingsPanel) {
    settingsToggle.addEventListener('click', function() {
      const isExpanded = settingsToggle.classList.contains('expanded');

      if (isExpanded) {
        // Collapse
        settingsToggle.classList.remove('expanded');
        settingsPanel.classList.remove('expanded');
      } else {
        // Expand
        settingsToggle.classList.add('expanded');
        settingsPanel.classList.add('expanded');
      }
    });
  }
});

// Standalone functions for content script execution
function extractTextFromPage(selector = '') {
  console.log('Starting text extraction with selector:', selector);

  const selectors = [
    selector.trim(),
    '.chapter-content',
    '.chapter-content .fr-view',
    '.chapter-content .chapter-c',
    '.chapter-c',
    '.fr-view',
    '#chapter-content',
    'div[class*="chapter"]',
    'div[class*="content"]',
    'article',
    '.content',
    'main'
  ].filter(s => s); // Remove empty strings

  console.log('Trying selectors:', selectors);

  let content = null;
  let usedSelector = '';

  for (const sel of selectors) {
    console.log(`Trying selector: "${sel}"`);
    const element = document.querySelector(sel);
    if (element) {
      console.log(`Found element with selector "${sel}":`, element);
      content = element;
      usedSelector = sel;
      break;
    }
  }

  if (!content) {
    console.log('No content found with any selector');
    return {
      success: false,
      error: 'Could not find chapter content on this page',
      availableSelectors: Array.from(document.querySelectorAll('div, article, main, section'))
        .map(el => {
          const classes = el.className ? `.${el.className.replace(/\s+/g, '.')}` : '';
          const id = el.id ? `#${el.id}` : '';
          return `${el.tagName.toLowerCase()}${id}${classes}`;
        })
        .slice(0, 10)
    };
  }

  console.log(`Using content from selector: ${usedSelector}`);
  console.log('Content element:', content);

  // Remove unwanted elements
  const contentClone = content.cloneNode(true);
  const unwantedSelectors = [
    'script', 'style', 'nav', 'header', 'footer',
    '[class*="ad"]', '[id*="ad"]',
    '[class*="banner"]', '[id*="banner"]',
    '.navigation', '.nav', '.menu',
    '.sidebar', '.widget',
    '[class*="comment"]', '[id*="comment"]',
    '[class*="share"]', '[class*="social"]',
    '.breadcrumb', '.breadcrumbs',
    '[class*="vote"]', '[class*="rating"]',
    '[class*="recommend"]',
    'button', 'input', 'form',
    '[style*="display: none"]', '[style*="display:none"]',
    '.hidden', '[hidden]'
  ];

  unwantedSelectors.forEach(sel => {
    const elements = contentClone.querySelectorAll(sel);
    console.log(`Removing ${elements.length} elements matching: ${sel}`);
    elements.forEach(el => el.remove());
  });

  // Get text content
  let text = contentClone.textContent || contentClone.innerText || '';

  // Clean up the text
  text = text
    .replace(/\s+/g, ' ')  // Replace multiple whitespace with single space
    .replace(/\n\s*\n/g, '\n')  // Remove empty lines
    .trim();

  console.log(`Extracted text length: ${text.length}`);
  console.log('Text preview:', text.substring(0, 200) + '...');

  if (text.length < 50) {
    console.log('Text too short, might not be chapter content');
    return {
      success: false,
      error: `Text too short (${text.length} characters). This might not be chapter content.`,
      extractedText: text,
      usedSelector: usedSelector
    };
  }

  return {
    success: true,
    text: text,
    usedSelector: usedSelector,
    wordCount: text.split(/\s+/).length
  };
}

function analyzePageSelectors() {
  console.log('Analyzing page selectors...');

  const potentialSelectors = [
    '.chapter-content',
    '.chapter-content .fr-view',
    '.chapter-content .chapter-c',
    '.chapter-c',
    '.fr-view',
    '#chapter-content',
    'div[class*="chapter"]',
    'div[class*="content"]',
    'article',
    '.content',
    'main'
  ];

  const analysis = {
    url: window.location.href,
    title: document.title,
    selectors: []
  };

  potentialSelectors.forEach(selector => {
    try {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        elements.forEach((element, index) => {
          const text = element.textContent || element.innerText || '';
          const preview = text.substring(0, 100).replace(/\s+/g, ' ').trim();

          analysis.selectors.push({
            selector: selector,
            index: index,
            found: true,
            elementTag: element.tagName.toLowerCase(),
            textLength: text.length,
            preview: preview + (text.length > 100 ? '...' : ''),
            innerHTML: element.innerHTML.substring(0, 200) + (element.innerHTML.length > 200 ? '...' : '')
          });
        });
      } else {
        analysis.selectors.push({
          selector: selector,
          found: false,
          elements: 0
        });
      }
    } catch (error) {
      analysis.selectors.push({
        selector: selector,
        found: false,
        error: error.message
      });
    }
  });

  // Also check for any divs with text content
  const allDivs = document.querySelectorAll('div');
  const textDivs = Array.from(allDivs)
    .filter(div => {
      const text = div.textContent || div.innerText || '';
      return text.length > 200; // Only divs with substantial text
    })
    .slice(0, 5) // Limit to first 5
    .map(div => {
      const classes = div.className ? `.${div.className.replace(/\s+/g, '.')}` : '';
      const id = div.id ? `#${div.id}` : '';
      const selector = `div${id}${classes}`;
      const text = div.textContent || div.innerText || '';

      return {
        selector: selector,
        textLength: text.length,
        preview: text.substring(0, 100).replace(/\s+/g, ' ').trim() + '...',
        suggested: true
      };
    });

  analysis.suggestedSelectors = textDivs;

  console.log('Page analysis complete:', analysis);
  return analysis;
}

class NaturalTTS {
  constructor() {
    this.audio = null;
    this.apiKey = null;
    this.googleApiKey = null;
    this.currentProvider = 'google'; // Default to Google Cloud
    this.isPlaying = false;
    this.isPaused = false;
    this.currentText = '';
    this.sourceTabId = null; // Store the tab ID we want to extract from

    // Queue system for streaming audio
    this.audioQueue = [];
    this.currentChunkIndex = 0;
    this.isGeneratingChunks = false;
    this.chunks = [];
    this.isStreamingMode = false;    this.initializeElements();
    this.bindEvents();
    this.resetAudioState(); // Ensure clean audio state
    this.loadSettings().then(() => {
      this.onProviderChange(); // Initialize provider UI
    });

    // Detect if running in a tab vs popup and show appropriate status
    this.checkRunningContext();
  }

  initializeElements() {
    this.elements = {
      ttsProvider: document.getElementById('ttsProvider'),
      apiKey: document.getElementById('apiKey'),
      googleApiKey: document.getElementById('googleApiKey'),
      openaiApiKeyGroup: document.getElementById('openaiApiKeyGroup'),
      googleApiKeyGroup: document.getElementById('googleApiKeyGroup'),
      googleStandardVoices: document.getElementById('googleStandardVoices'),
      googleNeural2Voices: document.getElementById('googleNeural2Voices'),
      googleGBStandardVoices: document.getElementById('googleGBStandardVoices'),
      googleGBNeural2Voices: document.getElementById('googleGBNeural2Voices'),
      googleAUStandardVoices: document.getElementById('googleAUStandardVoices'),
      googleAUNeural2Voices: document.getElementById('googleAUNeural2Voices'),
      openaiVoices: document.getElementById('openaiVoices'),
      selector: document.getElementById('selector'),
      voice: document.getElementById('voice'),
      speed: document.getElementById('speed'),
      extractBtn: document.getElementById('extractBtn'),
      debugBtn: document.getElementById('debugBtn'),
      resetBtn: document.getElementById('resetBtn'),
      openAsTabBtn: document.getElementById('openAsTabBtn'),
      extractedText: document.getElementById('extractedText'),
      textPreview: document.getElementById('textPreview'),
      audioControls: document.getElementById('audioControls'),
      playBtn: document.getElementById('playBtn'),
      pauseBtn: document.getElementById('pauseBtn'),
      stopBtn: document.getElementById('stopBtn'),
      volume: document.getElementById('volume'),
      progressFill: document.getElementById('progressFill'),
      currentTime: document.getElementById('currentTime'),
      totalTime: document.getElementById('totalTime'),
      status: document.getElementById('status'),
      loadingSpinner: document.getElementById('loadingSpinner')
    };
  }

  bindEvents() {
    this.elements.ttsProvider.addEventListener('change', () => this.onProviderChange());
    this.elements.apiKey.addEventListener('input', () => this.saveSettings());
    this.elements.googleApiKey.addEventListener('input', () => this.saveSettings());
    this.elements.selector.addEventListener('input', () => this.saveSettings());
    this.elements.voice.addEventListener('change', () => this.onVoiceChange());
    this.elements.speed.addEventListener('change', () => this.onSpeedChange());

    this.elements.extractBtn.addEventListener('click', () => this.extractText());
    this.elements.debugBtn.addEventListener('click', () => this.debugSelectors());
    this.elements.resetBtn.addEventListener('click', () => this.resetCache());
    this.elements.openAsTabBtn.addEventListener('click', () => this.openAsTab());
    this.elements.playBtn.addEventListener('click', () => this.play());
    this.elements.pauseBtn.addEventListener('click', () => this.pause());
    this.elements.stopBtn.addEventListener('click', () => this.stop());

    this.elements.volume.addEventListener('input', (e) => {
      if (this.audio) {
        this.audio.volume = e.target.value;
      }
    });

    // Add click-to-seek functionality for progress bar
    this.elements.progressFill.parentElement.addEventListener('click', (e) => {
      this.handleProgressBarClick(e);
    });

    this.elements.extractedText.addEventListener('input', () => {
      this.currentText = this.elements.extractedText.value;
      this.clearAudioCache(); // Clear audio cache when text changes
      this.showStatus('Text modified. Audio will be regenerated on next play.', 'info');
      this.saveState(); // Save state when text is modified
    });

    // Save state when popup is about to close
    window.addEventListener('beforeunload', () => {
      this.saveState();
    });
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.local.get([
        'tts_provider',
        'tts_apiKey',
        'tts_googleApiKey',
        'tts_selector',
        'tts_voice',
        'tts_speed',
        'tts_currentText',
        'tts_isPlaying',
        'tts_isPaused',
        'tts_pausedTime',
        'tts_isStreamingMode',
        'tts_currentChunkIndex',
        'tts_chunks',
        'tts_sourceTabId'
      ]);

      // Load provider (default to Google)
      if (result.tts_provider) {
        this.elements.ttsProvider.value = result.tts_provider;
        this.currentProvider = result.tts_provider;
      } else {
        this.currentProvider = 'google';
      }

      if (result.tts_apiKey) {
        this.elements.apiKey.value = result.tts_apiKey;
        this.apiKey = result.tts_apiKey;
      }

      if (result.tts_googleApiKey) {
        this.elements.googleApiKey.value = result.tts_googleApiKey;
        this.googleApiKey = result.tts_googleApiKey;
      }
      if (result.tts_selector) {
        this.elements.selector.value = result.tts_selector;
      }
      if (result.tts_voice) {
        this.elements.voice.value = result.tts_voice;
      }
      if (result.tts_speed) {
        this.elements.speed.value = result.tts_speed;
      }

      // Load source tab ID if available
      if (result.tts_sourceTabId) {
        this.sourceTabId = result.tts_sourceTabId;
        console.log('Loaded source tab ID:', this.sourceTabId);
      }

      // Restore session state
      if (result.tts_currentText) {
        this.currentText = result.tts_currentText;
        this.elements.extractedText.value = result.tts_currentText;
        this.elements.textPreview.style.display = 'block';
        this.elements.audioControls.style.display = 'block';
        this.elements.extractedText.removeAttribute('readonly');
      }

      if (result.tts_isStreamingMode) {
        this.isStreamingMode = result.tts_isStreamingMode;
        this.currentChunkIndex = result.tts_currentChunkIndex || 0;
        this.chunks = result.tts_chunks || [];
      }

      if (result.tts_isPlaying) {
        // Don't set isPlaying = true here since we don't have an audio object yet
        // Just show a status message that audio was previously playing
        this.showStatus('Audio was playing when popup closed. Use controls to resume.', 'info');
      }

      if (result.tts_isPaused) {
        this.isPaused = result.tts_isPaused;
        this.pausedTime = result.tts_pausedTime || 0;
        this.showStatus('Audio was paused. Click Play to resume.', 'info');
      }

      this.updateControlButtons();
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  async saveSettings() {
    try {
      const settings = {
        tts_provider: this.elements.ttsProvider.value,
        tts_apiKey: this.elements.apiKey.value,
        tts_googleApiKey: this.elements.googleApiKey.value,
        tts_selector: this.elements.selector.value,
        tts_voice: this.elements.voice.value,
        tts_speed: this.elements.speed.value
      };

      await chrome.storage.local.set(settings);
      this.currentProvider = this.elements.ttsProvider.value;
      this.apiKey = this.elements.apiKey.value;
      this.googleApiKey = this.elements.googleApiKey.value;
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  async saveState() {
    try {
      const state = {
        tts_currentText: this.currentText,
        tts_isPlaying: this.isPlaying,
        tts_isPaused: this.isPaused,
        tts_pausedTime: this.pausedTime || 0,
        tts_isStreamingMode: this.isStreamingMode,
        tts_currentChunkIndex: this.currentChunkIndex,
        tts_chunks: this.chunks,
        tts_sourceTabId: this.sourceTabId
      };

      await chrome.storage.local.set(state);
    } catch (error) {
      console.error('Error saving state:', error);
    }
  }

  async extractText() {
    try {
      this.showStatus('Extracting text from target tab...', 'info');

      let targetTabId;

      // Determine which tab to extract from
      if (this.sourceTabId) {
        // We're in tab mode and have a stored source tab ID
        try {
          const tab = await chrome.tabs.get(this.sourceTabId);
          if (tab) {
            targetTabId = this.sourceTabId;
            console.log('Using stored source tab:', targetTabId);
          } else {
            throw new Error('Stored tab no longer exists');
          }
        } catch (error) {
          console.log('Stored tab not accessible, falling back to active tab');
          this.sourceTabId = null; // Clear invalid tab ID
          const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
          targetTabId = activeTab.id;
        }
      } else {
        // We're in popup mode or no stored tab, use active tab
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        targetTabId = activeTab.id;

        // If this is the TTS tab itself, try to find a different tab
        const currentTab = await chrome.tabs.get(targetTabId);
        if (currentTab.url && currentTab.url.includes(chrome.runtime.getURL('tts.html'))) {
          this.showStatus('Cannot extract from TTS tab itself. Please switch to the content tab first.', 'error');
          return;
        }
      }

      // Get the target tab info for validation
      const targetTab = await chrome.tabs.get(targetTabId);
      console.log('Extracting from tab:', targetTab);

      if (!targetTab.url.includes('wuxiaworld.com') && !targetTab.url.includes('localhost')) {
        this.showStatus('For best results, navigate to a Wuxiaworld chapter page first', 'info');
      }

      const results = await chrome.scripting.executeScript({
        target: { tabId: targetTabId },
        function: extractTextFromPage,
        args: [this.elements.selector.value]
      });

      console.log('tab: ', targetTab);
      console.log('results: ', results);

      if (results && results[0] && results[0].result) {
        const result = results[0].result;
        console.log('Extraction result:', result);

        // Handle the new object-based result format
        if (result.success) {
          const extractedText = result.text;

          this.currentText = extractedText;
          this.elements.extractedText.value = extractedText;
          this.elements.textPreview.style.display = 'block';

          // Clear audio cache when new text is extracted
          this.clearAudioCache();

          // Show audio controls when text is available
          this.elements.audioControls.style.display = 'block';
          this.updateControlButtons();

          // Save state after successful extraction
          this.saveState();

          // Show character count and estimated reading time
          const charCount = extractedText.length;
          const estimatedMinutes = Math.ceil(charCount / 800); // Rough estimate: 800 chars per minute
          this.showStatus(`Extracted ${charCount} characters (≈${estimatedMinutes} min read) using selector: ${result.usedSelector}`, 'success');

          // Make the text editable for user modifications
          this.elements.extractedText.removeAttribute('readonly');
        } else {
          // Handle extraction failure
          this.showStatus(result.error || 'Failed to extract text', 'error');

          // Show available selectors if provided
          if (result.availableSelectors && result.availableSelectors.length > 0) {
            console.log('Available selectors found:', result.availableSelectors);
            setTimeout(() => {
              this.showStatus('Try the Debug button to see available selectors on this page', 'info');
            }, 3000);
          } else {
            setTimeout(() => {
              this.showStatus('Try using selectors like: .content, main, article, or leave empty for auto-detection', 'info');
            }, 3000);
          }
        }
      } else {
        this.showStatus('No response from content script. Try refreshing the page and try again.', 'error');
      }
    } catch (error) {
      console.error('Error extracting text:', error);
      if (error.message.includes('Cannot access')) {
        this.showStatus('Cannot access the target tab. Please switch to the content tab first, then try again.', 'error');
      } else {
        this.showStatus('Error extracting text from page. Make sure you\'re on a webpage with readable content.', 'error');
      }
    }
  }

  async generateAudio() {
    const currentApiKey = this.currentProvider === 'google' ? this.googleApiKey : this.apiKey;
    const providerName = this.currentProvider === 'google' ? 'Google Cloud' : 'OpenAI';

    if (!currentApiKey) {
      this.showStatus(`Please enter your ${providerName} API key`, 'error');
      return null;
    }

    if (!this.currentText.trim()) {
      this.showStatus('No text to convert to speech', 'error');
      return null;
    }

    // Check if text is too long and needs chunking
    const maxChunkSize = this.currentProvider === 'google' ? 5000 : 4000;
    if (this.currentText.length > maxChunkSize) {
      return await this.generateChunkedAudio();
    }

    this.showLoading(true);
    this.showStatus(`Generating audio with ${providerName} TTS...`, 'info');

    try {
      let audioUrl;
      if (this.currentProvider === 'google') {
        audioUrl = await this.generateGoogleAudio(this.currentText);
      } else {
        audioUrl = await this.generateOpenAIAudio(this.currentText);
      }

      this.showLoading(false);
      this.showStatus('Audio generated successfully', 'success');
      return audioUrl;
    } catch (error) {
      console.error('Error generating audio:', error);
      this.showLoading(false);
      this.showStatus(`Error: ${error.message}`, 'error');
      return null;
    }
  }

  async generateGoogleAudio(text) {
    const voice = this.elements.voice.value;
    const speed = parseFloat(this.elements.speed.value);

    // Parse voice name to extract language code and voice name
    const voiceParts = voice.split('-');
    const languageCode = `${voiceParts[0]}-${voiceParts[1]}`; // e.g., "en-US"

    const requestBody = {
      input: {
        text: text
      },
      voice: {
        languageCode: languageCode,
        name: voice
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: speed
      }
    };

    const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.googleApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.json();
      let errorMessage = error.error?.message || 'Failed to generate audio with Google Cloud TTS';

      // Provide helpful guidance for common errors
      if (errorMessage.includes('API has not been used') || errorMessage.includes('is disabled')) {
        errorMessage = 'Google Cloud Text-to-Speech API is not enabled. Please:\n' +
                     '1. Visit Google Cloud Console\n' +
                     '2. Enable the Text-to-Speech API\n' +
                     '3. Wait a few minutes for changes to propagate\n' +
                     'Original error: ' + errorMessage;
      } else if (errorMessage.includes('API key') || errorMessage.includes('authentication')) {
        errorMessage = 'Invalid Google Cloud API key. Please check your API key in the settings.\n' +
                     'Original error: ' + errorMessage;
      } else if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
        errorMessage = 'Google Cloud API quota exceeded. You may have reached your free tier limit.\n' +
                     'Original error: ' + errorMessage;
      }

      throw new Error(errorMessage);
    }

    const result = await response.json();

    // Convert base64 audio to blob
    const audioData = atob(result.audioContent);
    const audioArray = new Uint8Array(audioData.length);
    for (let i = 0; i < audioData.length; i++) {
      audioArray[i] = audioData.charCodeAt(i);
    }

    const audioBlob = new Blob([audioArray], { type: 'audio/mp3' });
    const audioUrl = URL.createObjectURL(audioBlob);

    return audioUrl;
  }

  async generateOpenAIAudio(text) {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: this.elements.voice.value,
        speed: parseFloat(this.elements.speed.value)
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to generate audio');
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    return audioUrl;
  }

  async generateChunkedAudio() {
    // Initialize streaming mode
    this.isStreamingMode = true;
    this.audioQueue = [];
    this.currentChunkIndex = 0;
    const maxChunkSize = this.currentProvider === 'google' ? 5000 : 4000;
    this.chunks = this.splitTextIntoChunks(this.currentText, maxChunkSize);
    this.isGeneratingChunks = true;

    console.log(`Starting streaming TTS for ${this.chunks.length} chunks`);
    this.showStatus(`Generating first audio chunk...`, 'info');

    try {
      // Generate and play first chunk immediately
      const firstChunkUrl = await this.generateSingleChunk(0);
      if (!firstChunkUrl) return null;

      // Start background generation of remaining chunks
      this.generateRemainingChunksInBackground();

      return firstChunkUrl;
    } catch (error) {
      console.error('Error in chunked audio generation:', error);
      this.showLoading(false);
      this.showStatus(`Error: ${error.message}`, 'error');
      this.isStreamingMode = false;
      return null;
    }
  }

  async generateSingleChunk(chunkIndex) {
    try {
      let audioUrl;

      if (this.currentProvider === 'google') {
        audioUrl = await this.generateGoogleAudio(this.chunks[chunkIndex]);
      } else {
        audioUrl = await this.generateOpenAIAudio(this.chunks[chunkIndex]);
      }

      console.log(`Generated chunk ${chunkIndex + 1}/${this.chunks.length}`);
      return audioUrl;
    } catch (error) {
      console.error(`Error generating chunk ${chunkIndex + 1}:`, error);
      throw error;
    }
  }

  async generateRemainingChunksInBackground() {
    // Generate chunks 1, 2, 3... in background
    for (let i = 1; i < this.chunks.length; i++) {
      try {
        this.showStatus(`Preparing chunk ${i + 1} of ${this.chunks.length}...`, 'info');
        const chunkUrl = await this.generateSingleChunk(i);
        this.audioQueue.push(chunkUrl);

        console.log(`Queued chunk ${i + 1}, queue size: ${this.audioQueue.length}`);

        // Small delay to prevent overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Failed to generate chunk ${i + 1}:`, error);
        // Continue with other chunks even if one fails
      }
    }

    this.isGeneratingChunks = false;
    console.log('Finished generating all chunks');
  }

  playNextChunkFromQueue() {
    if (!this.isStreamingMode) return;

    if (this.audioQueue.length > 0) {
      // Play next chunk from queue
      const nextAudioUrl = this.audioQueue.shift();
      this.currentChunkIndex++;

      console.log(`Playing chunk ${this.currentChunkIndex + 1}, queue remaining: ${this.audioQueue.length}`);
      this.playAudioUrl(nextAudioUrl);

      this.showStatus(`Playing chunk ${this.currentChunkIndex + 1} of ${this.chunks.length}`, 'info');
    } else if (this.isGeneratingChunks) {
      // Wait for next chunk to be ready
      console.log('Waiting for next chunk to be generated...');
      this.showStatus('Waiting for next chunk...', 'info');

      const checkQueue = () => {
        if (this.audioQueue.length > 0) {
          this.playNextChunkFromQueue();
        } else if (this.isGeneratingChunks) {
          setTimeout(checkQueue, 100);
        } else {
          // No more chunks, we're done
          this.finishStreamingPlayback();
        }
      };

      setTimeout(checkQueue, 100);
    } else {
      // All chunks played
      this.finishStreamingPlayback();
    }
  }

  finishStreamingPlayback() {
    console.log('Finished playing all chunks');
    this.isStreamingMode = false;
    this.isPlaying = false;
    this.isPaused = false;
    this.updateControlButtons();
    this.showStatus(`Completed playing ${this.chunks.length} chunks`, 'success');
  }

  playAudioUrl(audioUrl) {
    if (this.audio) {
      this.audio.pause();
      URL.revokeObjectURL(this.audio.src); // Clean up previous URL
    }

    this.audio = new Audio(audioUrl);
    this.setupAudioEvents();

    this.audio.play().then(() => {
      this.isPlaying = true;
      this.updateControlButtons();
      this.audio.volume = this.elements.volume.value;
      this.saveState(); // Save state when playing
    }).catch(error => {
      console.error('Error playing audio chunk:', error);
      this.showStatus('Error playing audio chunk', 'error');
    });
  }

  splitTextIntoChunks(text, maxSize) {
    const chunks = [];
    let currentChunk = '';

    // Split by paragraphs first (double newlines or single newlines)
    const paragraphs = text.split(/\n\s*\n|\n/).filter(p => p.trim().length > 0);

    for (const paragraph of paragraphs) {
      const trimmedParagraph = paragraph.trim();

      // If a single paragraph is too long, split by sentences as fallback
      if (trimmedParagraph.length > maxSize) {
        // Add current chunk if it exists
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
        }

        // Split long paragraph by sentences
        const sentences = trimmedParagraph.split(/(?<=[.!?])\s+/);

        for (const sentence of sentences) {
          if (sentence.length > maxSize) {
            // If even a sentence is too long, split by words (last resort)
            if (currentChunk.trim()) {
              chunks.push(currentChunk.trim());
              currentChunk = '';
            }

            const words = sentence.split(' ');
            for (const word of words) {
              if (currentChunk.length + word.length + 1 > maxSize) {
                if (currentChunk.trim()) {
                  chunks.push(currentChunk.trim());
                  currentChunk = word;
                } else {
                  chunks.push(word);
                }
              } else {
                currentChunk += (currentChunk ? ' ' : '') + word;
              }
            }
          } else {
            // Check if adding this sentence would exceed the limit
            if (currentChunk.length + sentence.length + 2 > maxSize) { // +2 for space and potential newline
              if (currentChunk.trim()) {
                chunks.push(currentChunk.trim());
                currentChunk = sentence;
              } else {
                chunks.push(sentence);
              }
            } else {
              currentChunk += (currentChunk ? ' ' : '') + sentence;
            }
          }
        }
      } else {
        // Check if adding this paragraph would exceed the limit
        if (currentChunk.length + trimmedParagraph.length + 2 > maxSize) { // +2 for double newline
          if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
            currentChunk = trimmedParagraph;
          } else {
            chunks.push(trimmedParagraph);
          }
        } else {
          // Add paragraph with proper spacing
          if (currentChunk.trim()) {
            currentChunk += '\n\n' + trimmedParagraph;
          } else {
            currentChunk = trimmedParagraph;
          }
        }
      }
    }

    // Add the last chunk if it exists
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks.filter(chunk => chunk.length > 0);
  }

  async play() {
    try {
      if (!this.audio || this.audio.src === '') {
        const audioUrl = await this.generateAudio();
        if (!audioUrl) return;

        if (this.isStreamingMode) {
          // For streaming mode, use the playAudioUrl method
          this.playAudioUrl(audioUrl);
        } else {
          // For normal mode, set up audio normally
          this.audio = new Audio(audioUrl);
          this.setupAudioEvents();

          await this.audio.play();
          this.isPlaying = true;
          this.updateControlButtons();
          this.elements.audioControls.style.display = 'block';
          this.audio.volume = this.elements.volume.value;
          this.saveState(); // Save state when playing
        }
      } else {
        // Resume paused audio
        if (this.isPaused) {
          this.audio.currentTime = this.pausedTime || 0;
          this.isPaused = false;
        }

        await this.audio.play();
        this.isPlaying = true;
        this.updateControlButtons();
        this.elements.audioControls.style.display = 'block';
        this.audio.volume = this.elements.volume.value;
        this.saveState(); // Save state when resuming
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      this.showStatus('Error playing audio', 'error');
    }
  }

  pause() {
    if (this.audio && this.isPlaying) {
      this.audio.pause();
      this.pausedTime = this.audio.currentTime;
      this.isPlaying = false;
      this.isPaused = true;
      this.updateControlButtons();
      this.saveState(); // Save state when pausing
    }
  }

  stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.isPlaying = false;
      this.isPaused = false;
      this.pausedTime = 0;

      // Stop streaming mode if active
      if (this.isStreamingMode) {
        this.isStreamingMode = false;
        this.isGeneratingChunks = false;
        this.audioQueue = [];
        this.currentChunkIndex = 0;
        this.showStatus('Streaming playback stopped', 'info');
      }

      this.updateControlButtons();
      this.updateProgress();
      this.saveState(); // Save state when stopping
    }
  }

  setupAudioEvents() {
    this.audio.addEventListener('loadedmetadata', () => {
      this.elements.totalTime.textContent = this.formatTime(this.audio.duration);
    });

    this.audio.addEventListener('timeupdate', () => {
      this.updateProgress();
    });

    this.audio.addEventListener('ended', () => {
      if (this.isStreamingMode) {
        // In streaming mode, play next chunk
        this.playNextChunkFromQueue();
      } else {
        // Normal mode, just finish
        this.isPlaying = false;
        this.isPaused = false;
        this.updateControlButtons();
        this.showStatus('Playback completed', 'success');
      }
    });

    this.audio.addEventListener('error', (e) => {
      console.error('Audio error:', e);
      this.showStatus('Audio playback error', 'error');
      this.isPlaying = false;
      this.updateControlButtons();
    });
  }

  updateProgress() {
    if (this.audio) {
      const progress = (this.audio.currentTime / this.audio.duration) * 100;
      this.elements.progressFill.style.width = `${progress}%`;
      this.elements.currentTime.textContent = this.formatTime(this.audio.currentTime);
    }
  }

  updateControlButtons() {
    this.elements.playBtn.disabled = this.isPlaying;
    this.elements.pauseBtn.disabled = !this.isPlaying;
    this.elements.stopBtn.disabled = !this.isPlaying && !this.isPaused;
  }

  formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  showStatus(message, type = 'info') {
    this.elements.status.textContent = message;
    this.elements.status.className = `status-message status-${type}`;

    // Convert newlines to HTML breaks for better formatting
    this.elements.status.innerHTML = message.replace(/\n/g, '<br>');

    // Auto-hide success/error messages after 5 seconds
    if (type !== 'info') {
      setTimeout(() => {
        this.elements.status.textContent = '';
        this.elements.status.className = 'status-message';
      }, 15000); // Increased to 15 seconds for longer error messages
    }
  }

  showLoading(show) {
    this.elements.loadingSpinner.style.display = show ? 'flex' : 'none';
  }

  async debugSelectors() {
    try {
      this.showStatus('Analyzing page selectors...', 'info');

      let targetTabId;

      // Determine which tab to analyze (same logic as extractText)
      if (this.sourceTabId) {
        try {
          const tab = await chrome.tabs.get(this.sourceTabId);
          if (tab) {
            targetTabId = this.sourceTabId;
          } else {
            throw new Error('Stored tab no longer exists');
          }
        } catch (error) {
          console.log('Stored tab not accessible, falling back to active tab');
          this.sourceTabId = null;
          const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
          targetTabId = activeTab.id;
        }
      } else {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        targetTabId = activeTab.id;

        // Check if this is the TTS tab itself
        const currentTab = await chrome.tabs.get(targetTabId);
        if (currentTab.url && currentTab.url.includes(chrome.runtime.getURL('tts.html'))) {
          this.showStatus('Cannot analyze TTS tab itself. Please switch to the content tab first.', 'error');
          return;
        }
      }

      const results = await chrome.scripting.executeScript({
        target: { tabId: targetTabId },
        function: analyzePageSelectors
      });

      if (results && results[0] && results[0].result) {
        const analysis = results[0].result;
        console.log('Analysis result:', analysis);

        // Format the analysis object into a readable string
        let formattedAnalysis = `=== PAGE SELECTOR ANALYSIS ===\n\n`;
        formattedAnalysis += `URL: ${analysis.url}\n`;
        formattedAnalysis += `TITLE: ${analysis.title}\n\n`;

        formattedAnalysis += `SELECTOR RESULTS:\n`;
        analysis.selectors.forEach(selector => {
          if (selector.found) {
            formattedAnalysis += `✓ ${selector.selector} - Found ${selector.textLength} chars (${selector.elementTag})\n`;
            if (selector.preview) {
              formattedAnalysis += `  Preview: "${selector.preview}"\n`;
            }
          } else {
            formattedAnalysis += `✗ ${selector.selector} - Not found\n`;
          }
        });

        if (analysis.suggestedSelectors && analysis.suggestedSelectors.length > 0) {
          formattedAnalysis += `\nSUGGESTED SELECTORS (with substantial text):\n`;
          analysis.suggestedSelectors.forEach(item => {
            formattedAnalysis += `• ${item.selector} - ${item.textLength} chars\n`;
            formattedAnalysis += `  Preview: "${item.preview}"\n`;
          });
        }

        // Show the analysis in the text area
        this.elements.extractedText.value = formattedAnalysis;
        this.elements.textPreview.style.display = 'block';
        this.elements.extractedText.setAttribute('readonly', 'true');

        this.showStatus('Page analysis complete. Check suggested selectors above.', 'success');
      } else {
        this.showStatus('Unable to analyze page selectors', 'error');
      }
    } catch (error) {
      console.error('Error analyzing selectors:', error);
      if (error.message.includes('Cannot access')) {
        this.showStatus('Cannot access the target tab. Please switch to the content tab first.', 'error');
      } else {
        this.showStatus('Error analyzing page selectors', 'error');
      }
    }
  }

  async openAsTab() {
    try {
      // Get the current active tab ID to store as source
      const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });

      // Don't store the TTS tab itself as the source
      if (!currentTab.url.includes(chrome.runtime.getURL('tts.html'))) {
        this.sourceTabId = currentTab.id;
        console.log('Storing source tab ID:', this.sourceTabId);
      }

      // Save current state including the source tab ID
      await this.saveState();

      // Create a new tab with the TTS interface
      const tab = await chrome.tabs.create({
        url: chrome.runtime.getURL('tts.html'),
        active: true
      });

      this.showStatus('Opening TTS in new tab for persistent playback...', 'info');

      // Optional: Close the popup after a short delay
      setTimeout(() => {
        window.close();
      }, 500);

    } catch (error) {
      console.error('Error opening TTS in new tab:', error);
      this.showStatus('Error opening TTS in new tab', 'error');
    }
  }

  checkRunningContext() {
    // Better detection: check if we're in a small popup window
    const isPopup = window.outerWidth <= 420 && window.outerHeight <= 600;
    const isTab = !isPopup;

    if (isTab) {
      // Add class to center content in tab mode
      document.body.classList.add('tab-mode');

      // Hide the "Open as Tab" button since we're already in a tab
      if (this.elements.openAsTabBtn) {
        this.elements.openAsTabBtn.style.display = 'none';
      }

      // Show connection status for tab mode
      this.showTabConnectionStatus();
    } else {
      // Remove tab mode class if in popup
      document.body.classList.remove('tab-mode');

      // Show the "Open as Tab" button in popup mode
      if (this.elements.openAsTabBtn) {
        this.elements.openAsTabBtn.style.display = 'inline-flex';
      }
      this.showStatus('💡 Tip: Click "Open as Tab" for persistent audio playback that won\'t stop when you click outside', 'info');
    }
  }

  async showTabConnectionStatus() {
    if (this.sourceTabId) {
      try {
        const tab = await chrome.tabs.get(this.sourceTabId);
        if (tab) {
          const tabTitle = tab.title.length > 50 ? tab.title.substring(0, 50) + '...' : tab.title;
          this.showStatus(`📌 Connected to: ${tabTitle}`, 'info');
        } else {
          throw new Error('Tab not found');
        }
      } catch (error) {
        this.showStatus('⚠️ Source tab no longer available. Extract from the current tab or switch to the content tab first.', 'error');
        this.sourceTabId = null;
        this.saveState();
      }
    } else {
      this.showStatus('🔍 No source tab connected. Switch to the content tab first, then extract text.', 'info');
    }
  }

  resetAudioState() {
    // Reset audio-related state to ensure clean initialization
    this.isPlaying = false;
    this.isPaused = false;
    this.pausedTime = 0;
    this.audio = null;
    this.updateControlButtons();
  }

  onProviderChange() {
    this.currentProvider = this.elements.ttsProvider.value;

    // Show/hide appropriate API key fields
    if (this.currentProvider === 'google') {
      this.elements.googleApiKeyGroup.style.display = 'block';
      this.elements.openaiApiKeyGroup.style.display = 'none';

      // Show Google voices, hide OpenAI voices
      this.elements.googleStandardVoices.style.display = 'block';
      this.elements.googleNeural2Voices.style.display = 'block';
      this.elements.googleGBStandardVoices.style.display = 'block';
      this.elements.googleGBNeural2Voices.style.display = 'block';
      this.elements.googleAUStandardVoices.style.display = 'block';
      this.elements.googleAUNeural2Voices.style.display = 'block';
      this.elements.openaiVoices.style.display = 'none';
    } else {
      this.elements.googleApiKeyGroup.style.display = 'none';
      this.elements.openaiApiKeyGroup.style.display = 'block';

      // Show OpenAI voices, hide Google voices
      this.elements.googleStandardVoices.style.display = 'none';
      this.elements.googleNeural2Voices.style.display = 'none';
      this.elements.googleGBStandardVoices.style.display = 'none';
      this.elements.googleGBNeural2Voices.style.display = 'none';
      this.elements.googleAUStandardVoices.style.display = 'none';
      this.elements.googleAUNeural2Voices.style.display = 'none';
      this.elements.openaiVoices.style.display = 'block';
    }

    this.saveSettings();
  }

  onVoiceChange() {
    this.clearAudioCache();
    this.saveSettings();
    this.showStatus('Voice changed. Audio will be regenerated with new voice on next play.', 'info');
  }

  onSpeedChange() {
    this.clearAudioCache();
    this.saveSettings();
    this.showStatus('Speed changed. Audio will be regenerated with new speed on next play.', 'info');
  }

  clearAudioCache() {
    // Stop current playback if active
    if (this.audio && this.isPlaying) {
      this.stop();
    }

    // Clear cached audio
    if (this.audio && this.audio.src) {
      URL.revokeObjectURL(this.audio.src); // Clean up the blob URL
      this.audio = null;
    }

    // Clear streaming mode data
    this.isStreamingMode = false;
    this.isGeneratingChunks = false;
    this.audioQueue = [];
    this.currentChunkIndex = 0;
    this.chunks = [];

    // Reset state
    this.isPlaying = false;
    this.isPaused = false;
    this.pausedTime = 0;
    this.updateControlButtons();

    console.log('Audio cache cleared due to voice/speed change');
  }

  resetCache() {
    // Clear audio cache
    this.clearAudioCache();

    // Reset progress bar
    this.elements.progressFill.style.width = '0%';
    this.elements.currentTime.textContent = '0:00';
    this.elements.totalTime.textContent = '0:00';

    // Show confirmation message
    this.showStatus('Cache cleared! Audio will be regenerated on next play.', 'success');

    console.log('Manual cache reset performed');
  }

  handleProgressBarClick(e) {
    // Only allow seeking if we have audio loaded and it's not in streaming mode
    if (!this.audio || !this.audio.duration || this.isStreamingMode) {
      if (this.isStreamingMode) {
        this.showStatus('Seeking not available in streaming mode for long texts', 'info');
      }
      return;
    }

    const progressBar = this.elements.progressFill.parentElement;
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const progressBarWidth = rect.width;

    // Calculate the percentage of where the user clicked
    const clickPercentage = Math.max(0, Math.min(1, clickX / progressBarWidth));

    // Calculate the new time position
    const newTime = clickPercentage * this.audio.duration;

    // Set the new time
    this.audio.currentTime = newTime;

    // Update the progress immediately
    this.updateProgress();

    // Show feedback to user
    this.showStatus(`Seeked to ${this.formatTime(newTime)}`, 'info');

    console.log(`Seeked to ${clickPercentage * 100}% (${this.formatTime(newTime)})`);
  }
}

// Initialize the TTS when the page loads
document.addEventListener('DOMContentLoaded', () => {
  new NaturalTTS();
});
