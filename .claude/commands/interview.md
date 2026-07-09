---
description: 向我提问以了解更多关于我的信息并更新我的个人画像
---

## 主题：$ARGUMENTS

根据主题参数，选择对应的画像文件：
- `relationships` → `关于我/relationships.md`
- `career` 或 `work` → `关于我/career-projects.md`
- `health` 或 `habits` → `关于我/health-habits.md`
- `core`、`values`、`identity` → `关于我/core-profile.md`
- 无参数或 `random` → 选择信息缺口最多/`last_updated` 最旧的文件

## 步骤

1. 读取选中的画像文件
2. 识别一处信息缺失、过时或可深化的领域（静默完成，用户不需要知道你选了什么以及为什么选）
3. 向我提出一个清晰、对话式的问题
   - 要具体，不要泛泛
   - 引用你已知的信息来展示上下文
   - 示例："你提到过X——现在有什么变化吗？" 或 "关于Y我了解不多——能跟我说说吗？"
4. 我回答后：
   - 用新信息更新对应的画像文件
   - 更新 frontmatter 中的 `last_updated`
   - 保持格式与现有结构一致

只回复你的问题（不要解释你读了什么文件，用户已经知道）。我回答后，只回复："✓ 画像已更新"
