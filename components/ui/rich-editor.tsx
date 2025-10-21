"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Link, 
  Code, 
  Image,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RichEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  readOnly?: boolean
  height?: string
  className?: string
}

export function RichEditor({ 
  content, 
  onChange, 
  placeholder = "Start typing...", 
  readOnly = false,
  height = "200px",
  className
}: RichEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    if (editorRef.current && content !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = content
    }
  }, [content])

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    handleInput()
  }

  const insertLink = () => {
    const url = prompt('Enter URL:')
    if (url) {
      execCommand('createLink', url)
    }
  }

  const insertImage = () => {
    const url = prompt('Enter image URL:')
    if (url) {
      execCommand('insertImage', url)
    }
  }

  const ToolbarButton = ({ 
    onClick, 
    children, 
    isActive = false, 
    disabled = false 
  }: { 
    onClick: () => void
    children: React.ReactNode
    isActive?: boolean
    disabled?: boolean
  }) => (
    <Button
      variant={isActive ? "default" : "ghost"}
      size="sm"
      onClick={onClick}
      disabled={disabled || readOnly}
      className="h-8 w-8 p-0"
    >
      {children}
    </Button>
  )

  const toolbarButtons = [
    {
      command: 'bold',
      icon: Bold,
      label: 'Bold'
    },
    {
      command: 'italic',
      icon: Italic,
      label: 'Italic'
    },
    {
      command: 'underline',
      icon: Underline,
      label: 'Underline'
    },
    {
      command: 'insertUnorderedList',
      icon: List,
      label: 'Bullet List'
    },
    {
      command: 'insertOrderedList',
      icon: ListOrdered,
      label: 'Numbered List'
    },
    {
      command: 'justifyLeft',
      icon: AlignLeft,
      label: 'Align Left'
    },
    {
      command: 'justifyCenter',
      icon: AlignCenter,
      label: 'Align Center'
    },
    {
      command: 'justifyRight',
      icon: AlignRight,
      label: 'Align Right'
    },
    {
      command: 'insertCode',
      icon: Code,
      label: 'Code'
    }
  ]

  return (
    <Card className={cn("border", className)}>
      {!readOnly && (
        <div className="border-b p-2 flex flex-wrap gap-1">
          {toolbarButtons.map(({ command, icon: Icon, label }) => (
            <ToolbarButton
              key={command}
              onClick={() => execCommand(command)}
              isActive={false}
            >
              <Icon className="h-4 w-4" />
              <span className="sr-only">{label}</span>
            </ToolbarButton>
          ))}
          <ToolbarButton onClick={insertLink}>
            <Link className="h-4 w-4" />
            <span className="sr-only">Insert Link</span>
          </ToolbarButton>
          <ToolbarButton onClick={insertImage}>
            <Image className="h-4 w-4" />
            <span className="sr-only">Insert Image</span>
          </ToolbarButton>
        </div>
      )}
      <CardContent className="p-0">
        <div
          ref={editorRef}
          contentEditable={!readOnly}
          onInput={handleInput}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            "prose prose-sm max-w-none p-3 focus:outline-none",
            isFocused && !readOnly && "ring-2 ring-ring ring-offset-2",
            readOnly && "cursor-default"
          )}
          style={{ minHeight: height }}
          data-placeholder={placeholder}
          suppressContentEditableWarning
        />
        <style jsx>{`
          [contenteditable]:empty:before {
            content: attr(data-placeholder);
            color: #9ca3af;
            pointer-events: none;
          }
        `}</style>
      </CardContent>
    </Card>
  )
}
