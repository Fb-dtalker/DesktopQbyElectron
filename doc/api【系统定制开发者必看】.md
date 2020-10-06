## DesktopQv0_1版本文档

### 开发开始

```
//I.拉取代码
git clone https://github.com/Fb-dtalker/DesktopQbyElectron.git

//II.安装对应版本electron等依赖
npm install electron@^版本
//具体版本和依赖看package.json文件

//III.启动项目
npm start

//IV.打包
npm install electron-packager -g
npm install asar -g
npm run-script packager
//打包配置修改package.json
```

因为特地没有用asar把源码加密打包，所以如果懒的话可以直接下载Release版本，然后在\resources\app下的代码里开发【注意备份】，推荐使用vscode。不过如果要新加依赖包的话可能这样会有问题。



### Release版本

https://github.com/Fb-dtalker/DesktopQbyElectron/releases



### 全局类

- DqSystem【desktopSys/dqsystem.js】：全局的管理系统类

  - app.getGlobal('dqglobal').dqSys

- DqDisplay【desktopSys/dqdisplay.js】：全局的屏幕管理类

  - app.getGlobal('dqglobal').dqDisplay

- DqWebpage【desktopSys/dqwebpage.js】：对应单个渲染进程的管理类

  - remote.getCurrentWindow().webpage

- DqConfig【desktopSys/dqconfig.js】：对应全局配置信息文件的管理类

  - app.getGlobal('dqglobal').dqConfig

- DqUtils【desktopSys/dqutils】：全局的工具类，里面的全部函数都为static

  - ```javascript
    if (typeof DqUtils == "undefined" || DqUtils == null) {
        let remote = require('electron').remote
        if (remote != null || typeof remote != 'undefined') {
            DqUtils = remote.require('./code/desktopSys/dqutils').DqUtils; //路径要根据文件所在变化
        } else {
            DqUtils = require('./dqutils').DqUtils;
        }
    }
    //引入这个类的Js文件如果可能会被html页面直接<script src=""></script>引入的话，需要按照上面的方式引入
    //因为html如果已经引入了再进行const {DqUtils}会变成重复声明变量而出错
    
    //否则直接也可
    const {DqUtils} = require('./dqutils');
    ```



### 全局变量

- dqglobal={}

  - ```
    dqglobal.dqSys; //DqSystem
    dqglobal.dqConfig = null; //DqConfig，对配置项负责
    dqglobal.dqDisplay = null; //DqDisplay，对显示器负责
    
    dqglobal.uiObject = {}; //暂时只有tray和contextMenu
    dqglobal.uiObject.tray = null;
    dqglobal.uiObject.contextMenu = null;
    
    dqglobal.globalFunction = {}; //在里面放全局函数方便调用
    ```

  - **变量获取：**

    - app.getGlobal('dqglobal')



### 主进程and渲染进程通信

- 主进程监听：
  - 'dqMessage4r2m'
    - 添加监听事件
      - dqglobal.dqSys.AddEventFunction(key, callback);
      - callback：(event, param={})=>{}
    - 移除监听事件
      - dqglobal.dqSys.DelEventFunction(key);
  - 发送到渲染进程：
    - win.webContents.send('dqMessage4m2r', key, callback=null, param={})
    - //key是归于dqMessage4m2r下的子事件名，callback是回调函数如果不为空则会优先执行否则执行已注册的函数，param为传递给回调函数的参数【多参数的情况请放在{}里传递】
- 渲染进程监听：
  - 'dqMessage4m2r'
    - 添加监听事件
      - webpage.AddEventFunction(key, callback, replace=true);
      - callback：(event, param={})=>{}
    - 移除监听事件
      - webpage.RemoveEventFunction(key);
  - 发生到主进程
    - webpage.sendMessage4r2m(key, callback = null, param = {}, event = 'dqMessage4r2m')
    - //key是归于dqMessage4r2m下的子事件名，callback是回调函数如果不为空则会优先执行否则执行已注册的函数，param为传递给回调函数的参数【多参数的情况请放在{}里传递】，event是当想要发送到其它事件时的填的内容



### 必要的激活内容

- dqSys

  - 在主进程初始化时调用

    - dqglobal.dqSys = new DqSystem(dqglobal.dqConfig);

  - 主进程事件注册

    - ```javascript
      //callback函数类型：function(param={}){}
      AddEventFunction(eventKey, callback, replace = true)
      //给'dqMessage4r2m'注册子事件
      
      //获得'dqMessage4r2m'注册的子事件
      GetEventFunction(eventKey, instead = null) 
      
      //删除注册了的'dqMessage4r2m'子事件
      DelEventFunction(eventKey)
      
      //目前只支持一个key对应一个回调函数，以后会考虑扩展为一个key可对应多个回调函数
      ```

- dqConfig

  - 在主进程初始化时调用

    - dqglobal.dqConfig = DqConfig.GetInstance();

  - 配置文件：config文件夹下的.cf文件

  - 配置变量类型包括

    - sysConfig【sysconfig.cf】：系统配置
    - dataConfig【dataconfig.cf】：普通用户配置
    - elseConfig【自建文件名.cf】：定制时的配置文件，比如写了个fbABC插件为了避免配置名冲突就多加个fbabcconfig.cf

  - API

    - ```javascript
      dqConfig.SetConfig(key, value, content = 'data')
      //添加设置。content表示是什么类型的配置，sys|data|自定的
      //注意，如果自定的是test.cf就写：
      //dqConfig.SetConfig(key, value, content = 'test')
      //新建配置类型之间传content为指定值就行，会自动新建
      //这里的配置内容都会被保存并在下次开启时读取
      
      GetConfig(key, content = 'data')
      //获得配置
      
      DelConfig(key, content = 'data')
      //删除配置
      ```

      

- dqDisplay

  - 在主进程初始化时调用

    - dqglobal.dqDisplay = DqDisplay.GetInstance();

  - API

    - ```javascript
      ShowSignWindows() //显示窗口标识并且重新检测屏幕状态
      
      GetDisplayOffset(index = 0) //得到序号为index的屏幕的左上角偏移量
      
      AddWindow(win, displayIndex)
      //添加现实特效的窗口，displayIndex是要放到哪个屏幕上，会把窗口的位置调整到目标屏幕的左上角
      
      CleanScreen(index = null) //清除屏幕序号为index上的特效窗口
      
      GetWindowsByScreen(index)
      //通过屏幕编号获得在这个屏幕上的特效窗口们
      
      GetScreen2WindowsMap()
      //获得屏幕到窗口的对应编号
      //[屏幕序号:[窗口序号],...]
      /*
      eg.[[0,3],[1,2]]
      表示this.displays和this._showingWindow的对应
      序号为0【displays[0]】的屏幕上有0、3窗口【_showingWindow[0]和_showingWindow[3]】
      序号为1的屏幕上有1、2窗口
      */
      ```

      

- dqWebpage

  - 写在加载的html的js区域中

    - let webpage = new DqWebpage(require('electron').remote.getCurrentWindow(), document);

  - 在webpage里面其实还写了DOM文档元素的分别事件管理，但是现阶段还没用到

    - 元素事件透过：

      - ```javascript
        webpage.AddMouseEventListener(element, true); //true为透过
        /*
        比如现在的窗口透过效果进行的就是首先把DOM的body给全透过，再设置单个元素的不透过
        */
        let webpage = new DqWebpage(win, document);
        webpage.AddMouseEventListenerByID('body', true); //body下元素透过
        webpage.AddMouseEventListener(element, false);
        //这样element就又能接受鼠标消息了
        ```

    - 元素的拖动支持：

      - ```javascript
        //拖拽之前首先要确保element能够接受鼠标消息
        //webpage.AddMouseEventListener(元素, false);
        
        webpage.AddMouseDragElementByID('id'); //元素可以拖拽了
        webpage.RemoveMouseDragElementByID('id'); //元素不可以拖拽了
        ```

    - 窗口的右键支持：

      - ```javascript
        webpage.AddRclickEvent(document);
        //传入可以右键的元素，这样是执行默认的"contextmenu"事件回调
        
        //AddRclickEvent(target = null, e = "contextmenu", callback = null)
        AddRclickEvent(element, null, ()=>{/*自己的处理函数or激发其他的右键内容*/});
        //如果你在自己的右键事件里面有给主进程传自己的事件'a'，也可以让e='a'，这样就也能够调用你的处理函数。不过这里之后可能会和AddMouseEventListener函数合并精简掉。
        ```

    - 元素的鼠标响应：webpage.AddMouseEventListener(元素, true);

    - 更多的事件响应：【尚未详细测试】

      - webpage.AddEvent4Element(target, e, callback)

      - webpage.RemoveEvent4Element(target, e, callback = null)

      - 可能你会问直接 doc元素.onclick=()=>{}; 不是很方便的，这里的做法主要是想能够更为动态、简单的删除事件回调。

        - ```
          let element = document.getElementById("id")
          
          element.addEventListener("onmouseover", ()=>{}) //事件0
          webpage.AddEvent4Element(element, "onmouseover", ()=>{}) //事件1
          webpage.AddEvent4Element(element, "onmouseover", ()=>{}) //事件2
          webpage.RemoveEvent4Element(element, "onmouseover")
          //在不影响事件0的情况下删掉element的事件1、事件2
          //以后可能会改成下面的方式来利用个标志来单独删除事件
          //但是感觉实际上和已有的单独移除方式差别不大
          /*
          webpage.AddEvent4Element(element, "onmouseover", sign, ()=>{})
          webpage.RemoveEvent4Element(element, "onmouseover", sign)
          */
          //目前要单独移除的话得要：
          let func = ()=>{};
          webpage.AddEvent4Element(element, "onmouseover", func)
          webpage.RemoveEvent4Element(element, "onmouseover", func)
          
          ```

          

--------

最后编辑：2020年10月7日03点22分

编辑者：FB-dtalker

文档版本号：DesktopQv0_1.0_a