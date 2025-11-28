// components/courses/RichTextEditor.tsx
'use client'
import React, { useRef, useEffect, useState } from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Undo,
  Redo,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  error?: string;
}

interface ActiveFormats {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start typing...',
  minHeight = '200px',
  error,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [currentFormat, setCurrentFormat] = useState<string>('p');
  const [activeFormats, setActiveFormats] = useState<ActiveFormats>({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
  });

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  // Execute command
  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateActiveFormats();
  };

  // Update active formats
  const updateActiveFormats = () => {
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikethrough: document.queryCommandState('strikethrough'),
    });
  };

  // Handle content change
  const handleContentChange = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  // Format handlers
  const handleBold = () => executeCommand('bold');
  const handleItalic = () => executeCommand('italic');
  const handleUnderline = () => executeCommand('underline');
  const handleStrikethrough = () => executeCommand('strikethrough');
  
  const handleAlignLeft = () => executeCommand('justifyLeft');
  const handleAlignCenter = () => executeCommand('justifyCenter');
  const handleAlignRight = () => executeCommand('justifyRight');
  const handleAlignJustify = () => executeCommand('justifyFull');
  
  const handleBulletList = () => executeCommand('insertUnorderedList');
  const handleNumberList = () => executeCommand('insertOrderedList');
  
  const handleQuote = () => {
    executeCommand('formatBlock', 'blockquote');
    handleContentChange();
  };
  
  const handleCode = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    
    if (selectedText) {
      const codeHTML = `<pre class="code-block"><code>${selectedText}</code></pre><p><br></p>`;
      document.execCommand('insertHTML', false, codeHTML);
      editorRef.current?.focus();
      handleContentChange();
    }
  };
  
  const handleUndo = () => executeCommand('undo');
  const handleRedo = () => executeCommand('redo');
  
  const handleLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      let formattedUrl = url.trim();
      if (!formattedUrl.match(/^https?:\/\//i)) {
        formattedUrl = 'https://' + formattedUrl;
      }
      executeCommand('createLink', formattedUrl);
      handleContentChange();
    }
  };

  const handleUnlink = () => executeCommand('unlink');

  const handleImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      executeCommand('insertImage', url);
      handleContentChange();
    }
  };

  const handleFormatChange = (format: string) => {
    setCurrentFormat(format);
    executeCommand('formatBlock', format);
    handleContentChange();
  };

  // Track selection changes
  useEffect(() => {
    const handleSelectionChange = () => {
      if (editorRef.current?.contains(document.activeElement)) {
        updateActiveFormats();
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  const ToolbarButton = ({ 
    onClick, 
    title, 
    icon: Icon, 
    active = false 
  }: { 
    onClick: () => void; 
    title: string; 
    icon: React.ComponentType<{ className?: string }>; 
    active?: boolean;
  }) => (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="sm"
      onClick={onClick}
      title={title}
      className="h-8 w-8 p-0"
    >
      <Icon className="h-4 w-4" />
    </Button>
  );

  return (
    <div className="w-full">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 bg-muted/50 border border-b-0 rounded-t-md flex-wrap">
        {/* Text Formatting */}
        <ToolbarButton onClick={handleBold} title="Bold" icon={Bold} active={activeFormats.bold} />
        <ToolbarButton onClick={handleItalic} title="Italic" icon={Italic} active={activeFormats.italic} />
        <ToolbarButton onClick={handleStrikethrough} title="Strikethrough" icon={Strikethrough} active={activeFormats.strikethrough} />
        <ToolbarButton onClick={handleCode} title="Code Block" icon={Code} />
        <ToolbarButton onClick={handleUnderline} title="Underline" icon={Underline} active={activeFormats.underline} />

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Alignment */}
        <ToolbarButton onClick={handleAlignLeft} title="Align Left" icon={AlignLeft} />
        <ToolbarButton onClick={handleAlignCenter} title="Align Center" icon={AlignCenter} />
        <ToolbarButton onClick={handleAlignRight} title="Align Right" icon={AlignRight} />
        <ToolbarButton onClick={handleAlignJustify} title="Justify" icon={AlignJustify} />

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Lists */}
        <ToolbarButton onClick={handleBulletList} title="Bullet List" icon={List} />
        <ToolbarButton onClick={handleNumberList} title="Numbered List" icon={ListOrdered} />

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Quote */}
        <ToolbarButton onClick={handleQuote} title="Quote" icon={Quote} />

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Link */}
        <ToolbarButton onClick={handleLink} title="Insert Link" icon={LinkIcon} />
        <ToolbarButton onClick={handleUnlink} title="Remove Link" icon={Unlink} />

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Image */}
        <ToolbarButton onClick={handleImage} title="Insert Image" icon={ImageIcon} />

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Format Dropdown */}
        <Select value={currentFormat} onValueChange={handleFormatChange}>
          <SelectTrigger className="h-8 w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="p">Normal</SelectItem>
            <SelectItem value="h1">Heading 1</SelectItem>
            <SelectItem value="h2">Heading 2</SelectItem>
            <SelectItem value="h3">Heading 3</SelectItem>
            <SelectItem value="h4">Heading 4</SelectItem>
            <SelectItem value="h5">Heading 5</SelectItem>
            <SelectItem value="h6">Heading 6</SelectItem>
          </SelectContent>
        </Select>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Undo/Redo */}
        <ToolbarButton onClick={handleUndo} title="Undo" icon={Undo} />
        <ToolbarButton onClick={handleRedo} title="Redo" icon={Redo} />
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleContentChange}
        onMouseUp={updateActiveFormats}
        onKeyUp={updateActiveFormats}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          
          if (target.closest('pre.code-block')) {
            e.preventDefault();
            const pre = target.closest('pre.code-block') as HTMLElement;
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNode(pre);
            selection?.removeAllRanges();
            selection?.addRange(range);
            return;
          }
          
          if (target.tagName === 'A' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            window.open((target as HTMLAnchorElement).href, '_blank');
          }
        }}
        data-placeholder={placeholder}
        style={{ minHeight }}
        className={`
          p-4 border border-t-0 rounded-b-md bg-background
          outline-none prose prose-sm max-w-none
          focus:ring-2 focus:ring-ring focus:ring-offset-2
          ${error ? 'border-destructive' : ''}
          rich-text-editor
        `}
      />

      {error && (
        <p className="text-sm text-destructive mt-1">{error}</p>
      )}

     

      {/* Styles */}
      <style jsx global>{`
        .rich-text-editor:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }

        .rich-text-editor ul {
          list-style-type: disc;
          padding-left: 2rem;
          margin: 1em 0;
        }
        
        .rich-text-editor ol {
          list-style-type: decimal;
          padding-left: 2rem;
          margin: 1em 0;
        }
        
        .rich-text-editor li {
          margin: 0.5em 0;
        }
        
        .rich-text-editor a {
          color: #2563eb;
          text-decoration: underline;
          cursor: pointer;
        }
        
        .rich-text-editor a:hover {
          color: #1d4ed8;
        }
        
        .rich-text-editor blockquote {
          border-left: 4px solid #ccc;
          margin-left: 0;
          padding-left: 1rem;
          color: #666;
          font-style: italic;
          margin: 1em 0;
        }
        
        .rich-text-editor pre {
          background-color: #f5f5f5;
          padding: 0.75rem;
          border-radius: 0.25rem;
          border: 1px solid #ddd;
          overflow: auto;
          font-family: monospace;
          margin: 1em 0;
          user-select: all;
        }
        
        .rich-text-editor code {
          font-family: 'Courier New', monospace;
          font-size: 13px;
        }
        
        .rich-text-editor h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 0.67em 0;
        }
        
        .rich-text-editor h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.75em 0;
        }
        
        .rich-text-editor h3 {
          font-size: 1.17em;
          font-weight: bold;
          margin: 0.83em 0;
        }
        
        .rich-text-editor h4 {
          font-size: 1em;
          font-weight: bold;
          margin: 1em 0;
        }
        
        .rich-text-editor h5 {
          font-size: 0.83em;
          font-weight: bold;
          margin: 1.5em 0;
        }
        
        .rich-text-editor h6 {
          font-size: 0.67em;
          font-weight: bold;
          margin: 2em 0;
        }
      `}</style>
    </div>
  );
}