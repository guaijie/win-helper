## 开发流程说明

### 生成扩展（vscode extension）

1. 首先全局安装 `yo` and `generator-code`

    `npm install -g yo generator-code`

2. 在终端使用 `yo code` 命令来创建一个扩展

3. 选中指定的扩展类型（大多采用第一种）,完成接下来的交互式问题

4. 此时会生成一个*vscode extension*的项目，目录大致如下：

![img](https://i.postimg.cc/43zMYKn4/dir.png)

5. 查看 *package.json* 中的 `engines.vscode` 版本是否小于等于 *vscode* 编辑器版本（点击编辑器的*帮助/关于*）
```
{
    // 插件的名字，应全部小写，不能有空格
    "name": "vscode-plugin-demo",
    // 插件的友好显示名称，用于显示在应用市场，支持中文
    "displayName": "VSCode插件demo",
    // 描述
    "description": "VSCode插件demo集锦",
    // 关键字，用于应用市场搜索
    "keywords": ["vscode", "plugin", "demo"],
    // 版本号
    "version": "1.0.0",
    // 发布者，如果要发布到应用市场的话，这个名字必须与发布者一致
    "publisher": "sxei",
    // 表示插件最低支持的vscode版本
    "engines": {
        "vscode": "^1.38.1"
    },
    // 插件应用市场分类，可选值： [Programming Languages, Snippets, Linters, Themes, Debuggers, Formatters, Keymaps, SCM Providers, Other, Extension Packs, Language Packs]
    "categories": [
        "Other"
    ],
    // 插件图标，至少128x128像素
    "icon": "images/icon.png",
    // 扩展的激活事件数组，可以被哪些事件激活扩展，后文有详细介绍
    "activationEvents": [
        "onCommand:extension.sayHello"
    ],
    // 插件的主入口
    "main": "./src/extension",
    // 贡献点，整个插件最重要最多的配置项
    "contributes": {
        // 插件配置项
        "configuration": {
            "type": "object",
            // 配置项标题，会显示在vscode的设置页
            "title": "vscode-plugin-demo",
            "properties": {
                // 这里我随便写了2个设置，配置你的昵称
                "vscodePluginDemo.yourName": {
                    "type": "string",
                    "default": "guest",
                    "description": "你的名字"
                },
                // 是否在启动时显示提示
                "vscodePluginDemo.showTip": {
                    "type": "boolean",
                    "default": true,
                    "description": "是否在每次启动时显示欢迎提示！"
                }
            }
        },
        // 命令
        "commands": [
            {
                "command": "extension.sayHello",
                "title": "Hello World" 
            }
        ],
        // 快捷键绑定
        "keybindings": [
            {
                "command": "extension.sayHello",
                "key": "ctrl+f10",
                "mac": "cmd+f10",
                "when": "editorTextFocus"
            }
        ],
        // 菜单
        "menus": {
            // 编辑器右键菜单
            "editor/context": [
                {
                    // 表示只有编辑器具有焦点时才会在菜单中出现
                    "when": "editorFocus",
                    "command": "extension.sayHello",
                    // navigation是一个永远置顶的分组，后面的@6是人工进行组内排序
                    "group": "navigation@6"
                },
                {
                    "when": "editorFocus",
                    "command": "extension.demo.getCurrentFilePath",
                    "group": "navigation@5"
                },
                {
                    // 只有编辑器具有焦点，并且打开的是JS文件才会出现
                    "when": "editorFocus && resourceLangId == javascript",
                    "command": "extension.demo.testMenuShow",
                    "group": "z_commands"
                },
                {
                    "command": "extension.demo.openWebview",
                    "group": "navigation"
                }
            ],
            // 编辑器右上角图标，不配置图片就显示文字
            "editor/title": [
                {
                    "when": "editorFocus && resourceLangId == javascript",
                    "command": "extension.demo.testMenuShow",
                    "group": "navigation"
                }
            ],
            // 编辑器标题右键菜单
            "editor/title/context": [
                {
                    "when": "resourceLangId == javascript",
                    "command": "extension.demo.testMenuShow",
                    "group": "navigation"
                }
            ],
            // 资源管理器右键菜单
            "explorer/context": [
                {
                    "command": "extension.demo.getCurrentFilePath",
                    "group": "navigation"
                },
                {
                    "command": "extension.demo.openWebview",
                    "group": "navigation"
                }
            ]
        },
        // 代码片段
        "snippets": [
            {
                "language": "javascript",
                "path": "./snippets/javascript.json"
            },
            {
                "language": "html",
                "path": "./snippets/html.json"
            }
        ],
        // 自定义新的activitybar图标，也就是左侧侧边栏大的图标
        "viewsContainers": {
            "activitybar": [
                {
                    "id": "language",
                    "title": "语言",
                    "icon": "images/beautifulGirl.svg"
                }
            ]
        },
        // 自定义侧边栏内view的实现
        "views": {
            // 和 viewsContainers 的id对应
            "beautifulGirl": [
                {
                    "id": "js",
                    "name": "js"
                },
                {
                    "id": "java",
                    "name": "java"
                },
                {
                    "id": "go",
                    "name": "go"
                }
            ]
        },
        // 图标主题
        "iconThemes": [
            {
                "id": "testIconTheme",
                "label": "测试图标主题",
                "path": "./theme/icon-theme.json"
            }
        ]
    },
    // 同 npm scripts
    "scripts": {
		"vscode:prepublish": "npm run compile",
		"compile": "tsc -p ./",
		"watch": "tsc -watch -p ./",
		"pretest": "npm run compile",
		"test": "node ./out/test/runTest.js"
	},
    // 开发依赖
	"devDependencies": {
		"@types/glob": "^7.1.1",
		"@types/mocha": "^5.2.6",
		"@types/node": "^10.12.21",
		"@types/vscode": "^1.38.0",
		"glob": "^7.1.4",
		"mocha": "^6.1.4",
		"tslint": "^5.12.1",
		"typescript": "^3.3.1",
		"vscode-test": "^1.2.0"
	},
    // 后面这几个应该不用介绍了
    "license": "SEE LICENSE IN LICENSE.txt",
    "bugs": {
        "url": "https://github.com/sxei/vscode-plugin-demo/issues"
    },
    "repository": {
        "type": "git",
        "url": "https://github.com/sxei/vscode-plugin-demo"
    },
    // 主页
    "homepage": "https://github.com/sxei/vscode-plugin-demo/blob/master/README.md"
}
```

6. 若版本不满足则修改 `engines.vscode` 或者升级 *vscode*（若修改`engines.vscode` 则需重新安装 `@types/vscode` 版本）

### 测试扩展

1. 项目的主入口文件为 *src/extension.[ts|js]*

2. 在 *extension* 文件中编写好代码后按 `F5` 启动扩展程序进行代码测试。（或者打开活动栏中的调试，点击 *run extension* 启动扩展程序）

![img](https://i.postimg.cc/9f3KXPmN/run-extension.png)

3. 此时 *vscode* 会重新打开一个窗口，窗口标题为 *[扩展开发宿主]*，若启动过程中，宿主弹出 *版本的错误* 则回到 *生成扩展的第6步* 

4. 按住 `ctrl+shift+p` 后，输入 `Hello World` 若弹出信息 *Hello World* ,表示扩展程序成功运行

![img](https://i.postimg.cc/R0HmXVF2/cmd.png)
![img](https://i.postimg.cc/HkKHw7pQ/message.png)

5. 修改 *extention* 文件中的 `vscode.window.showInformationMessage("修改后的信息");`
![img](https://i.postimg.cc/0QP4D8JY/update-msg.png)

6. 重新启动扩展程序，*重复第4步* 若弹出自定义的信息，则可进行接下来的插件开发

### 发布插件

1. 全局安装 `vsce`，需要通过命令发布插件

    `npm install -g vsce`

2. 注册一个 *microsoft* 账户

![img](https://i.postimg.cc/Rh9v35vy/microsoft-account.png)

3. 访问： https://aka.ms/SignupAzureDevOps ，如果你从来没有使用过Azure，那么会看到如下提示：

![img](https://i.postimg.cc/DzJvHPCj/azure.png)

4. 创建令牌

    默认进入组织的主页后，点击右上角的Security：

![img](https://i.postimg.cc/xdwf2Nh0/security.png)

*点击创建新的个人访问令牌，这里特别要注意Organization要选择all accessible organizations，Scopes要选择Full access，否则后面发布会失败。*

![img](https://i.postimg.cc/qR2kMMH2/token.png)

5. 使用vsce创建发布账户

    `vsce create-publisher your-publisher-name`
    <br/>
    *your-publisher-name必须是字母数字下划线，这是全网唯一的账号，然后会依次要求输入昵称、邮箱、令牌*

6. 发布vscode插件
    `vsce publish`


### 附加说明

1. 注意事项
    - README.md文件默认会显示在插件主页；
    - README.md中的资源必须全部是HTTPS的，如果是HTTP会发布失败；
    - CHANGELOG.md会显示在变更选项卡；
    - 如果代码是放在git仓库并且设置了repository字段，发布前必须先提交git，否则会提示Git working directory not clean

2. 修改版本

    - 升级补丁号：npm version patch

    - 升级小版本号：npm version minor

    - 升级大版本号：npm version major

3. 取消发布

    `vsce unpublish (publisher name).(extension name)`