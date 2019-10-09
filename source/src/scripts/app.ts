import {
  window, commands, ViewColumn, Disposable, workspace
} from "vscode";
import Resource from "./resource";


//组件帮助文档
export class App {
  private _disposable: Disposable;
  public WORD_REG: RegExp = /(-?\d*\.\d\w*)|([^\`\~\!\@\$\^\&\*\(\)\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\s]+)/gi;


  getSeletedText() {
    let editor = window.activeTextEditor;
    if (!editor) { return; }

    let selection = editor.selection;

    if (selection.isEmpty) {
      let range = editor.document.getWordRangeAtPosition(selection.start, this.WORD_REG);
      return editor.document.getText(range);
    } else {
      return editor.document.getText(selection);
    }
  }

  setConfig() {
    // 启动在字符串中的快速建议（智能提示），为属性提供值的智能提示很有用
    const config = workspace.getConfiguration("editor");
    const quickSuggestions = config.get("quickSuggestions");
    if (!(quickSuggestions as any)["strings"]) {
      config.update("quickSuggestions", { "strings": true }, true);
    }
  }

  async openDocs(title: string) {
    const panel = window.createWebviewPanel(
      "markdown",
      title,
      ViewColumn.Two,
      { enableScripts: true, retainContextWhenHidden: true }
    );

    try {
      let md = await Resource.getMarkDown(title);
      commands.executeCommand("markdown.api.render", md).then((result) => {
        panel.webview.html = (result as string);
      });

    } catch (error) {
      panel.webview.html = error;
    }
  }


  dispose() {
    this._disposable.dispose();
  }
}
