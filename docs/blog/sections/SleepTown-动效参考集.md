# SleepTown 高级无框动效 · 参考集

> 来源说明：小红书内容在登录墙后，无法直接抓取。以下用公开网络（Smashing Magazine、CSS Showcase、电影 Noir 理论站、创意工作室站）替代，覆盖你锁定的「暗房显影 + 墨水晕开 + 打字机 + 颗粒 + 聚光灯」语汇，以及「无框 / 少框」交互模式。每条都标注了「动效要点 / 无框启示 / 对应 SleepTown 落点」。

## 一、可点击参考（按动效类型）

### A. 暗房显影 / 图片揭露（mask 技法 → 对应"角色揭示"）
1. **Smashing Magazine — Revealing Images With CSS Mask Animations**（Temani Afif）
   https://www.smashingmagazine.com/2023/09/revealing-images-css-mask-animations/
   - 要点：用 gradient mask + `mask-composite` 做斜向 / 对角「擦除式」揭露；纯 CSS、无图片资源。
   - 无框启示：揭示靠「可见性窗口滑动」而非边框，天然无框。
   - 对应落点：开局角色卡 `role-card` 的暗房显影（雾→清晰）。
2. **CSS Showcase — Mask reveal（soft edge, light beam）**
   https://www.cssshowcase.com/snippets/animation/mask-reveal
   - 要点：宽 gradient mask 横扫，边缘柔化如光束；含 `prefers-reduced-motion` 降级。
   - 无框启示：软边擦除比 `clip-path` 硬切更高级；带无障碍降级。
   - 对应落点：通用「进场」基类；角色揭示复用。
3. **php.cn — CSS mask-image 跨浏览器实战**
   https://m.php.cn/faq/2713124.html
   - 要点：必须同时写 `-webkit-mask-image`；用灰度字面量 `transparent`；`background-image + mask` 组合结构。
   - 工程启示（SleepTown 要兼容 WebKit，必须带前缀）。
   - 对应落点：实现时的工程约束清单。

### B. 聚光灯 / 径向揭示（→ 对应"放逐结果"）
4. **DigitalThriveAI — Revealing Images with CSS Mask Animations**
   https://digitalthriveai.com/en-au/resources/web-development/revealing-images-css-mask-animations
   - 要点：`radial-gradient` 做 center-out / edge-in 圆形揭示 = 聚光灯；`conic` 做旋转揭示。
   - 无框启示：聚光灯本身就是「用光划区域」，不需要框。
   - 对应落点：放逐结果——一束暖光（`--st-lamp`）照出被放逐者名字。

### C. 电影感 / 极简无框（整体调性参考）
5. **Active Theory**（创意工作室站）https://activetheory.net — 沉浸电影感、minimal UI max impact、WebGL 动效。
6. **The Boat by SBS**（交互叙事）https://www.sbs.com.au/theboat/ — 极简 UI、氛围音频、情绪节奏驱动，无框沉浸。
7. **Inside Chanel**（奢侈品牌叙事）https://inside.chanel.com — 电影化时间线、motion typography。

### D. Noir 光影理论（动效"质感"的源头）
8. **CineNoir — The Chromatic Abyss / Chromatic Void**（Neo-Noir 片单）
   https://cinenoir.net/style/neon-noir/the-chromatic-abyss-10-essential-neon-lit-neo-noirs
   - 要点：光即叙事重量；高反差；彩色凝胶营造「炼狱 / 疏离」；Drive / Blade Runner 2049 / Only God Forgives。
   - 对应落点：聚光灯的「克制 + 有重量」节奏参考（长 `ease-out`，禁用弹跳）。
9. **Neo-Noir 理论**（clair-obscur 明暗对照、镜像双生、不可靠叙述）
   https://www.europeanstudios.nl/encyclopedie/neo-noir-film
   - 要点：chiaroscuro 光影强调道德灰度；镜像 / 反射象征身份双生；爵士 / 氛围音景。
   - 对应落点：揭示瞬间的「明暗对照」、游戏「不可靠信息」的碎片感。

## 二、锁定语汇 → 落点映射（回扣 grill 结论）

| 语汇 | 技术手法 | SleepTown 落点 |
|---|---|---|
| 暗房显影 | mask 横扫 + 柔边 + 雾层淡出 | 角色揭示 `role-card` |
| 聚光灯 | radial 暖光（`--st-lamp`）+ 缩放 | 放逐 / 投票结果 |
| 打字机 | JS 逐字 + 光标闪烁 | 放逐判定词 / 线索 |
| 墨水晕开 | `feTurbulence` 扰动 / mask 斜擦 | 界面转场 setup→游戏、模式→游戏 |
| 胶片颗粒 | SVG `feTurbulence` 噪声叠加 | 全局氛围层 |
| 慢 / 克制 / 有重量 | `cubic-bezier(.22,1,.36,1)` 长缓动，禁 spring | 贯穿全部 |

## 三、工程约束（纯 CSS/JS，零依赖）
- 必须 `-webkit-mask-*` 前缀（WebKit 兼容）
- `prefers-reduced-motion` 降级（mask 全显、动画关）
- 不引 GSAP / Lottie，保持单文件自包含
- 颗粒用 SVG `feTurbulence` 噪声叠加，避免大图资源

## 四、下一步
Phase 1（参考集 + Demo）已交付，你看完觉得「味道对」后，我再进入 Phase 2：把这三种语汇落地到 `sleeptown.html` 的 3 个高光时刻（角色揭示 / 放逐结果 / 界面转场），先不提交、你看效果。
