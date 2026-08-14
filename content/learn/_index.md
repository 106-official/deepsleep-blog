---
title: "学习路径"
description: "系统化学习路径 — CPA / ACCA / 网络协议 / Three.js Web 3D / 从零训练 LLM / 网络安全"
slug: "learn"
---

<div class="learn-home-hero">
  <h1 class="learn-home-title">📚 学习路径</h1>
</div>

<div class="learn-cards">
  <a href="/learn/cpa/" class="learn-card learn-card-cpa">
    <div class="learn-card-icon">📊</div>
    <div class="learn-card-cert">CPA</div>
    <h2 class="learn-card-title">注册会计师</h2>
    <p class="learn-card-en">Certified Public Accountant</p>
    <div class="learn-card-meta">
      <span>6 科专业阶段</span>
      <span>1 科综合阶段</span>
      <span>5 年有效期</span>
    </div>
    <span class="learn-card-btn">查看路径 →</span>
  </a>

  <a href="/learn/acca/" class="learn-card learn-card-acca">
    <div class="learn-card-icon">🌍</div>
    <div class="learn-card-cert">ACCA</div>
    <h2 class="learn-card-title">特许公认会计师</h2>
    <p class="learn-card-en">Association of Chartered Certified Accountants</p>
    <div class="learn-card-meta">
      <span>13 科全英文</span>
      <span>4 个考季</span>
      <span>7 年有效期</span>
    </div>
    <span class="learn-card-btn">查看路径 →</span>
  </a>
  <a href="/learn/network-protocols/" class="learn-card learn-card-proto">
    <div class="learn-card-icon">🌐</div>
    <div class="learn-card-cert">NET</div>
    <h2 class="learn-card-title">网络协议</h2>
    <p class="learn-card-en">Network Protocols</p>
    <div class="learn-card-meta">
      <span>30 个常用协议</span>
      <span>OSI 分层</span>
      <span>原理 + 实战</span>
    </div>
    <span class="learn-card-btn">查看路径 →</span>
  </a>

  <a href="/learn/three-js/" class="learn-card learn-card-web">
    <div class="learn-card-icon">🎮</div>
    <div class="learn-card-cert">WEB</div>
    <h2 class="learn-card-title">Three.js 教程</h2>
    <p class="learn-card-en">Web 3D with Three.js</p>
    <div class="learn-card-meta">
      <span>8 章完整教程</span>
      <span>场景到优化</span>
      <span>可运行示例</span>
    </div>
    <span class="learn-card-btn">查看路径 →</span>
  </a>

  <a href="/learn/llm-from-scratch/" class="learn-card learn-card-llm">
    <div class="learn-card-icon">🤖</div>
    <div class="learn-card-cert">LLM</div>
    <h2 class="learn-card-title">从零训练大模型</h2>
    <p class="learn-card-en">Train LLM from Scratch</p>
    <div class="learn-card-meta">
      <span>8 章完整教程</span>
      <span>数据到部署</span>
      <span>可运行示例</span>
    </div>
    <span class="learn-card-btn">查看路径 →</span>
  </a>

  <a href="/learn/network-security/" class="learn-card learn-card-sec">
    <div class="learn-card-icon">🛡️</div>
    <div class="learn-card-cert">SEC</div>
    <h2 class="learn-card-title">网络安全</h2>
    <p class="learn-card-en">Network Security</p>
    <div class="learn-card-meta">
      <span>10 章完整教程</span>
      <span>攻防闭环</span>
      <span>防御视角</span>
    </div>
    <span class="learn-card-btn">查看路径 →</span>
  </a>

</div>

<div class="learn-home-notice">
  <p>📝 本板块内容由作者持续整理中。每章节会逐步补充学习要点、考点拆解、备考经验与推荐资料。</p>
  <p>如需交流心得或反馈错误，欢迎<a href="mailto:2651699459@QQ.com">邮件联系</a>。</p>
</div>

<style>
.learn-home-hero {
  text-align: center;
  padding: 3rem 1.5rem 2rem;
  max-width: 800px;
  margin: 0 auto;
}
.learn-home-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 700;
  color: var(--color-text-primary, #2d2d2d);
  margin: 0;
}
.learn-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  max-width: 860px;
  margin: 2rem auto 3rem;
  padding: 0 1.5rem;
}
.learn-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem 1.5rem;
  background: var(--color-bg-secondary, #fff);
  border: 2px solid var(--color-border, #e0e0e0);
  border-radius: 16px;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}
.learn-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(212,175,55,0.08), transparent);
  opacity: 0;
  transition: opacity 0.3s;
}
.learn-card:hover {
  border-color: var(--color-accent, #D4AF37);
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(212,175,55,0.2);
}
.learn-card:hover::before { opacity: 1; }
.learn-card-icon {
  font-size: 2.4rem;
  position: relative;
  z-index: 1;
}
.learn-card-cert {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 0.85rem;
  letter-spacing: 0.3em;
  color: var(--color-accent-dark, #B8960C);
  font-weight: 600;
  position: relative;
  z-index: 1;
}
.learn-card-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.35rem;
  color: var(--color-text-primary, #2d2d2d);
  margin: 0.3rem 0 0;
  position: relative;
  z-index: 1;
}
.learn-card-en {
  font-size: 0.8rem;
  color: var(--color-text-muted, #999);
  margin: 0 0 1rem;
  text-align: center;
  position: relative;
  z-index: 1;
}
.learn-card-meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  position: relative;
  z-index: 1;
}
.learn-card-meta span {
  padding: 0.25rem 0.7rem;
  background: var(--color-bg-primary, #fafafa);
  border: 1px solid var(--color-border, #e0e0e0);
  border-radius: 100px;
  font-size: 0.78rem;
  color: var(--color-text-secondary, #666);
}
.learn-card-btn {
  padding: 0.5rem 1.2rem;
  background: linear-gradient(135deg, var(--color-accent, #D4AF37), var(--color-accent-light, #F4E5B2));
  color: #000;
  border-radius: 100px;
  font-size: 0.85rem;
  font-weight: 600;
  position: relative;
  z-index: 1;
  transition: transform 0.3s;
}
.learn-card:hover .learn-card-btn { transform: scale(1.05); }
.learn-home-notice {
  max-width: 700px;
  margin: 0 auto 4rem;
  padding: 1.5rem 2rem;
  background: var(--color-bg-secondary, #fff);
  border-left: 4px solid var(--color-accent, #D4AF37);
  border-radius: 0 12px 12px 0;
  color: var(--color-text-secondary, #666);
  line-height: 1.8;
  font-size: 0.92rem;
}
.learn-home-notice a {
  color: var(--color-accent-dark, #B8960C);
  border-bottom: 1px solid var(--color-accent-light, #F4E5B2);
  text-decoration: none;
}
[data-theme="dark"] .learn-card { background: #242424; }
[data-theme="dark"] .learn-card-meta span { background: #1a1a1a; }
[data-theme="dark"] .learn-home-notice { background: #2a2a2a; }
</style>
