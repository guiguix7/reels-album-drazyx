import type { CSSProperties, ReactNode } from 'react'
import styles from './ui.module.css'

export function Panel({
  title,
  hint,
  children,
  actions,
}: {
  title: string
  hint?: string
  children: ReactNode
  actions?: ReactNode
}): JSX.Element {
  return (
    <section className={styles.panel}>
      <header className={styles.panelHead}>
        <div className={styles.panelTitles}>
          <h2 className={styles.panelTitle}>{title}</h2>
          {hint ? <p className={styles.panelHint}>{hint}</p> : null}
        </div>
        {actions ? <div className={styles.panelActions}>{actions}</div> : null}
      </header>
      <div className={styles.panelBody}>{children}</div>
    </section>
  )
}

export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  format?: (value: number) => string
}): JSX.Element {
  return (
    <label className={styles.sliderRow}>
      <span className={styles.rowLabel}>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={styles.range}
      />
      <span className={styles.rowValue}>{format ? format(value) : String(value)}</span>
    </label>
  )
}

export function TextInput({
  label,
  value,
  onChange,
  maxLength = 80,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  maxLength?: number
  placeholder?: string
}): JSX.Element {
  return (
    <label className={styles.fieldRow}>
      <span className={styles.rowLabel}>{label}</span>
      <input
        type="text"
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={styles.input}
      />
    </label>
  )
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}): JSX.Element {
  return (
    <label className={styles.toggleRow}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className={styles.check} />
      <span>{label}</span>
    </label>
  )
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: T; label: string }>
  value: T
  onChange: (value: T) => void
}): JSX.Element {
  return (
    <div className={styles.segmented} role="group">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`${styles.segment} ${value === option.value ? styles.segmentActive : ''}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function Button({
  children,
  onClick,
  variant = 'ghost',
  disabled,
  style,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'ghost' | 'danger'
  disabled?: boolean
  style?: CSSProperties
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={style}
      className={`${styles.button} ${styles[`btn_${variant}`] ?? ''}`}
    >
      {children}
    </button>
  )
}

export function Notice({ tone, children }: { tone: 'info' | 'error' | 'ok'; children: ReactNode }): JSX.Element {
  return <p className={`${styles.notice} ${styles[`notice_${tone}`] ?? ''}`}>{children}</p>
}
