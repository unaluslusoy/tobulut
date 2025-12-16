
import React, { useState, useRef, useEffect } from 'react';
import { Bold, Italic, List, AlignLeft, AlignCenter, RotateCcw, Type } from 'lucide-react';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    placeholder?: string;
    height?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
    value, 
    onChange, 
    label, 
    placeholder,
    height = '200px'
}) => {
    // We use a contentEditable div for rich text
    const contentRef = useRef<HTMLDivElement>(null);
    const [isfocused, setIsFocused] = useState(false);

    // Sync external value to internal content (only if different to prevent cursor jumps)
    useEffect(() => {
        if (contentRef.current && contentRef.current.innerHTML !== value) {
             // Only update if the content is significantly different to avoid loop
             // Simple check: if value is empty, clear. If not, only set if we are not focused?
             // Actually, controlled contentEditable is hard. 
             // Improved strategy: Only set html if it's completely different or empty.
             if (value === '' && contentRef.current.innerHTML !== '<br>') {
                 contentRef.current.innerHTML = '';
             } else if (value !== contentRef.current.innerHTML) {
                 // Danger: resetting innerHTML moves cursor. 
                 // We will trust the user's typing mostly. 
                 // But for initial load or external updates:
                 if (!isfocused) {
                     contentRef.current.innerHTML = value;
                 }
             }
        }
    }, [value, isfocused]);

    const execCmd = (command: string, value: any = null) => {
        document.execCommand(command, false, value);
        handleInput(); // meaningful update
        contentRef.current?.focus();
    };

    const handleInput = () => {
        if (contentRef.current) {
            const html = contentRef.current.innerHTML;
            onChange(html);
        }
    };

    return (
        <div className="w-full">
            {label && <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>}
            
            <div className={`
                border rounded-lg overflow-hidden bg-white dark:bg-slate-800 
                ${isfocused ? 'ring-2 ring-indigo-500 border-transparent' : 'border-slate-300 dark:border-slate-600'}
                transition-all
            `}>
                {/* Toolbar */}
                <div className="flex items-center gap-1 p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                    <ToolbarButton icon={<Bold size={16} />} onClick={() => execCmd('bold')} tooltip="Kalın" />
                    <ToolbarButton icon={<Italic size={16} />} onClick={() => execCmd('italic')} tooltip="İtalik" />
                    <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1" />
                    <ToolbarButton icon={<List size={16} />} onClick={() => execCmd('insertUnorderedList')} tooltip="Liste" />
                    <ToolbarButton icon={<AlignLeft size={16} />} onClick={() => execCmd('justifyLeft')} tooltip="Sola Yasla" />
                    <ToolbarButton icon={<AlignCenter size={16} />} onClick={() => execCmd('justifyCenter')} tooltip="Ortala" />
                    <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1" />
                    <ToolbarButton icon={<Type size={16} />} onClick={() => execCmd('formatBlock', 'H3')} tooltip="Başlık" />
                    <ToolbarButton icon={<RotateCcw size={16} />} onClick={() => execCmd('removeFormat')} tooltip="Temizle" />
                </div>

                {/* Editor Area */}
                <div
                    ref={contentRef}
                    className="p-4 overflow-auto outline-none prose prose-sm dark:prose-invert max-w-none min-h-[150px]"
                    contentEditable
                    style={{ height }}
                    onInput={handleInput}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onKeyDown={(e) => {
                        if (e.key === 'Tab') {
                            e.preventDefault();
                            execCmd('insertHTML', '&nbsp;&nbsp;&nbsp;&nbsp;');
                        }
                    }}
                    dangerouslySetInnerHTML={{ __html: value }}
                    role="textbox"
                    aria-label={label}
                />
            </div>
            {placeholder && !value && (
                <div className="text-xs text-slate-400 mt-1 pl-1">{placeholder}</div>
            )}
        </div>
    );
};

const ToolbarButton: React.FC<{ icon: React.ReactNode, onClick: () => void, tooltip: string }> = ({ icon, onClick, tooltip }) => (
    <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); onClick(); }}
        className="p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
        title={tooltip}
    >
        {icon}
    </button>
);

export default RichTextEditor;
