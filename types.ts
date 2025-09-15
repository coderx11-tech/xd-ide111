export enum FileType {
  FILE = 'file',
  FOLDER = 'folder',
}

export interface FileNode {
  name: string;
  path: string;
  type: FileType;
  content?: string;
  children?: FileNode[];
}

export interface ChatMessage {
    role: 'user' | 'model' | 'tool';
    content: string;
}

export interface TerminalHandle {
    executeCommand: (command: string) => void;
}

export interface FileSystem {
    root: FileNode;
    findNode: (path: string) => FileNode | null;
    addNode: (type: 'file' | 'folder', path: string, content?: string) => boolean;
    deleteNode: (path: string) => boolean;
}