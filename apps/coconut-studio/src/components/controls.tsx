import { type ReactNode } from 'react';
import { Icon } from '../icons/Icon';

export interface StepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}

export function Stepper({ value, min = 1, max = 99, onChange }: StepperProps): JSX.Element {
  return (
    <div className="stepper">
      <button type="button" className="btn icon sm" onClick={() => onChange(Math.max(min, value - 1))}><Icon name="minus" size={13} /></button>
      <input className="num" value={value} readOnly />
      <button type="button" className="btn icon sm" onClick={() => onChange(Math.min(max, value + 1))}><Icon name="plus" size={13} /></button>
    </div>
  );
}

export interface SegOption<T extends string> {
  value: T;
  label: ReactNode;
}

export interface SegProps<T extends string> {
  options: Array<SegOption<T>>;
  value: T;
  onChange: (value: T) => void;
  full?: boolean;
}

export function Seg<T extends string>({ options, value, onChange, full = false }: SegProps<T>): JSX.Element {
  return (
    <div className={`seg ${full ? 'full' : ''}`.trim()}>
      {options.map((option) => (
        <button key={option.value} type="button" className={value === option.value ? 'active' : ''} onClick={() => onChange(option.value)}>
          {option.label}
        </button>
      ))}
    </div>
  );
}

export type TagVariant = 'green' | 'gold' | 'navy' | 'husk' | 'muted';

export function Tag({ variant = 'muted', children }: { variant?: TagVariant; children: ReactNode }): JSX.Element {
  return <span className={`tag ${variant}`}>{children}</span>;
}

export function Prop({ label, children }: { label: string; children: ReactNode }): JSX.Element {
  return (
    <div className="prop-row">
      <span className="prop-key">{label}</span>
      <span className="prop-val">{children}</span>
    </div>
  );
}

export function Field({ label, children }: { label: ReactNode; children: ReactNode }): JSX.Element {
  return (
    <div className="field">
      <div className="field-label">{label}</div>
      {children}
    </div>
  );
}
