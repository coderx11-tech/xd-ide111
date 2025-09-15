import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { FileNode, FileType, TerminalHandle, FileSystem } from '../types';
import { XylonRegistry } from '../constants';

// --- Xylon Interpreter ---
class XylonInterpreter {
    private scope: Map<string, any>;
    private functions: Map<string, { args: string[], body: string }>;
    private printCallback: (output: string) => void;
    private fileSystem: FileSystem;

    constructor(printCallback: (output: string) => void, fileSystem: FileSystem) {
        this.scope = new Map();
        this.functions = new Map();
        this.printCallback = printCallback;
        this.fileSystem = fileSystem;
    }

    private evaluate(expression: string): any {
        // This is a very simplified evaluator.
        // It handles simple arithmetic and variable lookups.
        expression = expression.trim();
        
        // Handle function calls
        const functionCallMatch = expression.match(/(\w+)\((.*)\)/);
        if (functionCallMatch) {
            const [, funcName, argsStr] = functionCallMatch;
            if (this.functions.has(funcName)) {
                const func = this.functions.get(funcName)!;
                const argValues = argsStr ? argsStr.split(',').map(arg => this.evaluate(arg.trim())) : [];
                
                // Create a local scope for the function call
                const localScope = new Map(this.scope);
                func.args.forEach((argName, index) => {
                    localScope.set(argName, argValues[index]);
                });

                // Temporarily swap to local scope to run function
                const oldScope = this.scope;
                this.scope = localScope;
                const result = this.runBlock(func.body);
                this.scope = oldScope; // Restore global scope
                
                return result !== undefined ? result : null;
            }
        }
        
        if (this.scope.has(expression)) return this.scope.get(expression);
        if (!isNaN(Number(expression))) return Number(expression);
        if (expression.startsWith('"') && expression.endsWith('"')) return expression.slice(1, -1);
        
        // Simple arithmetic
        const parts = expression.split(/([+\-*/])/).map(p => p.trim());
        if (parts.length === 3) {
            const [left, op, right] = parts;
            const leftVal = this.evaluate(left);
            const rightVal = this.evaluate(right);
            switch(op) {
                case '+': return leftVal + rightVal;
                case '-': return leftVal - rightVal;
                case '*': return leftVal * rightVal;
                case '/': return leftVal / rightVal;
            }
        }
        
        return expression; // Return as string if unevaluatable
    }
    
    private runBlock(code: string): any {
        const lines = code.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('//') || trimmed === '') continue;

            const letMatch = trimmed.match(/^let\s+(\w+)\s*=\s*(.*)/);
            if (letMatch) {
                const [, varName, value] = letMatch;
                this.scope.set(varName, this.evaluate(value));
                continue;
            }

            const printMatch = trimmed.match(/^print\((.*)\)/);
            if (printMatch) {
                const value = this.evaluate(printMatch[1]);
                this.printCallback(String(value));
                continue;
            }

            const returnMatch = trimmed.match(/^return\s+(.*)/);
            if (returnMatch) {
                return this.evaluate(returnMatch[1]);
            }

            // Fallback to evaluate as a potential function call
            this.evaluate(trimmed);
        }
    }
    
    public async run(code: string): Promise<void> {
        // First pass: find all function definitions and imports
        const lines = code.split('\n');
        let inFunction = false;
        let currentFunc: { name: string, args: string[], body: string[] } | null = null;
        
        for (const line of lines) {
            const trimmed = line.trim();
            
            const importMatch = trimmed.match(/^import\s+"(.*)"/);
            if (importMatch) {
                const importPath = importMatch[1];
                const fileNode = this.fileSystem.findNode(importPath);
                if (fileNode?.content) {
                    // Recursively run the imported file to load its functions
                    await this.run(fileNode.content);
                } else {
                    this.printCallback(`Error: Cannot find module '${importPath}'`);
                }
                continue;
            }
            
            const funcMatch = trimmed.match(/^function\s+(\w+)\(([^)]*)\)\s*\{/);
            if (funcMatch) {
                inFunction = true;
                const [, name, args] = funcMatch;
                currentFunc = { name, args: args ? args.split(',').map(a => a.trim()) : [], body: [] };
                continue;
            }
            if (trimmed === '}' && inFunction) {
                inFunction = false;
                if (currentFunc) {
                    this.functions.set(currentFunc.name, { args: currentFunc.args, body: currentFunc.body.join('\n') });
                }
                currentFunc = null;
                continue;
            }
            if (inFunction && currentFunc) {
                currentFunc.body.push(line);
            }
        }
        
        // Second pass: run top-level code (not inside functions)
        this.runBlock(lines.filter(l => !l.trim().startsWith('function ') && !l.trim().startsWith('import ')).join('\n'));
    }
}


const Terminal = forwardRef<TerminalHandle, { fileSystem: FileSystem }>(({ fileSystem }, ref) => {
  const [history, setHistory] = useState<React.ReactNode[]>(['Welcome to the Xylon IDE Terminal. Type "help" for a list of commands.']);
  const [input, setInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historySearch, setHistorySearch] = useState({ active: false, query: '', index: -1 });
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [history]);
  
  const processCommand = async (command: string) => {
    const trimmedCommand = command.trim();
    const newHistory = [...history, <span className="text-cyan-400">{`$ ${trimmedCommand}`}</span>];
    
    if (trimmedCommand && trimmedCommand !== commandHistory[commandHistory.length - 1]) {
        setCommandHistory(prev => [...prev, trimmedCommand]);
    }

    const [cmd, ...args] = trimmedCommand.split(/\s+/);
    
    let output: React.ReactNode[] = [];
    
    switch(cmd) {
        case 'help':
            output.push('Available commands:');
            output.push('  run <file>       - Execute a Xylon file.');
            output.push('  xip install <pkg> - Install a Xylon package.');
            output.push('  ls [path]        - List files and directories.');
            output.push('  touch <file>     - Create a new empty file.');
            output.push('  mkdir <dir>      - Create a new directory.');
            output.push('  rm <path>        - Remove a file or directory.');
            output.push('  clear            - Clear the terminal screen.');
            break;
        case 'clear':
            setHistory([]);
            return;
        case 'ls': {
            const path = args[0] || fileSystem.root.path;
            const node = fileSystem.findNode(path);
            if (node && node.type === FileType.FOLDER) {
                output = node.children?.map(child => 
                    <span key={child.path} className={child.type === FileType.FOLDER ? 'text-blue-400' : ''}>{child.name}</span>
                ) || [];
            } else {
                output.push(`ls: cannot access '${path}': No such file or directory`);
            }
            break;
        }
        case 'touch':
        case 'mkdir': {
            const path = args[0];
            if (!path) {
                output.push(`Usage: ${cmd} <path>`);
            } else if (fileSystem.findNode(path)) {
                output.push(`${cmd}: cannot create '${path}': File exists`);
            } else {
                const success = fileSystem.addNode(cmd === 'touch' ? 'file' : 'folder', path);
                if (!success) output.push(`${cmd}: cannot create '${path}': Invalid path`);
            }
            break;
        }
        case 'rm': {
            const path = args[0];
            if (!path) {
                output.push('Usage: rm <path>');
            } else if (!fileSystem.findNode(path)) {
                output.push(`rm: cannot remove '${path}': No such file or directory`);
            } else {
                fileSystem.deleteNode(path);
            }
            break;
        }
        case 'xip': {
            const [subCmd, pkgName] = args;
            if (subCmd === 'install' && pkgName) {
                if (pkgName in XylonRegistry) {
                    const libContent = XylonRegistry[pkgName as keyof typeof XylonRegistry];
                    const libsDir = 'my-project/libs';
                    // Create libs directory if it doesn't exist
                    if (!fileSystem.findNode(libsDir)) {
                        fileSystem.addNode('folder', libsDir);
                    }
                    const filePath = `${libsDir}/${pkgName}.xylon`;
                    fileSystem.addNode('file', filePath, libContent);
                    output.push(`Package '${pkgName}' installed successfully.`);
                } else {
                    output.push(`Package '${pkgName}' not found in registry.`);
                }
            } else {
                output.push('Usage: xip install <package_name>');
            }
            break;
        }
        case 'run': {
            const path = args[0];
            const node = fileSystem.findNode(path);
            if (node && node.type === FileType.FILE) {
                if (node.content) {
                    const interpreter = new XylonInterpreter((out) => output.push(out), fileSystem);
                    await interpreter.run(node.content);
                }
                // If content is empty, do nothing, just don't crash.
            } else {
                output.push(`run: could not find file '${path}'`);
            }
            break;
        }
        case '':
            break; // Do nothing for empty command
        default:
            output.push(`${cmd}: command not found`);
    }

    setHistory([...newHistory, ...output]);
  };
  
  useImperativeHandle(ref, () => ({
    executeCommand: (command: string) => {
        setInput(command);
        processCommand(command);
        setInput('');
    }
  }));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (historySearch.active && e.key !== 'r' && e.ctrlKey) {
        // Let other ctrl combinations pass through
        return;
    } else if (historySearch.active && e.key !== 'Control' && e.key !== 'Shift' && e.key !== 'Alt') {
        // Any meaningful keypress deactivates search mode unless it's another Ctrl+R
        if (e.key === 'Enter') {
            setHistorySearch({ active: false, query: '', index: -1 });
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setInput(historySearch.query); // Restore original input
            setHistorySearch({ active: false, query: '', index: -1 });
            return;
        } else if (e.key.startsWith('Arrow')) {
             setHistorySearch({ active: false, query: '', index: -1 });
             // Don't return, let arrow key move cursor
        } else {
            setHistorySearch({ active: false, query: '', index: -1 });
        }
    }

    if (e.key === 'r' && e.ctrlKey) {
        e.preventDefault();
        const query = !historySearch.active ? input : historySearch.query;
        const startIndex = historySearch.active ? historySearch.index - 1 : commandHistory.length - 1;

        if (!historySearch.active) {
            setHistorySearch({ active: true, query: input, index: commandHistory.length });
        }

        for (let i = startIndex; i >= 0; i--) {
            if (commandHistory[i].includes(query)) {
                setInput(commandHistory[i]);
                setHistorySearch(prev => ({ ...prev, query: query, index: i }));
                return;
            }
        }
        return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      processCommand(input);
      setInput('');
    }
  };

  const promptText = historySearch.active
    ? `(reverse-i-search)\`${historySearch.query}\`: `
    : '$';

  return (
    <div className="bg-slate-900 text-slate-300 h-full p-4 font-mono text-sm flex flex-col" onClick={() => inputRef.current?.focus()}>
      <div ref={scrollRef} className="flex-grow overflow-y-auto">
        {history.map((line, i) => (
          <div key={i} className="whitespace-pre-wrap">{line}</div>
        ))}
      </div>
      <div className="flex-shrink-0 flex items-center gap-2">
        <span className="text-cyan-400 whitespace-pre">{promptText}</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="bg-transparent w-full outline-none text-slate-300"
          autoFocus
        />
      </div>
    </div>
  );
});

export default Terminal;