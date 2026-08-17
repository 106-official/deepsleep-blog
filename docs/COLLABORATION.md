# 多设备 / 并行更新协作约定（重要）

> **背景**：本项目由 **两个设备 + 同一 GitHub 账号** 共同维护，且工作区内常有并行会话 / 多任务同时操作同一工作树。两者叠加，git 推送与共享文件写入都可能出现"互相覆盖 / 推送被拒 / 内容丢失"的混乱。
>
> **适用范围**：所有带 GitHub remote 的仓库（`blog-static`、`waline-deepsleep`、`community-deepsleep`），以及本地共享目录（`docs/`、`.workbuddy/memory/`、`remote-control/` 等）。

---

## 1. 为什么会乱

1. **跨设备不同步**：设备 A 推送了提交，设备 B 本地仍停留在旧 commit；B 再推送会被 GitHub 拒绝（non-fast-forward），若强行覆盖会丢失 A 的改动。
2. **自动部署放大后果**：`blog-static`（GitHub Pages）、`waline-deepsleep`（Vercel）均"推送即上线"，一次错误推送直接进入生产环境。
3. **本环境 git 会自动暂存全部已跟踪改动**：裸 `git commit` 会把工作区里所有 tracked 文件的改动一起提交（包括另一设备 / 另一会话刚写入的无关改动）。
4. **共享文件并发写冲突**：`docs/` 文档与 `.workbuddy/memory/` 日志可能被两端 / 多会话同时改写，后写覆盖先写，造成内容丢失。

---

## 2. 黄金法则

- **开工先同步**：开始任何改动前，先 `git fetch` 并确认本地已包含对方 / 另一会话的最新提交（见第 3 节）。
- **收工必推送且确认无 rejected**：推送后看终端是否报 `! [rejected]`，有就按第 4 节处置，**不要直接强推**（`git push --force`）。
- **错峰 / 分文件**：两设备尽量不同时编辑同一仓库的同一批文件；必要时用分支隔离。
- **绝不使用裸 `git commit`**（原因见第 5 节）。

---

## 3. 标准工作流（每设备、每会话开始时）

```bash
git fetch origin
git status                      # 看本地是否落后 / 有未提交改动

# 情况 A：本地落后且工作区干净
git pull --rebase origin main   # 把本地提交变基到远程最新之上

# 情况 B：工作区有未提交改动
git stash
git pull --rebase origin main
git stash pop
```

> 重要：`pull --rebase`（而非 `pull --merge`）能避免产生无意义的"合并提交"，让两端历史保持线性、便于排查。

---

## 4. 推送被拒的统一处置

GitHub 报 `! [rejected] main -> main (non-fast-forward)` 或 `cannot lock ref 'refs/heads/main'`，**多半不是冲突，而是远程已有对方 / 另一会话的新提交**：

1. `git fetch origin main`
2. `git log --oneline <你的旧基线>..FETCH_HEAD` —— 看远程新增了什么、自己的提交是否已在其中
3. `git rev-list --left-right --count HEAD...origin/main` —— 若结果为 `0 0`，表示已完全同步，无需任何操作
4. 否则 `git rebase origin/main` 把本地提交接上去，再 `git push origin HEAD:main`
5. **工作树脏时勿贸然 `rebase --autostash`**：可能 stash 掉正被另一会话写入的文件，有丢失风险；先 `git status` 确认工作区状态再决定。

---

## 5. 铁律：只提交你要改的文件

本环境 `git commit` 会自动暂存所有已跟踪文件的修改。做聚焦提交一律：

```bash
git add <你改的文件>
git commit --only <你改的文件> -m "具体说明"
```

新增未跟踪文件要先 `git add`，再把它连同其它路径一起写进 `git commit --only` 的路径列表，才会进本次提交。

---

## 6. 共享文档 / 记忆文件并发写规范

- 改 `docs/` 下文件前，先 `git fetch` + 确认不是基于旧版本在改；
- 改 `.workbuddy/memory/` 日志：采用「**重读 → Edit 追加 → 写完复查**」，若 Edit 报"文件已被修改"就重读再试，避免覆盖另一设备 / 会话的写入；
- 大段新增优先用"追加"而非"整文件重写"，降低冲突面。

---

## 7. 推荐：用分支隔离两设备的实验性改动

```bash
git checkout -b dev/设备A-功能描述
# 改动、提交…
git push -u origin dev/设备A-功能描述
# 在 GitHub 上发起 PR，或直接 rebase 回 main 后推送
```

用分支后，即便两设备同时工作也不会直接互相覆盖 `main`；合并时 git 能帮你发现冲突，而不是静默丢失。
