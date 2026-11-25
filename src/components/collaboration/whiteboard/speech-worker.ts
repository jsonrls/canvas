import {
  env,
  pipeline,
  type AutomaticSpeechRecognitionPipeline,
} from "@huggingface/transformers";

/**
 * Turns speech into text off the main thread. Only the model files are
 * fetched; no audio or text leaves the device.
 */
export type SpeechRequest =
  | { type: "load" }
  | {
      id: number;
      language: string;
      samples: Float32Array;
      type: "transcribe";
    };

export type SpeechReply =
  | { percent: number; type: "progress" }
  | { type: "ready" }
  | { type: "load-failed" }
  | { id: number; text: string; type: "text" }
  | { id: number; type: "failed" };

const MODEL = "onnx-community/whisper-base";
// Pinned, so the files cannot change under us.
const MODEL_REVISION = "27a07b4b52b3a4c5886134bb4320e93e1a4bbc7c";

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<SpeechRequest>) => void) | null;
  postMessage(reply: SpeechReply): void;
};

env.allowLocalModels = false;
// Served by Qollab; the library's default is a third-party script host. The
// plain build runs everywhere, where the larger ones need WebGPU.
if (env.backends.onnx.wasm) {
  env.backends.onnx.wasm.wasmPaths = {
    mjs: new URL(
      "onnxruntime-web/ort-wasm-simd-threaded.mjs",
      import.meta.url,
    ).toString(),
    wasm: new URL(
      "onnxruntime-web/ort-wasm-simd-threaded.wasm",
      import.meta.url,
    ).toString(),
  };
}

let loading: Promise<AutomaticSpeechRecognitionPipeline> | undefined;

function load(): Promise<AutomaticSpeechRecognitionPipeline> {
  loading ??= pipeline("automatic-speech-recognition", MODEL, {
    device: "wasm",
    dtype: "q8",
    progress_callback: (info) => {
      if (info.status === "progress_total") {
        scope.postMessage({ percent: info.progress, type: "progress" });
      }
    },
    revision: MODEL_REVISION,
  });
  return loading;
}

/** Whisper's code for the browser's language; Filipino is "tl" there. */
function whisperLanguage(language: string): string {
  const code = language.toLowerCase().split("-")[0];
  return code === "fil" ? "tl" : code;
}

scope.onmessage = async ({ data }) => {
  let transcribe: AutomaticSpeechRecognitionPipeline;
  try {
    transcribe = await load();
    scope.postMessage({ type: "ready" });
  } catch (error) {
    console.error("[qollab:voice] speech model failed to load", error);
    scope.postMessage({ type: "load-failed" });
    return;
  }
  if (data.type === "load") return;

  try {
    const listen = (language: string) =>
      transcribe(data.samples, {
        chunk_length_s: 30,
        language,
        task: "transcribe",
      });
    // The model does not know every browser language, such as Cebuano.
    const result = await listen(whisperLanguage(data.language)).catch(() =>
      listen("en"),
    );
    scope.postMessage({ id: data.id, text: result.text, type: "text" });
  } catch (error) {
    console.error("[qollab:voice] speech could not be transcribed", error);
    scope.postMessage({ id: data.id, type: "failed" });
  }
};
