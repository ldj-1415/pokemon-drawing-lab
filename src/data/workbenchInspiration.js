export const WORKBENCH_INSPIRATION_DIMENSIONS = [
  { key: 'theme', label: '创作主题', icon: 'bulb' },
  { key: 'story', label: '故事情境', icon: 'bookmark' },
  { key: 'actionInteraction', label: '动作互动', icon: 'activity' },
  { key: 'environment', label: '场景环境', icon: 'map-pin' },
  { key: 'composition', label: '构图', icon: 'grid' },
  { key: 'viewpoint', label: '视角', icon: 'target' },
  { key: 'lighting', label: '光影建议', icon: 'sun' },
  { key: 'challenge', label: '可选绘画挑战', icon: 'zap' },
];

export const WORKBENCH_INSPIRATION_DIMENSION_MAP = Object.fromEntries(
  WORKBENCH_INSPIRATION_DIMENSIONS.map((item) => [item.key, item]),
);

export const WORKBENCH_INSPIRATION_KEYS = WORKBENCH_INSPIRATION_DIMENSIONS.map((item) => item.key);

export const GROUP_THEMES = [
  {
    id: 'wait-out-rain',
    text: '{names}一起等一场雨停',
    types: ['water', 'electric'],
    scenes: ['city', 'cafe', 'forest'],
    moods: ['cozy', 'gentle', 'reflective'],
  },
  {
    id: 'afternoon-plan',
    text: '{names}的午后小计划',
    types: ['normal', 'fairy', 'grass'],
    scenes: ['room', 'cafe', 'garden', 'countryside'],
    moods: ['cozy', 'playful', 'warm'],
  },
  {
    id: 'quiet-dusk',
    text: '属于{names}的安静黄昏',
    types: ['flying', 'psychic', 'fire'],
    scenes: ['mountain', 'seaside', 'lake', 'countryside'],
    moods: ['quiet', 'romantic', 'dramatic'],
  },
  {
    id: 'first-trip',
    text: '{names}第一次一起出远门',
    types: ['dragon', 'flying', 'ground'],
    scenes: ['mountain', 'countryside', 'seaside', 'sky'],
    moods: ['hopeful', 'free', 'adventurous'],
  },
  {
    id: 'same-direction',
    text: '当{names}同时看向同一个方向',
    types: ['psychic', 'flying', 'dark'],
    scenes: ['sky', 'mountain', 'ruins', 'space'],
    moods: ['mysterious', 'majestic', 'silent'],
  },
  {
    id: 'small-secret',
    text: '{names}在旅途中发现的小秘密',
    types: ['grass', 'bug', 'rock', 'ghost'],
    scenes: ['forest', 'cave', 'ruins', 'garden'],
    moods: ['mysterious', 'playful', 'magical'],
  },
  {
    id: 'cooperative-show',
    text: '{names}的合作演出',
    types: ['fairy', 'electric', 'psychic', 'normal'],
    scenes: ['amusement-park', 'city', 'garden'],
    moods: ['playful', 'lively', 'magical'],
  },
  {
    id: 'shared-umbrella',
    text: '{names}挤在同一把伞下',
    types: ['water', 'normal', 'grass'],
    scenes: ['city', 'countryside', 'forest'],
    moods: ['cozy', 'gentle', 'humorous'],
  },
  {
    id: 'midnight-adventure',
    text: '{names}的深夜探险',
    types: ['ghost', 'dark', 'psychic'],
    scenes: ['ruins', 'city', 'cave', 'forest'],
    moods: ['eerie', 'playful', 'mysterious'],
  },
  {
    id: 'exchange-favorite',
    text: '{names}交换了最喜欢的东西',
    types: ['normal', 'fairy', 'grass'],
    scenes: ['room', 'cafe', 'garden', 'countryside'],
    moods: ['cozy', 'warm', 'gentle'],
  },
  {
    id: 'shared-nap',
    text: '{names}分享同一片午睡的阳光',
    types: ['normal', 'grass', 'fairy'],
    scenes: ['garden', 'countryside', 'beach', 'grassland'],
    moods: ['lazy', 'cozy', 'gentle'],
  },
  {
    id: 'unexpected-encounter',
    text: '{names}遇见了一个意料之外的家伙',
    types: ['dark', 'ghost', 'poison', 'electric'],
    scenes: ['forest', 'ruins', 'city', 'cave'],
    moods: ['mysterious', 'playful', 'comic'],
  },
  {
    id: 'snowy-field',
    text: '{names}在雪原上留下的第一串脚印',
    types: ['ice', 'normal', 'flying'],
    scenes: ['grassland', 'snow-mountain', 'countryside'],
    times: ['morning', 'noon'],
    weathers: ['snow', 'blizzard', 'cloudy'],
    moods: ['quiet', 'hopeful', 'cozy'],
  },];

export const INTERACTION_IDEAS = [
  {
    id: 'solo-small-game',
    minCount: 1,
    maxCount: 1,
    text: '把注意力放在一个小物件上，像在和自己玩一个只有它懂的游戏。',
    tags: ['quiet', 'playful', 'cute'],
  },
  {
    id: 'solo-window',
    minCount: 1,
    maxCount: 1,
    text: '独自待在画面里，视线越过前景看向画外，保留一点没有说出口的心事。',
    tags: ['quiet', 'mysterious', 'gentle'],
  },
  {
    id: 'solo-own-tail',
    minCount: 1,
    maxCount: 1,
    text: '发现自己的尾巴或影子，认真地盯着它，像在确认它会不会先动。',
    tags: ['playful', 'derpy', 'comic'],
  },
  {
    id: 'pair-mirror',
    minCount: 2,
    maxCount: 2,
    text: '一只先行动，另一只跟着模仿；动作之间留一个短暂的眼神交换。',
    tags: ['playful', 'cozy', 'cute'],
  },
  {
    id: 'pair-shoulder',
    minCount: 2,
    maxCount: 2,
    text: '并肩看向同一个方向，最靠近的肩膀、尾巴或翼尖轻轻碰在一起。',
    tags: ['quiet', 'romantic', 'gentle'],
  },
  {
    id: 'pair-share-food',
    minCount: 2,
    maxCount: 2,
    text: '分享同一份食物，一只负责递，一只负责接；中间留出一小段犹豫。',
    tags: ['cozy', 'warm', 'share-food'],
  },
  {
    id: 'pair-rescue',
    minCount: 2,
    maxCount: 2,
    text: '一只踮脚去够高处的东西，另一只在下面稳住重心，形成清楚的互助关系。',
    tags: ['cooperate', 'hopeful', 'playful'],
  },
  {
    id: 'pair-argument',
    minCount: 2,
    maxCount: 2,
    text: '背对背闹别扭，但尾巴和耳朵仍然朝向对方，暴露了其实没有真的生气。',
    tags: ['comic', 'playful', 'quarrel'],
  },
  {
    id: 'group-circle',
    minCount: 3,
    maxCount: 99,
    text: '围成一个松散的弧形，所有视线落到画面中心的小物件上，形成共同目标。',
    tags: ['cooperate', 'cozy', 'group'],
  },
  {
    id: 'group-relay',
    minCount: 3,
    maxCount: 99,
    text: '一前一后穿过场景，动作连成一条接力线；每只宝可梦负责其中一个节拍。',
    tags: ['chase', 'energetic', 'group'],
  },
  {
    id: 'group-each',
    minCount: 3,
    maxCount: 99,
    text: '各自做着自己的小事，但用朝向、距离和重复的动作暗示它们在同一段时光里。',
    tags: ['quiet', 'cozy', 'group'],
  },
  {
    id: 'group-mischief',
    minCount: 3,
    maxCount: 99,
    text: '围绕同一个恶作剧分工：一只放哨，一只行动，最小的那只负责收尾。',
    tags: ['comic', 'playful', 'group'],
  },
  {
    id: 'group-comfort',
    minCount: 3,
    maxCount: 99,
    text: '把最小的成员围在中间，其他宝可梦用身体形成一圈柔软的遮挡。',
    tags: ['care', 'cozy', 'group'],
  },
  {
    id: 'group-observe',
    minCount: 3,
    maxCount: 99,
    text: '保持一点距离观察同一个东西，谁都没有先动，安静里带一点共同的紧张。',
    tags: ['observe', 'mysterious', 'group'],
  },
];

export const WORKBENCH_COMPOSITION_GROUP_HINTS = {
  solo: ['close-up', 'rule-thirds', 'negative-space'],
  group: ['triangle-group', 'layers', 'frame', 'leading-lines'],
};

export const STORY_IDEAS = [
  {
    id: 'small-discovery',
    minCount: 1,
    maxCount: 99,
    text: '原本只是一次普通的{action}，却因为{names}同时注意到同一个细节，变成了一段被记住的时光。',
    tags: ['quiet', 'warm', 'curious'],
  },
  {
    id: 'quiet-after-rain',
    minCount: 1,
    maxCount: 99,
    text: '{names}在{environment}里等待事情慢慢发生，谁都没有催促谁，只有光线一点点移动。',
    tags: ['quiet', 'gentle', 'reflective'],
  },
  {
    id: 'tiny-misunderstanding',
    minCount: 2,
    maxCount: 99,
    text: '一开始像是一个小小的误会，后来才发现大家都在为同一件事努力；{names}在{environment}里完成了默契。',
    tags: ['playful', 'warm', 'group'],
  },
  {
    id: 'shared-task',
    minCount: 2,
    maxCount: 99,
    text: '{names}临时决定一起完成一件小事。{action}只是开始，真正留在画面里的是彼此配合的节奏。',
    tags: ['cooperate', 'warm', 'group'],
  },
  {
    id: 'unexpected-guest',
    minCount: 1,
    maxCount: 99,
    text: '原本安静的{environment}里出现了一个意料之外的来客，{names}停下手里的动作，先交换了一个眼神。',
    tags: ['mysterious', 'curious', 'playful'],
  },
  {
    id: 'last-light',
    minCount: 1,
    maxCount: 99,
    text: '光线快要消失的时候，{names}终于找到了那个一直在找的东西；画面停在“要不要伸手”的一瞬间。',
    tags: ['hopeful', 'quiet', 'dramatic'],
  },
  {
    id: 'day-off',
    minCount: 1,
    maxCount: 99,
    text: '这是一段没有计划的空档。{names}在{environment}里做着自己的事，却在同一个节拍上停下来休息。',
    tags: ['cozy', 'lazy', 'gentle'],
  },
  {
    id: 'group-adventure',
    minCount: 2,
    maxCount: 99,
    text: '{names}决定把今天当成一次小冒险。路线并不重要，重要的是每只宝可梦都带着自己的小心思出发。',
    tags: ['adventurous', 'hopeful', 'group'],
  },
  {
    id: 'shared-silence',
    minCount: 2,
    maxCount: 99,
    text: '没有人先开口。{names}只是并肩待在{environment}里，让沉默替他们说完剩下的话。',
    tags: ['quiet', 'romantic', 'gentle'],
  },
  {
    id: 'comic-delay',
    minCount: 1,
    maxCount: 99,
    text: '事情本来应该很顺利，但总有一个环节慢半拍；{names}认真地处理着这个小事故，越认真越显得好笑。',
    tags: ['comic', 'playful', 'quirky'],
  },
];

export const WORKBENCH_INSPIRATION_HINT = '同一份灵感内，单项重抽会校正未锁定的冲突维度；锁定内容始终保留，单独重抽宝可梦不会自动改写整套灵感。';
