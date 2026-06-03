import { type CSSProperties } from 'react';

const COCO_ICON = '/brand/coquinho-icon-256.png';
const DEFAULT_MASCOT = 28;
const DEFAULT_LOGO = 26;

export interface MascotProps {
  size?: number;
  ring?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function Mascot({ size = DEFAULT_MASCOT, ring = false, className = '', style }: MascotProps): JSX.Element {
  return (
    <span className={`mascot ${ring ? 'ring' : ''} ${className}`.trim()} style={{ width: size, height: size, ...style }}>
      <img src={COCO_ICON} alt="ILuvCoconut" draggable={false} />
    </span>
  );
}

export interface LogoProps {
  size?: number;
  sub?: string;
}

export function Logo({ size = DEFAULT_LOGO, sub }: LogoProps): JSX.Element {
  return (
    <div className="logo">
      <Mascot size={size} />
      <div>
        <div className="logo-title">
          ILuvCoconut <span className="accent">Studio</span>
        </div>
        {sub !== undefined && <div className="logo-sub">{sub}</div>}
      </div>
    </div>
  );
}
