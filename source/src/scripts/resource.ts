"use strict";

import { window, workspace, TextEditor } from "vscode";
import { join, sep } from "path";
import { coerce } from "semver";
const fs = require("fs");

export default class Resource {

  static ROOT_PATH: string = join(__dirname, "..", "..");
  static DOCS_PATH: string = join(Resource.ROOT_PATH, "node_modules", "win-docs");
  static PROJECT_ROOT: string;
  static WIN_VERSION: string;
  static DOCKERURL:string = "http://docker.yhfin.club:81/service/extdirect";
  static ONLINE_LATEST:string = "0.0";
  static LOCAL_LATEST: string = "0.0";

  static get(filePath: string) {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, "utf8", (err: Error, data: string) => {
        if (err) {
          reject("ReadFail");
        }
        resolve(data);
      });
    });
  }

  static getProjectRootPath(editor: TextEditor) {
    if (workspace.workspaceFolders) {
      let folderNum = workspace.workspaceFolders.length;
      if (folderNum === 1) {
        Resource.PROJECT_ROOT = workspace.rootPath;
      } else {
        for (let i = 0; i < folderNum; i++) {
          let fsPath = workspace.workspaceFolders[i].uri.fsPath;
          let regExp = new RegExp(`^${fsPath.split(sep).join("/")}`);
          if (regExp.test(editor.document.uri.fsPath.split(sep).join("/"))) {
            Resource.PROJECT_ROOT = fsPath;
          }
        }
      }
    }
    Resource.getPackageVersion(Resource.PROJECT_ROOT, "win-plus")
      .then((version) => { Resource.WIN_VERSION = version; });
  }

  static async getPackageVersion(root: string, lib: string) {
    if (root) {
      try {
        let data = await Resource.get(join(root, "package.json"));
        let version = JSON.parse(data as string).dependencies[lib];
        if (version) {
          let semver = coerce(version);
          return semver.major + "." + semver.minor;
        }
      } catch (err) {
        return;
      }
    }
  }
  static getAllVersion(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      return fs.readdir(join(Resource.DOCS_PATH, "docs"), (err: Error, files: string[]) => {
        if (err) {
          reject("ReadFail");
        }
        resolve(files);
      });
    });
  }

  static async getMarkDown(title: string): Promise<string> {
    let content: any;
    try {
      content = await Resource.get(join(Resource.DOCS_PATH, "docs", Resource.WIN_VERSION||Resource.LOCAL_LATEST, `${title}.md`));
    } catch{
      content = "";
    }
    return content;
  }

}

window.onDidChangeActiveTextEditor((editor: TextEditor) => {
  Resource.getProjectRootPath(editor);
});