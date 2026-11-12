# 响应式检查

在以下视口宽度检查六个页面是否出现横向溢出：

- 1440px
- 1024px
- 768px
- 390px
- 320px

每档宽度检查：
- 随机工作台（抽取设置、宝可梦、候选池、计时、历史）
- 绘画灵感工坊（模式、基础场景、主题、故事、绘画指导、配色、参考素材）
- 筛选设置（完整视图）
- 我的图库
- 我的收藏
- 抽取历史

结果：**30/30 通过**，所有页面 `documentElement.scrollWidth === clientWidth`，没有横向滚动条；桌面侧边栏与移动端顶部导航、六项底部导航在对应断点正常切换；工作台双栏在窄屏变为单栏；工坊场景设定、绘画指导、配色角色、参考素材在 320px / 390px 下不溢出。

另外保存了：
- `docs/screenshots/inspiration-workshop.png`
- `docs/screenshots/inspiration-workshop-390.png`
- `docs/screenshots/inspiration-workshop-320.png`
- `docs/screenshots/settings-atmosphere.png`
- `docs/screenshots/settings-atmosphere-mobile.png`
- `docs/screenshots/settings-atmosphere-320.png`
- `docs/screenshots/workbench-atmosphere.png`
- `docs/screenshots/settings-image-preferences.png`
- `docs/screenshots/settings-image-preferences-320.png`
- `docs/screenshots/workbench-settings.png`
- `docs/screenshots/workbench-settings-390.png`
- `docs/screenshots/workbench-settings-320.png`
- `docs/screenshots/workshop-scene-panel.png`
- `docs/screenshots/workbench-one-click.png`
- `docs/screenshots/workbench-one-click-390.png`
- `docs/screenshots/workbench-one-click-320.png`