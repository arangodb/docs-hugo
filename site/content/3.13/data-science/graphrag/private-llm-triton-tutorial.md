---
title: How to use GraphRAG with a Private LLM
menuTitle: Private LLM Tutorial
weight: 15
description: >-
 Learn how to create, configure, and run a full GraphRAG workflow with
 using a private LLM and Triton Inference Server
---
{{< tag "ArangoDB Platform" >}}

{{< tip >}}
The ArangoDB Platform & GenAI Suite is available as a pre-release. To get
exclusive early access, [get in touch](https://arangodb.com/contact/) with
the ArangoDB team.
{{< /tip >}}

## Prerequisite: Get an LLM to host

If you already have an LLM, you can skip this step. If you are new to LLMs
(Large Language Models), this section explains how to get and prepare an
open-source LLM.

This tutorial downloads an open-source model from Hugging Face, but you can
use any other model provider.

### Install the Hugging Face CLI

Follow the official [Hugging Face guide](https://huggingface.co/docs/huggingface_hub/en/guides/cli)
to install the CLI.

You should now be able to run the `hf --help` command.

### Download a model

Pick the model you want to use. For demonstration purposes, this tutorial is
using a [Nemotron model](https://huggingface.co/nvidia/OpenReasoning-Nemotron-7B).

You can download it with the following command:
```
hf download nvidia/OpenReasoning-Nemotron-7B`
```

Refer to the Hugging Face documentation for more details.

{{< info >}}
ArangoDB explicitly provides no further guarantees or guidance on the chosen LLM.
ArangoDB's goal is to work with any LLM available in the market.
{{< /info >}}

### Export model as ONNX

ONNX is an open standard hat defines a common set of operators and a file format
to represent deep learning models in different frameworks. The Optimum library
exports a model to ONNX with configuration objects which are supported for many
architectures and can be easily extended.

Follow the [Hugging Face guideline](https://huggingface.co/docs/transformers/serialization)
to export the model as ONNX format via Optimum.

After installing Optimum, run the following command:
```
optimum-cli export onnx --model nvidia/OpenReasoning-Nemotron-7B MyModel
```
{{< tip >}}
Replace `MyModel` with a name of your choice for your model.
{{< /tip >}}

This exports the model into ONNX format, which is currently required.

## Prepare the necessary files

You need two files for the model to work:
- Triton configuration file: `config.pb.txt`
- Python backend file: `model.py`

{{< info >}}
Currently, it is only supported the Python backend of Triton with the rest of GenAI services.
Other operating modes will be added in future versions.
{{< /info >}}

### Triton configuration file

To ensure compatibility with the Triton service, you need the following configuration
file `config.pb.txt`, which must be placed next to your Models folder:

```yaml
name: "MyModel" # Set the name to the you chose previously
backend: "python"
input [
  {
    name: "INPUT0"
    data_type: TYPE_STRING
    dims: [-1]
  }
]
output [
  {
    name: "OUTPUT0"
    data_type: TYPE_STRING
    dims: [-1]
  }
]
instance_group [
  {
    count: 1
    kind: KIND_GPU
  }
]
```

This configuration defines the display name of the Model, specifies the use of
the Python backend, and sets input and output as string tokens for text generation.
It also configures the model to use 1 GPU on the Triton server.

### Triton Python backend

Next, you need to implement Python code for the backend to handle the text
tokenization within the Triton server.

Therefore, place a file named `model.py` in your model folder with the following content:

```python
import numpy as np
import json
import triton_python_backend_utils as pb_utils
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline

class TritonPythonModel:
    def initialize(self, args):
        model_path = args['model_repository'] + "/" + args['model_version'] + "/"
        self.tokenizer = AutoTokenizer.from_pretrained(model_path)
        self.model = AutoModelForCausalLM.from_pretrained(model_path)
        self.pipe = pipeline("text-generation", model=self.model, tokenizer=self.tokenizer, batch_size=1)

    def execute(self, requests):
        responses = []
        for request in requests:
            in_0 = pb_utils.get_input_tensor_by_name(request, "INPUT0")
            input_text = in_0.as_numpy()[0].decode('utf-8')

            try:
                input_data = json.loads(input_text)
            except json.JSONDecodeError:
                input_data = eval(input_text)

            prompt = self.tokenizer.apply_chat_template(input_data, tokenize=False, add_generation_prompt=True)
            output = self.pipe(prompt, max_new_tokens=1024, do_sample=True, temperature=0.7, top_k=50, top_p=0.95)
            generated_text = output[0]['generated_text'][len(prompt):].strip()

            out_tensor = pb_utils.Tensor("OUTPUT0", np.array([generated_text], dtype=object))
            responses.append(pb_utils.InferenceResponse(output_tensors=[out_tensor]))
        return responses
```

The above code is generic and should work for most CausalLM Models. Check Hugging
Face Transformers to see if your model supports `AutoModelForCausalLM`.
If not, you need to adjust this file. You may also need to adjust it if you want
to fine-tune the configuration of your model. This tutorial prioritizes a
plug-and-play workflow over fine-tuning for maximum performance, aiming to work
in most common scenarios.

### Model directory structure

After preparing these files, your directory structure should look similar to this:

```
.
├── config.pb.txt
└── MyModel
    ├── added_tokens.json
    ├── chat_template.jinja
    ├── config.json
    ├── generation_config.json
    ├── merges.txt
    ├── model.onnx
    ├── model.onnx_data
    ├── model.py
    ├── special_tokens_map.json
    ├── tokenizer_config.json
    ├── tokenizer.json
    └── vocab.json
```

Now you are ready to upload the model.

### Upload the Model to MLflow

First, you need to install the CLI.

```
pip install mlflow==2.22.1
```

{{< warning >}}
MLflow version 3 introduces a breaking change that affects this workflow, so it is
important to use MLflow version 2.
{{< /warning >}}

