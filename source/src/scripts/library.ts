"use strict";

import Resource from "./resource";
import { cd, exec } from "shelljs";
import { window, ExtensionContext } from "vscode";
import { ChildProcess } from "child_process";
import axios from "axios";
import { coerce, lt } from "semver";
import { join } from "path";
import { readFileSync } from "fs";


class Library {
  static REFRESH_PERIOD_MS_ = 3 * 60 * 60 * 1000;
  static ROOTPATH: string;
  public context: ExtensionContext;
  public version: string;
  public child: ChildProcess = null;
  constructor(context: ExtensionContext) {
    this.context = context;
    this.updateVersion()
      .then((child) => {
        // tslint:disable-next-line: no-unused-expression
        child && child.on("exit", () => { this.child = null; });
      });

    Resource.getProjectRootPath(window.activeTextEditor);
    setInterval(() => {
      this.updateVersion()
        .then((child) => {
          // tslint:disable-next-line: no-unused-expression
          child && child.on("exit", () => { this.child = null; });
        });
    }, Library.REFRESH_PERIOD_MS_);
  }

  async updateVersion() {
    let onlineWinDocs: string[], localDocs: string[];
    try {
      let { data: { result: { data } } } = await axios.post(
        Resource.DOCKERURL,
        {
          "action": "coreui_Browse",
          "method": "read",
          "data": [{
            "repositoryName": "winnpm",
            "sort": [{ "property": "leaf", "direction": "ASC" }],
            "node": "win-docs"
          }],
          "type": "rpc",
          "tid": 10
        }
      );
      onlineWinDocs = data ? data.map((item: any) => {
        return coerce(item.id).format();
      }) : [];

    } catch (e) {
      onlineWinDocs = [];
    }
    try {
      localDocs = await Resource.getAllVersion();
      localDocs = localDocs.map(v => coerce(v).format());
    } catch (e) {
      localDocs = [];
    }
    
    let JSONObj = JSON.parse(readFileSync(join(Resource.ROOT_PATH,"package.json"),{encoding: "utf8"})); 
    let semver = coerce(JSONObj["dependencies"]["win-docs"]);
    if( semver ){
      Resource.LOCAL_WINDOCS = semver.format();
    }

    if (onlineWinDocs.length > 0) {
      let semver = coerce(this.getLastestVersion(onlineWinDocs));
      Resource.ONLINE_LATEST_WINDOCS = semver.format();
    }
    if (localDocs.length > 0) {
      let semver = coerce(this.getLastestVersion(localDocs));
      Resource.LOCAL_LATEST_DOC = semver.major + "." + semver.minor;
    }

    // console.log(Resource.LOCAL_LATEST_DOC,Resource.LOCAL_WINDOCS,Resource.ONLINE_LATEST_WINDOCS);
    if(lt(Resource.LOCAL_WINDOCS,Resource.ONLINE_LATEST_WINDOCS)){
      cd(Resource.ROOT_PATH);
      let child = exec("npm install win-docs@latest --save", { async: true });
      this.child = child;
      return child;
    }
    
  }

  getLastestVersion(versionList: string[]) {
    return versionList.sort((prev, next) => {
      return lt(next, prev) ? 0 : 1;
    })[0];
  }





  // setVersionSchema(versions: string[]) {
  //   const config = workspace.getConfiguration("element-helper");
  //   const filename = Path.join(__dirname, "..", "..", "package.json");
  //   fs.readFile(filename, "utf8", (err: Error, data: string) => {
  //     if (err) {
  //       console.error("ReadFail");
  //       return;
  //     }
  //     const content = JSON.parse(data);
  //     content.contributes.configuration.properties["element-helper.version"]["enum"] = versions;
  //     config.update("version", versions[versions.length - 1], true);
  //     fs.writeFileSync(filename, JSON.stringify(content, null, 2));
  //   });
  // }

  // fetchVersion(repo: RepoObject) {
  //   Resource.get(Path.join(Resource.ELEMENT_PATH, "versions.json")).then((local) => {
  //     Resource.getFromUrl(Resource.ELEMENT_VERSION_URL)
  //       .then((online) => {
  //         const newVersions = this.getValues(JSON.parse(online as string));
  //         if (!this.isSame(JSON.parse(local as string), JSON.parse(online as string))) {
  //           cd(`${Resource.RESOURCE_PATH}/..`);
  //           exec("npm update element-gh-pages --save", (error) => {
  //             if (error) {
  //               return;
  //             }
  //             const versionsStr = fs.readFileSync(Path.join(Resource.ELEMENT_PATH, "versions.json"), "utf8");
  //             if (!this.isSame(JSON.parse(local as string), JSON.parse(versionsStr))) {
  //               this.setVersionSchema(newVersions);
  //               window.showInformationMessage(`${repo.name} version updated to lasted version`);
  //             }
  //             Resource.updateResource();
  //           });
  //         } else {
  //           if (!fs.existsSync(Path.join(Resource.ELEMENT_PATH, "main.html"))) {
  //             Resource.updateResource();
  //           }
  //         }
  //       }).catch(() => {
  //         window.showInformationMessage("Please check whether you can access the external network");
  //       });
  //   });
  // }
  // isSame(local: JSON, online: JSON) {
  //   for (let key in online) {
  //     if (!(local as any)[Symbol(key)]) {
  //       return false;
  //     }
  //   }
  //   return true;
  // }

  setLoading(text: string, duration?: number) {
    return window.setStatusBarMessage(text, duration);
  }

  // getValues(obj: any) {
  //   let values = [];
  //   for (let key in obj) {
  //     values.push(obj[key]);
  //   }
  //   return values;
  // }
}

export default Library;
