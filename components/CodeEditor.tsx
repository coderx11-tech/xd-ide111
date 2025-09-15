import React from 'react';
import Editor from 'react-simple-code-editor';

// Prism is loaded globally via script tag in index.html
declare const Prism: any;

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSelectionChange: (selection: { start: number, end: number }) => void;
  language?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange, onSelectionChange, language = 'xylon' }) => {
  
  const highlightCode = (code: string) => {
    if (typeof Prism === 'undefined' || !Prism.languages[language]) {
      return code; // Return unhighlighted if Prism or language not ready
    }
    return Prism.highlight(code, Prism.languages[language], language);
  };
  
  return (
    <div className="h-full w-full relative editor-container">
      <Editor
        value={value}
        onValueChange={onChange}
        highlight={highlightCode}
        padding={16}
        className="w-full h-full text-slate-200 font-mono text-sm outline-none"
        style={{
            fontFamily: '"Fira code", "Fira Mono", monospace',
            fontSize: 14,
        }}
        onSelect={code => {
            const textarea = document.querySelector('.editor-container textarea') as HTMLTextAreaElement;
            if (textarea) {
                onSelectionChange({ start: textarea.selectionStart, end: textarea.selectionEnd });
            }
        }}
      />
    </div>
  );
};

export default CodeEditor;
