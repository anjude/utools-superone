/**
 * 图标工具函数
 * 支持 ColorUI 和 iconfont 图标
 */

// 图标类型定义
export type IconType = 'cuIcon' | 'iconfont';

// 图标前缀映射
const ICON_PREFIX_MAP: Record<string, IconType> = {
  'cuIcon-': 'cuIcon',
  'icon-': 'iconfont'
};

// 图标配置接口
export interface IconConfig {
  type: IconType;
  name: string;
  className?: string;
}

/**
 * 获取图标类名（自动处理多个类的情况）
 * @param iconName 图标名称（支持完整类名或简化名称）
 * @returns 拼接好的图标类名字符串
 */
export function getIconClass(iconName: string): string {
  // 如果已经包含前缀，直接返回
  for (const prefix of Object.keys(ICON_PREFIX_MAP)) {
    if (iconName.startsWith(prefix)) {
      return iconName.startsWith('icon-') ? `iconfont ${iconName}` : iconName;
    }
  }

  // 根据图标名称判断类型
  const iconType = getIconType(iconName);
  
  switch (iconType) {
    case 'cuIcon':
      return `cuIcon-${iconName}`;
    case 'iconfont':
      return `iconfont icon-${iconName}`;
    default:
      // 默认使用 ColorUI 图标
      return `cuIcon-${iconName}`;
  }
}

/**
 * 判断图标类型
 * @param iconName 图标名称（支持完整类名或简化名称）
 * @returns 图标类型
 */
export function getIconType(iconName: string): IconType {
  // 如果已经包含前缀，根据前缀映射判断类型
  for (const [prefix, type] of Object.entries(ICON_PREFIX_MAP)) {
    if (iconName.startsWith(prefix)) {
      return type;
    }
  }

  // 如果没有前缀，根据图标名称判断类型
  // ColorUI 图标列表（常用图标）
  const cuIcons = [
    'appreciate', 'check', 'close', 'edit', 'emoji', 'favorfill', 'favor',
    'loading', 'locationfill', 'location', 'phone', 'roundcheckfill', 'roundcheck',
    'roundclosefill', 'roundclose', 'roundrightfill', 'roundright', 'search',
    'taxi', 'timefill', 'time', 'unfold', 'warnfill', 'warn', 'camerafill',
    'camera', 'commentfill', 'comment', 'likefill', 'like', 'notificationfill',
    'notification', 'order', 'samefill', 'same', 'deliver', 'evaluate', 'pay',
    'send', 'shop', 'ticket', 'back', 'cascades', 'discover', 'list', 'more',
    'scan', 'settings', 'questionfill', 'question', 'shopfill', 'form', 'pic',
    'filter', 'footprint', 'top', 'pulldown', 'pullup', 'right', 'refresh',
    'moreandroid', 'deletefill', 'refund', 'cart', 'qrcode', 'remind', 'delete',
    'profile', 'home', 'cartfill', 'discoverfill', 'homefill', 'message',
    'addressbook', 'link', 'lock', 'unlock', 'vip', 'weibo', 'activity',
    'friendaddfill', 'friendadd', 'friendfamous', 'friend', 'goods', 'selection',
    'explore', 'present', 'squarecheckfill', 'square', 'squarecheck', 'round',
    'roundaddfill', 'roundadd', 'add', 'notificationforbidfill', 'explorefill',
    'fold', 'game', 'redpacket', 'selectionfill', 'similar', 'appreciatefill',
    'infofill', 'info', 'forwardfill', 'forward', 'rechargefill', 'recharge',
    'vipcard', 'voice', 'voicefill', 'friendfavor', 'wifi', 'share', 'wefill',
    'we', 'lightauto', 'lightforbid', 'lightfill', 'camerarotate', 'light',
    'barcode', 'flashlightclose', 'flashlightopen', 'searchlist', 'service',
    'sort', 'down', 'mobile', 'mobilefill', 'copy', 'countdownfill', 'countdown',
    'noticefill', 'notice', 'upstagefill', 'upstage', 'babyfill', 'baby',
    'brandfill', 'brand', 'choicenessfill', 'choiceness', 'clothesfill', 'clothes',
    'creativefill', 'creative', 'female', 'keyboard', 'male', 'newfill', 'new',
    'pullleft', 'pullright', 'rankfill', 'rank', 'bad', 'cameraadd', 'focus',
    'friendfill', 'cameraaddfill', 'apps', 'paintfill', 'paint', 'picfill',
    'refresharrow', 'colorlens', 'markfill', 'mark', 'presentfill', 'repeal',
    'album', 'peoplefill', 'people', 'servicefill', 'repair', 'file', 'repairfill',
    'taoxiaopu', 'weixin', 'attentionfill', 'attention', 'commandfill', 'command',
    'communityfill', 'community', 'read', 'calendar', 'cut', 'magic', 'backwardfill',
    'playfill', 'stop', 'tagfill', 'tag', 'group', 'all', 'backdelete', 'hotfill',
    'hot', 'post', 'radiobox', 'rounddown', 'upload', 'writefill', 'write',
    'radioboxfill', 'punch', 'shake', 'move', 'safe', 'activityfill', 'crownfill',
    'crown', 'goodsfill', 'messagefill', 'profilefill', 'sound', 'sponsorfill',
    'sponsor', 'upblock', 'weblock', 'weunblock', 'my', 'myfill', 'emojifill',
    'emojiflashfill', 'flashbuyfill', 'text', 'goodsfavor', 'musicfill',
    'musicforbidfill', 'card', 'triangledownfill', 'triangleupfill',
    'roundleftfill-copy', 'font', 'title', 'recordfill', 'record', 'cardboardfill',
    'cardboard', 'formfill', 'coin', 'cardboardforbid', 'circlefill', 'circle',
    'attentionforbid', 'attentionforbidfill', 'attentionfavorfill', 'attentionfavor',
    'titles', 'icloading', 'full', 'mail', 'peoplelist', 'goodsnewfill', 'goodsnew',
    'medalfill', 'medal', 'newsfill', 'newshotfill', 'newshot', 'news', 'videofill',
    'video', 'exit', 'skinfill', 'skin', 'moneybagfill', 'usefullfill', 'usefull',
    'moneybag', 'redpacket_fill', 'subscription', 'loading1', 'github', 'global',
    'settingsfill', 'back_android', 'expressman', 'evaluate_fill', 'group_fill',
    'play_forward_fill', 'deliver_fill', 'notice_forbid_fill', 'fork', 'pick',
    'wenzi', 'ellipse', 'qr_code', 'dianhua', 'cuIcon', 'loading2', 'btn'
  ];

  // iconfont 图标列表（项目自定义图标）
  const iconfontIcons = [
    'task', 'accountbook', 'a-1-Increase', 'reset', 'tansuodianjihou01',
    'Homehomepagemenu', 'igw-f-flow', 'Checklist', 'fabu_mian24', 'up-circle',
    'add-circle', 'chat-2-line', 'more-line', 'qr-code-line', 'share-box-fill',
    'thumb-up-line', 'thumb-up-fill', 'thumb-down-fill', 'thumb-down-line',
    'more-fill', 'indent-increase', 'pencil-fill'
  ];

  // 检查是否在 ColorUI 图标列表中
  if (cuIcons.includes(iconName)) {
    return 'cuIcon';
  }

  // 检查是否在 iconfont 图标列表中
  if (iconfontIcons.includes(iconName)) {
    return 'iconfont';
  }

  // 默认返回 ColorUI 类型
  return 'cuIcon';
}

/**
 * 获取图标配置
 * @param iconName 图标名称
 * @param additionalClasses 额外的 CSS 类名
 * @returns 图标配置对象
 */
export function getIconConfig(iconName: string, additionalClasses: string = ''): IconConfig {
  const type = getIconType(iconName);
  const className = getIconClass(iconName);
  
  return {
    type,
    name: iconName,
    className: additionalClasses ? `${className} ${additionalClasses}` : className
  };
}

/**
 * 检查图标是否存在
 * @param iconName 图标名称
 * @returns 是否存在
 */
export function isIconExists(iconName: string): boolean {
  const type = getIconType(iconName);
  return type !== null;
}

/**
 * 注册新的图标前缀
 * @param prefix 图标前缀（如 'myIcon-'）
 * @param type 图标类型
 */
export function registerIconPrefix(prefix: string, type: IconType): void {
  ICON_PREFIX_MAP[prefix] = type;
}

/**
 * 获取所有已注册的图标前缀
 * @returns 前缀映射对象
 */
export function getIconPrefixes(): Record<string, IconType> {
  return { ...ICON_PREFIX_MAP };
}

/**
 * 获取所有可用的图标列表
 * @returns 图标列表
 */
export function getAllIcons(): { cuIcon: string[], iconfont: string[] } {
  return {
    cuIcon: [
      'appreciate', 'check', 'close', 'edit', 'emoji', 'favorfill', 'favor',
      'loading', 'locationfill', 'location', 'phone', 'roundcheckfill', 'roundcheck',
      'roundclosefill', 'roundclose', 'roundrightfill', 'roundright', 'search',
      'taxi', 'timefill', 'time', 'unfold', 'warnfill', 'warn', 'camerafill',
      'camera', 'commentfill', 'comment', 'likefill', 'like', 'notificationfill',
      'notification', 'order', 'samefill', 'same', 'deliver', 'evaluate', 'pay',
      'send', 'shop', 'ticket', 'back', 'cascades', 'discover', 'list', 'more',
      'scan', 'settings', 'questionfill', 'question', 'shopfill', 'form', 'pic',
      'filter', 'footprint', 'top', 'pulldown', 'pullup', 'right', 'refresh',
      'moreandroid', 'deletefill', 'refund', 'cart', 'qrcode', 'remind', 'delete',
      'profile', 'home', 'cartfill', 'discoverfill', 'homefill', 'message',
      'addressbook', 'link', 'lock', 'unlock', 'vip', 'weibo', 'activity',
      'friendaddfill', 'friendadd', 'friendfamous', 'friend', 'goods', 'selection',
      'explore', 'present', 'squarecheckfill', 'square', 'squarecheck', 'round',
      'roundaddfill', 'roundadd', 'add', 'notificationforbidfill', 'explorefill',
      'fold', 'game', 'redpacket', 'selectionfill', 'similar', 'appreciatefill',
      'infofill', 'info', 'forwardfill', 'forward', 'rechargefill', 'recharge',
      'vipcard', 'voice', 'voicefill', 'friendfavor', 'wifi', 'share', 'wefill',
      'we', 'lightauto', 'lightforbid', 'lightfill', 'camerarotate', 'light',
      'barcode', 'flashlightclose', 'flashlightopen', 'searchlist', 'service',
      'sort', 'down', 'mobile', 'mobilefill', 'copy', 'countdownfill', 'countdown',
      'noticefill', 'notice', 'upstagefill', 'upstage', 'babyfill', 'baby',
      'brandfill', 'brand', 'choicenessfill', 'choiceness', 'clothesfill', 'clothes',
      'creativefill', 'creative', 'female', 'keyboard', 'male', 'newfill', 'new',
      'pullleft', 'pullright', 'rankfill', 'rank', 'bad', 'cameraadd', 'focus',
      'friendfill', 'cameraaddfill', 'apps', 'paintfill', 'paint', 'picfill',
      'refresharrow', 'colorlens', 'markfill', 'mark', 'presentfill', 'repeal',
      'album', 'peoplefill', 'people', 'servicefill', 'repair', 'file', 'repairfill',
      'taoxiaopu', 'weixin', 'attentionfill', 'attention', 'commandfill', 'command',
      'communityfill', 'community', 'read', 'calendar', 'cut', 'magic', 'backwardfill',
      'playfill', 'stop', 'tagfill', 'tag', 'group', 'all', 'backdelete', 'hotfill',
      'hot', 'post', 'radiobox', 'rounddown', 'upload', 'writefill', 'write',
      'radioboxfill', 'punch', 'shake', 'move', 'safe', 'activityfill', 'crownfill',
      'crown', 'goodsfill', 'messagefill', 'profilefill', 'sound', 'sponsorfill',
      'sponsor', 'upblock', 'weblock', 'weunblock', 'my', 'myfill', 'emojifill',
      'emojiflashfill', 'flashbuyfill', 'text', 'goodsfavor', 'musicfill',
      'musicforbidfill', 'card', 'triangledownfill', 'triangleupfill',
      'roundleftfill-copy', 'font', 'title', 'recordfill', 'record', 'cardboardfill',
      'cardboard', 'formfill', 'coin', 'cardboardforbid', 'circlefill', 'circle',
      'attentionforbid', 'attentionforbidfill', 'attentionfavorfill', 'attentionfavor',
      'titles', 'icloading', 'full', 'mail', 'peoplelist', 'goodsnewfill', 'goodsnew',
      'medalfill', 'medal', 'newsfill', 'newshotfill', 'newshot', 'news', 'videofill',
      'video', 'exit', 'skinfill', 'skin', 'moneybagfill', 'usefullfill', 'usefull',
      'moneybag', 'redpacket_fill', 'subscription', 'loading1', 'github', 'global',
      'settingsfill', 'back_android', 'expressman', 'evaluate_fill', 'group_fill',
      'play_forward_fill', 'deliver_fill', 'notice_forbid_fill', 'fork', 'pick',
      'wenzi', 'ellipse', 'qr_code', 'dianhua', 'cuIcon', 'loading2', 'btn'
    ],
    iconfont: [
      'task', 'accountbook', 'a-1-Increase', 'reset', 'tansuodianjihou01',
      'Homehomepagemenu', 'igw-f-flow', 'Checklist', 'fabu_mian24', 'up-circle',
      'add-circle', 'chat-2-line', 'more-line', 'qr-code-line', 'share-box-fill',
      'thumb-up-line', 'thumb-up-fill', 'thumb-down-fill', 'thumb-down-line',
      'more-fill', 'indent-increase', 'pencil-fill'
    ]
  };
}
