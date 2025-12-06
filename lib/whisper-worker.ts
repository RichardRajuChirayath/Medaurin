// @ts-nocheck
// Worker: speech-worker.ts
// Fully optimized Whisper ASR worker for @xenova/transformers

// =====================================================================
// POLYFILLS - MUST RUN BEFORE ANYTHING ELSE
// =====================================================================

// 1. Ensure 'process' exists
if (typeof self.process === 'undefined') {
    self.process = {};
}

// 2. Ensure 'process.env' exists
if (typeof self.process.env === 'undefined') {
    self.process.env = {};
}

// 3. Mock other common process properties that might be checked
if (typeof self.process.versions === 'undefined') {
    self.process.versions = { node: '18.0.0' }; // Fake node version
}
if (typeof self.process.platform === 'undefined') {
    self.process.platform = 'browser';
}
if (typeof self.process.type === 'undefined') {
    self.process.type = 'renderer';
}

// Standard postMessage helper
const post = (type, data = null) => self.postMessage({ type, data });

class PipelineSingleton {
    static instance = null;

    static async getInstance() {
        if (this.instance) return this.instance;

        try {
            // Notify frontend: start downloading model (or loading library)
            post("download", { status: "initiate" });

            // Dynamic import of the library to ensure polyfills are applied first
            const { pipeline, env } = await import('@xenova/transformers');

            // =============================
            // REQUIRED ENV SETTINGS FOR WHISPER
            // =============================
            env.allowLocalModels = false;        // Don't load from disk
            env.allowRemoteModels = true;        // Allow downloading from HuggingFace
            env.useBrowserCache = true;          // Cache WASM + model for speed

            // Safe access to nested properties
            if (env?.backends?.onnx?.wasm) {
                env.backends.onnx.wasm.numThreads = 1;  // Prevent freezing on low-end CPUs
            }

            const progress_callback = (data) => {
                if (data?.status === "progress" && data.loaded && data.total) {
                    const progress = Math.round((data.loaded / data.total) * 100);

                    post("download", {
                        status: "progress",
                        progress,
                        loaded: data.loaded,
                        total: data.total,
                        file: data.name || "model",
                    });
                }

                if (data?.status === "done") {
                    post("download", { status: "done" });
                }
            };

            // ⚠ Whisper model name FIXED
            this.instance = await pipeline(
                "automatic-speech-recognition",
                "Xenova/whisper-tiny",   // ❗ DO NOT USE .en
                { progress_callback }
            );
        } catch (err) {
            console.error("Pipeline initialization error:", err);
            post("error", "Failed to load ASR model: " + (err.message || err));
            throw err;
        }

        return this.instance;
    }
}

// =============================
// Worker Message Handler
// =============================
self.onmessage = async ({ data }) => {
    const { type, audio } = data || {};

    try {
        // --------------------------------------
        // LOAD MODEL
        // --------------------------------------
        if (type === "load") {
            await PipelineSingleton.getInstance();
            post("ready");
            return;
        }

        // --------------------------------------
        // TRANSCRIBE AUDIO
        // --------------------------------------
        if (type === "generate") {
            if (!audio) {
                post("error", "No audio buffer provided.");
                return;
            }

            const transcriber = await PipelineSingleton.getInstance();

            const result = await transcriber(audio, {
                task: "transcribe",
                language: "english",
                chunk_length_s: 30,   // Stable chunking
                stride_length_s: 5,
            });

            post("result", result?.text || "");
            return;
        }

        // --------------------------------------
        // UNKNOWN MESSAGE
        // --------------------------------------
        post("error", "Unknown worker message type: " + type);

    } catch (err) {
        post("error", err?.message || "Unexpected worker error.");
    }
};
