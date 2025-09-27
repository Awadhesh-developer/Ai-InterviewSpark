/**
 * Script to download face-api.js models
 * Run with: node scripts/download-models.js
 */

const fs = require('fs')
const path = require('path')
const https = require('https')

const MODELS_DIR = path.join(__dirname, '..', 'public', 'models')
const BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'

const MODELS = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2',
  'face_expression_model-weights_manifest.json',
  'face_expression_model-shard1',
  'age_gender_model-weights_manifest.json',
  'age_gender_model-shard1'
]

// Create models directory if it doesn't exist
if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR, { recursive: true })
  console.log('Created models directory:', MODELS_DIR)
}

function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination)
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`))
        return
      }
      
      response.pipe(file)
      
      file.on('finish', () => {
        file.close()
        resolve()
      })
      
      file.on('error', (err) => {
        fs.unlink(destination, () => {}) // Delete the file on error
        reject(err)
      })
    }).on('error', (err) => {
      reject(err)
    })
  })
}

async function downloadModels() {
  console.log('Downloading face-api.js models...')
  
  for (const model of MODELS) {
    const url = `${BASE_URL}/${model}`
    const destination = path.join(MODELS_DIR, model)
    
    // Skip if file already exists
    if (fs.existsSync(destination)) {
      console.log(`✓ ${model} (already exists)`)
      continue
    }
    
    try {
      await downloadFile(url, destination)
      console.log(`✓ ${model}`)
    } catch (error) {
      console.error(`✗ Failed to download ${model}:`, error.message)
    }
  }
  
  console.log('Model download complete!')
}

// Create a simple README for the models directory
const readmeContent = `# Face-API.js Models

This directory contains the machine learning models used by face-api.js for facial analysis.

## Models included:
- **tiny_face_detector**: Lightweight face detection
- **face_landmark_68**: 68-point facial landmark detection
- **face_recognition**: Face recognition and encoding
- **face_expression**: Emotion/expression recognition
- **age_gender**: Age and gender estimation

## Usage:
These models are automatically loaded by the FacialAnalysisService when initializing.

## Size:
Total size: ~6MB

## Source:
Downloaded from: https://github.com/justadudewhohacks/face-api.js
`

fs.writeFileSync(path.join(MODELS_DIR, 'README.md'), readmeContent)

// Run the download
downloadModels().catch(console.error)
