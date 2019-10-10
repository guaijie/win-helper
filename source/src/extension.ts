// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
// import provider from "./scripts/index";
import { App } from "./scripts/app";
import { WinCompletionItemProvider } from "./scripts/provider";
import Library from "./scripts/library";
import * as tags from "win-docs/tags.json";
// import { join } from "path";
// import { writeFileSync } from "fs";

const WORD_REG = /(-?\d*\.\d\w*)|([^\`\~\!\@\$\^\&\*\(\)\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\s]+)/gi;
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let app = new App();
	const library = new Library(context);
	let winCompletionItemProvider = new WinCompletionItemProvider();
	// let tags = require(`${context.extensionPath}/src/snippets/html.json`);
	let vueLanguageConfig = vscode.languages.setLanguageConfiguration("vue", { wordPattern: WORD_REG });

	let tagCompletion = vscode.languages.registerCompletionItemProvider([{
		language: "vue", scheme: "file"
	}, {
		language: "html", scheme: "file"
	}], winCompletionItemProvider, "<", " ", "", ":", "/", "@", "(");

	let updateDisposable = vscode.commands.registerCommand("win-helper.update", () => {
		if (library.child) {
			return;
		}
		let disposable = library.setLoading("updating, please wait a minute");
		library.updateVersion()
		.then((child)=>{
			if(child){
				child.on("exit", (code:number) => {
					library.child = null;
					disposable.dispose();
					library.setLoading("updated", 2000);
					if (code === 0) {
						library.setLoading("Update successful", 2000);
					} else {
						library.setLoading("Update failed", 2000);
					}
				});
			}else{
				disposable.dispose();
				library.setLoading("It is the latest version", 2000);
			}
		});
		
	});

	let searchDisposable = vscode.commands.registerCommand("win-helper.search", () => {
		switch (vscode.window.activeTextEditor.document.languageId) {
			case "vue":
			case "html":
				break;
			default:
				return;
		}

		const selection = app.getSeletedText();
		let items = Object.keys(tags).map((key: string) => {
			return {
				label: (tags as any)[key].prefix,
				detail: (tags as any)[key].description,
				path: (tags as any)[key].path,
				description: (tags as any)[key].type,
			};
		});

		let find = items.filter(item => item.label.includes(selection));

		if (find.length >= 1) {
			app.openDocs(find[0].path);
		} else {
			vscode.window.showQuickPick(items).then((selected: any) => {
				app.openDocs(selected.path);
			});
		}

		return;
	});

	context.subscriptions.push(searchDisposable, updateDisposable, tagCompletion, vueLanguageConfig);
}

export function deactivate() { }
