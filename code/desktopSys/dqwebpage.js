//注意,如果在渲染进程里面载入过了dqutils.js再定义一次就会报错
if (typeof DqUtils == "undefined" || DqUtils == null) {
    let remote = require('electron').remote
    if (remote != null || typeof remote != 'undefined') {
        DqUtils = remote.require('./code/desktopSys/dqutils').DqUtils;
    } else {
        DqUtils = require('./dqutils').DqUtils;
    }
}
//可以在多种情况下通过require载入函数库

//用来单独处理每次屏保页面的事件等响应
class DqWebpage {

    currentSelected4Drog = {
        currentObject: null,
        oLeft: null,
        oRight: null,
        moving: false
    }

    constructor(win, doc) {
        this._window = win;
        this._document = doc;
        this._pageEvent = new Map();
        this._pageEffects = new Map();

        this.mouseEventFunction4Drag = {
            mouseDown: this.mouseDown.bind(this),
            mouseMove: this.mouseMove.bind(this),
            mouseUp: this.mouseUp.bind(this)
        }

        this.ignoreEventFunction4MouseEvent = {
            ignore: this.IgnoreMouseEvent.bind(this),
            accept: this.AcceptMouseEvent.bind(this)
        }

        this.rclickEvent = this.origal_rclickEvent.bind(this)

        // DqUtils.ThrowMessageBox("创建DqWebpage", "" + (doc == null ? 1 : 2));

        this._eventFunctions = new Map();

        let ipcRenderer = require('electron').ipcRenderer;
        ipcRenderer.on('dqMessage4m2r', (event, idName, callback = null, param = {}) => {
            callback = callback || this.GetEventFunction(idName, callback);
            if (callback == null) {
                return;
            }
            if (DqUtils.IsFunction(callback)) {
                callback(event, param);
            }
        });

        win.webpage = this;
    }

    IgnoreMouseEvent() {
        this.Window.setIgnoreMouseEvents(true, {
            forward: true
        })
    }
    AcceptMouseEvent() {
        this.Window.setIgnoreMouseEvents(false)
    }
    AddMouseEventListenerByID(targetID, enterIgnore = false) {
        let targetObj = this.Document.getElementById(targetID)
        if (targetObj == null) {
            return false;
        }
        this.AddMouseEventListener(targetObj, enterIgnore);
    }
    RemoveMouseEventListenerByID(targetID, enterIgnore = false) {
        let targetObj = this.Document.getElementById(targetID)
        if (targetObj == null) {
            return false;
        }
        this.RemoveMouseEventListener(targetObj, enterIgnore);
    }
    AddMouseEventListener(targetObjs, enterIgnore = false) {
        let doFunc4Object = function(targetObj, callbackEnter, callbackLeave) {
            targetObj.addEventListener('mouseleave', callbackLeave)
            targetObj.addEventListener('mouseenter', callbackEnter)
        }

        let doFunc4Backgroud = function(targetObj, callbackEnter) {
            targetObj.addEventListener('mouseenter', callbackEnter)
            callbackEnter();
        }
        if (targetObjs.length > 0) {
            for (let index = 0, len = targetObjs.length; index < len; ++index) {
                doFunc4Object(targetObjS[index], this.ignoreEventFunction4MouseEvent.accept, this.ignoreEventFunction4MouseEvent.ignore)
            }
        } else {
            if (enterIgnore) {
                doFunc4Backgroud(targetObjs, this.ignoreEventFunction4MouseEvent.ignore)
            } else {
                doFunc4Object(targetObjs, this.ignoreEventFunction4MouseEvent.accept, this.ignoreEventFunction4MouseEvent.ignore)
            }
        }
    }
    RemoveMouseEventListener(targetObjs, enterIgnore = false) {
        if (targetObjs.length > 0) {
            for (let index = 0, len = targetObjs.length; index < len; ++index) {
                targetObjs[index].removeEventListener('mouseleave', this.ignoreEventFunction4MouseEvent.ignore)
                targetObjs[index].removeEventListener('mouseenter', this.ignoreEventFunction4MouseEvent.accept)
            }
        } else {
            if (enterIgnore) {
                targetObjs.removeEventListener('mouseenter', this.ignoreEventFunction4MouseEvent.ignore)
            } else {
                targetObjs.removeEventListener('mouseleave', this.ignoreEventFunction4MouseEvent.ignore)
                targetObjs.removeEventListener('mouseenter', this.ignoreEventFunction4MouseEvent.accept)
            }
        }
    }

    AddMouseDragElementByID(targetID, add = true) {
        let targetObj = this.Document.getElementById(targetID)
        if (targetObj == null) {
            return false;
        }
        this.AddMouseDragElement(targetObj, add);
    }
    AddMouseDragElement(targetObj, add = true) {
        if (!add) {
            if (this.currentSelected4Drog.moving) {
                this.mouseEventFunction4Drag.mouseUp();
            }
            targetObj.onmousedown = null;
            return;
        }
        targetObj.onmousedown = this.mouseEventFunction4Drag.mouseDown;
    }
    RemoveMouseDragElementByID(targetID) {
        let targetObj = this.Document.getElementById(targetID)
        if (targetObj == null) {
            return false;
        }
        this.RemoveMouseDragElement(targetObj);
    }
    RemoveMouseDragElement(targetObj) {
        this.AddMouseDragElement(targetObj, false);
    }
    mouseDown = function(ev) {
        this.currentSelected4Drog.oLeft = ev.clientX - ev.target.offsetLeft;
        this.currentSelected4Drog.oTop = ev.clientY - ev.target.offsetTop;

        this.currentSelected4Drog.currentObject = ev.target;

        document.addEventListener("mousemove", this.mouseEventFunction4Drag.mouseMove)
        document.addEventListener("mouseup", this.mouseEventFunction4Drag.mouseUp)
    }
    mouseMove = function(ev) {
        this.currentSelected4Drog.moving = true;
        var ev = ev || event;
        this.currentSelected4Drog.currentObject.style.left = ev.clientX - this.currentSelected4Drog.oLeft + 'px';
        this.currentSelected4Drog.currentObject.style.top = ev.clientY - this.currentSelected4Drog.oTop + 'px';
    }
    mouseUp = function(ev) {
        this.Document.removeEventListener("mousemove", this.mouseEventFunction4Drag.mouseMove)
        this.Document.removeEventListener("mouseup", this.mouseEventFunction4Drag.mouseUp)
        this.currentSelected4Drog.currentObject = null;
        this.currentSelected4Drog.oLeft = this.currentSelected4Drog.oRight = 0;
        this.currentSelected4Drog.moving = false;
    }

    origal_rclickEvent = function(e) {
        const {
            ipcRenderer
        } = require('electron');
        // 右键事件触发
        e.preventDefault();
        ipcRenderer.send('contextMenu'); //触发自定义事件
    }
    AddRclickEvent(target = null, e = "contextmenu", callback = null) {
        e = e || "contextmenu";
        target = (target == null ? this.Document : target);
        callback = (callback == null ? this.rclickEvent : callback);
        let { dialog } = require('electron').remote;
        this.AddEvent4Element(target, e, callback);
    }
    RemoveRclickEvent(target = null, e = "contextmenu", callback = null) {
        e = e || "contextmenu";
        target = (target == null ? this.Document : target);
        callback = (callback == null ? this.rclickEvent : callback);
        this.RemoveEvent4Element(target, e, callback);
    }



    AddEvent4ElementByID(targetID, e, callback) {
        let element = this.Document.getElementById(targetID);
        if (element == null) {
            return false;
        }
        this.AddEvent4Element(element, e, callback);
        return true;
    }
    RemoveEvent4ElementByID(targetID, e, callback) {
        let element = this.Document.getElementById(targetID);
        if (element == null) {
            return false;
        }
        this.removeEvent4Element(element, e, callback);
        return true;
    }
    AddEvent4Element(target, e, callback) {
        let targetMap = this._pageEvent.get(target);
        if (targetMap == null) {
            targetMap = new Map();
            this._pageEvent.set(target, targetMap);
        }
        let targetEventSet = targetMap.get(e);
        if (targetEventSet == null) {
            targetEventSet = new Set()
            targetMap.set(e, targetEventSet)
        }
        targetEventSet.add(callback)
        target.addEventListener(e, callback);
    }
    RemoveEvent4Element(target, e, callback = null) {
        if (callback == null && this._pageEvent.has(target) && this._pageEvent.get(target).has(e)) {
            callback = Array.from(this._pageEvent.get(target).get(e));
        }
        //不知道为什么直接.length判断会误判为length>0,所以用isArray判断
        if (Array.isArray(callback)) {
            for (let index in callback) {
                //原本封装在一个定义在这个函数的remove函数中调用，但是封装的函数内用this指针似乎没用，所以直接放外面
                target.removeEventListener(e, callback[index]);
                if (this._pageEvent.get(target) != null && this._pageEvent.get(target).get(e) != null) {
                    this._pageEvent.get(target).get(e).delete(callback[index]);
                }
            }
        } else {
            target.removeEventListener(e, callback);
            if (this._pageEvent.get(target) != null && this._pageEvent.get(target).get(e) != null) {
                this._pageEvent.get(target).get(e).delete(callback);
            }

        }
        if (this._pageEvent.get(target).get(e).size < 1) {
            this._pageEvent.get(target).delete(e);
        }
    }

    SendMessage4r2m(key, callback = null, param = {}, event = 'dqMessage4r2m') {
        let {
            ipcRenderer
        } = require('electron')
        if (ipcRenderer == null) {
            return false;
        }
        ipcRenderer.send(event, key, callback, param);
        return true;
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

    RemoveEventFunction(eventKey) {
        let callback = this._eventFunctions.get(eventKey);
        if (callback != null) {
            this._eventFunctions.delete(eventKey);
        }
        return callback;
    }

    _pageEffects = null;
    AddEffect(key, func) {
        this._pageEffects.set(key, func);
    }
    GetEffect(key, instead = null) {
        return this._pageEffects.get(key) || instead;
    }

    get Document() {
        return this._document;
    }
    set Document(doc) {}

    get Window() {
        return this._window;
    }
    set Window(doc) {}
}

if (module != null) {
    module.exports = { DqWebpage };
}