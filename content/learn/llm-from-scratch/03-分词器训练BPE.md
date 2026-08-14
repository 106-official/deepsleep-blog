---
title: "第 3 章 · 分词器：训练你的 BPE"
description: "子词切分（Subword）为什么必要、BPE 算法原理、用 tokenizers 库从语料训练一个 BPE 分词器、设置词表大小与特殊 token，并接入模型"
layout: "learn"
category: "llm-from-scratch"
weight: 3
keywords: ["Tokenizer", "BPE", "子词切分", "词表", "tokenizers", "SentencePiece", "特殊token", "未登录词", "分词"]
ShowToc: true
TocOpen: true
---

## 先建立直觉

模型读不懂「字」，只能读「数字」。分词器（Tokenizer）就是把人类文本 ↔ 模型能吃的整数序列的**翻译器**。

- **词级别**：「苹果」→ 1 个 id。优点短，缺点词表爆炸、遇到新词（未登录词）就傻眼。
- **字级别**：「苹果」→ 2 个 id。词表小，但序列变长、语义切碎。
- **子词（BPE/WordPiece/Unigram）**：「苹果」→ 可能「苹」+「果」，但「苹果公司」作为高频词会合并成 1 个 id。**兼顾词表小与序列短**，这是现代 LLM 的默认选择。

> 关键结论：**分词器必须和模型一起训、一起用**。换分词器 = 换词表 = 模型 embedding 维度对不上。预训练前定好分词器，全程不变。

## 它解决什么问题

1. **未登录词（OOV）**：子词可拼出任意新词（如「ChatGPT」=「Chat」+「G」+「PT」）。
2. **词表大小与压缩率平衡**：词表太小→序列太长→算得慢；太大→embedding 占显存、稀疏。BPE 在数据驱动下自动找到平衡。
3. **多语言/代码友好**：子词天然能拼出多种文字与符号。

## 核心概念

### 1. BPE 算法直觉

BPE（Byte-Pair Encoding）从「字符级」起步，反复把**最常相邻出现的字节对**合并成新符号，直到词表达到目标大小：

```
初始:  "low" -> l o w ;  "lower" -> l o w e r ;  "newest" -> n e w e s t
统计相邻对频率:  (l,o) 出现最多 -> 合并为 lo
继续:  (lo,w) 频繁 -> 合并为 low
……
最终词表 = 单字 + 高频合并串
```

### 2. 用 tokenizers 训练 BPE（Rust 后端，极快）

```python
from tokenizers import Tokenizer
from tokenizers.models import BPE
from tokenizers.trainers import BpeTrainer
from tokenizers.pre_tokenizers import Whitespace

tokenizer = Tokenizer(BPE(unk_token="<unk>"))
tokenizer.pre_tokenizer = Whitespace()

trainer = BpeTrainer(
    vocab_size=32_000,        # 目标词表大小
    min_frequency=2,          # 合并对最低出现次数
    special_tokens=["<bos>", "<eos>", "<sep>", "<unk>", "<pad>"],
)

# 从清洗好的语料训练（支持多文件）
tokenizer.train(files=["clean/corpus.jsonl"], trainer=trainer)
tokenizer.save("tokenizer.json")
```

### 3. 推理：编码与解码

```python
tok = Tokenizer.from_file("tokenizer.json")

ids = tok.encode("从零训练一个LLM很有趣").ids
print(ids)                 # 如 [123, 88, 540, ...] 子词 id 序列
print(tok.decode(ids))     # "从零训练一个LLM很有趣"

# 带特殊 token
text = "<bos>从零训练一个LLM很有趣<eos>"
enc = tok.encode(text)
print(enc.ids, enc.special_tokens_mask)  # 标出哪些是特殊 token
```

### 4. 接进 HuggingFace 工作流

```python
from transformers import PreTrainedTokenizerFast

hf_tok = PreTrainedTokenizerFast(
    tokenizer_file="tokenizer.json",
    bos_token="<bos>", eos_token="<eos>",
    pad_token="<pad>", unk_token="<unk>",
)
hf_tok.save_pretrained("my-llm-tokenizer/")   # 之后模型直接 load
```

### 5. 词表大小怎么定

| 语种/场景 | 经验词表大小 |
|-----------|--------------|
| 纯英文 | 32k |
| 中英混合 | 64k–100k |
| 多语言（100+语） | 128k–256k |

> 词表越大，embedding 表越大（`vocab_size × d_model`）。7B 模型的 embedding 常占数百 MB，词表翻倍显存也涨。中小模型 32k 足够起步。

## 常见坑

1. **分词器和模型不匹配**：用别人的 tokenizer 加载自己模型的 vocab_size，会 index 越界。务必「自己训的分词器，配自己训的模型」。
2. **特殊 token 没注册**：`<bos>/<eos>` 必须在训练时加入 `special_tokens`，否则编码后它们会被拆成普通子词，模型学不会「句首/句尾」信号。
3. **词表太大拖慢训练**：小模型配 256k 词表，embedding 显存比 transformer 主体还大，纯浪费。
4. **pre_tokenizer 不一致**：训练用 `Whitespace`、推理用默认，结果对不上。保存 `tokenizer.json` 后统一用文件加载，别手写规则。

## 小结

- 分词器 = 文本与 id 的双向翻译器；子词（BPE）兼顾词表小与序列短；
- BPE 从字符级起，按频率合并字节对直到目标词表；
- 用 `tokenizers` 从语料训练，注册好特殊 token，保存为 `tokenizer.json`；
- 下一章：模型本体——Decoder-only Transformer 的每个零件。
