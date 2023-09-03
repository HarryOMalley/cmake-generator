// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as CMake from './cmake_generator';
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
		console.log("No workspace folders found.");
		// 2. Check the directory of the active file.
		const activeEditor = vscode.window.activeTextEditor;
		if (activeEditor && activeEditor.document.uri.scheme === 'file') {
			currentDir = path.dirname(activeEditor.document.uri.fsPath);
			console.log("currentDir: " + currentDir);
		} else {
			console.log("No active editor found.");
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
		console.log(initialPath);
		vscode.window.showInformationMessage(`Initial path: ${initialPath}`);
		const editor = vscode.window.activeTextEditor;

		if (editor) {
			const documentPath = editor.document.uri.fsPath;
			const docDir = path.dirname(documentPath);
			// Usage example
			await showFilePickerQuickPick().then(file => {
				if (file) {
					console.log(`Selected file: ${file}`);
				} else {
					console.log('No file was selected.');
				}
			});
		}

		// 	// if (selectedPath) {
		// 	// 	vscode.window.showInformationMessage(`Selected file: ${selectedPath}`);
		// 	// }
		// } else {
		// 	vscode.window.showErrorMessage('No active editor found.');
		// }
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

		let libraryTypes: CMake.LibraryType[] = Object.values(CMake.LibraryType);

		// Show quick pick to the user
		const libraryTypeItems: vscode.QuickPickItem[] = libraryTypes.map((type: CMake.LibraryType) => {
			return { label: type.toString(), description: '' };
		});

		const selectedLibraryType: vscode.QuickPickItem | undefined = await vscode.window.showQuickPick(libraryTypeItems, {
			placeHolder: 'Select the library type',
		});

		if (!selectedLibraryType) {
			vscode.window.showErrorMessage('Library type is required');
			return;
		}

		const libraryType: CMake.LibraryType = selectedLibraryType.label as CMake.LibraryType;

		if (!libraryType) {
			vscode.window.showErrorMessage('Library type is required');
			return;
		}

		vscode.window.showInformationMessage(`Creating ${libraryName}! Library type: ${libraryType}`);

		// const options: vscode.OpenDialogOptions = {
		// 	canSelectMany: true,      // Allows selecting multiple files.
		// 	openLabel: 'Open',        // Label for the open button.
		// 	filters: {
		// 		// eslint-disable-next-line @typescript-eslint/naming-convention
		// 		'Text files': ['txt'], // Filter files by extension (in this case, .txt files).
		// 		// eslint-disable-next-line @typescript-eslint/naming-convention
		// 		'All files': ['*']     // Allow selecting any type of file.
		// 	}
		// };

		// Show the file picker.
		// const fileUris = await vscode.window.showOpenDialog(options);

		// if (fileUris && fileUris.length > 0) {
		// 	for (const fileUri of fileUris) {
		// 		vscode.window.showInformationMessage(`Selected file: ${fileUri.fsPath}`);
		// 	}
		// }


		const exampleLibrary: CMake.Library = {
			config: {
				name: libraryName,
				type: libraryType,
			},
			sources: [
				{
					type: CMake.SourceType.regular,
					visibility: CMake.CMakeVisibility.private,
					files: [
						{
							name: "source1",
							path: "src/source1.cpp",

						}
					]
				},
				{
					type: CMake.SourceType.header,
					visibility: CMake.CMakeVisibility.public,
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
			],
			includeDirectories: [{
				visibility: CMake.CMakeVisibility.public,
				directories: [
					"include",
				]
			}],
			linkLibraries: [{
				visibility: CMake.CMakeVisibility.public,
				libraries: [
					"lib1",
					"lib2",
				]
			},
			{
				visibility: CMake.CMakeVisibility.private,
				libraries: [
					"lib3",
					"lib4",
				]
			}],
			installConfig: {
				headerDestination: "include/" + libraryName,
				libraryDestination: "lib",
			}
		};

		let lib: string = CMake.createLibrary(exampleLibrary);
		vscode.window.showInformationMessage('Generated configuration, pasting into editor...');
		const editor2 = vscode.window.activeTextEditor;
		if (editor2) {
			const edit = new vscode.WorkspaceEdit();
			const position = editor2.selection.active;
			const text = 'Hello, world!';
		
			edit.insert(editor2.document.uri, position, text);
			vscode.workspace.applyEdit(edit);
		
			const range = new vscode.Range(position, position.translate(0, text.length));
			const decoration = { range, hoverMessage: 'This text was added by the extension.' };
			const decorationType = vscode.window.createTextEditorDecorationType({ backgroundColor: 'yellow' });
			editor2.setDecorations(decorationType, [decoration]);
		
			const uri = editor2.document.uri;
			const document = await vscode.workspace.openTextDocument(uri);
			const textEditor = await vscode.window.showTextDocument(document, { preview: false });
			textEditor.setDecorations(decorationType, [decoration]);
		
			const acceptChanges = await vscode.window.showInformationMessage('Do you want to accept the changes?', 'Yes', 'No');
			if (acceptChanges === 'Yes') {
				await vscode.workspace.applyEdit(edit);
			} else {
				editor2.setDecorations(decorationType, []);
				textEditor.setDecorations(decorationType, []);
			}
		} else {
			vscode.window.showErrorMessage('No active editor found.');
		}
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }
