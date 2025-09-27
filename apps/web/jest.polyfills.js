/**
 * Jest Polyfills
 * Provides polyfills for browser APIs that are not available in the Jest test environment
 */

// TextEncoder/TextDecoder polyfill for Node.js environment
const { TextEncoder, TextDecoder } = require('util')

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Fetch polyfill
global.fetch = require('node-fetch')

// URL polyfill
const { URL, URLSearchParams } = require('url')
global.URL = URL
global.URLSearchParams = URLSearchParams

// Web Crypto API polyfill
const { webcrypto } = require('crypto')
global.crypto = webcrypto

// Canvas polyfill for face-api.js
global.HTMLCanvasElement = class HTMLCanvasElement {
  constructor() {
    this.width = 0
    this.height = 0
  }
  
  getContext() {
    return {
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      getImageData: jest.fn(() => ({ data: new Array(4) })),
      putImageData: jest.fn(),
      createImageData: jest.fn(() => ({ data: new Array(4) })),
      setTransform: jest.fn(),
      drawImage: jest.fn(),
      save: jest.fn(),
      fillText: jest.fn(),
      restore: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      closePath: jest.fn(),
      stroke: jest.fn(),
      translate: jest.fn(),
      scale: jest.fn(),
      rotate: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      measureText: jest.fn(() => ({ width: 0 })),
      transform: jest.fn(),
      rect: jest.fn(),
      clip: jest.fn(),
    }
  }
  
  toDataURL() {
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  }
}

// Image polyfill
global.Image = class Image {
  constructor() {
    this.src = ''
    this.width = 0
    this.height = 0
    this.onload = null
    this.onerror = null
  }
}

// MediaDevices polyfill
global.navigator = {
  ...global.navigator,
  mediaDevices: {
    getUserMedia: jest.fn(() => Promise.resolve({
      getTracks: () => [],
      getVideoTracks: () => [],
      getAudioTracks: () => [],
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })),
    enumerateDevices: jest.fn(() => Promise.resolve([])),
  },
  userAgent: 'Mozilla/5.0 (Node.js) Jest Test Environment'
}

// WebRTC polyfills
global.RTCPeerConnection = class RTCPeerConnection {
  constructor() {
    this.localDescription = null
    this.remoteDescription = null
    this.signalingState = 'stable'
    this.iceConnectionState = 'new'
    this.connectionState = 'new'
    this.onicecandidate = null
    this.ontrack = null
    this.ondatachannel = null
  }
  
  createOffer() {
    return Promise.resolve({ type: 'offer', sdp: 'mock-sdp' })
  }
  
  createAnswer() {
    return Promise.resolve({ type: 'answer', sdp: 'mock-sdp' })
  }
  
  setLocalDescription() {
    return Promise.resolve()
  }
  
  setRemoteDescription() {
    return Promise.resolve()
  }
  
  addIceCandidate() {
    return Promise.resolve()
  }
  
  addTrack() {
    return { id: 'mock-sender' }
  }
  
  removeTrack() {}
  
  createDataChannel() {
    return {
      send: jest.fn(),
      close: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }
  }
  
  close() {}
}

// Speech Recognition polyfills
global.SpeechRecognition = class SpeechRecognition {
  constructor() {
    this.continuous = false
    this.interimResults = false
    this.lang = 'en-US'
    this.maxAlternatives = 1
    this.onstart = null
    this.onend = null
    this.onerror = null
    this.onresult = null
  }
  
  start() {
    if (this.onstart) this.onstart()
  }
  
  stop() {
    if (this.onend) this.onend()
  }
  
  abort() {
    if (this.onend) this.onend()
  }
}

global.webkitSpeechRecognition = global.SpeechRecognition

// Speech Synthesis polyfills
global.speechSynthesis = {
  speak: jest.fn(),
  cancel: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  getVoices: jest.fn(() => []),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}

global.SpeechSynthesisUtterance = class SpeechSynthesisUtterance {
  constructor(text) {
    this.text = text || ''
    this.lang = 'en-US'
    this.voice = null
    this.volume = 1
    this.rate = 1
    this.pitch = 1
    this.onstart = null
    this.onend = null
    this.onerror = null
  }
}

// File API polyfills
global.File = class File {
  constructor(bits, name, options = {}) {
    this.bits = bits
    this.name = name
    this.type = options.type || ''
    this.lastModified = options.lastModified || Date.now()
    this.size = bits.reduce((acc, bit) => acc + (bit.length || bit.byteLength || 0), 0)
  }
}

global.FileReader = class FileReader {
  constructor() {
    this.result = null
    this.error = null
    this.readyState = 0
    this.onload = null
    this.onerror = null
    this.onabort = null
    this.onloadstart = null
    this.onloadend = null
    this.onprogress = null
  }
  
  readAsDataURL() {
    setTimeout(() => {
      this.result = 'data:text/plain;base64,dGVzdA=='
      if (this.onload) this.onload()
    }, 0)
  }
  
  readAsText() {
    setTimeout(() => {
      this.result = 'test'
      if (this.onload) this.onload()
    }, 0)
  }
  
  readAsArrayBuffer() {
    setTimeout(() => {
      this.result = new ArrayBuffer(4)
      if (this.onload) this.onload()
    }, 0)
  }
  
  abort() {
    if (this.onabort) this.onabort()
  }
}

// Blob polyfill
global.Blob = class Blob {
  constructor(parts = [], options = {}) {
    this.parts = parts
    this.type = options.type || ''
    this.size = parts.reduce((acc, part) => acc + (part.length || part.byteLength || 0), 0)
  }
  
  slice(start = 0, end = this.size, contentType = '') {
    return new Blob(this.parts.slice(start, end), { type: contentType })
  }
  
  text() {
    return Promise.resolve(this.parts.join(''))
  }
  
  arrayBuffer() {
    return Promise.resolve(new ArrayBuffer(this.size))
  }
}

// Performance API polyfill
global.performance = {
  ...global.performance,
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn(() => []),
  getEntriesByType: jest.fn(() => []),
}

// IntersectionObserver polyfill
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback, options) {
    this.callback = callback
    this.options = options
  }
  
  observe() {}
  unobserve() {}
  disconnect() {}
}

// ResizeObserver polyfill
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback
  }
  
  observe() {}
  unobserve() {}
  disconnect() {}
}

// MutationObserver polyfill
global.MutationObserver = class MutationObserver {
  constructor(callback) {
    this.callback = callback
  }
  
  observe() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}

// Console polyfills for better test output
const originalConsole = global.console
global.console = {
  ...originalConsole,
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}
