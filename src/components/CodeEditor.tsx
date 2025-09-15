import React, { useEffect } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/themes/prism-okaidia.css';

// Custom language definition for Xylon
Prism.languages.xylon = {
    // FIX: Changed comment from '#' to '//' to match the interpreter.
    'comment': /\/\/.*/,
    'string': {
        pattern: /"(?:\\.|[^\\"])*"/,
        greedy: true
    },
    // FIX: Changed keyword 'func' to 'function' to match the interpreter.
    'keyword': /\b(?:let|print|if|else|function|return|import)\b/,
    'function': /\b[a-zA-Z_]\w*(?=\s*\()/,
    'number': /\b\d+\b/,
    'operator': /[+\-*/=<>!]+/,
    'punctuation': /[{}[\]();,]/,
    'variable': /\b[a-zA-Z_]\w*\b/
};


interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSelectionChange: (selection: { start: number, end: number }) => void;
  language?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange, onSelectionChange, language = 'xylon' }) => {
  
  useEffect(() => {
    Prism.highlightAll();
  }, [value, language]);

  const highlightCode = (code: string) => {
    if (Prism.languages[language]) {
      return Prism.highlight(code, Prism.languages[language], language);
    }
    return code; // Return unhighlighted if language not found
  };
  
  return (
    <div className="h-full w-full relative editor-container overflow-auto">
      <Editor
        value={value}
        onValueChange={onChange}
        highlight={highlightCode}
        padding={16}
        className="w-full h-full text-slate-200 font-mono text-sm outline-none"
        style={{
            fontFamily: '"Fira code", "Fira Mono", monospace',
            fontSize: 14,
            minHeight: '100%',
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