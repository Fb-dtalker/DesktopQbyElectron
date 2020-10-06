const fs = require('fs');
const { types } = require('util');

//工具类，都能调用
class DqUtils {
    static IsUndefined(target) {
        return typeof(target) == "undefined";
    }

    static IsFunction(target) {
        return typeof target === "function";
    }

    static IsArray(target) {
        if (!Array.isArray) {
            Array.isArray = function(arg) {
                return Object.prototype.toString.call(arg) === '[object Array]';
            };
        }
        return Array.isArray(target)
    }

    static GetType(obj) {
        var type = Object.prototype.toString.call(obj).match(/^\[object (.*)\]$/)[1].toLowerCase();
        if (type === 'string' && typeof obj === 'object') return 'object'; // Let "new String('')" return 'object'
        if (obj === null) return 'null'; // PhantomJS has type "DOMWindow" for null
        if (obj === undefined) return 'undefined'; // PhantomJS has type "DOMWindow" for undefined
        return type;
    }

    static Map2Object(mapObj) {
        let obj = {};
        for (let [key, value] of mapObj) {
            obj[key] = value;
        }
        return obj;
    }

    static Object2Map(obj) {
        let obj_keys = Object.keys(obj);
        let mapObj = new Map();

        for (let item of obj_keys) {
            mapObj.set(item, obj[item]);
        }
        return mapObj;
    }

    static ReadFileSync(filePath, encoding = 'utf-8') {
        if (fs.existsSync(filePath)) {
            return fs.readFileSync(filePath, encoding);
        }
        return null;
    }

    static WriteFileSync(filePath, data, encoding = 'utf-8') {
        fs.writeFileSync(filePath, data, encoding = encoding);
    }

    static MkdirSync(dirPath, recursive = true) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, recursive = recursive)
        }
    }

    static Object2Json(obj) {
        return JSON.stringify(obj);
    }

    static Json2Object(json) {
        return JSON.parse(json);
    }

    static Map2Json(map) {
        // DqUtils.ThrowMessageBox("", DqUtils.GetType(map));
        return JSON.stringify([...map]);
    }

    static Json2Map(json) {
        return new Map(JSON.parse(json));
    }

    static ThrowMessageBox(title = "title", content) {
        let { dialog } = require('electron')
        let inMain = true;
        if (dialog == null) {
            var { remote } = require('electron')
            dialog = remote.dialog;
            inMain = false;
            title = title + "(在渲染进程中调用)"
        }

        dialog.showMessageBox({
            "title": title,
            "message": "" + content
        })
    }

    static ThrowWindow(winOption = null, loadFile = null) {
        winOption = winOption == null ? {
            width: 800,
            height: 600,
            webPreferences: {
                nodeIntegration: true
            },
            frame: true,
            transparent: false,
            resizable: true,
            skipTaskbar: true, //隐藏任务栏
            title: ""
        } : winOption;

        let { dialog } = require('electron')
        let BrowserWindow = null;
        if (dialog == null) {
            var { remote } = require('electron')
            BrowserWindow = remote.BrowserWindow;
        }

        let win = new BrowserWindow(winOption)
        if (loadFile != null) {
            win.loadFile(loadFile)
        }

        return win;
    }

    //通过这个方法只能拿到配置
    static GetGlobal(key = "dqglobal") {
        let { remote } = require("electron"); //引入remote模块，通过remote模块在渲染进程中使用electron各模块
        if (remote == null) {
            return global[key];
        }
        return remote.getGlobal(key);
    }
}

//可以让这个类能够被nodejs和html引用
if (module != null) {
    module.exports = { DqUtils };
}