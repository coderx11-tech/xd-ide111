import React, { useState } from 'react';
import { FileNode, FileType } from '../types';
import { Icon } from './Icon';

interface FileExplorerProps {
  files: FileNode;
  selectedFile: FileNode | null;
  onSelectFile: (file: FileNode) => void;
  onCreateFile: () => void;
  onCreateFolder: () => void;
  onResetProject: () => void;
  onDownloadProject: () => void;
  dirtyFiles: string[];
}

const FileEntry: React.FC<{ 
  node: FileNode; 
  selectedFile: FileNode | null; 
  onSelectFile: (file: FileNode) => void; 
  indent: number;
  dirtyFiles: string[];
}> = ({ node, selectedFile, onSelectFile, indent, dirtyFiles }) => {
  const [isOpen, setIsOpen] = useState(true);

  const isFolder = node.type === FileType.FOLDER;
  const isSelected = selectedFile?.path === node.path;
  const isDirty = !isFolder && dirtyFiles.includes(node.path);

  const handleSelect = () => {
    if (isFolder) setIsOpen(prev => !prev);
    onSelectFile(node);
  };
  
  const getIconName = () => {
    if (isFolder) return isOpen ? 'folder-open' : 'folder';
    if (node.name.endsWith('.xylon')) return 'xylon';
    if (node.name.endsWith('.md')) return 'file';
    return 'file';
  }

  return (
    <div>
      <div
        onClick={handleSelect}
        style={{ paddingLeft: `${indent * 1}rem` }}
        className={`flex items-center gap-2 p-1 cursor-pointer rounded-md hover:bg-slate-700 ${isSelected && !isFolder ? 'bg-slate-700' : ''}`}
      >
        {isFolder ? (
          <Icon name={isOpen ? 'chevron-down' : 'chevron-right'} className="h-4 w-4 flex-shrink-0" />
        ) : (
          <div className="w-4 flex-shrink-0"></div>
        )}
        <Icon name={getIconName()} className="h-5 w-5 flex-shrink-0" />
        <span className="truncate">{node.name}</span>
        {isDirty && <div className="w-2 h-2 bg-yellow-400 rounded-full ml-auto mr-2 flex-shrink-0" title="Unsaved changes"></div>}
      </div>
      {isFolder && isOpen && node.children && (
        <div>
          {node.children.map(child => (
            <FileEntry 
              key={child.path} 
              node={child} 
              selectedFile={selectedFile} 
              onSelectFile={onSelectFile} 
              indent={indent + 1}
              dirtyFiles={dirtyFiles}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FileExplorer: React.FC<FileExplorerProps> = ({ files, selectedFile, onSelectFile, onCreateFile, onCreateFolder, onResetProject, onDownloadProject, dirtyFiles }) => {
  return (
    <div className="bg-slate-900 text-slate-300 h-full p-2 overflow-y-auto">
      <div className="flex items-center justify-between text-sm font-semibold p-2 mb-2">
        <span>EXPLORER</span>
        <div className="flex items-center gap-2">
           <button 
              onClick={onCreateFolder} 
              className="p-1 rounded hover:bg-slate-700"
              title="New Folder"
            >
              <Icon name="folder-plus" className="h-4 w-4" />
            </button>
            <button 
              onClick={onCreateFile} 
              className="p-1 rounded hover:bg-slate-700"
              title="New File"
            >
              <Icon name="file-plus" className="h-4 w-4" />
            </button>
             <button 
              onClick={onDownloadProject} 
              className="p-1 rounded hover:bg-slate-700"
              title="Download Project as ZIP"
            >
              <Icon name="download" className="h-4 w-4" />
            </button>
             <button 
              onClick={onResetProject} 
              className="p-1 rounded hover:bg-slate-700"
              title="Reset Project"
            >
              <Icon name="trash" className="h-4 w-4" />
            </button>
        </div>
      </div>
      <FileEntry 
        node={files} 
        selectedFile={selectedFile} 
        onSelectFile={onSelectFile} 
        indent={0}
        dirtyFiles={dirtyFiles}
      />
    </div>
  );
};

export default FileExplorer;