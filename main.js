const { app, BrowserWindow, ipcMain, Menu, Tray } = require('electron')
const path = require('path')
const { DqUtils } = require('./code/desktopSys/dqutils')
const { DqSystem } = require('./code/desktopSys/dqsystem')
const { DqConfig } = require('./code/desktopSys/dqConfig')
const { DqDisplay } = require('./code/desktopSys/dqdisplay')
const dqConfig = require('./code/desktopSys/dqConfig')

let dqglobal = {}
global.dqglobal = dqglobal; //给到全局

dqglobal.dqSys = null; //对主线程负责
dqglobal.dqWebpages = []; //对渲染线程负责
dqglobal.dqConfig = null; //对配置项负责
dqglobal.dqDisplay = null; //对显示器负责

dqglobal.uiObject = {};
dqglobal.uiObject.tray = null;
dqglobal.uiObject.contextMenu = null;
dqglobal.uiObject.explainWindow = null;

dqglobal.globalFunction = {}; //在里面给全局函数

dqglobal.canClose = false; //避免关闭全部窗口后退出的临时flag，以后会修掉

//阻止多开
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
    app.quit()
}


function DQInit() {
    let { ipcMain } = require('electron')

    //callback = (event, param={}) => {}
    function AddEvent(key, callback) {
        dqglobal.dqSys.AddEventFunction(key, callback)
    }

    function DelEvent(key) {
        return dqglobal.dqSys.DelEventFunction(key);
    }

    // AddEvent("test", (event, param = {}) => {
    //     DqUtils.ThrowMessageBox("TEST", "测试：" + param);
    // });

    //DelEvent("test")

    ipcMain.on('dqMessage4r2m', (event, idName, callback = null, param = {}) => {
        if (callback == null) {
            callback = dqglobal.dqSys.GetEventFunction(idName, callback);
        }
        if (DqUtils.IsFunction(callback)) {
            callback(event, param);
        }
    });

    //param = {windowOption:, loadFile:,  displayIndex:}
    AddEvent("CreateWindow4Effect", (event, param = {}) => {
        param.windowOption = param.windowOption || {
            width: 800,
            height: 600,
            webPreferences: {
                nodeIntegration: true
            },
            frame: false,
            transparent: true,
            resizable: false,
            skipTaskbar: true //隐藏任务栏
        };
        let win = new BrowserWindow(param.windowOption);
        dqglobal.dqDisplay.AddWindow(win, param.displayIndex);

        win.setAlwaysOnTop(true, "pop-up-menu")
        win.setFullScreen(true)

        if (param.loadFile != null) {
            win.loadFile(param.loadFile);
        }
    });

    //param={key:, value:, content:}
    AddEvent("SetConfig", (event, param) => {
        let dqConfig = DqConfig.GetInstance();
        dqConfig.SetConfig(param.key, param.value, param.content);
    });

    //避免窗口关闭后退出
    app.on('before-quit', (event) => {
        if (!dqglobal.canClose) {
            event.preventDefault();
        }
    })
}

function createRclick() {
    let contextMenuTemplate = [{
            label: '撤销',
            role: 'undo',
        },
        {
            label: '恢复',
            role: 'redo',
        },
        {
            type: 'separator',
        },
        {
            label: '截切',
            role: 'cut',
        },
        {
            label: '复制',
            role: 'copy',
        },
        {
            label: '黏贴',
            role: 'paste',
        },
        {
            type: 'separator',
        }, // 分隔线
        {
            label: '全选',
            role: 'selectall',
        },
        // Select All菜单项
    ];

    const contextMenu = Menu.buildFromTemplate(contextMenuTemplate);
    // 监听右键事件
    ipcMain.on('contextMenu', () => {
        contextMenu.popup(BrowserWindow.getFocusedWindow());
    });

    return contextMenu;
}

function createTray() {
    let trayIcon = path.join(__dirname, 'static/');
    let tray = new Tray(path.join(trayIcon, 'xiwu_head.png'))
    let trayMenu = Menu.buildFromTemplate([{
            label: '显示/隐藏', //设置单个菜单项名称
            click: function() { //设置单个菜单项点击事件
                    dqglobal.dqDisplay.HandleWindow(null, (win) => {
                        win.isVisible() ? win.hide() : win.show();
                    });
                } //打开相应页面
        }, {
            label: '设置',
            click: function() {
                dqglobal.dqSys.CreateSettingWindow();
            }
        }, {
            label: '关于...',
            click: function() {
                if (dqglobal.uiObject.explainWindow != null && !dqglobal.uiObject.explainWindow.isDestroyed()) {
                    dqglobal.uiObject.explainWindow.show();
                    return;
                }
                dqglobal.uiObject.explainWindow = new BrowserWindow({
                    width: 800,
                    height: 600,
                    webPreferences: {
                        nodeIntegration: true
                    },
                    frame: true,
                })
                dqglobal.uiObject.explainWindow.loadFile('code/html/message.html');
            }
        },
        {
            label: '退出',
            click: function() {
                dqglobal.canClose = true;
                app.quit();
            }
        }
    ])

    tray.setToolTip('FB DesktopQ');
    tray.setContextMenu(trayMenu);

    let doubleclick4TaryEvent = function() {
        dqglobal.dqDisplay.HandleWindow(null, (win) => {
            win.show();
        });
    }
    tray.addListener('double-click', doubleclick4TaryEvent);

    return tray;
}

function createWindow() {
    // 创建浏览器窗口


    dqglobal.dqConfig = DqConfig.GetInstance();
    dqglobal.dqDisplay = DqDisplay.GetInstance();
    dqglobal.dqSys = new DqSystem(dqglobal.dqConfig);
    DQInit();

    { //这里是临时代码区，到时候一定会删掉修改的
        if (dqglobal.dqConfig.GetConfig("nofirstOpen") == null) {
            dqglobal.dqSys.CreateSettingWindow();
        } else {
            let activeDisplay = dqglobal.dqConfig.GetConfig("activeDisplay", null) || {};
            //{display0:1,display1:0}
            let activeEffect = dqglobal.dqConfig.GetConfig("activeEffect", null) || {};
            //{display0:["",""...], display1:[]...}

            let keys = Object.keys(activeDisplay);
            for (let i = 0; i < keys.length; ++i) {
                if (activeDisplay[keys[i]] == null || activeDisplay[keys[i]] == 0) {
                    continue;
                }
                let key = keys[i];
                let win = new BrowserWindow({
                    width: 800,
                    height: 600,
                    webPreferences: {
                        nodeIntegration: true
                    },
                    frame: false,
                    transparent: true,
                    resizable: false,
                    skipTaskbar: true //隐藏任务栏
                });
                dqglobal.dqDisplay.AddWindow(win, parseInt(key.replace("display", "")))
                win.loadFile("index.html")
                let effects = activeEffect[key];
                for (let ii = 0; ii < effects.length; ++ii) {
                    //DqUtils.ThrowMessageBox("加载效果", effects[ii]);
                    setTimeout(() => { win.webContents.send("dqMessage4m2r", "showEffect", null, { key: effects[ii] }); }, 1500)
                }
            }
        }
        dqglobal.dqConfig.SetConfig("nofirstOpen", true);
    }

    // dqglobal.dqDisplay.AddWindow(new BrowserWindow({
    //     width: 800,
    //     height: 600,
    //     webPreferences: {
    //         nodeIntegration: true
    //     },
    //     frame: false,
    //     transparent: true,
    //     resizable: false,
    //     skipTaskbar: true //隐藏任务栏
    // })) //新加特效窗口的方法
    dqglobal.uiObject.tray = createTray();
    dqglobal.uiObject.rclickbox = createRclick();
}

app.whenReady().then(createWindow)