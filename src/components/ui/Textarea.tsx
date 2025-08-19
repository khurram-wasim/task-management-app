import { forwardRef, TextareaHTMLAttributes } from 'react'
import { cn } from '@/utils/classNames'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  resize?: 'none' | 'vertical' | 'horizontal' | 'both'
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    label, 
    error, 
    helperText, 
    resize = 'vertical', 
    className, 
    disabled, 
    ...props 
  }, ref) => {
    const resizeClasses = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize'
    }

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={props.id}
            className={cn(
              'block text-sm font-medium mb-1',
              error ? 'text-red-700' : 'text-gray-700',
              disabled && 'text-gray-400'
            )}
          >
            {label}
          </label>
        )}
        
        <textarea
          ref={ref}
          className={cn(
            'block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 text-gray-900',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            'transition-colors duration-200',
            resizeClasses[resize],
            error 
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
            disabled && 'bg-gray-50 text-gray-500 cursor-not-allowed',
            className
          )}
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? `${props.id}-error` : 
            helperText ? `${props.id}-helper` : undefined
          }
          {...props}
        />

        {error && (
          <p 
            id={`${props.id}-error`}
            className="mt-1 text-sm text-red-600"
            role="alert"
          >
            {error}
          </p>
        )}

        {helperText && !error && (
          <p 
            id={`${props.id}-helper`}
            className="mt-1 text-sm text-gray-500"
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

// Auto-resizing textarea variant
interface AutoResizeTextareaProps extends Omit<TextareaProps, 'resize'> {
  minRows?: number
  maxRows?: number
}

export const AutoResizeTextarea = forwardRef<HTMLTextAreaElement, AutoResizeTextareaProps>(
  ({ minRows = 2, maxRows = 10, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const textarea = e.target
      
      // Reset height to calculate new height
      textarea.style.height = 'auto'
      
      // Calculate number of rows needed
      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight)
      const padding = parseInt(getComputedStyle(textarea).paddingTop) + parseInt(getComputedStyle(textarea).paddingBottom)
      const borderHeight = parseInt(getComputedStyle(textarea).borderTopWidth) + parseInt(getComputedStyle(textarea).borderBottomWidth)
      
      const contentHeight = textarea.scrollHeight - padding - borderHeight
      const rows = Math.max(minRows, Math.min(maxRows, Math.ceil(contentHeight / lineHeight)))
      
      textarea.style.height = `${rows * lineHeight + padding + borderHeight}px`
      
      onChange?.(e)
    }

    return (
      <Textarea
        ref={ref}
        resize="none"
        rows={minRows}
        onChange={handleChange}
        {...props}
      />
    )
  }
)

AutoResizeTextarea.displayName = 'AutoResizeTextarea'