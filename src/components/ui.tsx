import { Button as BaseButton } from '@base-ui/react/button'
import { Dialog } from '@base-ui/react/dialog'
import { Field } from '@base-ui/react/field'
import { Select as BaseSelect } from '@base-ui/react/select'
import type { ComponentProps, ReactNode } from 'react'

export type ButtonProps = ComponentProps<typeof BaseButton> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'md' | 'sm'
}

export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  return (
    <BaseButton
      className={['button', `button-${variant}`, size === 'sm' ? 'button-sm' : '', className ?? '']
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  )
}

export type TextFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'password' | 'number'
  placeholder?: string
  autoComplete?: string
  required?: boolean
  autoFocus?: boolean
  min?: number
  hideLabel?: boolean
  className?: string
}

export function TextField({ label, value, onChange, hideLabel, className, ...inputProps }: TextFieldProps) {
  return (
    <Field.Root className={['field', className ?? ''].filter(Boolean).join(' ')}>
      <Field.Label className={hideLabel ? 'visually-hidden' : 'field-label'}>{label}</Field.Label>
      <Field.Control
        className="input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        {...inputProps}
      />
    </Field.Root>
  )
}

export type SelectOption<Value extends string> = {
  value: Value
  label: string
}

export type SelectProps<Value extends string> = {
  label: string
  value: Value | null
  options: SelectOption<Value>[]
  onChange: (value: Value) => void
  placeholder?: string
  hideLabel?: boolean
  disabled?: boolean
  size?: 'md' | 'sm'
  className?: string
}

export function Select<Value extends string>({
  label,
  value,
  options,
  onChange,
  placeholder,
  hideLabel,
  disabled,
  size = 'md',
  className,
}: SelectProps<Value>) {
  return (
    <Field.Root className={['field', className ?? ''].filter(Boolean).join(' ')}>
      <Field.Label
        className={hideLabel ? 'visually-hidden' : 'field-label'}
        nativeLabel={false}
        render={<div />}
      >
        {label}
      </Field.Label>
      <BaseSelect.Root
        items={options}
        value={value}
        disabled={disabled}
        onValueChange={(next) => {
          if (next !== null) onChange(next)
        }}
      >
        <BaseSelect.Trigger
          className={size === 'sm' ? 'select-trigger select-trigger-sm' : 'select-trigger'}
          aria-label={hideLabel ? label : undefined}
        >
          <BaseSelect.Value placeholder={placeholder} />
          <BaseSelect.Icon className="select-icon">
            <ChevronIcon />
          </BaseSelect.Icon>
        </BaseSelect.Trigger>
        <BaseSelect.Portal>
          <BaseSelect.Positioner className="select-positioner" sideOffset={6} alignItemWithTrigger={false}>
            <BaseSelect.Popup className="select-popup">
              <BaseSelect.List className="select-list">
                {options.map((option) => (
                  <BaseSelect.Item key={option.value} value={option.value} className="select-item">
                    <BaseSelect.ItemIndicator className="select-item-indicator">
                      <CheckIcon />
                    </BaseSelect.ItemIndicator>
                    <BaseSelect.ItemText>{option.label}</BaseSelect.ItemText>
                  </BaseSelect.Item>
                ))}
              </BaseSelect.List>
            </BaseSelect.Popup>
          </BaseSelect.Positioner>
        </BaseSelect.Portal>
      </BaseSelect.Root>
    </Field.Root>
  )
}

export type ModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  className?: string
  children: ReactNode
}

export function Modal({ open, onOpenChange, title, description, className, children }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(next) => onOpenChange(next)}>
      <Dialog.Portal>
        <Dialog.Backdrop className="dialog-backdrop" />
        <Dialog.Popup className={['dialog-popup', className ?? ''].filter(Boolean).join(' ')}>
          <Dialog.Title className="dialog-title">{title}</Dialog.Title>
          {description ? <Dialog.Description className="dialog-description">{description}</Dialog.Description> : null}
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export function ErrorText({ error }: { error: string | null | undefined }) {
  if (!error) return null
  return (
    <p className="error-text" role="alert">
      {error}
    </p>
  )
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="empty-state">{children}</p>
}

export function Loading({ label }: { label: string }) {
  return (
    <p className="loading" role="status">
      {label}…
    </p>
  )
}

function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path d="m2.5 6.5 2.5 2.5 4.5-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
