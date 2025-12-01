
/*eslint-disable @typescript-eslint/no-unused-vars */
// components/cms/CMSRichTextEditor.tsx
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
  Heading1,
  Heading2,
  Heading3,
  Palette,
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

interface CMSRichTextEditorProps {
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

export default function CMSRichTextEditor({
  value,
  onChange,
  placeholder = 'Start writing your page content here...',
  minHeight = '400px',
  error,
}: CMSRichTextEditorProps) {
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
      const codeHTML = `<pre class="cms-code-block"><code>${selectedText}</code></pre>`;
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
      const imgHTML = `<img src="${url}" alt="" style="max-width: 100%; height: auto; border-radius: 4px;" />`;
      document.execCommand('insertHTML', false, imgHTML);
      editorRef.current?.focus();
      handleContentChange();
    }
  };

  const handleFormatChange = (format: string) => {
    setCurrentFormat(format);
    executeCommand('formatBlock', format);
    handleContentChange();
  };

  const handleTextColor = () => {
    const color = prompt('Enter color (hex, rgb, or name):', '#000000');
    if (color) {
      executeCommand('foreColor', color);
      handleContentChange();
    }
  };

  const handleBackgroundColor = () => {
    const color = prompt('Enter background color (hex, rgb, or name):', '#ffffff');
    if (color) {
      executeCommand('backColor', color);
      handleContentChange();
    }
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
    active = false,
    variant = "ghost" as "ghost" | "secondary"
  }: { 
    onClick: () => void; 
    title: string; 
    icon: React.ComponentType<{ className?: string }>; 
    active?: boolean;
    variant?: "ghost" | "secondary";
  }) => (
    <Button
      type="button"
      variant={active ? "secondary" : variant}
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
      <div className="flex items-center gap-1 p-3 bg-muted/30 border border-b-0 rounded-t-lg flex-wrap">
        {/* Text Formatting */}
        <div className="flex items-center gap-1">
          <ToolbarButton onClick={handleBold} title="Bold" icon={Bold} active={activeFormats.bold} />
          <ToolbarButton onClick={handleItalic} title="Italic" icon={Italic} active={activeFormats.italic} />
          <ToolbarButton onClick={handleUnderline} title="Underline" icon={Underline} active={activeFormats.underline} />
          <ToolbarButton onClick={handleStrikethrough} title="Strikethrough" icon={Strikethrough} active={activeFormats.strikethrough} />
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Headings & Format */}
        <div className="flex items-center gap-1">
          <Select value={currentFormat} onValueChange={handleFormatChange}>
            <SelectTrigger className="h-8 w-36">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="p">Paragraph</SelectItem>
              <SelectItem value="h1">
                <div className="flex items-center gap-2">
                  <Heading1 className="h-4 w-4" />
                  Heading 1
                </div>
              </SelectItem>
              <SelectItem value="h2">
                <div className="flex items-center gap-2">
                  <Heading2 className="h-4 w-4" />
                  Heading 2
                </div>
              </SelectItem>
              <SelectItem value="h3">
                <div className="flex items-center gap-2">
                  <Heading3 className="h-4 w-4" />
                  Heading 3
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Alignment */}
        <div className="flex items-center gap-1">
          <ToolbarButton onClick={handleAlignLeft} title="Align Left" icon={AlignLeft} />
          <ToolbarButton onClick={handleAlignCenter} title="Align Center" icon={AlignCenter} />
          <ToolbarButton onClick={handleAlignRight} title="Align Right" icon={AlignRight} />
          <ToolbarButton onClick={handleAlignJustify} title="Justify" icon={AlignJustify} />
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Lists */}
        <div className="flex items-center gap-1">
          <ToolbarButton onClick={handleBulletList} title="Bullet List" icon={List} />
          <ToolbarButton onClick={handleNumberList} title="Numbered List" icon={ListOrdered} />
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Special Formats */}
        <div className="flex items-center gap-1">
          <ToolbarButton onClick={handleQuote} title="Quote" icon={Quote} />
          <ToolbarButton onClick={handleCode} title="Code Block" icon={Code} />
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Media & Links */}
        <div className="flex items-center gap-1">
          <ToolbarButton onClick={handleLink} title="Insert Link" icon={LinkIcon} />
          <ToolbarButton onClick={handleUnlink} title="Remove Link" icon={Unlink} />
          <ToolbarButton onClick={handleImage} title="Insert Image" icon={ImageIcon} />
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Colors */}
        <div className="flex items-center gap-1">
          <ToolbarButton onClick={handleTextColor} title="Text Color" icon={Palette} />
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* History */}
        <div className="flex items-center gap-1">
          <ToolbarButton onClick={handleUndo} title="Undo" icon={Undo} />
          <ToolbarButton onClick={handleRedo} title="Redo" icon={Redo} />
        </div>
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
          
          if (target.closest('pre.cms-code-block')) {
            e.preventDefault();
            const pre = target.closest('pre.cms-code-block') as HTMLElement;
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
          p-6 border border-t-0 rounded-b-lg bg-background
          outline-none prose prose-lg max-w-none
          focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          transition-colors duration-200
          ${error ? 'border-destructive ring-2 ring-destructive' : 'border-gray-300'}
          cms-rich-text-editor
        `}
      />

      {error && (
        <p className="text-sm text-destructive mt-2 font-medium">{error}</p>
      )}

      {/* Character Count */}
      <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
        <span>Supports HTML formatting</span>
        <span>{editorRef.current?.textContent?.length || 0} characters</span>
      </div>

      {/* Styles */}
      <style jsx global>{`
        .cms-rich-text-editor:empty:before {
          content: attr(data-placeholder);
          color: #6b7280;
          pointer-events: none;
          font-style: italic;
        }

        .cms-rich-text-editor ul {
          list-style-type: disc;
          padding-left: 2rem;
          margin: 1em 0;
        }
        
        .cms-rich-text-editor ol {
          list-style-type: decimal;
          padding-left: 2rem;
          margin: 1em 0;
        }
        
        .cms-rich-text-editor li {
          margin: 0.5em 0;
          line-height: 1.6;
        }
        
        .cms-rich-text-editor a {
          color: #2563eb;
          text-decoration: underline;
          cursor: pointer;
          transition: color 0.2s;
        }
        
        .cms-rich-text-editor a:hover {
          color: #1d4ed8;
        }
        
        .cms-rich-text-editor blockquote {
          border-left: 4px solid #e5e7eb;
          margin-left: 0;
          padding-left: 1.5rem;
          color: #6b7280;
          font-style: italic;
          margin: 1.5em 0;
          background: #f9fafb;
          padding: 1rem 1.5rem;
          border-radius: 0 8px 8px 0;
        }
        
        .cms-rich-text-editor pre.cms-code-block {
          background-color: #1f2937;
          color: #f3f4f6;
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid #374151;
          overflow: auto;
          font-family: 'Fira Code', 'Courier New', monospace;
          margin: 1.5em 0;
          user-select: all;
          font-size: 0.875rem;
          line-height: 1.5;
        }
        
        .cms-rich-text-editor code {
          font-family: 'Fira Code', 'Courier New', monospace;
          background: #f3f4f6;
          padding: 0.2em 0.4em;
          border-radius: 4px;
          font-size: 0.875em;
          color: #dc2626;
        }
        
        .cms-rich-text-editor pre.cms-code-block code {
          background: transparent;
          color: inherit;
          padding: 0;
        }
        
        .cms-rich-text-editor h1 {
          font-size: 2.25em;
          font-weight: 700;
          margin: 1em 0 0.5em 0;
          color: #111827;
          line-height: 1.2;
        }
        
        .cms-rich-text-editor h2 {
          font-size: 1.875em;
          font-weight: 600;
          margin: 1.2em 0 0.6em 0;
          color: #1f2937;
          line-height: 1.3;
        }
        
        .cms-rich-text-editor h3 {
          font-size: 1.5em;
          font-weight: 600;
          margin: 1.3em 0 0.7em 0;
          color: #374151;
          line-height: 1.4;
        }
        
        .cms-rich-text-editor p {
          margin: 1em 0;
          line-height: 1.7;
          color: #374151;
        }
        
        .cms-rich-text-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1.5em 0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .cms-rich-text-editor strong {
          font-weight: 700;
          color: #111827;
        }
        
        .cms-rich-text-editor em {
          font-style: italic;
          color: #4b5563;
        }
      `}</style>
    </div>
  );
}