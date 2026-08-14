---
title: "第 6 章 · 监督微调 SFT"
description: "用指令/对话数据把基座模型变成助手：SFT 数据构造、ChatML/对话模板、LoRA 与全参微调的取舍、训练配置与防过拟合，附 TRL 实现"
layout: "learn"
category: "llm-from-scratch"
weight: 6
keywords: ["SFT", "监督微调", "指令微调", "LoRA", "PEFT", "对话模板", "ChatML", "灾难性遗忘", "TRL", "指令数据"]
ShowToc: true
TocOpen: true
---

## 先建立直觉

基座模型（Base）只会「续写」——你给它半句话，它接着编。它不懂「请回答」「总结一下」这类**指令**。SFT（Supervised Fine-Tuning，监督微调）就是教它「按人类指令办事」。

- 预训练：学「语言与知识」（续写能力强）；
- SFT：学「对话格式与服从指令」（把能力包装成好用的助手）。

可以把 SFT 想成「岗前培训」：员工（基座）已有知识，但不知道公司话术（对话模板），培训几周就会按流程回复了。

## 它解决什么问题

1. **对齐对话格式**：模型要学会在 `<user>` / `<assistant>` 角色间切换，只在 assistant 部分生成。
2. **激发已有能力**：很多能力预训练已具备，只差「用指令触发」。
3. **小数据高效适配**：相比预训练要 TB 级，SFT 往往几万条指令就够，成本低得多。

## 核心概念

### 1. SFT 数据格式

一条样本 = 多轮对话，每轮带角色。常用 **ChatML** 风格：

```text
<|user|>
怎么用 Python 读取一个 CSV 文件？<|endoftext|>
<|assistant|>
可以使用 pandas：import pandas as pd; df = pd.read_csv("a.csv")。也可用标准库 csv 模块逐行读取。<|endoftext|>
```

对话模板（template）把角色变成特殊 token，模型靠这些 token 区分「该谁说话」：

```python
def build_prompt(messages):
    """messages: [{"role":"user","content":...}, {"role":"assistant","content":...}]"""
    s = ""
    for m in messages:
        if m["role"] == "user":
            s += "<|user|>\n" + m["content"] + "<|endoftext|>\n"
        else:
            s += "<|assistant|>\n" + m["content"] + "<|endoftext|>\n"
    return s
```

> **关键**：SFT 只在 `<|assistant|>` 的输出部分算 loss，用户输入部分 `loss_mask=0`，否则模型会去「学复述问题」。

### 2. 全参微调 vs LoRA

| 方式 | 改哪些参数 | 显存 | 遗忘风险 | 适用 |
|------|-----------|------|----------|------|
| 全参 SFT | 全部权重 | 高（需 ZeRO） | 中（小数据易过拟合） | 数据多、要最大效果 |
| **LoRA** | 只训低秩矩阵 A/B | 低（冻结主干） | 低 | 单卡、小数据、快速迭代 |

LoRA 直觉：不直改大权重 `W`，而是学一个「小修正」`ΔW = B·A`（`B=256→d`, `A=d→8`），训练量骤降：

```python
from peft import LoraConfig, get_peft_model
lora = LoraConfig(
    r=8,                         # 低秩维度
    lora_alpha=16,
    target_modules=["q_proj", "v_proj"],  # 通常只改注意力投影
    lora_dropout=0.05,
    bias="none",
)
model = get_peft_model(base_model, lora)   # 冻结主干，只训 LoRA
model.print_trainable_parameters()         # 常 < 1% 参数
```

### 3. 用 TRL 一行跑 SFT

```python
from trl import SFTTrainer, SFTConfig
from datasets import load_dataset

dataset = load_dataset("json", data_files="sft_data.jsonl")["train"]

cfg = SFTConfig(
    output_dir="sft-llm",
    per_device_train_batch_size=4,
    gradient_accumulation_steps=8,
    num_train_epochs=3,
    learning_rate=2e-5,                 # SFT lr 比预训练小一个量级
    bf16=True,
    logging_steps=20,
    max_seq_length=2048,
    packing=True,                       # 把短样本拼满，省算力
)
trainer = SFTTrainer(model=base_model, args=cfg, train_dataset=dataset)
trainer.train()
trainer.save_model("sft-llm-final")
```

> 若用 LoRA，把 `base_model = get_peft_model(...)` 传入即可，其余代码不变。

### 4. 防过拟合 / 防遗忘

- **小学习率**（1e-5 ~ 3e-5）：避免把基座「覆盖」掉；
- **少 epoch**（1~3）：SFT 数据少，多跑就背答案；
- **保留通用数据混合**：在 SFT 数据里掺 5~10% 预训练文本，减缓灾难性遗忘；
- **只训 assistant 部分 loss**：用户输入不参与梯度。

## 常见坑

1. **忘记 loss mask**：对用户问题也算 loss，模型学会「复读问题」而非回答。务必只算 assistant 段。
2. **学习率沿用预训练的 3e-4**：SFT 阶段太大会瞬间遗忘基座能力，loss 可能先降后崩。
3. **对话模板和推理不一致**：训练用 ChatML，推理忘了拼 `<|user|>` 标记，模型输出乱套。模板必须全程统一。
4. **LoRA target_modules 选错**：只改 `lm_head` 不生效；通常改 `q_proj/v_proj`（或 `q,k,v,o`）。
5. **数据全是单一风格**：模型只会在该风格下好用，换种问法就废。数据要多样。

## 小结

- SFT = 用指令/对话数据，把「续写基座」教成「听话助手」；
- 数据用 ChatML 模板，loss 只算 assistant 段；
- 单卡小数据优先 **LoRA**（低秩、省显存、抗遗忘），数据多再全参；
- lr 比预训练小一个量级，epoch 1~3，防遗忘可混通用数据；
- 下一章：用 RLHF / DPO 做对齐，让回答更安全、更符合人类偏好。
