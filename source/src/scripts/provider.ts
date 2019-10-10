import {
    CancellationToken,
    CompletionItemProvider, ProviderResult,
    TextDocument, Position, CompletionItem, CompletionList, CompletionItemKind,
    SnippetString, Range
} from "vscode";
import * as tags from "win-docs/tags.json";
import * as attrs from "win-docs/attrs.json";
import { satisfies, coerce } from "semver";
import Resource from "./resource";
export interface TagObject {
    text: string;
    offset: number;
    isAttrStart: boolean;
}
let TAGS: { [key: string]: any } = tags;
let ATTRS: { [key: string]: any } = attrs;



// 代码补全
export class WinCompletionItemProvider implements CompletionItemProvider {
    private _document: TextDocument;
    private _position: Position;
    private tagReg: RegExp = /<([\w-]+)\s*/g;
    private attrReg: RegExp = /(?:\(|\s*)(\w+)=['"][^'"]*/;

    getPreTag(): TagObject | undefined {
        let line = this._position.line;
        let tag: TagObject | string;
        let curtxt = this.getTextBeforePosition(this._position);
        let txt = curtxt;

        while (this._position.line - line < 10 && line >= 0) {
            if (line !== this._position.line) {
                txt = this._document.lineAt(line).text;
            }
            tag = this.matchTag(this.tagReg, txt, line);

            if (tag === "break") {
                return {
                    text: curtxt.trimLeft(),
                    offset: this._document.offsetAt(this._position),
                    isAttrStart: false
                };
            }
            if (tag) return <TagObject>tag;
            line--;
        }
        return;
    }

    getPreAttr(): string | undefined {
        let txt = this.getTextBeforePosition(this._position).replace(/"[^'"]*(\s*)[^'"]*$/, "");
        let end = this._position.character;
        let start = txt.lastIndexOf(" ", end) + 1;
        let parsedTxt = this._document.getText(new Range(this._position.line, start, this._position.line, end));

        return this.matchAttr(this.attrReg, parsedTxt);
    }

    matchAttr(reg: RegExp, txt: string): string {
        let match: RegExpExecArray;
        match = reg.exec(txt);
        return !/"[^"]*"/.test(txt) && match && match[1];
    }

    matchTag(reg: RegExp, txt: string, line: number): TagObject | string {
        let match: RegExpExecArray;
        let arr: TagObject[] = [];
        if (!this.isTagBreak(txt, line) || /[^<>]*<$/.test(txt.trimRight()[txt.length - 1])) {
            return "break";
        }
        while ((match = reg.exec(txt))) {
            arr.push({
                text: match[1],
                offset: this._document.offsetAt(new Position(line, match.index)),
                isAttrStart: true
            });
        }
        return arr.pop();
    }

    getTextBeforePosition(position: Position): string {
        var start = new Position(position.line, 0);
        var range = new Range(start, position);
        return this._document.getText(range);
    }
    getTagSuggestion() {
        let suggestions = [];

        let id = 100;
        for (let tag in TAGS) {
            suggestions.push(this.buildTagSuggestion(tag, TAGS[tag], id));
            id++;
        }
        return suggestions;
    }

    getAttrValueSuggestion(tag: string, attr: string): CompletionItem[] {
        let suggestions: any[] = [];
        const values = this.getAttrValues(tag, attr);
        values.forEach((value: string) => {
            suggestions.push({
                label: value,
                kind: CompletionItemKind.Value
            });
        });
        return suggestions;
    }

    getAttrSuggestion(tag: string) {
        let suggestions: any[] = [];
        let tagAttrs: any[] = [];
        let preText = this.getTextBeforePosition(this._position);
        let prefix = preText.replace(/['"]([^'"]*)['"]$/, "").split(/\s|\(+/).pop();
        // method attribute
        const event = prefix[0] === "@";
        // bind attribute
        const bind = prefix[0] === ":";

        if (event) {
            tagAttrs = tagAttrs.concat(this.getTagEvents(tag));
        } else {
            tagAttrs = tagAttrs.concat(this.getTagAttrs(tag));
        }

        prefix = prefix.replace(/[:@]/, "");

        if (/[^@:a-zA-z\s]/.test(prefix[0])) {
            return suggestions;
        }

        let id = 100;
        tagAttrs.forEach((attr: any) => {

            let attrVersion = ATTRS[tag][event ? "events" : "attrs"][attr].version;
            let version = Resource.WIN_VERSION ;
            if (version && !satisfies(coerce(version).format(), attrVersion)) {
                return;
            }
            const sug = this.buildAttrSuggestion({ attr, tag, event, attrVersion, id });
            id++;
            // tslint:disable-next-line: no-unused-expression
            suggestions.push(sug);
            if (attr.includes("-")) {
                let attrR = attr.replace(/-(\w)/g, (_match: any, p: string) => {
                    return p.toUpperCase();
                });
                const sug = this.buildAttrSuggestion({ attr: attrR, tag, event, attrVersion, id });
                id++;
                // tslint:disable-next-line: no-unused-expressiWon
                suggestions.push(sug);
            }
        });
        return suggestions;
    }

    isTagBreak(text: string, line: number): number {
        text = text.replace(/('|").*\1/, "$1$1").trimRight();
        let attrMatch = line === this._position.line ? /(?<=\<[\w-]+\s{1,}[^<>]*)[\w]*$/ : /(?<=\<[\w-]+[^<>]*)[\w]*$/;
        let rightAngle = text.lastIndexOf(">");
        let leftAngle = text.lastIndexOf("<");
        let index: number;
        if (rightAngle === leftAngle) {
            return 1;
        }
        index = leftAngle > rightAngle
            ? attrMatch.test(text.substr(leftAngle))
                ? 1
                : 0
            : 0;
        return index;
    }

    buildTagSuggestion(tag: any, tagVal: any, id: any) {

        let text = this.getTextBeforePosition(this._position);
        let rightAngle = text.lastIndexOf(">");
        let leftAngle = text.lastIndexOf("<");
        let index: number;
        index = leftAngle > rightAngle
            ? /<[\w-]*/.test(text.substr(leftAngle))
                ? 1
                : 0
            : 0;

        return {
            label: tag,
            sortText: `0${id}${tag}`,
            insertText: new SnippetString((tagVal.body.join ? tagVal.body.join("") : tagVal.body).substr(index)),
            kind: CompletionItemKind.Snippet,
            detail: tagVal.detail,
            documentation: tagVal.description
        };
    }

    buildAttrSuggestion({ attr, tag, event, attrVersion, id }: any) {
        return {
            label: attr,
            sortText: `0${id}${attr}`,
            insertText: new SnippetString(`${attr}="$1"$0`),
            kind: event ? CompletionItemKind.Event : CompletionItemKind.Field,
            detail: `${tag} ${event ? "@" : ":"}${attr} (${attrVersion})`
        };

    }

    getAttrValues(tag: any, attr: any) {
        let attrItem = this.getAttrItem(tag, attr);
        let options = attrItem && attrItem.options;
        if (!options && attrItem) {
            if (attrItem.type === "boolean") {
                options = ["true", "false"];
            } else if (attrItem.type === "icon") {
                options = ATTRS["icons"];
            } else if (attrItem.type === "shortcut-icon") {
                options = [];
                ATTRS["icons"].forEach((icon: string) => {
                    options.push(icon.replace(/^el-icon-/, ""));
                });
            }
        }
        return options || [];
    }

    getTagAttrs(tag: string) {
        return (ATTRS[tag] && Object.keys(ATTRS[tag]["attrs"])) || [];
    }

    getTagEvents(tag: string) {
        return (ATTRS[tag] && Object.keys(ATTRS[tag]["events"])) || [];
    }

    getAttrItem(tag: string | undefined, attr: string | undefined) {
        return ATTRS[`${tag}/${attr}`] || ATTRS[attr];
    }

    isAttrValueStart(tag: Object | string | undefined, attr: any) {
        return tag && attr;
    }

    isAttrStart(tag: TagObject | undefined) {
        return tag.isAttrStart;

    }

    firstCharsEqual(str1: string, str2: string) {
        if (str2 && str1) {
            return str1[0].toLowerCase() === str2[0].toLowerCase();
        }
        return false;
    }
    // tentative plan for vue file
    inTemplate(): boolean {
        let line = this._position.line;
        while (line >= 0) {
            if (/^\s*<template.*>\s*$/.test(<string>this._document.lineAt(line).text)) {
                return true;
            }
            line--;
        }
        return false;
    }

    provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken): ProviderResult<CompletionItem[] | CompletionList> {
        this._document = document;
        this._position = position;
        let tag: TagObject | string | undefined = this.getPreTag();
        let attr = this.getPreAttr();
        if (this.isAttrValueStart(tag, attr)) {
            return this.getAttrValueSuggestion(tag.text, attr);
        } else if (this.isAttrStart(tag)) {
            return this.getAttrSuggestion(tag.text);
        } else if (tag) {
            let text = this.getTextBeforePosition(this._position);
            if (!/(<|<?[\w-]+)$/.test(text)) {
                return [];
            }
            switch (document.languageId) {
                case "vue":
                    return this.inTemplate()
                        ? this.getTagSuggestion()
                        : [];
                case "html":
                    return this.getTagSuggestion();
            }
        } else { return []; }
    }

}

// export class WinDocsContentProvider implements TextDocumentContentProvider {
//     private _onDidChange = new EventEmitter<Uri>();

//     get onDidChange(): Event<Uri> {
//         return this._onDidChange.event;
//     }

//     public update(uri: Uri) {
//         this._onDidChange.fire(uri);
//     }

//     provideTextDocumentContent(uri: Uri, token: CancellationToken): string | Thenable<string> {
//         return HTML_CONTENT(decodeDocsUri(uri));
//     }
// }