export const INSPIRATION_MODES = [
  {
    id: 'random',
    label: '完全随机',
    short: '随机',
    icon: 'sparkles',
    description: '忽略当前组合，从全部本地词条中独立生成一套完整灵感。',
  },
  {
    id: 'linked',
    label: '当前宝可梦联动',
    short: '联动',
    icon: 'target',
    description: '读取当前工作台的宝可梦与场景，优先选择更匹配的主题、动作与光线。',
  },
  {
    id: 'custom',
    label: '自定义生成',
    short: '自定义',
    icon: 'palette',
    description: '输入自己的主题或关键词，再让本地规则补全指导、风格与挑战。',
  },
];

export const INSPIRATION_DIFFICULTIES = [
  {
    id: 'beginner',
    label: '入门',
    level: 1,
    timerSeconds: 30 * 60,
    timerLabel: '30 分钟',
    description: '更清晰的步骤、较少的限制，适合热身和日常练习。',
  },
  {
    id: 'intermediate',
    label: '进阶',
    level: 2,
    timerSeconds: 60 * 60,
    timerLabel: '1 小时',
    description: '加入构图、材质与双光源等约束，适合完整练习。',
  },
  {
    id: 'challenge',
    label: '挑战',
    level: 3,
    timerSeconds: 120 * 60,
    timerLabel: '2 小时',
    description: '更复杂的主题与限制，适合想突破舒适区的创作者。',
  },
];

export const INSPIRATION_DIMENSIONS = [
  { key: 'theme', group: 'theme', label: '创意主题', icon: 'bulb' },
  { key: 'story', group: 'guidance', label: '故事情境', icon: 'bookmark' },
  { key: 'scene', group: 'guidance', label: '场景环境', icon: 'map-pin' },
  { key: 'action', group: 'guidance', label: '动作互动', icon: 'activity' },
  { key: 'composition', group: 'guidance', label: '构图', icon: 'grid' },
  { key: 'viewpoint', group: 'guidance', label: '视角', icon: 'target' },
  { key: 'lighting', group: 'guidance', label: '光影', icon: 'sun' },
  { key: 'background', group: 'guidance', label: '背景建议', icon: 'image' },
  { key: 'palette', group: 'visual', label: '配色与色卡', icon: 'palette' },
  { key: 'mood', group: 'visual', label: '氛围', icon: 'sparkles' },
  { key: 'material', group: 'visual', label: '材质建议', icon: 'brush' },
  { key: 'challenge', group: 'challenge', label: '特殊绘画挑战', icon: 'zap' },
];

export const INSPIRATION_DIMENSION_MAP = Object.fromEntries(
  INSPIRATION_DIMENSIONS.map((dimension) => [dimension.key, dimension]),
);

export const INSPIRATION_GROUPS = [
  { id: 'theme', step: '01', title: '创意主题', eyebrow: 'CREATIVE THEME' },
  { id: 'guidance', step: '02', title: '绘画指导', eyebrow: 'DRAWING GUIDANCE' },
  { id: 'visual', step: '03', title: '视觉风格', eyebrow: 'VISUAL STYLE' },
  { id: 'challenge', step: '04', title: '特殊绘画挑战', eyebrow: 'DRAWING CHALLENGE' },
];

export const INSPIRATION_DIMENSION_KEYS = INSPIRATION_DIMENSIONS.map((dimension) => dimension.key);

export const INSPIRATION_THEMES = [
  { id: 'rainy-store', level: 1, text: '雨夜便利店门口的短暂停留', types: ['water', 'electric'], scenes: ['city'], times: ['night'], moods: ['quiet', 'cozy'] },
  { id: 'last-cable-car', level: 2, text: '火山脚下最后一班缆车', types: ['fire', 'rock'], scenes: ['volcano', 'mountain'], times: ['dusk'], moods: ['dramatic'] },
  { id: 'sunken-ruins', level: 2, text: '湖底沉睡的古代遗迹', types: ['water', 'psychic'], scenes: ['underwater', 'lake'], times: ['afternoon'], moods: ['mysterious'] },
  { id: 'snow-sunrise', level: 1, text: '雪山日出时的第一缕光', types: ['ice', 'flying'], scenes: ['snow-mountain'], times: ['dawn'], moods: ['hopeful'] },
  { id: 'midnight-carousel', level: 2, text: '废弃游乐园的午夜旋转木马', types: ['ghost', 'electric'], scenes: ['amusement-park'], times: ['midnight'], moods: ['eerie'] },
  { id: 'garden-tea', level: 1, text: '花园里的小型午后茶会', types: ['grass', 'fairy'], scenes: ['garden', 'cafe', 'grassland'], times: ['afternoon'], moods: ['cozy'] },
  { id: 'sand-caravan', level: 2, text: '沙暴中缓慢前行的商队', types: ['ground', 'rock'], scenes: ['desert'], times: ['noon'], moods: ['tense'] },
  { id: 'sky-whales', level: 3, text: '云层之上的鲸群迁徙', types: ['flying', 'dragon'], scenes: ['sky'], times: ['morning'], moods: ['dreamy'] },
  { id: 'old-bookshop', level: 1, text: '旧书店阁楼的灰尘与秘密', types: ['ghost', 'dark'], scenes: ['room'], times: ['afternoon'], moods: ['quiet'] },
  { id: 'rooftop-puddles', level: 2, text: '暴雨后的城市天台积水', types: ['water', 'electric'], scenes: ['city'], times: ['dusk'], moods: ['reflective'] },
  { id: 'sakura-nap', level: 1, text: '樱花树下的短暂午睡', types: ['grass', 'fairy'], scenes: ['garden', 'countryside', 'grassland'], times: ['afternoon'], moods: ['gentle'] },
  { id: 'crater-noon', level: 3, text: '火山口边缘的炽热午后', types: ['fire', 'dragon'], scenes: ['volcano'], times: ['noon'], moods: ['intense'] },
  { id: 'night-station', level: 2, text: '深夜加油站与远方的车灯', types: ['dark', 'steel'], scenes: ['city', 'countryside'], times: ['midnight'], moods: ['lonely'] },
  { id: 'desert-campfire', level: 3, text: '星空沙漠中的一团篝火', types: ['fire', 'psychic'], scenes: ['desert'], times: ['night'], moods: ['warm'] },
  { id: 'glowing-spores', level: 2, text: '森林深处会发光的孢子', types: ['grass', 'poison'], scenes: ['forest', 'grassland'], times: ['night'], moods: ['magical'] },
  { id: 'storm-lighthouse', level: 3, text: '海边灯塔在风暴中亮起', types: ['water', 'electric'], scenes: ['seaside', 'island'], weathers: ['storm', 'thunderstorm'], moods: ['heroic'] },
  { id: 'rain-ruins', level: 1, text: '雨水打湿的遗迹回廊', types: ['water', 'rock', 'ghost'], scenes: ['ruins'], times: ['afternoon', 'dusk'], weathers: ['light-rain', 'rain'], moods: ['mysterious', 'quiet'] },
  { id: 'dusty-chandelier', level: 2, text: '古堡舞厅里落灰的吊灯', types: ['ghost', 'fairy'], scenes: ['ruins'], times: ['night'], moods: ['elegant'] },
  { id: 'river-sunbath', level: 1, text: '溪流石头上晒太阳的午后', types: ['water', 'normal'], scenes: ['river'], times: ['noon'], moods: ['lazy'] },
  { id: 'space-station', level: 3, text: '太空站窗外缓慢掠过的地球', types: ['psychic', 'steel'], scenes: ['space'], times: ['night'], moods: ['silent'] },
  { id: 'bakery-morning', level: 1, text: '小镇面包店刚出炉的清晨', types: ['normal', 'fairy'], scenes: ['cafe', 'city'], times: ['morning'], moods: ['warm'] },
];

export const ACTION_NOTES = {
  sleeping: '身体蜷成放松的弧线，呼吸带动背部轻微起伏',
  running: '前肢先落地，后腿完全伸展，草屑或水花向外飞散',
  flying: '双翼展开到最大幅度，利用气流让身体略微后仰',
  foraging: '低头拨开草叶或沙土，注意力集中在找到的小东西上',
  playing: '身体失去平衡的一瞬间，尾巴和耳朵都在表达情绪',
  battling: '重心压低，前爪或尾巴形成明确的攻击方向',
  swimming: '身体顺着水流的曲线，四肢划开细小气泡',
  resting: '身体放松但眼睛仍观察周围，保留一点警觉',
  jumping: '在半空中定格，四肢收拢或张开，动势向上',
  exploring: '伸出一只爪子拨开遮挡物，身体前倾',
  hiding: '只从掩体后露出半张脸或一双眼睛',
  observing: '头部微倾，视线集中在画面外的某个细节',
  eating: '捧着实食物，脸颊鼓起，碎屑落在周围',
  dancing: '重心偏移，身体形成优美的 S 形曲线',
  sunbathing: '眯起眼睛，身体摊开享受光线，影子拉得很长',
};

export const ACTION_BLOCKED_LOCATIONS = {
  swimming: ['volcano', 'desert', 'room', 'cafe', 'school', 'space', 'sky', 'snow-mountain'],
  flying: ['underwater', 'room', 'cafe', 'school', 'cave'],
  foraging: ['underwater', 'sky', 'space', 'volcano', 'room', 'cafe'],
  running: ['underwater', 'space', 'room', 'cafe', 'sky'],
  jumping: ['underwater', 'space', 'room', 'cafe'],
  sunbathing: ['underwater', 'cave', 'space'],
  hiding: ['sky', 'underwater', 'space'],
  exploring: ['sky', 'underwater', 'space'],
};

export const LOCATION_DETAILS = {
  forest: '前景用树干或蕨类植物做遮挡，地面铺一层落叶与苔藓',
  seaside: '潮湿礁石与远处的海平线形成层次，风把毛发和草叶吹向同一侧',
  beach: '贝壳、脚印和被浪打湿的沙面提供细小纹理',
  'snow-mountain': '雪面保留大面积蓝紫阴影，呼气形成一小团白雾',
  city: '街灯、玻璃反光和广告牌提供人工光源，主体与建筑形成尺度对比',
  countryside: '木栅栏、田埂和远处低矮屋顶构成安静的重复节奏',
  grassland: '风吹出的草浪形成方向线，远处留一条很低的地平线',
  desert: '沙丘的曲线与细碎风纹让空间显得辽阔，影子边缘清晰',
  cave: '潮湿岩壁与钟乳石形成框景，局部光源让深处保持未知',
  ruins: '断裂石柱和爬满苔藓的墙面承载时间感，地面散落碎片',
  volcano: '暗红岩层与上升热气扭曲远处轮廓，火星成为小面积亮点',
  lake: '平静水面提供完整倒影，岸边植物形成一圈画框',
  river: '流水与卵石形成连续引导线，潮湿石头有高光',
  waterfall: '水雾遮住远处细节，水流的白与岩壁的深色形成强对比',
  'amusement-park': '彩灯、栏杆和空置设施构成节奏，局部光源制造怀旧感',
  school: '走廊、课桌或操场线条重复，午后光斑落在地面',
  room: '生活物件形成小型舞台，窗外光线作为唯一自然光源',
  cafe: '窗边座位、杯具和暖灯构成亲密尺度，玻璃反光叠在主体上',
  garden: '花丛前后错落，蜂蝶或花瓣提供小面积动态',
  sky: '云层分前中后景，主体与云团形成大小对比',
  mountain: '岩峰形成坚固的三角结构，风让毛发和披风产生方向',
  island: '浅滩、礁石与低矮植被构成明亮色块，远处海面留白',
  'tropical-island': '暖水、珊瑚与棕榈形成高饱和色块，空气里有强烈日光',
  'cold-island': '冷海、黑色岩岸与被风压低的地平线，雪或盐霜留在背风处',
  underwater: '光柱从水面落下，气泡和悬浮微粒表现深度',
  space: '行星/星云作为大尺度背景，主体轮廓需要清晰边缘光',
};

export const BACKGROUND_SUGGESTIONS = [
  {
    id: 'depth-stage',
    text: '背景用{scene}拉开前中后景：{detail}。让{weather}和{time}退到后景，主体周围留一块较暗的负空间，光源方向与{action}一致。',
  },
  {
    id: 'quiet-frame',
    text: '不要把{scene}画满。用{detail}做中景框，{weather}只占画面一侧，{time}的天空留白；主体边缘保留清晰轮廓，背景对比降一档。',
  },
  {
    id: 'weather-layer',
    text: '把{weather}当成第二层叙事：{scene}的{detail}留在近景，远处用低对比的{time}空气层隔开，避免背景细节压过主体。',
  },
  {
    id: 'action-space',
    text: '给{action}留出动作方向上的空白。{scene}只保留{detail}的局部线索，{weather}散布在远处，{time}通过色温而不是文字说明。',
  },
  {
    id: 'story-corner',
    text: '背景是一段被截取的生活：{scene}里只露出{detail}的一角，{weather}和{time}决定空气质感，前景用道具或阴影回应主体动作。',
  },
  {
    id: 'light-path',
    text: '让光成为背景的引导线：{scene}的{detail}从近景向远处退去，{weather}削弱远景细节，{time}决定主光源的冷暖与方向。',
  },
];

export const INSPIRATION_COMPOSITIONS = [
  { id: 'rule-thirds', text: '三分法构图：主体放在右侧交点，左侧留给天空或环境叙事。' },
  { id: 'center-symmetry', text: '中心对称构图：用圆形光晕或门框把主体稳稳包在中间。' },
  { id: 'frame-foreground', text: '前景框架：用树叶、栏杆或窗框形成遮挡，让观众像在偷看这一幕。' },
  { id: 'low-wide', text: '低机位广角：让近处地面占据下半张画，环境向远处迅速收窄。' },
  { id: 'triangle-group', text: '三角形群像：多只宝可梦的头部形成三角关系，视线汇聚到中心道具。' },
  { id: 'negative-space', text: '留白式构图：主体只占画面三分之一，让空白承担情绪。' },
  { id: 's-curve', text: 'S 形引导线：用河流、道路或烟雾把视线从前景送到远处。' },
  { id: 'diagonal', text: '对角线构图：让动作方向与光的方向形成交叉，画面更有速度。' },
  { id: 'layers', text: '层叠式构图：用雾、光或色温把画面分成清晰的前中后景。' },
  { id: 'close-and-context', text: '特写加环境：主体占大面积，画面边缘只露出环境线索。' },
  { id: 'window-frame', text: '窗框式构图：门、窗或洞口把主体框在中央，外面保留第二层故事。' },
  { id: 'top-down', text: '平面俯视构图：弱化透视，用形状、影子与色块组织画面。' },
];

export const COMPOSITION_RULES = {
  'triangle-group': { minGroup: 3 },
  'window-frame': { scenes: ['room', 'cafe', 'school', 'ruins', 'cave'] },
  'frame-foreground': { scenes: ['forest', 'garden', 'ruins', 'cave', 'city', 'school'] },
  's-curve': { scenes: ['river', 'lake', 'seaside', 'desert', 'forest', 'city', 'snow-mountain', 'grassland'] },
  'negative-space': { scenes: ['sky', 'space', 'desert', 'snow-mountain', 'seaside', 'grassland'] },
  'low-wide': { scenes: ['city', 'desert', 'grassland', 'seaside', 'snow-mountain'] },
  'close-and-context': { minGroup: 1 },
};

export const VIEWPOINT_RULES = {
  macro: { maxGroup: 1 },
  'over-shoulder': { minGroup: 2 },
  'extreme-wide': { scenes: ['sky', 'space', 'desert', 'snow-mountain', 'seaside', 'grassland', 'mountain'] },
  'first-person': { maxGroup: 2 },
};

export const INSPIRATION_VIEWPOINTS = [
  { id: 'eye-level', text: '平视视角：镜头与宝可梦视线同高，观众像蹲在它面前。', moodTags: ['calm', 'natural', 'cozy'], visualTags: ['soft', 'natural'] },
  { id: 'low-angle', text: '低角度仰视：放大主体存在感，背景建筑或树木向上收束。', moodTags: ['majestic', 'dramatic'], visualTags: ['low-angle', 'scale', 'contrast'] },
  { id: 'high-angle', text: '高机位俯视：强调地面布局、影子方向与主体的小小尺度。', moodTags: ['playful', 'quiet'], visualTags: ['top-down', 'graphic'] },
  { id: 'over-shoulder', text: '过肩视角：从伙伴背后看向远方，画面里保留一小块前景。', moodTags: ['adventurous', 'intimate'], visualTags: ['depth', 'framing'] },
  { id: 'wide-close', text: '广角贴近：前景被夸张放大，动作向镜头延伸。', moodTags: ['energetic', 'dynamic'], visualTags: ['motion', 'wide'] },
  { id: 'extreme-wide', text: '极远景：宝可梦只是环境中的一个色点，靠光线和构图寻找它。', moodTags: ['lonely', 'majestic', 'silent'], visualTags: ['negative-space', 'wide'] },
  { id: 'profile', text: '侧面轮廓视角：强调动作剪影，让四肢与尾巴的线条一目了然。', moodTags: ['cool', 'sharp'], visualTags: ['silhouette', 'profile'] },
  { id: 'first-person', text: '第一人称视角：画面下方出现伸出的手或爪，观众成为场景的一部分。', moodTags: ['playful', 'intimate'], visualTags: ['immersive', 'depth'] },
  { id: 'oblique-high', text: '斜俯视：像从树梢或楼顶观察，地面形成倾斜的舞台。', moodTags: ['mysterious', 'playful'], visualTags: ['diagonal', 'top-down'] },
  { id: 'macro', text: '微距特写：只画眼睛、爪尖或一小撮毛发，让纹理成为主角。', moodTags: ['intimate', 'gentle'], visualTags: ['close', 'textured'] },
];

export const INSPIRATION_LIGHTING = [
  { id: 'rim-gold', text: '侧逆光在毛发边缘勾出一圈暖金色轮廓光，面部保留柔和暗部。', times: ['dusk', 'afternoon'], weathers: ['sunny', 'rainbow'], types: ['fire', 'electric'] },
  { id: 'moon-blue', text: '月光从高处落下，地面只保留冷蓝色反光，局部光源保持克制。', times: ['night', 'midnight'], weathers: ['starry'], types: ['ghost', 'psychic', 'water'] },
  { id: 'fog-ambient', text: '雾把远处压成柔和的灰层，近景只保留轮廓与一小块清晰材质。', weathers: ['fog'], types: ['ghost', 'water', 'normal'] },
  { id: 'night-ambient', text: '夜色把环境光压到很低，只有近处材质保留微弱反光，远景交给模糊轮廓。', times: ['night', 'midnight'], types: ['normal', 'grass', 'ground', 'dark'] },
  { id: 'overcast-soft', text: '阴天柔光让阴影边缘变得松散，颜色偏低饱和，细节靠形体表达。', times: ['morning', 'noon', 'afternoon'], weathers: ['cloudy', 'fog', 'light-rain', 'rain', 'windy'], types: ['normal', 'grass'] },
  { id: 'storm-white', text: '雷雨间歇的冷白闪光把背景瞬间压暗，主体边缘出现一瞬高反差。', weathers: ['thunderstorm', 'storm', 'heavy-rain'], types: ['electric', 'flying'] },
  { id: 'day-clear', text: '侧光清楚但不刺眼，影子有明确方向，空气保持通透。', times: ['morning', 'noon', 'afternoon'], weathers: ['sunny', 'cloudy', 'windy', 'rainbow'], types: ['normal', 'grass', 'flying'] },
  { id: 'dawn-mist', text: '清晨薄雾中的低对比逆光，远处轮廓逐渐消失，近处保留细小露珠。', times: ['dawn'], weathers: ['fog', 'light-rain', 'sunny', 'cloudy', 'windy', 'starry', 'rainbow'], types: ['ice', 'water', 'fairy'] },
  { id: 'noon-hard', text: '正午硬光制造短而清晰的影子，高光集中，颜色饱和。', times: ['noon'], weathers: ['sunny'], types: ['ground', 'fire', 'rock'] },
  { id: 'dusk-side', text: '黄昏暖光从侧面铺开，长影指向画面外，空气里有一点金色颗粒。', times: ['dusk'], weathers: ['sunny', 'cloudy', 'windy', 'starry'], types: ['fire', 'normal', 'fairy'] },
  { id: 'snow-bounce', text: '雪地反射成为大面积冷色补光，阴影偏蓝，主体只有局部暖色。', weathers: ['snow', 'blizzard'], types: ['ice', 'steel'] },
  { id: 'neon-duo', text: '霓虹灯提供品红与青色的双色光，轮廓光与反射让画面像电影镜头。', times: ['night', 'midnight'], scenes: ['city', 'amusement-park'], types: ['electric', 'dark', 'poison'] },
  { id: 'fire-glow', text: '火光从下方照亮面部，背景沉入黑暗，眼睛与高光成为视觉中心。', times: ['night', 'midnight'], scenes: ['volcano', 'desert', 'cave'], types: ['fire', 'dragon'] },
  { id: 'god-rays', text: '丁达尔光束穿过树叶或云层，空气中悬浮微粒被照亮。', weathers: ['fog', 'cloudy', 'sunny'], scenes: ['forest', 'sky', 'underwater'], types: ['grass', 'flying', 'psychic'] },
  { id: 'water-caustics', text: '水面反射把流动的波纹光斑投到主体身上，边缘随水波轻轻变形。', scenes: ['lake', 'river', 'underwater', 'seaside'], types: ['water', 'ice'] },
];

export const INSPIRATION_PALETTES = [
  { id: 'after-rain', name: '雨后霓虹', description: '深蓝湿地面、青色反光与一点黄色灯光。', colors: ['#132A3A', '#2E6F95', '#7BD3D9', '#F4D35E', '#E76F51'], types: ['water', 'electric'], scenes: ['city', 'seaside', 'beach', 'island', 'school', 'lake', 'river', 'waterfall'], moods: ['reflective', 'quiet'] },
  { id: 'forest-moss', name: '森林苔藓', description: '苔藓绿、腐叶棕与奶油色的自然层次。', colors: ['#1F3A2E', '#4C6B4F', '#8DAA7A', '#D8C99B', '#F2E8D5'], types: ['grass', 'bug'], scenes: ['forest', 'garden', 'countryside', 'grassland'], moods: ['cozy', 'gentle'] },
  { id: 'volcano-ember', name: '火山余烬', description: '暗岩、铁锈红和近乎发白的火星色。', colors: ['#211A1A', '#5B2A28', '#B44A32', '#F08A4B', '#F7D08A'], types: ['fire', 'rock', 'dragon'], scenes: ['volcano', 'desert'], moods: ['intense', 'dramatic'] },
  { id: 'snow-haze', name: '雪原薄雾', description: '冷灰蓝向雾白过渡，只保留少量深色重量。', colors: ['#DCE7EC', '#A9C2CF', '#7396A8', '#4A6575', '#2C3947'], types: ['ice', 'flying'], scenes: ['snow-mountain', 'mountain', 'sky', 'cold-island', 'grassland'], moods: ['silent', 'quiet'] },
  { id: 'deep-glow', name: '深海流光', description: '墨蓝深处、青绿光柱与极少量荧光。', colors: ['#061A2B', '#0B3C5D', '#2A7F9E', '#65C6C4', '#E9F5DB'], types: ['water', 'psychic', 'dragon'], scenes: ['underwater', 'lake', 'river', 'waterfall', 'space', 'island', 'tropical-island', 'beach', 'seaside', 'cold-island'], moods: ['mysterious', 'dreamy'] },
  { id: 'dusk-candy', name: '黄昏糖果', description: '紫罗兰、珊瑚粉和奶油黄的柔和碰撞。', colors: ['#3B2C52', '#7A4E7E', '#D66BA0', '#F4A261', '#F7E3AF'], types: ['fairy', 'fire'], scenes: ['amusement-park', 'garden', 'sky', 'tropical-island', 'beach', 'island', 'cafe'], moods: ['warm', 'dreamy'] },
  { id: 'old-paper', name: '旧书尘埃', description: '老纸、深棕墨迹和被时间晒褪的暖灰。', colors: ['#2E2A26', '#5C4B3B', '#8C7358', '#C0A986', '#E7DCC8'], types: ['ghost', 'dark'], scenes: ['room', 'ruins', 'cave'], moods: ['quiet', 'nostalgic'] },
  { id: 'moon-ghost', name: '月下幽灵', description: '接近黑色的蓝紫、灰紫与一点冷白高光。', colors: ['#10141F', '#2A3352', '#5A5F91', '#9B8AC4', '#E4DFF5'], types: ['ghost', 'psychic'], scenes: ['ruins', 'forest', 'space', 'sky', 'snow-mountain', 'underwater'], moods: ['eerie', 'mysterious'] },
  { id: 'desert-sun', name: '沙丘落日', description: '赭石、焦糖与落日金，阴影偏紫。', colors: ['#3A2A20', '#8C5A3C', '#C98C56', '#E8B86D', '#F5E1B8'], types: ['ground', 'rock'], scenes: ['desert', 'mountain', 'volcano'], moods: ['lonely', 'warm'] },
  { id: 'sakura-cream', name: '樱花奶油', description: '浅粉、灰粉与奶油白，适合柔软日常。', colors: ['#F7E8E8', '#F2C4CE', '#D98BA4', '#9C6B7D', '#5E4A56'], types: ['fairy', 'grass'], scenes: ['garden', 'countryside'], moods: ['gentle', 'cozy'] },
  { id: 'cyber-lemon', name: '赛博柠檬', description: '深青黑底上叠加荧光黄、薄荷绿和警报红。', colors: ['#101820', '#2A4D4F', '#61C9A8', '#F2E863', '#F25C54'], types: ['electric', 'steel'], scenes: ['city'], moods: ['playful', 'tense'] },
  { id: 'coffee-cream', name: '奶油咖啡', description: '咖啡棕、焦糖和牛奶色，温暖又安静。', colors: ['#2C211B', '#6F4E37', '#A67C52', '#D9B382', '#F4E9DA'], types: ['normal', 'fire'], scenes: ['cafe', 'room', 'countryside', 'school'], moods: ['cozy', 'nostalgic'] },
];

export const INSPIRATION_MOODS = [
  { id: 'quiet', text: '安静、略带孤独，像散场后的空房间。', tags: ['quiet', 'lonely'] },
  { id: 'cozy', text: '温暖、治愈，让观众想走进画面坐一会儿。', tags: ['cozy', 'warm'] },
  { id: 'mysterious', text: '神秘、未知，远处的深处似乎还有没说完的故事。', tags: ['mysterious', 'eerie'] },
  { id: 'playful', text: '轻快、俏皮，画面里有一个让人会心一笑的小失误。', tags: ['playful', 'humorous'] },
  { id: 'epic', text: '史诗、庄重，用尺度差和静谧感制造敬畏。', tags: ['heroic', 'dramatic'] },
  { id: 'nostalgic', text: '怀旧、柔软，像一张被翻过很多次的旧照片。', tags: ['nostalgic', 'quiet'] },
  { id: 'tense', text: '紧张、速度感，画面像一段即将发生什么的停顿。', tags: ['tense', 'intense'] },
  { id: 'dreamy', text: '梦幻、失重，边缘可以轻微溶进背景。', tags: ['dreamy', 'magical'] },
  { id: 'humorous', text: '淘气、幽默，用夸张的比例或表情打破严肃。', tags: ['humorous', 'playful'] },
  { id: 'gentle', text: '温柔、日常，情绪不外放，藏在小小动作里。', tags: ['gentle', 'cozy'] },
  { id: 'eerie', text: '压抑、悬疑，保留大片暗部和不明确的声源。', tags: ['eerie', 'mysterious'] },
  { id: 'free', text: '自由、辽阔，让风与距离成为画面的主角。', tags: ['free', 'hopeful'] },
];

export const INSPIRATION_MATERIALS = [
  { id: 'watercolor-pencil', text: '水彩纸颗粒打底，彩铅补充毛发和边缘细节。' },
  { id: 'acrylic-thick', text: '厚涂丙烯与硬边高光，保留明显笔触和堆叠厚度。' },
  { id: 'cel-shade', text: '数码赛璐璐平涂，加少量纸张纹理避免过于干净。' },
  { id: 'pencil-wash', text: '铅笔线稿与局部淡彩，未上色区域保留纸白。' },
  { id: 'pastel-crayon', text: '粉彩和蜡笔混用，边缘故意粗糙，颜色轻轻叠压。' },
  { id: 'ink-gold', text: '水墨晕染配金箔点缀，大面积留白与极细线条并置。' },
  { id: 'marker-screentone', text: '马克笔平涂加网点纸，适合清晰的图形与高饱和色块。' },
  { id: 'oil-palette', text: '油画厚笔触与刮刀纹理，暗部颜色保持透明层次。' },
  { id: 'vector-grain', text: '矢量平涂加颗粒噪点，边缘干净但整体不显塑料。' },
  { id: 'collage', text: '纸张拼贴、手账胶带与撕边，让画面像一页私人记录。' },
  { id: 'gouache', text: '半透明水粉叠加彩色铅笔，颜色柔和但有覆盖力。' },
  { id: 'ink-spot', text: '浓墨勾线、留白与单色高光，靠线条疏密表现体积。' },
];

export const INSPIRATION_CHALLENGES = [
  { id: 'b-three-colors', level: 1, text: '只用三种颜色完成整张画，其中一种必须作为高光。' },
  { id: 'b-no-black', level: 1, text: '不要使用纯黑，用深棕、深蓝或深绿代替所有阴影。' },
  { id: 'b-thirty-min', level: 1, text: '30 分钟内完成主要色块，不追求细节，把时间留给构图。' },
  { id: 'b-negative-space', level: 1, text: '画面中必须保留一处明显的留白，且不能是纯白。' },
  { id: 'b-one-moment', level: 1, text: '只画一个动作瞬间，不添加对白或装饰性边框。' },
  { id: 'i-two-lights', level: 2, text: '让画面出现两个光源，并明确主光与辅光的方向。' },
  { id: 'i-bounce-color', level: 2, text: '让环境色影响宝可梦的固有色，至少在三处体现反射光。' },
  { id: 'i-one-shape', level: 2, text: '只使用一种形状语言（圆形、三角形或方形）设计主要构图。' },
  { id: 'i-partial-body', level: 2, text: '不画完整身体，只通过局部、影子和环境暗示主体。' },
  { id: 'i-story-object', level: 2, text: '加入一个与主体无关但能讲故事的小物件。' },
  { id: 'c-five-colors', level: 3, text: '用五种颜色完成画面，其中两种只能占 10% 以下面积。' },
  { id: 'c-no-horizon', level: 3, text: '画面中不出现地平线，但观众仍要能感知空间深度。' },
  { id: 'c-rim-only', level: 3, text: '逆光让主体大部分处于阴影，只保留边缘光与少量反射。' },
  { id: 'c-three-depths', level: 3, text: '必须清楚画出前、中、后三层空间，并让每层拥有独立的光源。' },
  { id: 'c-no-sun', level: 3, text: '只用冷暖对比表现时间变化，不画太阳、月亮或时钟。' },
  { id: 'c-two-moments', level: 3, text: '让同一只宝可梦出现两次，但表达两个不同的时间状态。' },
];

const KEYWORD_TAGS = [
  { words: ['海', '水', '雨', '湖', '河', '浪', '潜', '潮', '沙'], types: ['water'], scenes: ['seaside', 'beach', 'lake', 'river', 'underwater', 'waterfall'], moods: ['free'] },
  { words: ['火', '炎', '熔', '热', '火山', '烬'], types: ['fire'], scenes: ['volcano'], moods: ['intense'] },
  { words: ['森林', '树', '草', '花', '花园', '绿'], types: ['grass'], scenes: ['forest', 'garden', 'grassland'], moods: ['cozy'] },
  { words: ['雪', '冰', '冬', '霜', '寒'], types: ['ice'], scenes: ['snow-mountain'], moods: ['silent'] },
  { words: ['城市', '街', '霓虹', '屋', '店', '灯'], types: ['electric'], scenes: ['city', 'cafe', 'room'], moods: ['quiet'] },
  { words: ['夜', '月', '星', '深夜', '黑暗'], types: ['dark'], scenes: ['sky', 'space'], times: ['night', 'midnight'], moods: ['mysterious'] },
  { words: ['幽灵', '废', '遗', '旧', '墓'], types: ['ghost'], scenes: ['ruins'], moods: ['eerie'] },
  { words: ['云', '天空', '飞', '风', '鸟'], types: ['flying'], scenes: ['sky', 'mountain'], moods: ['free'] },
  { words: ['宇宙', '太空', '星球', '银河'], types: ['psychic'], scenes: ['space'], times: ['night'], moods: ['dreamy'] },
  { words: ['龙', '鳞', '翼'], types: ['dragon'], scenes: ['mountain', 'sky'], moods: ['epic'] },
  { words: ['可爱', '甜', '软', '梦', '童话'], types: ['fairy'], scenes: ['garden'], moods: ['dreamy', 'gentle'] },
];

export function getInspirationMode(id) {
  return INSPIRATION_MODES.find((mode) => mode.id === id) || INSPIRATION_MODES[0];
}

export function getInspirationDifficulty(id) {
  return INSPIRATION_DIFFICULTIES.find((difficulty) => difficulty.id === id)
    || INSPIRATION_DIFFICULTIES[1];
}

export function inferCustomTags(seed) {
  const text = String(seed || '').toLowerCase();
  const types = new Set();
  const scenes = new Set();
  const times = new Set();
  const moods = new Set();
  for (const group of KEYWORD_TAGS) {
    if (!group.words.some((word) => text.includes(word))) continue;
    group.types?.forEach((type) => types.add(type));
    group.scenes?.forEach((scene) => scenes.add(scene));
    group.times?.forEach((time) => times.add(time));
    group.moods?.forEach((mood) => moods.add(mood));
  }
  return {
    types: [...types],
    scenes: [...scenes],
    times: [...times],
    moods: [...moods],
  };
}
