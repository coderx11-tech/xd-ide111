import { FileNode, FileType } from './types';

export const XylonRegistry = {
  "string-utils": `
function reverse(str) {
    let reversed = "";
    // Note: This is a simplified implementation for demo purposes.
    // A real implementation would handle Unicode correctly.
    let i = str.length - 1;
    while (i >= 0) {
        reversed = reversed + str[i];
        i = i - 1;
    }
    return reversed;
}

function toUpperCase(str) {
    // This is a placeholder as the language doesn't have native string methods yet
    return str;
}
`
};

export const BLANK_FILE_STRUCTURE: FileNode = {
  name: 'my-project',
  path: 'my-project',
  type: FileType.FOLDER,
  children: [],
};
