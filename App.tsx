


import React, { useState, useCallback, useEffect, useRef } from 'react';
import FileExplorer from './components/FileExplorer';
import CodeEditor from './components/CodeEditor';
import Terminal from './components/Terminal';
import AiChat from './components/AiChat';
import FloatingAiButton from './components/FloatingAiButton';
import { FileNode, FileType, ChatMessage, TerminalHandle } from './types';
import { BLANK_FILE_STRUCTURE } from './constants';
import { Chat, Part } from '@google/genai';
import { ai, ideTools } from './services/geminiService';
import { Icon } from './components/Icon';

// --- Global declaration for JSZip from CDN ---
declare const JSZip: any;


// --- LocalStorage Keys ---
const FILES_STORAGE_KEY = 'xylon_ide_filesystem';
const BUFFERS_STORAGE_KEY = 'xylon_ide_file_buffers';


// --- File System Utils ---

function findNode(root: FileNode, path: string): FileNode | null {
  if (root.path === path) return root;
  if (root.type === FileType.FOLDER && root.children) {
    for (const child of root.children) {
      const found = findNode(child, path);
      if (found) return found;
    }
  }
  return null;
}

function updateFileContent(root: FileNode, path: string, newContent: string): FileNode {
  if (root.path === path && root.type === FileType.FILE) {
    return { ...root, content: newContent };
  }
  if (root.type === FileType.FOLDER && root.children) {
    return {
      ...root,
      children: root.children.map(child => updateFileContent(child, path, newContent))
    };
  }
  return root;
}

function addNodeToTree(root: FileNode, parentPath: string, newNode: FileNode): FileNode {
  function recursiveAdd(node: FileNode): FileNode {
    if (node.path === parentPath && node.type === FileType.FOLDER) {
      const newChildren = [...(node.children || []), newNode];
      newChildren.sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === FileType.FOLDER ? -1 : 1;
      });
      return { ...node, children: newChildren };
    }
    if (node.type === FileType.FOLDER && node.children) {
      return { ...node, children: node.children.map(recursiveAdd) };
    }
    return node;
  }
  return recursiveAdd(root);
}

function deleteNodeFromTree(root: FileNode, path: string): FileNode {
    if (root.type === FileType.FOLDER && root.children) {
        const newChildren = root.children.filter(child => child.path !== path).map(child => deleteNodeFromTree(child, path));
        return { ...root, children: newChildren };
    }
    return root;
}


// --- App Component ---

const App: React.FC = () => {
  const [files, setFiles] = useState<FileNode>(() => {
    try {
      const savedFiles = localStorage.getItem(FILES_STORAGE_KEY);
      return savedFiles ? JSON.parse(savedFiles) : BLANK_FILE_STRUCTURE;
    } catch (e) {
      console.error("Failed to parse files from localStorage", e);
      return BLANK_FILE_STRUCTURE;
    }
  });

  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);

  const [fileBuffers, setFileBuffers] = useState<Record<string, string>>(() => {
     try {
      const savedBuffers = localStorage.getItem(BUFFERS_STORAGE_KEY);
      return savedBuffers ? JSON.parse(savedBuffers) : {};
    } catch (e) {
      console.error("Failed to parse buffers from localStorage", e);
      return {};
    }
  });
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatRef = useRef<Chat | null>(null);
  const terminalRef = useRef<TerminalHandle>(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });

  useEffect(() => {
    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: 'You are an expert AI assistant integrated into a code editor for a language called Xylon. You can help the user by writing and explaining code. You also have the ability to directly manipulate the file system by creating files and folders when requested.',
          tools: [ideTools],
        }
    });
    chatRef.current = chat;
  }, []);
  
  // Persist files and buffers to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(FILES_STORAGE_KEY, JSON.stringify(files));
    } catch(e) {
      console.error("Failed to save files to localStorage", e);
    }
  }, [files]);

  useEffect(() => {
    try {
      localStorage.setItem(BUFFERS_STORAGE_KEY, JSON.stringify(fileBuffers));
    } catch(e) {
      console.error("Failed to save buffers to localStorage", e);
    }
  }, [fileBuffers]);


  const handleSelectFile = (file: FileNode) => {
    if (file.type === FileType.FILE) {
      setSelectedFile(file);
    }
  };

  const handleCodeChange = (newCode: string) => {
    if (selectedFile) {
      setFileBuffers(prev => ({
        ...prev,
        [selectedFile.path]: newCode,
      }));
    }
  };

  const handleSave = useCallback(() => {
    if (!selectedFile || fileBuffers[selectedFile.path] === undefined) {
      return; // Nothing to save for the current file
    }

    const newContent = fileBuffers[selectedFile.path];
    setFiles(prevFiles => updateFileContent(prevFiles, selectedFile.path, newContent));

    setSelectedFile(prev => (prev ? { ...prev, content: newContent } : null));

    setFileBuffers(prevBuffers => {
      const newBuffers = { ...prevBuffers };
      delete newBuffers[selectedFile.path];
      return newBuffers;
    });
  }, [selectedFile, fileBuffers]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleSave]);


  const getParentPath = (path?: string) => {
    let targetPath = path;
    if (targetPath) {
        // If the path is a file, get its directory
        if (!targetPath.endsWith('/') && findNode(files, targetPath)?.type === FileType.FILE) {
             const lastSlashIndex = targetPath.lastIndexOf('/');
             if (lastSlashIndex > 0) {
                targetPath = targetPath.substring(0, lastSlashIndex);
             } else {
                targetPath = files.path; // root
             }
        }
    } else if (selectedFile) {
        // If no path, use selected file's directory
        const lastSlashIndex = selectedFile.path.lastIndexOf('/');
        if (lastSlashIndex > 0) {
           targetPath = selectedFile.path.substring(0, lastSlashIndex);
        } else {
           targetPath = files.path;
        }
    } else {
        // Fallback to root
        targetPath = files.path;
    }
    const targetNode = findNode(files, targetPath);
    if (targetNode?.type === FileType.FOLDER) return targetNode.path;
    return files.path;
  };

  const handleDeleteNode = (path: string) => {
      if (path === files.path) return false;
      setFiles(currentFiles => deleteNodeFromTree(currentFiles, path));
      setFileBuffers(prevBuffers => {
        const newBuffers = { ...prevBuffers };
        if (newBuffers[path]) delete newBuffers[path];
        return newBuffers;
      });
      if (selectedFile?.path === path) setSelectedFile(null);
      return true;
  };

  const handleCreateNode = (type: 'file' | 'folder', path: string, content?: string) => {
    const parentPath = getParentPath(path);
    const parentNode = findNode(files, parentPath);
    if (!parentNode || parentNode.type !== FileType.FOLDER) return false;
    const name = path.substring(parentPath.length === files.path.length ? parentPath.length + 1 : parentPath.length + 1);
    
    if (parentNode.children?.some(child => child.name === name)) return false;

    const newNode: FileNode = type === 'file'
      ? { name, path, type: FileType.FILE, content: content || '' }
      : { name, path, type: FileType.FOLDER, children: [] };
    
    setFiles(currentFiles => addNodeToTree(currentFiles, parentPath, newNode));
    if (type === 'file') setSelectedFile(newNode);
    return true;
  };

  const handleCreateFromExplorer = (type: 'file' | 'folder') => {
    const parentPath = getParentPath(selectedFile?.path);
    const parentNode = findNode(files, parentPath);
    if (!parentNode || parentNode.type !== FileType.FOLDER) return;

    const name = prompt(`Enter new ${type} name in "${parentNode.name}":`);
    if (!name || name.trim() === '') return;
    
    let finalName = name.trim();
    if (type === 'file' && !finalName.includes('.')) {
        finalName = `${finalName}.xylon`;
    }

    const newPath = `${parentPath === files.path ? parentPath : parentPath + '/'}${finalName}`;

    if (parentNode.children?.some(child => child.name === finalName)) {
        alert(`A ${type} named "${finalName}" already exists here.`);
        return;
    }
    handleCreateNode(type, newPath);
  };
  
  const handleResetProject = () => {
    if (window.confirm("Are you sure you want to delete all files and folders? This action cannot be undone.")) {
        localStorage.removeItem(FILES_STORAGE_KEY);
        localStorage.removeItem(BUFFERS_STORAGE_KEY);
        setFiles(BLANK_FILE_STRUCTURE);
        setFileBuffers({});
        setSelectedFile(null);
    }
  };
  
  const handleDownloadProject = () => {
    const zip = new JSZip();

    // Recursive function to add files to the zip
    function addFilesToZip(node: FileNode, currentFolder: any) {
        if (node.type === FileType.FILE) {
            const content = fileBuffers[node.path] ?? node.content ?? '';
            currentFolder.file(node.name, content);
        } else if (node.type === FileType.FOLDER && node.children) {
            const folder = currentFolder.folder(node.name);
            node.children.forEach(child => addFilesToZip(child, folder));
        }
    }
    
    // Start with the root project folder's children
    const projectFolder = zip.folder(files.name);
    if (files.children) {
        files.children.forEach(child => addFilesToZip(child, projectFolder));
    }

    zip.generateAsync({ type: 'blob' }).then((content: Blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = 'xylon-project.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
  };

  const handleSendMessage = async (message: string) => {
    if (!chatRef.current || isAiLoading) return;

    setChatHistory(prev => [...prev, { role: 'user', content: message }]);
    setIsAiLoading(true);

    try {
      let response = await chatRef.current.sendMessage({ message });

      while (true) {
        const functionCalls = response.candidates?.[0]?.content?.parts
            .filter(part => !!part.functionCall)
            .map(part => part.functionCall);

        if (!functionCalls || functionCalls.length === 0) {
            setChatHistory(prev => [...prev, { role: 'model', content: response.text }]);
            break; // Exit loop if no more function calls
        }

        const functionResponses: Part[] = [];

        for (const call of functionCalls) {
            setChatHistory(prev => [...prev, {
                role: 'tool',
                content: `Calling tool: ${call.name}(${JSON.stringify(call.args, null, 2)})`
            }]);

            let output: any;
            try {
                if (call.name === 'createFile') {
                    const { path, content = '' } = call.args as { path: string; content?: string };
                    const success = handleCreateNode('file', path, content);
                    output = { result: success ? `File '${path}' created.` : `Failed to create file '${path}'. It might already exist or the path is invalid.` };
                } else if (call.name === 'createFolder') {
                    const { path } = call.args as { path: string };
                    const success = handleCreateNode('folder', path);
                    output = { result: success ? `Folder '${path}' created.` : `Failed to create folder '${path}'. It might already exist or the path is invalid.` };
                } else {
                    output = { error: `Unknown tool: ${call.name}` };
                }
            } catch (e) {
                output = { error: e instanceof Error ? e.message : 'An unknown error occurred during tool execution.' };
            }
            
            functionResponses.push({
                functionResponse: { name: call.name, response: output }
            });
        }
        
        // FIX: The `sendMessage` method expects an object with a `message` property.
        response = await chatRef.current.sendMessage({ message: functionResponses });
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      setChatHistory(prev => [...prev, { role: 'model', content: `Error: ${errorMessage}` }]);
    } finally {
      setIsAiLoading(false);
    }
  };


  const handlePushCodeToEditor = (codeToPush: string) => {
    if (!selectedFile) {
        alert("Please select or create a file to add the code to.");
        return;
    }
    const currentCode = fileBuffers[selectedFile.path] ?? selectedFile.content ?? '';
    const newCode = 
        currentCode.slice(0, selection.start) + 
        codeToPush + 
        currentCode.slice(selection.end);
    
    handleCodeChange(newCode);
  };
  
  const handleRunCode = () => {
    if (selectedFile) {
        setTimeout(() => {
           terminalRef.current?.executeCommand(`run ${selectedFile.path}`);
        }, 0);
    } else {
        alert("Please select a file to run.");
    }
  };

  const editorContent = selectedFile ? (fileBuffers[selectedFile.path] ?? selectedFile.content ?? '') : "Create or select a file to begin.";
  const isDirty = selectedFile ? fileBuffers[selectedFile.path] !== undefined : false;

  return (
    <div className="h-screen w-screen bg-slate-800 text-white flex flex-col font-sans">
      <header className="flex-shrink-0 bg-slate-900 border-b border-slate-700 p-2 flex justify-between items-center">
        <span className="text-sm font-semibold pl-2">Xylon IDE</span>
        <button
          onClick={handleSave}
          disabled={!isDirty}
          className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 hover:bg-blue-500 rounded-md disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed"
          title="Save Current File (Ctrl+S)"
        >
          Save
        </button>
      </header>
      <main className="flex flex-grow overflow-hidden">
        <aside className="w-64 flex-shrink-0 border-r border-slate-700">
          <FileExplorer 
            files={files} 
            selectedFile={selectedFile} 
            onSelectFile={handleSelectFile} 
            onCreateFile={() => handleCreateFromExplorer('file')}
            onCreateFolder={() => handleCreateFromExplorer('folder')}
            onResetProject={handleResetProject}
            onDownloadProject={handleDownloadProject}
            dirtyFiles={Object.keys(fileBuffers)}
          />
        </aside>
        <section className="flex-grow flex flex-col">
          <div className="flex-grow h-2/3 border-b border-slate-700">
            {selectedFile ? (
              <CodeEditor 
                value={editorContent}
                onChange={handleCodeChange}
                onSelectionChange={setSelection}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
                {editorContent}
              </div>
            )}
          </div>
          <div className="flex-grow h-1/3 flex flex-col">
            <div className="flex-shrink-0 flex justify-between items-center border-b border-slate-700">
                <div className="flex">
                    <button className={`px-4 py-2 text-sm bg-slate-900`}>Terminal</button>
                </div>
                 <button 
                    onClick={handleRunCode}
                    className="flex items-center gap-2 px-4 py-1 mr-2 text-sm bg-green-600 hover:bg-green-500 rounded-md disabled:bg-slate-600"
                    disabled={!selectedFile}
                    title="Run Current File"
                >
                    <Icon name="play" className="h-4 w-4" />
                    Run
                </button>
            </div>
            <div className="flex-grow overflow-hidden">
              <Terminal 
                  ref={terminalRef}
                  fileSystem={{
                      root: files,
                      findNode: (path) => findNode(files, path),
                      addNode: handleCreateNode,
                      deleteNode: handleDeleteNode,
                  }}
              />
            </div>
          </div>
        </section>
      </main>

      {!isChatOpen && <FloatingAiButton onClick={() => setIsChatOpen(true)} />}

      {isChatOpen && (
        <div className="fixed bottom-4 right-4 w-[450px] h-[600px] bg-slate-800/90 backdrop-blur-sm border border-slate-700 rounded-lg shadow-2xl flex flex-col z-50 animate-fade-in-up">
           <header className="flex-shrink-0 bg-slate-900 flex items-center justify-between p-2 border-b border-slate-700 cursor-grab">
                <div className="flex items-center gap-2">
                    <Icon name="robot" className="h-5 w-5 text-cyan-400" />
                    <span className="font-semibold text-sm">AI Assistant</span>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="p-1 rounded hover:bg-slate-700">
                    <Icon name="close" className="h-4 w-4" />
                </button>
           </header>
           <AiChat 
                history={chatHistory}
                isLoading={isAiLoading}
                onSendMessage={handleSendMessage}
                onPushCode={handlePushCodeToEditor}
            />
        </div>
      )}

    </div>
  );
};

export default App;