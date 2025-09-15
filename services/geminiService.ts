
import { GoogleGenAI, Tool, Type } from '@google/genai';

export const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// FIX: `FunctionDeclarationsTool` is not a valid exported type. The correct type for this object is `Tool`.
// FIX: Use the `Type` enum for schema definitions instead of string literals.
export const ideTools: Tool = {
  functionDeclarations: [
    {
      name: 'createFile',
      description: 'Creates a new file with optional content at a specified path. Paths should be relative to the project root, e.g., "my-project/src/main.xylon".',
      parameters: {
        type: Type.OBJECT,
        properties: {
          path: {
            type: Type.STRING,
            description: 'The full path of the file to create, including the filename and extension.',
          },
          content: {
            type: Type.STRING,
            description: 'The initial content of the file. Can be an empty string.',
          },
        },
        required: ['path'],
      },
    },
    {
      name: 'createFolder',
      description: 'Creates a new, empty folder at a specified path. e.g., "my-project/src".',
      parameters: {
        type: Type.OBJECT,
        properties: {
          path: {
            type: Type.STRING,
            description: 'The full path of the folder to create.',
          },
        },
        required: ['path'],
      },
    },
  ],
};
