const option = (id, label, description, types = []) => ({ id, label, description, types });

export const SCENE_MODULES = [
  {
    key: 'location',
    title: '场景地点',
    icon: 'map-pin',
    hint: '给画面一个发生的地方',
    color: '#3e8b72',
    options: [
      option('forest', '森林', '树影、蕨类与斑驳的阳光', ['grass', 'bug', 'fairy']),
      option('seaside', '海边', '潮声、礁石与海风', ['water', 'ice', 'flying']),
      option('beach', '沙滩', '细沙、贝壳与夏日遮阳伞', ['water', 'fire', 'normal']),
      option('snow-mountain', '雪山', '积雪、冷杉与稀薄空气', ['ice', 'rock', 'flying']),
      option('city', '城市', '街灯、楼宇与霓虹倒影', ['electric', 'steel', 'normal']),
      option('countryside', '乡村', '田埂、木栅栏与慢下来的风', ['normal', 'grass', 'ground']),
      option('grassland', '草原', '开阔草浪与远处的云', ['grass', 'ground', 'normal']),
      option('desert', '沙漠', '沙丘、热浪与孤零零的岩石', ['ground', 'rock', 'fire']),
      option('cave', '洞穴', '潮湿岩壁与微弱回声', ['rock', 'ground', 'poison']),
      option('ruins', '遗迹', '残墙、石刻与安静的苔藓', ['ghost', 'psychic', 'rock']),
      option('volcano', '火山', '暗红岩层与翻涌的热气', ['fire', 'rock', 'ground']),
      option('lake', '湖泊', '倒映天空的平静水面', ['water', 'grass', 'ice']),
      option('river', '河流', '流水、卵石与两岸绿意', ['water', 'grass', 'normal']),
      option('waterfall', '瀑布', '水雾、彩虹与轰鸣声', ['water', 'rock', 'flying']),
      option('amusement-park', '游乐园', '摩天轮、彩灯与棉花糖', ['electric', 'fairy', 'normal']),
      option('school', '学校', '教室、操场与午后的走廊', ['normal', 'psychic', 'fighting']),
      option('room', '房间', '熟悉的小空间与生活痕迹', ['normal', 'psychic', 'dark']),
      option('cafe', '咖啡馆', '暖光、咖啡香与窗边座位', ['normal', 'fairy', 'fire']),
      option('garden', '花园', '花丛、藤架与飞舞的小虫', ['grass', 'fairy', 'bug']),
      option('sky', '天空', '云层、气流与辽阔的蓝', ['flying', 'dragon', 'electric']),
      option('mountain', '山脊', '岩峰、劲风与壮阔视野', ['rock', 'flying', 'fighting']),
      option('island', '小岛', '浅滩、礁石与与世隔绝的宁静', ['water', 'flying', 'grass']),
      option('tropical-island', '热带海岛', '暖水、珊瑚与强烈的日光', ['water', 'fire', 'grass']),
      option('cold-island', '寒冷海岛', '冷海、岩岸与被风压低的地平线', ['water', 'ice', 'flying']),
      option('underwater', '水下', '光柱、气泡与缓慢游动的影子', ['water', 'ice', 'dragon']),
      option('space', '星空', '星河、陨石与失重的寂静', ['psychic', 'dragon', 'fairy']),
    ],
  },
  {
    key: 'weather',
    title: '天气',
    icon: 'cloud',
    hint: '决定光线与空气质感',
    color: '#4c7fb8',
    options: [
      option('sunny', '晴天', '明亮、清晰、影子利落'),
      option('cloudy', '阴天', '柔和漫射光，颜色偏灰'),
      option('light-rain', '小雨', '细线般的雨丝与湿润反光'),
      option('heavy-rain', '大雨', '密集雨幕与溅起的水花'),
      option('storm', '暴雨', '压低的云层与猛烈降水'),
      option('thunderstorm', '雷雨', '闪电、积水与强烈明暗对比'),
      option('snow', '雪天', '缓慢飘落的雪与安静环境'),
      option('blizzard', '暴雪', '风雪交加，视线被压低'),
      option('fog', '雾天', '朦胧层次与柔化轮廓'),
      option('windy', '大风', '被吹动的毛发、草叶与衣角'),
      option('rainbow', '雨后彩虹', '湿润空气里短暂出现的色带'),
      option('starry', '晴朗星夜', '星光、深蓝与清晰轮廓'),
    ],
  },
  {
    key: 'time',
    title: '时间',
    icon: 'clock',
    hint: '给画面一个明确的时间段',
    color: '#9d7444',
    options: [
      option('dawn', '清晨', '淡蓝与浅金交界的安静时刻'),
      option('morning', '上午', '清透、有活力、光线渐强'),
      option('noon', '正午', '短影、强烈高光与饱和色'),
      option('afternoon', '下午', '温暖、略带困意的斜光'),
      option('dusk', '黄昏', '橙红天幕与长长的阴影'),
      option('night', '夜晚', '深蓝环境与点点光源'),
      option('midnight', '深夜', '寂静、低饱和与局部光源'),
    ],
  },
  {
    key: 'action',
    title: '动作',
    icon: 'activity',
    hint: '让宝可梦在画面里动起来',
    color: '#b45e50',
    options: [
      option('sleeping', '睡觉', '蜷起身体或靠在伙伴身边', ['normal', 'psychic']),
      option('running', '奔跑', '扬起草屑、水花或尘土', ['normal', 'fighting', 'electric']),
      option('flying', '飞行', '展开双翼或借风滑翔', ['flying', 'dragon', 'bug']),
      option('foraging', '觅食', '低头寻找果实、蘑菇或小虫', ['grass', 'bug', 'ground']),
      option('playing', '玩耍', '追逐玩具、滚成一团或扑向落叶', ['normal', 'fairy', 'electric']),
      option('battling', '战斗', '摆出架势，周围有能量感', ['fighting', 'fire', 'dragon']),
      option('swimming', '游泳', '划水、浮潜或在水面打转', ['water', 'ice', 'dragon']),
      option('resting', '休息', '放松身体，观察周围环境', ['normal', 'grass', 'psychic']),
      option('jumping', '跳跃', '在半空中定格，留下动势', ['fighting', 'electric', 'normal']),
      option('exploring', '探索', '拨开草丛、查看岩缝或寻找路径', ['ground', 'rock', 'dark']),
      option('hiding', '躲藏', '从掩体后探出头或压低身体', ['ghost', 'dark', 'bug']),
      option('observing', '观察', '专注地盯着某处，保持静止', ['psychic', 'normal', 'flying']),
      option('eating', '进食', '捧着实食物，脸颊鼓鼓的', ['normal', 'grass', 'fairy']),
      option('dancing', '跳舞', '轻盈旋转或跟着节奏摆动', ['fairy', 'psychic', 'electric']),
      option('sunbathing', '晒太阳', '眯起眼睛，享受暖光', ['fire', 'grass', 'normal']),
    ],
  },
  {
    key: 'interaction',
    title: '互动关系',
    icon: 'users',
    hint: '多只宝可梦之间的小故事',
    color: '#7b5ea7',
    options: [
      option('play-together', '一起玩耍', '分享同一个游戏或玩具'),
      option('chase', '互相追逐', '一前一后，带起动作线'),
      option('cooperate', '合作', '合力完成一件小事'),
      option('compete', '竞争', '友好的较量与不服输的眼神'),
      option('quarrel', '争吵', '背对背、炸毛或小幅度的斗嘴'),
      option('care', '照顾', '替对方整理毛发或递上食物'),
      option('help', '互相帮助', '一只搭把手，另一只努力够到目标'),
      option('forage-together', '共同觅食', '并肩寻找食物，分工明确'),
      option('observe', '互相观察', '保持距离，好奇地打量彼此'),
      option('share-food', '分享食物', '把最喜欢的食物推给对方'),
      option('groom', '互相梳理', '安静而亲密的日常瞬间'),
    ],
  },
  {
    key: 'event',
    title: '特殊事件',
    icon: 'zap',
    hint: '给画面加一个小转折',
    color: '#c18a2d',
    options: [
      option('sudden-rain', '突然下雨', '毫无准备，大家慌忙寻找遮蔽'),
      option('treasure', '发现宝藏', '土里露出闪光的旧物或果实'),
      option('stranger-pokemon', '遇到陌生宝可梦', '远处的剪影或谨慎的初次接触'),
      option('mystery-cave', '发现神秘洞穴', '洞口透出不属于这里的光'),
      option('other-creature', '遇见其他生物', '一只小动物或昆虫闯入画面'),
      option('food-stolen', '食物被偷走', '只剩空盘子与可疑的脚印'),
      option('strange-item', '发现奇怪物品', '无法判断用途的闪亮小物'),
      option('lost-way', '暂时迷路', '地图失效，需要一起找方向'),
      option('festival', '偶遇庆典', '彩灯、摊位与热闹人群'),
      option('meteor-shower', '流星划过', '所有人抬头看同一片夜空'),
    ],
  },
  {
    key: 'composition',
    title: '绘画构图',
    icon: 'grid',
    hint: '决定视线如何进入画面',
    color: '#5b7c7a',
    options: [
      option('rule-thirds', '三分法', '主体落在交点，留出呼吸空间'),
      option('center-symmetry', '中心对称', '稳定、正式、像一张舞台剧照'),
      option('low-angle', '低机位仰视', '放大存在感，让背景向上收束'),
      option('close-up', '特写', '让表情、材质和局部动作成为主角'),
      option('leading-lines', '引导线', '用道路、水流或光影把视线送向远处'),
      option('frame', '框架构图', '用门、窗或枝叶把主体框在中间'),
      option('negative-space', '大面积留白', '用空白承担情绪和想象'),
      option('diagonal', '对角线动势', '让动作和光的方向交叉，增加速度'),
      option('top-down', '平面俯视', '弱化透视，用形状与色块组织画面'),
      option('silhouette', '剪影', '压暗主体，只保留轮廓和边缘光'),
    ],
  },
  {
    key: 'visual',
    title: '视觉表现',
    icon: 'palette',
    hint: '统一光线、色彩与质感',
    color: '#9a6d73',
    options: [
      option('soft-diffuse', '柔和漫射', '低对比、边界柔软、适合日常'),
      option('hard-contrast', '硬光高对比', '明确高光与短影，形体更利落'),
      option('warm-glow', '暖光包裹', '金色环境光与温暖的反射'),
      option('cool-shadow', '冷色阴影', '阴影偏蓝紫，空气更安静'),
      option('pastel', '粉彩低饱和', '轻盈、柔软、像绘本'),
      option('monochrome', '单色层次', '用一个色相组织明暗与情绪'),
      option('neon', '霓虹双色光', '品红与青色反光，适合夜景'),
      option('cinematic', '电影感', '强调景深、光比与画面叙事'),
      option('painterly', '绘画质感', '保留笔触、纸张或颜料颗粒'),
      option('ethereal', '空灵发光', '边缘轻溶，局部发出柔光'),
    ],
  },
];

export const SCENE_MODULE_MAP = Object.fromEntries(SCENE_MODULES.map((module) => [module.key, module]));
export const SCENE_KEYS = SCENE_MODULES.map((module) => module.key);

export function getSceneOption(moduleKey, optionId) {
  return SCENE_MODULE_MAP[moduleKey]?.options.find((item) => item.id === optionId) || null;
}

export function getDefaultSceneValue(moduleKey) {
  return SCENE_MODULE_MAP[moduleKey]?.options[0]?.id || null;
}

export function createSceneState() {
  return Object.fromEntries(
    SCENE_MODULES.map((module) => [
      module.key,
      {
        enabled: true,
        locked: false,
        value: getDefaultSceneValue(module.key),
      },
    ]),
  );
}

export function normalizeSceneState(sceneState) {
  const defaults = createSceneState();
  if (!sceneState || typeof sceneState !== 'object') return defaults;
  return Object.fromEntries(
    SCENE_MODULES.map((module) => {
      const value = sceneState[module.key];
      const fallback = defaults[module.key];
      const validValue = module.options.some((item) => item.id === value?.value)
        ? value.value
        : fallback.value;
      return [
        module.key,
        {
          enabled: value?.enabled !== false,
          locked: Boolean(value?.locked),
          value: validValue,
        },
      ];
    }),
  );
}
