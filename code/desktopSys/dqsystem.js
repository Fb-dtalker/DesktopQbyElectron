if (typeof DqUtils == "undefined" || DqUtils == null) {
    let remote = require('electron').remote
    if (remote != null || typeof remote != 'undefined') {
        DqUtils = remote.require('./code/desktopSys/dqutils').DqUtils;
    } else {
        DqUtils = require('./dqutils').DqUtils;
    }
}
//可以在多种情况下通过require载入函数库

//在nodejs主进程里跑
class DqSystem {
    _globalData = null;
    _eventFunctions = null;
    _config = null;

    constructor(config) {
        this._globalData = new Map()
        this._eventFunctions = new Map()
        this._config = config;
    }

    get globalData() {
        return this._globalData;
    }
    set globalData(kv) {
        if (kv != null) {
            if (kv instanceof Map) {
                this._globalData = [...this._globalData, ...kv];
            } else if (typeof kv == "object") { //传入的是对象的话只能是{'key':,'value':}形式
                this._globalData.set(kv["key"], kv["value"]);
            }
        }
    }
    GetGlobalDataCopy() {
        return new Map(this.globalData());
    }
    GetData(key, instead = undefined) {
        if (this._globalData.has(key)) {
            return this._globalData[key];
        }
        return instead;
    }
    SetData(key, value) {
        this._globalData.set(key, value);
    }

    //callback函数类型：function(param={}){}
    AddEventFunction(eventKey, callback, replace = true) {
        if (!replace) {
            if (this._eventFunctions.has(eventKey)) {
                return false;
            }
        }
        this._eventFunctions.set(eventKey, callback);
        return true;
    }

    //callback函数类型：function(param={}){}
    GetEventFunction(eventKey, instead = null) {
        return this._eventFunctions.has(eventKey) ? this._eventFunctions.get(eventKey) : instead;
    }

    DelEventFunction(eventKey) {
        if (!this._eventFunctions.has(eventKey)) {
            return false;
        }
        this._eventFunctions.delete(eventKey);
        return true;
    }

    _settingWindow = null;
    CreateSettingWindow(winOption = null, loadFile = null) {
        if (this._settingWindow != null) {
            this._settingWindow.show();
            return;
        }

        loadFile = loadFile || 'code/html/settingwindow.html';
        winOption = winOption || {
            width: 800,
            height: 600,
            webPreferences: {
                nodeIntegration: true
            },
            frame: true,
            transparent: false,
            resizable: true,
            skipTaskbar: true, //隐藏任务栏
            title: "设置窗口"
        };
        let { BrowserWindow } = require('electron');
        this._settingWindow = new BrowserWindow(winOption);
        this._settingWindow.loadFile(loadFile);
        this._settingWindow.on("close", (event) => {
            this._settingWindow = null;
        })
    }

}

module.exports = { DqSystem };