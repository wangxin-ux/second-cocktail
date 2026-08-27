# AI Cocktail 专业知识库

本目录只保存可执行的调酒知识、来源和验证状态；不收录或复刻受版权保护书籍的正文与完整配方集合。

## 使用规则

- 每条规则必须标注来源、证据等级和适用范围。
- 书籍中的方法论应先转化为可测试的规则，再接入 `lib/cocktails/`；不能把书名当作配方正确性的证明。
- 生成结果仍须通过现有基酒、重复原料、用量和结构校验；专业知识库不能绕过 `validator.ts`。
- 历史信息、作者偏好与通用技法要分开标注，避免把单一酒吧风格误当成普适标准。

## 学习队列与产物

| 优先级 | 来源 | 当前可学习主题 | 计划产物 |
| --- | --- | --- | --- |
| P0 | *The Bar Book* — Jeffrey Morgenthaler | 柑橘、糖浆、摇和搅、浸泡、装饰、搅拌机等技法 | `technique-rules.md`：操作、适用饮型、失败条件 |
| P0 | *Cocktail Codex* — Alex Day, David Kaplan, Nick Fauchald | 六个 root cocktails：Old-Fashioned、Martini、Daiquiri、Sidecar、Whisky Highball、Flip | `template-taxonomy.md`：饮型模板和变体规则 |
| P0 | *Meehan's Bartender Manual* — Jim Meehan | 酒吧设计、菜单、烈酒、技法、服务与待客 | `service-and-execution.md`：出品与服务检查表 |
| P0 | *Liquid Intelligence* — Dave Arnold | 温度、碳酸化、糖浓度、酸度、澄清和浸泡 | `science-constraints.md`：需要量化验证的科学规则 |
| P0 | *Death & Co* — David Kaplan, Nick Fauchald, Alex Day | 当代鸡尾酒理论、烈酒/工具、关键技法与现代经典 | `modern-design-patterns.md`：风格标签和配方设计模式 |
| P1 | *The Joy of Mixology* — Gary Regan | 分类与调酒逻辑 | 补充分类交叉校验 |
| P1 | *The New Craft of the Cocktail* — Dale DeGroff | 经典、鲜榨果汁与吧台基本功 | 经典配方与服务基线 |
| P1 | *Imbibe!* — David Wondrich | 美国经典、Punch/Sour/Fizz/Toddy/Sling 的历史 | `history-notes.md`：不参与配方校验的历史上下文 |
| P1 | *The Oxford Companion to Spirits and Cocktails* | 烈酒生产、工艺、地域与术语 | `terminology.md`：术语与事实核验索引 |
| P1 | *The Flavor Bible* — Karen Page, Andrew Dornenburg | 风味亲和、酸度提亮、分层与平衡 | `flavor-hypotheses.md`：待实验验证的风味假设 |

## 证据等级

- **A：章节已合法阅读**。可提炼为明确规则，仍需工程测试。
- **B：出版方试读、作者公开文章或公开访谈**。仅能建立方向性规则或学习索引。
- **C：书籍简介/目录**。只用于确定阅读范围，不可导出具体技术结论。

目前目录中的 10 本均处于 B/C（官方页面与公开材料已确认），尚未取得可合法逐章阅读的完整文本。因此还不能声称已经“读完”任何一本书。

## 官方来源索引

- [The Bar Book（作者介绍）](https://jeffreymorgenthaler.com/i-wrote-a-book/)
- [Cocktail Codex（Ten Speed / Penguin Random House）](https://www.penguinrandomhouse.com/books/534533/cocktail-codex-by-alex-day-nick-fauchald-and-david-kaplan/)
- [Meehan's Bartender Manual（Ten Speed / Penguin Random House）](https://www.penguinrandomhouse.com/books/249859/meehans-bartender-manual-by-jim-meehan/)
- [Liquid Intelligence（W. W. Norton）](https://wwnorton.co.uk/books/9780393089035-liquid-intelligence)
- [Death & Co（Ten Speed / Penguin Random House）](https://www.penguinrandomhouse.com/books/225209/death-and-co-by-david-kaplan-nick-fauchald-and-alex-day/)
- [The Joy of Mixology（Penguin Random House）](https://www.penguinrandomhouse.com/books/550131/the-joy-of-mixology-revised-and-updated-edition-by-gary-regan/)
- [The New Craft of the Cocktail（Penguin Random House）](https://www.penguinrandomhouse.com/books/600408/the-new-craft-of-the-cocktail-by-dale-degroff/9781984823588)
- [Imbibe!（Penguin Random House）](https://www.penguinrandomhouse.com/books/317218/imbibe-updated-and-revised-edition-by-david-wondrich/)
- [The Oxford Companion to Spirits and Cocktails（Oxford University Press）](https://www.oup.com.au/books/general-interest/humanities-social-sciences/9780199311132)
- [The Flavor Bible（Hachette）](https://www.hachettebookgroup.com/titles/none/the-flavor-bible/9780316118408/)

## 下一步

优先取得 *The Bar Book* 与 *Cocktail Codex* 的合法电子版或章节内容。拿到后，每本书按“章节摘要 → 原子规则 → 与现有引擎的冲突检查 → 单元测试候选”四步沉淀。
