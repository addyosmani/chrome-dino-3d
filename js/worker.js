import {
  AutoTokenizer,
  AutoModelForCausalLM,
  TextStreamer,
  StoppingCriteria,
} from '@xenova/transformers';


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
    try {
      // Choose the model based on whether fp16 is available
      this.model_id = 'onnx-community/gemma-3-1b-it-ONNX-GQA';

      console.log('Loading tokenizer...');
      this.tokenizer ??= await AutoTokenizer.from_pretrained(this.model_id, {
        legacy: true,
        progress_callback,
      });

      console.log('Loading model...');
      this.model ??= await AutoModelForCausalLM.from_pretrained(this.model_id, {
        dtype: 'q4',
        device: 'webgpu',
        use_external_data_format: true,
        progress_callback,
      });

      return Promise.all([this.tokenizer, this.model]);
    } catch (error) {
      console.error('Error in getInstance:', error);
      throw error;
    }
  }
}

async function generate(messages) {
  try {
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
  } catch (error) {
    console.error('Error in generate:', error);
    self.postMessage({
      status: 'error',
      data: error.message
    });
  }
}

async function load() {
  try {
    self.postMessage({
      status: 'loading',
      data: 'Loading model...'
    });

    // Load the pipeline and save it for future use.
    const [tokenizer, model] = await TextGenerationPipeline.getInstance(x => {
      // We also add a progress callback to the pipeline so that we can
      // track model loading.
      self.postMessage(x);
    });

    self.postMessage({
      status: 'loading',
      data: 'Compiling shaders and warming up model...'
    });

    // Run model with dummy input to compile shaders
    const inputs = tokenizer('a');
    await model.generate({ ...inputs, max_new_tokens: 1 });
    self.postMessage({ status: 'ready' });
  } catch (error) {
    console.error('Error in load:', error);
    self.postMessage({
      status: 'error',
      data: error.message
    });
  }
}
// Listen for messages from the main thread
self.addEventListener('message', async (e) => {
  const { type, data } = e.data;

  try {
    switch (type) {
      case 'load':
        await load();
        break;

      case 'generate':
        stopping_criteria.reset();
        await generate(data);
        break;

      case 'interrupt':
        stopping_criteria.interrupt();
        break;

      case 'reset':
        stopping_criteria.reset();
        break;

      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    console.error('Error handling message:', error);
    self.postMessage({
      status: 'error',
      data: error.message
    });
  }
});