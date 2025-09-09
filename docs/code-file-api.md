# Code File API

The CodeFile API allows plugins to create, read, update, and manage code files within a Framer project. A code file exports either overrides or code components.

createCodeFile()
Create a new code file in the project.

getCodeFile()
Get a specific code file by its ID.

getCodeFiles()
Get all code files in the project.

subscribeToCodeFiles()
Subscribe to changes in code files across the project.

subscribeToOpenCodeFile()
Beta
Subscribe to changes in the Code Editor’s active file.

## CodeFile

A class representing a code file in a Framer project.

content
The current content/source code of the file.

exports
Array of exports available in this code file.

getVersions()
Get all versions/history of this code file.

id
The unique identifier of the code file.

lint()
Run linting on the code file content.

name
The name of the code file (e.g., "MyComponent.tsx").

navigateTo()
Beta
Get all versions/history of this code file.

path
The file system path of the code file.

remove()
Remove the code file from the project.

rename()
Rename the code file.

setFileContent()
Set the content of the code file.

typecheck()
Run TypeScript type checking on the code file.

## CodeFileExport

Union type representing exports from a code file.

insertURL
URL for inserting the component

isDefaultExport
Whether this is a default export

name
Export name

type
Discriminator

## CodeFileVersion

Represents a historical version of a code file.

createdAt
The creation timestamp.

createdBy
The user that created this version.

getContent()
Retrieve content for this version.

id
The version identifier.

name
The file name at this version.

# createCodeFile

Create a new code file in the project.

const newFile = await framer.createCodeFile(
"MyComponent",
`export default function MyComponent() {
    return <div>Hello World</div>
  }`
);
Parameters
name: string — The name of the file to create

code: string — The initial content of the file

Returns
Promise<CodeFile> – The created CodeFile instance

# getCodeFile

Get a specific code file by its ID.

const codeFile = await framer.getCodeFile("code-file-id");
console.log(`Found file: ${codeFile.name}`);
Parameters
id: string – The unique identifier of the code file

Returns
Promise<CodeFile | null> – The CodeFile instance or null if not found

# getCodeFiles

Get all code files in the project.

const allFiles = await framer.getCodeFiles();
console.log(`Project has ${allFiles.length} code files`);
Returns
Promise<readonly CodeFile[]> – An array of all CodeFile instances

# setFileContent

Set the content of the code file.

const updatedFile = await codeFile.setFileContent(`export default function MyComponent() {
  return <div>Hello World</div>
}`);
Parameters
code: string — The new source code content.

Returns
Promise<CodeFile>

# List All Code Files

In the Code Sync plugin, you can use the "List All Code Files" button to get a complete overview of all code files in your Framer project.

**Features:**

- Lists all code files with their names and paths
- Shows file IDs and export counts
- Outputs detailed information to the browser console
- Displays a summary alert with the total count

**Example Output:**

```
=== Code Files in Project ===
Total files: 5
1. Name: MyComponent.tsx
   Path: ./components/MyComponent.tsx
   ID: code-file-123
   Exports: 2
---
2. Name: utils.ts
   Path: ./utils/index.ts
   ID: code-file-456
   Exports: 5
---
```

This functionality uses the `framer.getCodeFiles()` API to retrieve all code files and display their properties.
