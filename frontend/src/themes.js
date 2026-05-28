export const THEME = {
  accent:  '#e94560',
  gold:    '#f5a623',
  blue:    '#0984e3',
  blueL:   '#74b9ff',
  green:   '#00b894',
  purple:  '#6c5ce7',

  text:    '#1a1a2e',
  textSub: '#3d4255',
  muted:   '#8892a4',

  card:    '#ffffff',
  border:  '#e4e8f8',
  shadow:  '0 2px 16px rgba(26,26,46,0.08)',
  blur:    'none',
  inset:   'none',

  headerBg:        'linear-gradient(160deg,#1a1a2e 0%,#16213e 100%)',
  navBg:           '#ffffff',
  navBorder:       '#e4e8f8',
  tabActiveBg:     '#1a1a2e',
  tabActiveColor:  '#ffffff',
  tabActiveBd:     'transparent',
  tabInactiveColor:'#8892a4',

  bodyBg:  'linear-gradient(145deg,#edf0ff 0%,#f5f7ff 55%,#fdf6ff 100%)',

  rowOdd:  '#f7f8ff',
  rowBd:   '#edf0f8',
  dPill:   '#1a1a2e',
  dPillTxt:'#ffffff',

  cGrid:   '#edf0f8',
  cTickX:  '#1a1a2e',
  cTickY:  '#8892a4',

  hmC:  ['#eef6ff','#c8e2ff','#74b9ff','#0984e3','#6c5ce7','#e94560'],
  hmLo: '#1a1a2e',
  hmHi: '#ffffff',
  hmTh: 3,

  featBg:  'linear-gradient(148deg,#1a1a2e 0%,#0f3460 100%)',
  featBd:  'rgba(245,166,35,0.25)',
  track:   '#e4e8f8',
  glassBright: '#eef0ff',
}

export function mkCard(T, extra = {}) {
  return {
    background: T.card,
    border:     `1px solid ${T.border}`,
    boxShadow:  T.shadow,
    ...extra,
  }
}
