class CanvasNest {
    container = null
    config = null
    canvas = null
    points = null
    current = null
    all = null
    context = null
    tid = null
    slim = 0.9
    rect = 2

    constructor(slim = 0.9, rect = 2) {
        this.slim = slim
        this.rect = rect
        var r = this.random()
        var b = this.random()
        var g = this.random()

        this.config = {
            zIndex: -1, // z-index
            opacity: 0.9, // opacity
            color: r + ',' + b + ',' + g, // color of lines
            pointColor: (r + 20) + ',' + (b + 20) + ',' + (g + 20),
            count: 199, // count
        }
    }

    init() {
        this.width = window.innerWidth
        this.height = window.innerHeight
        this.newCanvas()

        this.points = this.randomPoints()
        this.current = {
            x: null,
            y: null,
            max: 20000
        }
        this.all = this.points.concat([this.current])

        this.bindEvent()
    }

    random() {
        return parseInt(Math.random() * 235)
    }

    newCanvas() {
        this.canvas = document.createElement('canvas')
        this.canvas.style.cssText = "margin:0;padding:0;position:absolute;top:0;left:0;z-index:" + this.config.zIndex + ";opacity:" + this.config.opacity;
        this.container = this.canvas
        this.canvas.width = window.innerWidth
        this.canvas.height = window.innerHeight
        document.body.appendChild(this.container)
        this.context = this.canvas.getContext('2d')
    }

    randomPoints() {
        var p = []
        for (var i = 0; i < this.config.count; ++i) {
            p.push({
                x: Math.random() * this.width * this.rect,
                y: Math.random() * this.height * this.rect,
                xa: 4 * Math.random() - 2,
                ya: 4 * Math.random() - 2,
                max: 12000
            })
        }
        return p;
    }

    bindEvent() {
        window.addEventListener('resize', this.onWindowResize.bind(this));
        document.addEventListener('mousemove', this.onMouseMove.bind(this))
        document.addEventListener('mouseout', this.onMouseOut.bind(this))
    }

    onMouseMove(e) {
        this.current.x = e.clientX - this.container.offsetLeft + document.scrollingElement.scrollLeft; // 当存在横向滚动条时，x坐标再往右移动滚动条拉动的距离
        this.current.y = e.clientY - this.container.offsetTop + document.scrollingElement.scrollTop; // 当存在纵向滚动条时，y坐标再往下移动滚动条拉动的距离
    }

    onMouseOut(e) {
        this.current.x = null
        this.current.y = null
    }

    onWindowResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = window.innerWidth
        this.canvas.height = window.innerHeight
        this.hideBackground()
        this.showBackground()
    }

    requestFrame() {
        this.drawCanvas()
        setTimeout(() => {
            this.tid = requestAnimationFrame(this.requestFrame.bind(this));
        }, 50);
        //this.tid = requestAnimationFrame(this.requestFrame.bind(this))
        if (!this.show) {
            cancelAnimationFrame(this.tid)
        }
    }

    drawCanvas() {
        this.context.clearRect(0, 0, this.width, this.height)
            // 随机的线条和当前位置联合数组
        let e, i, d, x_dist, y_dist, dist; // 临时节点

        this.points.forEach(function(r, idx) {
            r.x += r.xa;
            r.y += r.ya; // 移动
            r.xa *= r.x > this.width || r.x < 0 ? -1 : 1;
            r.ya *= r.y > this.height || r.y < 0 ? -1 : 1; // 碰到边界，反向反弹
            this.context.fillStyle = "rgba(" + this.config.pointColor + "," + (this.config.opacity + 0.1) + ")";
            this.context.fillRect(r.x - 0.5, r.y - 0.5, 2, 2); // 绘制一个宽高为2的点

            // 从下一个点开始
            for (i = idx + 1; i < this.all.length; i++) {
                e = this.all[i];
                // 当前点存在
                if (null !== e.x && null !== e.y) {
                    x_dist = r.x - e.x; // x轴距离 l
                    y_dist = r.y - e.y; // y轴距离 n
                    dist = x_dist * x_dist + y_dist * y_dist; // 总距离, m

                    dist < e.max && (e === this.current && dist >= e.max / 4 && (r.x -= 0.03 * x_dist, r.y -= 0.03 * y_dist), // 靠近的时候加速
                        d = (e.max - dist) / e.max,
                        this.context.beginPath(),
                        this.context.lineWidth = d / this.slim,
                        this.context.strokeStyle = "rgba(" + this.config.color + "," + (this.config.opacity) + ")",
                        this.context.moveTo(r.x, r.y),
                        this.context.lineTo(e.x, e.y),
                        this.context.stroke());
                }
            }
        }.bind(this));
    }

    show = false;
    showBackground() {
        if (this.show) {
            return;
        }
        this.show = true
        this.init()
        document.body.appendChild(this.container)
        this.requestFrame()
    }

    hideBackground() {
        this.show = false
            // mouse 事件清除

        document.removeEventListener('mousemove', this.onMouseMove.bind(this), false)
        document.removeEventListener('mouseout', this.onMouseOut.bind(this), false)
        window.removeEventListener('resize', this.onWindowResize.bind(this), false)

        // 删除轮询
        cancelAnimationFrame(this.tid)

        // 删除 dom
        this.container.parentNode.removeChild(this.container)
        this.container = null
        this.canvas = null
        this.points = null
        this.current = null
        this.all = null
        this.context = null
        this.tid = null
    }
}

function nestBackground() {
    nestObject = new CanvasNest(0.9, 1.5);
    return nestObject;
}

/*
 *修改自：https://github.com/hustcc/canvas-nest.js
 */