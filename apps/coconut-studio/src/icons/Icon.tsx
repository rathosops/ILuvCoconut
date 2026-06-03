import { type CSSProperties, type ReactNode } from 'react';

const PATHS = {
  chevron: <path d="M9 6l6 6-6 6" />,
  chevronD: <path d="M6 9l6 6 6-6" />,
  folder: <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  file: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /></>,
  image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9.5" r="1.6" /><path d="M21 16l-5-5L5 20" /></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  layers: <><path d="M12 3l9 5-9 5-9-5 9-5z" /><path d="M3 13l9 5 9-5" /></>,
  reels: <><rect x="3" y="4" width="4.5" height="16" rx="1.5" /><rect x="9.75" y="4" width="4.5" height="16" rx="1.5" /><rect x="16.5" y="4" width="4.5" height="16" rx="1.5" /></>,
  table: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M3 14h18M9 4v16" /></>,
  play: <path d="M7 4.5l13 7.5-13 7.5z" fill="currentColor" stroke="none" />,
  stop: <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none" />,
  pause: <><rect x="7" y="5" width="3.5" height="14" rx="1" fill="currentColor" stroke="none" /><rect x="13.5" y="5" width="3.5" height="14" rx="1" fill="currentColor" stroke="none" /></>,
  refresh: <><path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 4v5h-5" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 0 1-4 0v-.1A1.6 1.6 0 0 0 6.6 19l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3 13.4H3a2 2 0 0 1 0-4h.1A1.6 1.6 0 0 0 4.6 7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 10 4.6V4a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 .9 2.5" /></>,
  sliders: <><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" /><circle cx="4" cy="12" r="2" /><circle cx="12" cy="6" r="2" /><circle cx="20" cy="14" r="2" /></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>,
  wand: <><path d="M15 4V2M15 10V8M11 6H9M21 6h-2" /><path d="M3 21l12-12 2 2L5 23z" /></>,
  crop: <><path d="M6 2v14a2 2 0 0 0 2 2h14" /><path d="M2 6h14a2 2 0 0 1 2 2v14" /></>,
  zoomIn: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4M11 8v6M8 11h6" /></>,
  zoomOut: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4M8 11h6" /></>,
  coin: <><circle cx="12" cy="12" r="9" /><path d="M12 7v10M9.5 9.2a2.5 2 0 0 1 2.5-1.2c1.4 0 2.5.8 2.5 1.8s-1.1 1.7-2.5 1.7-2.5.8-2.5 1.8.9 1.7 2.5 1.7a2.5 2 0 0 0 2.5-1.2" /></>,
  music: <><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></>,
  code: <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />,
  paint: <><rect x="2" y="3" width="20" height="9" rx="2" /><path d="M9 12v4a3 3 0 0 0 6 0v-1a2 2 0 0 1 2-2h1" /><circle cx="12" cy="20" r="2" /></>,
  box: <><path d="M21 8l-9-5-9 5v8l9 5 9-5z" /><path d="M3 8l9 5 9-5M12 13v8" /></>,
  link: <><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></>,
  download: <><path d="M12 3v12M7 10l5 5 5-5" /><path d="M5 21h14" /></>,
  upload: <><path d="M12 21V9M7 14l5-5 5 5" /><path d="M5 3h14" /></>,
  bolt: <path d="M13 2L4 14h7l-1 8 9-12h-7z" />,
  dice: <><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8" cy="8" r="1.2" fill="currentColor" stroke="none" /><circle cx="16" cy="16" r="1.2" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" /></>,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" /></>,
  sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />,
  gauge: <><path d="M12 13l4-4" /><path d="M3 18a9 9 0 1 1 18 0" /><circle cx="12" cy="13" r="1.5" fill="currentColor" stroke="none" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z" /></>,
  save: <><path d="M5 3h11l3 3v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" /><path d="M8 3v5h7M8 21v-6h8v6" /></>,
  check: <path d="M5 12l5 5L20 6" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  move: <><path d="M12 2v20M2 12h20" /><path d="M9 5l3-3 3 3M9 19l3 3 3-3M5 9l-3 3 3 3M19 9l3 3-3 3" /></>,
  dot: <circle cx="12" cy="12" r="3.5" fill="currentColor" stroke="none" />,
  list: <><path d="M8 6h13M8 12h13M8 18h13" /><circle cx="3.5" cy="6" r="1.2" fill="currentColor" stroke="none" /><circle cx="3.5" cy="12" r="1.2" fill="currentColor" stroke="none" /><circle cx="3.5" cy="18" r="1.2" fill="currentColor" stroke="none" /></>,
  cards: <><rect x="3" y="5" width="13" height="16" rx="2" /><path d="M8 5V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2h-1" /></>,
  history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 8v4l3 2" /></>
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof PATHS;

export interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

export function Icon({ name, size = 16, className = '', style }: IconProps): JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className={`ic ${className}`.trim()}
      style={style}
    >
      {PATHS[name]}
    </svg>
  );
}
