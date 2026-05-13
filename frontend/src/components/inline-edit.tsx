import React, { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'

type InlineEditProps = {
  value: string
  onChange: (newVal: string) => void
  className?: string
}

export const InlineEdit = ({ value, onChange, className }: InlineEditProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  // keep draft in sync if parent value changes
  useEffect(() => {
    setDraft(value)
  }, [value])

  // focus + select all when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const commit = () => {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== value) onChange(trimmed)
    setIsEditing(false)
  }

  const cancel = () => {
    setDraft(value)
    setIsEditing(false)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commit()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      cancel()
    }
  }

  return isEditing ? (
    <Input
      ref={inputRef}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={onKeyDown}
      className={className}
    />
  ) : (
    <p
      className={`
        ${className ?? ''}
        cursor-text
        hover:bg-muted/20
        px-1 py-0.5
      `}
      onClick={() => setIsEditing(true)}
    >
      {value}
    </p>
  );
};
