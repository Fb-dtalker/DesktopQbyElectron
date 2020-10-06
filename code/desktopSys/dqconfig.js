if (typeof DqUtils == "undefined" || DqUtils == null) {
    let remote = require('electron').remote
    if (remote != null || typeof remote != 'undefined') {
        DqUtils = remote.require('./code/desktopSys/dqutils').DqUtils;
    } else {
        DqUtils = require('./dqutils').DqUtils;
    }
}
//可以在多种情况下通过require载入函数库

class DqConfig {
    appPath = "";
    _baseDir = "/config";
    _sysConfigFile = "/sysconfig.cf";
    _dataConfigFile = "/dataconfig.cf";

    _sysConfig = null;
    _dataConfig = null;
    _elseConfig = {};

    constructor() {
        let { app } = require('electron');
        this.appPath = app.getAppPath(); //获得的是H:\目录\目录

        DqUtils.MkdirSync(this.ConfigBasePath);

        this.StartConfig();
    }

    StartConfig() {
        this.LoadSysConfig();
        this.LoadDataConfig();
        this.instance = null;

        if (this._sysConfig.get('elseConfig') != null) {
            let ep = this._sysConfig.get('elseConfig');

            for (let key in ep) {
                this._elseConfig[key] = this.LoadConfig(this.ConfigBasePath + ep[key]);
            }
        }

        let { app, ipcMain } = require('electron');
        app.on('before-quit', (event) => {
            this.EndConfig();
        });
        // app.on('before-quit', (event) => { DqUtils.ThrowMessageBox("关闭测试", "测试1") }); //.on是把函数调用加入到责任链一样的东西里面，也就是说on不管多少下都能被调用
        // app.on('before-quit', (event) => { DqUtils.ThrowMessageBox("关闭测试", "测试2") });
    }

    EndConfig() {
        let elseConfigTemp = {};
        for (let key in this._elseConfig) {
            let fileName = "/" + key + ".cf";
            elseConfigTemp[key] = fileName;

            this.SaveConfig(this.ConfigBasePath + fileName, this._elseConfig[key]);
        }
        this._sysConfig.set('elseConfig', elseConfigTemp);

        this.SaveDataConfig();
        this.SaveSysConfig();
    }

    AddElseConfig(key, map, clear = false) {
        if (clear && this._elseConfig[key] != null) {
            this._elseConfig[key] = new Map([...this._elseConfig[key], ...map]);
        } else {
            this._elseConfig[key] = map;
        }
        return this._elseConfig[key];
    }
    GetElseConfig(key, instead = null) {
        if (this._elseConfig[key] != null) {
            return this._elseConfig[key];
        }
        return instead;
    }
    RemoveElseConfig(key) {
        if (this._elseConfig[key] != null) {
            this._elseConfig[key].clear();
        } else {
            return false;
        }

        this._elseConfig[key] = null;
        return true;
    }

    get ConfigBasePath() {
        return this.appPath + this._baseDir;
    }
    set ConfigBasePath(p) {}

    get ConfigSysFilePath() {
        return this.appPath + this._baseDir + this._sysConfigFile;
    }
    set ConfigSysFilePath(p) {}
    get ConfigSys() {
        return this._sysConfig;
    }
    set ConfigSys(config) {}

    get ConfigDataFilePath() {
        return this.appPath + this._baseDir + this._dataConfigFile;
    }
    set ConfigDataFilePath(p) {}
    get ConfigData() {
        return this._dataConfig;
    }
    set ConfigData(config) {}

    SetConfig(key, value, content = 'data') {
        content = content || 'data';
        switch (content) {
            case 'data':
                this._dataConfig.set(key, value);
                break;
            case 'sys':
                this._sysConfig.set(key, value);
                break;
            default:
                if (this._elseConfig[content] == null) {
                    this._elseConfig[content] = new Map();
                }
                this._elseConfig[content].set(key, value);
        }
    }
    GetConfig(key, content = 'data') {
        content = content || 'data'
        switch (content) {
            case 'data':
                return this._dataConfig.get(key);
            case 'sys':
                return this._sysConfig.delete(key);
            default:
                if (this._elseConfig[content] == null) {
                    break;
                }
                return this._elseConfig[content].get(key);
        }
        return null;
    }
    DelConfig(key, content = 'data') {
        switch (content) {
            case 'data':
                this._dataConfig.delete(key);
                break;
            case 'sys':
                this._sysConfig.delete(key);
                break;
            default:
                if (this._elseConfig[content] == null) {
                    break;
                }
                this._elseConfig[content].delete(key);
        }
    }

    SaveSysConfig() {
        this.SaveConfig(this.ConfigSysFilePath, this._sysConfig);
    }
    LoadSysConfig() {
        this._sysConfig = this.LoadConfig(this.ConfigSysFilePath);
    }

    SaveDataConfig() {
        this.SaveConfig(this.ConfigDataFilePath, this._dataConfig)
    }
    LoadDataConfig() {
        this._dataConfig = this.LoadConfig(this.ConfigDataFilePath);
    }

    SaveConfig(path, configMap, encoding = 'utf-8') {
        DqUtils.WriteFileSync(path, DqUtils.Map2Json(configMap), encoding);
    }
    LoadConfig(path, encoding = 'utf-8') {
        let readData = DqUtils.ReadFileSync(path, encoding);
        if (readData == null) {
            return new Map();
        }
        return DqUtils.Json2Map(readData);
    }

    static GetInstance() {
        if (!this.instance) {
            this.instance = new DqConfig();
        }
        return this.instance;
    }
}

if (module != null) {
    module.exports = { DqConfig };
}