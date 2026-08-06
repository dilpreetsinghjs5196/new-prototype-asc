import { getSettingsAndKey } from './gemini';

// Helper functions for PCM converting and Base64 encoding/decoding
function floatTo16BitPCM(float32Array) {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  let offset = 0;
  for (let i = 0; i < float32Array.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  return buffer;
}

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function int16ToFloat32(int16Buffer) {
  const int16 = new Int16Array(int16Buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    const s = int16[i];
    float32[i] = s < 0 ? s / 0x8000 : s / 0x7FFF;
  }
  return float32;
}

// Inline AudioWorklet for extracting PCM chunks cleanly
const workletCode = `
class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 2048;
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input && input.length > 0) {
      const channelData = input[0];
      for (let i = 0; i < channelData.length; i++) {
        this.buffer[this.bufferIndex++] = channelData[i];
        if (this.bufferIndex >= this.bufferSize) {
          this.port.postMessage(this.buffer);
          this.bufferIndex = 0;
        }
      }
    }
    return true;
  }
}
registerProcessor('pcm-processor', PCMProcessor);
`;

export class GeminiLiveSession {
  constructor({
    model = "models/gemini-3.5-live-translate-preview", // Also compatible with models/gemini-2.0-flash-exp
    onStatusChange,
    onVolumeChange,
    onAudioPlaybackStart,
    onAudioPlaybackEnd,
    onTextReceived,
    onError
  } = {}) {
    this.model = model;
    this.onStatusChange = onStatusChange || (() => {});
    this.onVolumeChange = onVolumeChange || (() => {});
    this.onAudioPlaybackStart = onAudioPlaybackStart || (() => {});
    this.onAudioPlaybackEnd = onAudioPlaybackEnd || (() => {});
    this.onTextReceived = onTextReceived || (() => {});
    this.onError = onError || (() => {});

    this.ws = null;
    this.mediaStream = null;
    this.inputAudioContext = null;
    this.playbackAudioContext = null;
    this.workletNode = null;
    this.scriptProcessor = null;
    this.isMuted = false;
    this.isConnected = false;
    this.nextPlayTime = 0;
    this.activeSources = [];
    this.workletUrl = null;
  }

  async connect(systemInstruction = "You are a helpful and professional real-time AI Assistant for an Ambulatory Surgery Center (ASC) called ASC Manager.") {
    try {
      this.onStatusChange('Connecting...');

      const { apiKey } = await getSettingsAndKey();
      if (!apiKey) {
        throw new Error("Gemini API Key is missing. Please add it in Settings -> AI Configuration.");
      }

      // 1. Request microphone permission
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // 2. Setup Playback Audio Context
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.playbackAudioContext = new AudioContextClass({ sampleRate: 24000 });
      this.nextPlayTime = this.playbackAudioContext.currentTime;

      // 3. Setup Input Audio Context & Microphone Processing
      this.inputAudioContext = new AudioContextClass({ sampleRate: 16000 });
      const source = this.inputAudioContext.createMediaStreamSource(this.mediaStream);

      // Attempt to load inline AudioWorklet, fallback to ScriptProcessor if needed
      try {
        const blob = new Blob([workletCode], { type: 'application/javascript' });
        this.workletUrl = URL.createObjectURL(blob);
        await this.inputAudioContext.audioWorklet.addModule(this.workletUrl);

        this.workletNode = new AudioWorkletNode(this.inputAudioContext, 'pcm-processor');
        this.workletNode.port.onmessage = (event) => {
          this.handleAudioInput(event.data);
        };
        source.connect(this.workletNode);
        this.workletNode.connect(this.inputAudioContext.destination);
      } catch (e) {
        console.warn("AudioWorklet fallback to ScriptProcessor:", e);
        this.scriptProcessor = this.inputAudioContext.createScriptProcessor(2048, 1, 1);
        this.scriptProcessor.onaudioprocess = (event) => {
          const inputBuffer = event.inputBuffer.getChannelData(0);
          this.handleAudioInput(new Float32Array(inputBuffer));
        };
        source.connect(this.scriptProcessor);
        this.scriptProcessor.connect(this.inputAudioContext.destination);
      }

      // 4. Connect WebSocket to Gemini Live Multimodal API
      const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log("Gemini Live WebSocket connected.");
        this.isConnected = true;
        this.onStatusChange('Connected - Listening...');

        // Send setup payload
        const setupPayload = {
          setup: {
            model: this.model,
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: "Puck" // Clear medical professional voice profile
                  }
                }
              }
            },
            systemInstruction: {
              parts: [{ text: systemInstruction }]
            }
          }
        };
        this.ws.send(JSON.stringify(setupPayload));
      };

      this.ws.onmessage = async (event) => {
        try {
          let jsonStr = event.data;
          if (event.data instanceof Blob) {
            jsonStr = await event.data.text();
          }
          const data = JSON.parse(jsonStr);

          // Handle Setup Completion
          if (data.setupComplete) {
            console.log("Gemini Live Session Setup Complete.");
            return;
          }

          // Handle Server Content (Audio / Text Responses)
          if (data.serverContent) {
            if (data.serverContent.interrupted) {
              this.stopAllPlayback();
            }

            const modelTurn = data.serverContent.modelTurn;
            if (modelTurn && modelTurn.parts) {
              for (const part of modelTurn.parts) {
                if (part.inlineData && part.inlineData.data) {
                  // Decode PCM audio and queue for smooth playback
                  this.playAudioChunk(part.inlineData.data);
                }
                if (part.text) {
                  this.onTextReceived(part.text);
                }
              }
            }
          }
        } catch (err) {
          console.error("Error handling WebSocket message:", err);
        }
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket Error:", error);
        this.onError("Connection error occurred while communicating with Gemini Live API.");
      };

      this.ws.onclose = (event) => {
        console.log("WebSocket Closed:", event.code, event.reason);
        this.isConnected = false;
        this.onStatusChange('Disconnected');
        this.stopMedia();
      };

    } catch (err) {
      console.error("Failed to initialize Gemini Live Voice Session:", err);
      this.onError(err.message || "Failed to initiate Live Voice conversation.");
      this.disconnect();
    }
  }

  handleAudioInput(float32Array) {
    if (!this.isConnected || this.isMuted || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    // Calculate volume RMS for visualizations
    let sum = 0;
    for (let i = 0; i < float32Array.length; i++) {
      sum += float32Array[i] * float32Array[i];
    }
    const rms = Math.sqrt(sum / float32Array.length);
    this.onVolumeChange(Math.min(1, rms * 5)); // Boost multiplier for UI visualization

    // Convert to 16-bit PCM buffer
    const pcmBuffer = floatTo16BitPCM(float32Array);
    const base64Data = arrayBufferToBase64(pcmBuffer);

    // Send Realtime Audio Chunk over WebSocket
    const audioPayload = {
      realtimeInput: {
        mediaChunks: [
          {
            mimeType: "audio/pcm;rate=16000",
            data: base64Data
          }
        ]
      }
    };
    this.ws.send(JSON.stringify(audioPayload));
  }

  playAudioChunk(base64Data, sampleRate = 24000) {
    if (!this.playbackAudioContext) return;

    try {
      const arrayBuffer = base64ToArrayBuffer(base64Data);
      const float32Data = int16ToFloat32(arrayBuffer);

      const audioBuffer = this.playbackAudioContext.createBuffer(
        1,
        float32Data.length,
        sampleRate
      );
      audioBuffer.getChannelData(0).set(float32Data);

      const source = this.playbackAudioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.playbackAudioContext.destination);

      const currentTime = this.playbackAudioContext.currentTime;
      if (this.nextPlayTime < currentTime) {
        this.nextPlayTime = currentTime;
      }

      source.start(this.nextPlayTime);
      this.nextPlayTime += audioBuffer.duration;

      if (this.activeSources.length === 0) {
        this.onAudioPlaybackStart();
      }
      this.activeSources.push(source);

      source.onended = () => {
        this.activeSources = this.activeSources.filter(s => s !== source);
        if (this.activeSources.length === 0) {
          this.onAudioPlaybackEnd();
        }
      };
    } catch (e) {
      console.error("Error playing received PCM audio chunk:", e);
    }
  }

  stopAllPlayback() {
    this.activeSources.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    this.activeSources = [];
    if (this.playbackAudioContext) {
      this.nextPlayTime = this.playbackAudioContext.currentTime;
    }
    this.onAudioPlaybackEnd();
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (muted) {
      this.onVolumeChange(0);
    }
  }

  sendTextMessage(text) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && text.trim()) {
      const payload = {
        clientContent: {
          turns: [
            {
              role: "user",
              parts: [{ text: text.trim() }]
            }
          ],
          turnComplete: true
        }
      };
      this.ws.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }

  stopMedia() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    if (this.workletNode) {
      try { this.workletNode.disconnect(); } catch (e) {}
      this.workletNode = null;
    }
    if (this.scriptProcessor) {
      try { this.scriptProcessor.disconnect(); } catch (e) {}
      this.scriptProcessor = null;
    }
    if (this.inputAudioContext && this.inputAudioContext.state !== 'closed') {
      try { this.inputAudioContext.close(); } catch (e) {}
      this.inputAudioContext = null;
    }
    if (this.playbackAudioContext && this.playbackAudioContext.state !== 'closed') {
      try { this.playbackAudioContext.close(); } catch (e) {}
      this.playbackAudioContext = null;
    }
    if (this.workletUrl) {
      try { URL.revokeObjectURL(this.workletUrl); } catch (e) {}
      this.workletUrl = null;
    }
    this.stopAllPlayback();
  }

  disconnect() {
    this.isConnected = false;
    this.stopMedia();
    if (this.ws) {
      try { this.ws.close(); } catch (e) {}
      this.ws = null;
    }
    this.onStatusChange('Disconnected');
  }
}
