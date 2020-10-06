DqUtils = require('./dqutils').DqUtils;
const { screen, BrowserWindow } = require('electron');


//原则上只允许主线程调用
class DqDisplay {
    constructor() {
        this.instance = null;
        this.displays = null;
        this._showingWindow = [];

        this.RefreshDisplays();

        screen.on("display-added", (event, newDisplay) => {
            const { screen } = require('electron');
            this.displays = screen.getAllDisplays();
        })

        screen.on("display-removed", (event, newDisplay) => {
            const { screen } = require('electron');
            this.displays = screen.getAllDisplays();
        })
    }

    _testWindow = null;
    ShowSignWindows() {
        if (this._testWindow != null) {
            return;
        }
        this.RefreshDisplays();
        this._testWindow = [];
        for (let index = 0; index < this.displays.length; ++index) {
            this._testWindow[index] = new BrowserWindow({
                width: 300,
                height: 300,
                webPreferences: {
                    nodeIntegration: true
                },
                frame: false,
                transparent: true,
                resizable: false,
                skipTaskbar: true, //隐藏任务栏
                x: this.displays[index].bounds.x + 10,
                y: this.displays[index].bounds.y + 10
            });
            this._testWindow[index].WindowIndex = index;
            this._testWindow[index].setAlwaysOnTop(true, "pop-up-menu");

            this._testWindow[index].loadFile('code/html/showsignwindow.html');
        }

        setTimeout(() => {
            for (let index = 0; index < this._testWindow.length; ++index) {
                this._testWindow[index].close();
            }
            this._testWindow = null;
        }, 5000)
    }

    RefreshDisplays() {
        this.displays = screen.getAllDisplays();
    }

    GetDisplays() {
        this.displays = screen.getAllDisplays();
        return this.displays;
    }

    //返回值{x:,y:}
    GetDisplayOffset(index = 0) {
        if (index >= this.displays.length) {
            return { x: 0, y: 0 };
        }
        return this.displays[index].bounds;
    }

    _showingWindow = null;
    CleanWindow(index) {
        if (index == null) {
            for (let i = 0; i < this._showingWindow.length; ++i) {
                this._showingWindow[i].close();
                this._showingWindow[i] = null;
            }
            this._showingWindow = [];
        }
        if (index < this._showingWindow.length) {
            this._showingWindow[index].close();
            this._showingWindow.splice(index, 1);
        }
    }
    CleanScreen(index = null) {
        if (index == null) {
            this.CleanWindow();
        }
        let screen2window = this.GetScreen2WindowsMap();
        if (screen2window[index] == null) {
            return;
        }
        for (let i = 0; i < screen2window[index].length; ++i) {
            this._showingWindow[screen2window[index][i]].close();
            this._showingWindow[screen2window[index][i]] = null;
        }
        this._showingWindow = this._showingWindow.filter((element) => { return element != null })
    }
    GetScreen2WindowsMap() {
        let list = [];
        for (let i = 0; i < this.displays.length; i++) {
            list[i] = [];
            for (let ii = 0; ii < this._showingWindow.length; ii++) {
                if (this._showingWindow[ii].getBounds().x == this.displays[i].bounds.x) {
                    list[i].push(ii);
                }
            }
        }
        return list;
    }

    AddWindow(win, displayIndex = null) {
        if (this._showingWindow == null) {
            this._showingWindow = [];
        }
        if (displayIndex != null) {
            win.setBounds(this.GetDisplayOffset(displayIndex));
        }
        this._showingWindow.push(win);
    }
    GetWindow(index = null) {
        if (index == null) {
            return this._showingWindow;
        }
        return this._showingWindow[index];
    }
    HandleWindow(index, handle) {
        if (index == null) {
            for (let i = 0, len = this._showingWindow.length; i < len; ++i) {
                handle(this._showingWindow[i]);
            }
        } else {
            handle(this._showingWindow[index]);
        }
    }

    GetWindowsByScreen(index = null) {
        if (index == null) {
            return null;
        }
        let map = this.GetScreen2WindowsMap();
        let winIndexs = map[index];
        let wins = [];
        if (winIndexs.length > 0) {
            for (let i = 0; i < winIndexs.length; ++i) {
                wins.push(this._showingWindow[i]);
            }
        }
        return wins;
    }

    static GetInstance() {
        if (!this.instance) {
            this.instance = new DqDisplay();
        }
        return this.instance;
    }
}


if (module != null) {
    module.exports = { DqDisplay };
}