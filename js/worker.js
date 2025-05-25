import {
  AutoTokenizer,
  AutoModelForCausalLM,
  TextStreamer,
  StoppingCriteria,
} from '@huggingface/transformers';


class CallbackTextStreamer extends TextStreamer {
  constructor(tokenizer, cb) {
    super(tokenizer, {
      skip_prompt: true,
      skip_special_tokens: true,
    });
    this.cb = cb;
  }

  on_finalized_text(text) {
    this.cb(text);
  }
}

class InterruptableStoppingCriteria extends StoppingCriteria {
  constructor() {
    super();
    this.interrupted = false;
  }

  interrupt() {
    this.interrupted = true;
  }

  reset() {
    this.interrupted = false;
  }

  _call(input_ids, scores) {
    return new Array(input_ids.length).fill(this.interrupted);
  }
}

const stopping_criteria = new InterruptableStoppingCriteria();

async function hasFp16() {
  try {
    const adapter = await navigator.gpu.requestAdapter();
    return adapter.features.has('shader-f16');
  } catch (e) {
    return false;
  }
}

/**
* This class uses the Singleton pattern to ensure that only one instance of the model is loaded.
*/
class TextGenerationPipeline {
  static model_id = null;
  static model = null;
  static tokenizer = null;
  static streamer = null;

  static async getInstance(progress_callback = null) {
    // Choose the model based on whether fp16 is available
    this.model_id ??= (await hasFp16())
      ? 'Xenova/Phi-3-mini-4k-instruct_fp16'
      : 'Xenova/Phi-3-mini-4k-instruct';

    // Track files being downloaded for each component
    const progressState = {
      model: {
        files: new Map(),
        totalProgress: 0,
        status: 'pending',
      },
    };


    const createProgressCallback = (component) => (progress) => {
      const state = progressState[component];

      if (progress.status === 'progress') {
        const file = progress.file || 'unknown';
        const existing = state.files.get(file) || { loaded: 0, total: progress.total };

        // Only update if there's more progress
        if (progress.loaded > existing.loaded) {
          state.files.set(file, {
            loaded: progress.loaded,
            total: progress.total,
          });
        }

        // Compute total loaded and total bytes
        let loadedSum = 0;
        let totalSum = 0;

        for (const { loaded, total } of state.files.values()) {
          loadedSum += loaded;
          totalSum += total;
        }

        state.totalProgress = (loadedSum / totalSum) * 100;
        state.status = 'progress';
      } else if (progress.status === 'done') {
        state.totalProgress = 100;
        state.status = 'done';
      }

      if (progress_callback && component === 'model') {
        progress_callback({
          progress: Math.round(state.totalProgress),
          status: state.status,
        });
      }
    };

    this.tokenizer ??= AutoTokenizer.from_pretrained(this.model_id, {
      legacy: true,
    });

    this.model ??= AutoModelForCausalLM.from_pretrained(this.model_id, {
      dtype: 'q4',
      device: 'webgpu',
      use_external_data_format: true,
      progress_callback: createProgressCallback('model'),
    });

    return Promise.all([this.tokenizer, this.model]);
  }
}

async function generate(messages) {
  // Retrieve the text-generation pipeline.
  const [tokenizer, model] = await TextGenerationPipeline.getInstance();

  const inputs = tokenizer.apply_chat_template(messages, {
    add_generation_prompt: true,
    return_dict: true,
  });

  let startTime;
  let numTokens = 0;
  const cb = (output) => {
    startTime ??= performance.now();

    let tps;
    if (numTokens++ > 0) {
      tps = numTokens / (performance.now() - startTime) * 1000;
    }
    self.postMessage({
      status: 'update',
      output, tps, numTokens,
    });
  }

  const streamer = new CallbackTextStreamer(tokenizer, cb);

  // Tell the main thread we are starting
  self.postMessage({ status: 'start' });

  const outputs = await model.generate({
    ...inputs,
    max_new_tokens: 512,
    streamer,
    stopping_criteria,
  });
  const outputText = tokenizer.batch_decode(outputs, { skip_special_tokens: false });

  // Send the output back to the main thread
  self.postMessage({
    status: 'complete',
    output: outputText,
  });
}

async function load() {
  self.postMessage({
    status: 'loading',
    data: 'Loading model components...'
  });

  // Load the pipeline and save it for future use.
  const [tokenizer, model] = await TextGenerationPipeline.getInstance(progress => {
    let message;

    if (progress.status === 'done') {
      message = 'All components loaded successfully';
    } else if (progress.status === 'pending') {
      message = 'Initializing download...';
    } else {
      message = `Loading model: ${progress.progress}%`;
    }

    self.postMessage({
      status: 'loading',
      data: message
    });
  });

  self.postMessage({
    status: 'loading',
    data: 'Compiling shaders and warming up model...'
  });

  // Run model with dummy input to compile shaders
  const inputs = tokenizer('a');
  await model.generate({ ...inputs, max_new_tokens: 1 });
  self.postMessage({ status: 'ready' });
}

// Listen for messages from the main thread
self.addEventListener('message', async (e) => {
  const { type, data } = e.data;

  switch (type) {
    case 'load':
      load();
      break;

    case 'generate':
      stopping_criteria.reset();
      generate(data);
      break;

    case 'interrupt':
      stopping_criteria.interrupt();
      break;

    case 'reset':
      stopping_criteria.reset();
      break;
  }
});