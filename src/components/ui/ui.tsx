import { useId } from 'react'
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
  hint,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  format?: (value: number) => string
  hint?: string
}): JSX.Element {
  const hintId = useId()
  const valueText = format ? format(value) : String(value)
  return (
    <div className={styles.sliderBlock}>
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
          aria-valuetext={valueText}
          aria-describedby={hint ? hintId : undefined}
        />
        <span className={styles.rowValue}>{valueText}</span>
      </label>
      {hint ? (
        <p className={styles.sliderHint} id={hintId}>
          {hint}
        </p>
      ) : null}
    </div>
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

export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (value: T) => void
}): JSX.Element {
  return (
    <label className={styles.fieldRow}>
      <span className={styles.rowLabel}>{label}</span>
      <select className={styles.select} value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}): JSX.Element {
  return (
    <label className={styles.colorRow}>
      <span className={styles.rowLabel}>{label}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={styles.colorInput}
        aria-label={label}
      />
      <span className={styles.colorValue}>{value.toUpperCase()}</span>
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
