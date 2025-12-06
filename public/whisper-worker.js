// @ts-nocheck
// Worker: /public/whisper-worker.js
// High-accuracy offline speech recognition using Whisper Base model

import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js';

// =============================
// CONFIGURATION FOR ACCURACY
// =============================
env.allowLocalModels = false;
env.allowRemoteModels = true;
env.useBrowserCache = true;

// =============================
// MODEL SELECTION
// =============================
// whisper-tiny: ~40MB, fast, less accurate
// whisper-base: ~75MB, balanced, good accuracy 
// whisper-small: ~250MB, slower, very accurate
const MODEL_NAME = "Xenova/whisper-base"; // Upgraded from tiny for better accuracy

// =============================
// STATE
// =============================
class PipelineSingleton {
    static instance = null;

    static async getInstance(progress_callback = null) {
        if (this.instance) return this.instance;

        try {
            console.log("Worker: Initializing pipeline with model:", MODEL_NAME);
            this.instance = await pipeline(
                "automatic-speech-recognition",
                MODEL_NAME,
                {
                    progress_callback,
                    // Use quantized model for faster loading while maintaining accuracy
                    quantized: true
                }
            );
            console.log("Worker: Pipeline initialized successfully");
        } catch (err) {
            console.error("Worker: Pipeline error", err);
            throw err;
        }

        return this.instance;
    }
}

// =============================
// MESSAGE HANDLER
// =============================
self.onmessage = async (event) => {
    const { type, data, audio } = event.data;

    const post = (type, data) => self.postMessage({ type, data });

    try {
        if (type === 'load') {
            post('download', { status: 'initiate' });

            const progressCallback = (data) => {
                if (data.status === 'progress') {
                    post('download', {
                        status: 'progress',
                        progress: data.progress,
                        loaded: data.loaded,
                        total: data.total,
                        file: data.file
                    });
                } else if (data.status === 'done') {
                    post('download', { status: 'done' });
                }
            };

            await PipelineSingleton.getInstance(progressCallback);
            post('ready');
        }

        else if (type === 'generate') {
            if (!audio) {
                throw new Error("No audio provided");
            }

            const transcriber = await PipelineSingleton.getInstance();

            // Run transcription with optimized settings for accuracy
            const result = await transcriber(audio, {
                task: 'transcribe',
                language: 'english',
                chunk_length_s: 30,
                stride_length_s: 5,
                return_timestamps: false,
                // Higher beam size for better accuracy
                num_beams: 5,
                // Temperature 0 for more deterministic output
                temperature: 0
            });

            // Clean up the result text
            let text = result.text || '';
            text = text.trim();

            // Remove common transcription artifacts
            text = text.replace(/\[.*?\]/g, ''); // Remove [MUSIC], [NOISE] etc
            text = text.replace(/\(.*?\)/g, ''); // Remove (inaudible) etc
            text = text.replace(/\s+/g, ' '); // Normalize whitespace
            text = text.trim();

            post('result', text);
        }

    } catch (err) {
        console.error("Worker Error:", err);
        post('error', err.message || "Unknown worker error");
    }
};
