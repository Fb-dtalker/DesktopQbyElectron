class DynamicStars {
    stars1 = null
    stars2 = null
    stars3 = null
    container = null
    link = null

    constructor() {}

    init() {
        this.container = document.createElement('div')
        this.container.setAttribute('id', 'dynamicCanvas')
        this.container.style.zIndex = "-2"
        document.body.appendChild(this.container)

        // this.container.style.cssText = "margin:0;padding:0;position:absolute;top:0;left:0"
        this.link = document.createElement('link')
        this.link.href = 'code/js/dynamic_star/style.css' //在这里建立的元素实际是在写入document.body的地方使用，所以连接要以那个html文件所在的为准
        this.link.rel = 'stylesheet'
        this.container.appendChild(this.link)

        this.stars1 = document.createElement('div')
        this.stars1.setAttribute('id', "stars1")
        this.container.appendChild(this.stars1)

        this.stars2 = document.createElement('div')
        this.stars2.setAttribute('id', "stars2")
        this.container.appendChild(this.stars2)

        this.stars3 = document.createElement('div')
        this.stars3.setAttribute('id', "stars3")
        this.container.appendChild(this.stars3)
    }

    show = false;
    showBackground() {
        if (this.show) {
            return;
        }
        this.show = true;
        this.init();
    }

    hideBackground() {
        this.show = false;
        this.container.parentNode.removeChild(this.container);
        this.stars1 = null
        this.stars2 = null
        this.stars3 = null
        this.container = null
    }

}

function dynamicStarBackground() {
    let dynamicStarObject = new DynamicStars();
    return dynamicStarObject;
}

/*
 *修改自：https://github.com/xiaoyongyuan/dynamic
 */