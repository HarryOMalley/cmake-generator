// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ILibrary, ILibraryType, ISourceType, ISourceVisibility, createLibrary } from './cmake_generator';
import * as fs from 'fs';
import * as path from 'path';

async function showFilePickerQuickPick(): Promise<string | undefined> {
	let currentDir: string | undefined;

	const workspaceFolders = vscode.workspace.workspaceFolders;

	// 1. Check if there's an open workspace.
	if (workspaceFolders) {
		currentDir = workspaceFolders[0].uri.fsPath;
		console.log("currentDir: " + currentDir);
	} else {
		console.log("No workspace folders found.")
		// 2. Check the directory of the active file.
		const activeEditor = vscode.window.activeTextEditor;
		if (activeEditor && activeEditor.document.uri.scheme === 'file') {
			currentDir = path.dirname(activeEditor.document.uri.fsPath);
			console.log("currentDir: " + currentDir);
		} else {
			console.log("No active editor found.")
			// 3. Prompt the user to choose a base directory.
			const userChosenDir = await vscode.window.showOpenDialog({
				canSelectFiles: false,
				canSelectFolders: true,
				canSelectMany: false,
				title: 'Select a base directory'
			});

			if (userChosenDir && userChosenDir[0]) {
				currentDir = userChosenDir[0].fsPath;
			} else {
				vscode.window.showErrorMessage("Failed to select a directory.");
				return;
			}
		}
	}

	while (true) {
		if (!fs.existsSync(currentDir)) {
			console.error(`Directory does not exist: ${currentDir}`);
			vscode.window.showErrorMessage(`Directory does not exist: ${currentDir}`);
			return;
		}

		let entries: string[] = [];
		try {
			const directoryEntries = fs.readdirSync(currentDir, { withFileTypes: true });

			const directories = directoryEntries.filter(de => de.isDirectory()).map(de => de.name).sort();
			const files = directoryEntries.filter(de => !de.isDirectory()).map(de => de.name).sort();

			entries = ['..', ...directories, ...files];
			console.log("entries: " + entries);
		} catch (error) {
			vscode.window.showErrorMessage(`Error reading directory: ${(error as Error).message}`);
			return;
		}

		const pick = await vscode.window.showQuickPick(entries, {
			placeHolder: 'Select a file or directory',
		});

		if (!pick) {
			console.log("User canceled the quick pick");
			return; // User canceled the quick pick
		}

		if (pick === '..') {
			// Go up one directory
			currentDir = path.dirname(currentDir);
		} else {
			const newDir = path.join(currentDir, pick);

			const stats = fs.statSync(newDir);
			if (stats.isDirectory()) {
				currentDir = newDir;
			} else if (stats.isFile()) {
				return newDir;
			}
		}
	}
}




// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('CMake Generator starting...');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('cmake-generator.create-library', async () => {
		const initialPath = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : '.';
		const editor = vscode.window.activeTextEditor;

		if (editor) {
			const documentPath = editor.document.uri.fsPath;
			const docDir = path.dirname(documentPath);
			// Usage example
			showFilePickerQuickPick().then(file => {
				if (file) {
					console.log(`Selected file: ${file}`);
				} else {
					console.log('No file was selected.');
				}
			});

			// if (selectedPath) {
			// 	vscode.window.showInformationMessage(`Selected file: ${selectedPath}`);
			// }
		} else {
			vscode.window.showErrorMessage('No active editor found.');
		}
		vscode.window.showInformationMessage('Creating a CMake Library!');
		// Example Usage:
		const libraryName = await vscode.window.showInputBox({
			prompt: 'Enter the library name',
			placeHolder: 'Name here'
		});

		if (!libraryName) {
			vscode.window.showErrorMessage('Library name is required');
			return;
		}

		let libraryTypes: ILibraryType[] = Object.values(ILibraryType);

		// Show quick pick to the user
		const libraryTypeItems: vscode.QuickPickItem[] = libraryTypes.map((type: ILibraryType) => {
			return { label: type.toString(), description: '' };
		});

		const selectedLibraryType: vscode.QuickPickItem | undefined = await vscode.window.showQuickPick(libraryTypeItems, {
			placeHolder: 'Select the library type',
		});

		if (!selectedLibraryType) {
			vscode.window.showErrorMessage('Library type is required');
			return;
		}

		const libraryType: ILibraryType = selectedLibraryType.label as ILibraryType;

		if (!libraryType) {
			vscode.window.showErrorMessage('Library type is required');
			return;
		}

		vscode.window.showInformationMessage(`Creating ${libraryName}! Library type: ${libraryType}`);

		const options: vscode.OpenDialogOptions = {
			canSelectMany: true,      // Allows selecting multiple files.
			openLabel: 'Open',        // Label for the open button.
			filters: {
				'Text files': ['txt'], // Filter files by extension (in this case, .txt files).
				'All files': ['*']     // Allow selecting any type of file.
			}
		};

		// Show the file picker.
		const fileUris = await vscode.window.showOpenDialog(options);

		if (fileUris && fileUris.length > 0) {
			for (const fileUri of fileUris) {
				vscode.window.showInformationMessage(`Selected file: ${fileUri.fsPath}`);
			}
		}


		const exampleLibrary: ILibrary = {
			name: libraryName,
			type: libraryType,
			sources: [
				{
					type: ISourceType.REGULAR,
					visibility: ISourceVisibility.PRIVATE,
					files: [
						{
							name: "source1",
							path: "src/source1.cpp",

						}
					]
				},
				{
					type: ISourceType.HEADER,
					visibility: ISourceVisibility.PUBLIC,
					files: [
						{
							name: "header1",
							path: "include/header1.hpp",
						},
						{
							name: "header2",
							path: "include/header2.hpp",
						}
					]
				}
			]
		};

		console.log(createLibrary(exampleLibrary));
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }
