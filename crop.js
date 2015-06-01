/**
 * Created by Lian on 2015/5/18.
 */

(function () {
    /* 检测触摸设备 */
    function is_touch_device() {
        return ('ontouchstart' in window);
    }

    var isTouchEnabled = is_touch_device();

    /**
     * 图片剪切
     */
    function Crop(option) {
        /* 默认参数 */
        var def = {
            imgUrl: "",
            scaleRate: 0,
            x: 0,
            y: 0, //在可移动范围内的纵坐标
            w: 0,
            h: 0,
            wrapper: document.body
        };

        var copySet = {};
        if (typeof option === "object") {
            for (var key in def) {
                if (option.hasOwnProperty(key)) {
                    def[key] = option[key];
                }
                //复制对象, 不包含wrapper(如果包含的话,在手机里json.stringify将它转化成字符串会出错)
                if (key !== "wrapper") {
                    copySet[key] = def[key];
                }
            }
        }

        this.copySet = copySet;

        if (!def.imgUrl) {
            return;
        }

        /**
         * 剪裁框的配置
         * x:x坐标 y:y坐标 w:宽度 h:高度 (后面的代码会涉及到)
         * px: 鼠标距离左边框的距离 py: 鼠标距离上边框的距离
         * csize: 调节手柄的宽度  csizeh: 手柄可感应范围 bHover: 鼠标放置在哪个角
         * iCSize: 四个手柄的大小 bDrag: 鼠标拖动哪个角 bDragAll: 移动整个框
         */
        this.px = this.x;
        this.py = this.y;
        this.csize = 3;
        this.csizeh = 10;
        this.bHover = [false, false, false, false];
        this.iCSize = [this.csize, this.csize, this.csize, this.csize];
        this.bDrag = [false, false, false, false];
        this.bDragAll = false;

        /**
         * 图片剪裁信息(单位对应图片实际像素)
         * cropX: x坐标 cropY: y坐标
         * cropW: 宽度 cropH: 高度 cropDeg: 图片旋转角度
         */
        this.cropX = 0;
        this.cropY = 0;
        this.cropW = 0;
        this.cropH = 0;
        this.cropDeg = 0;

        if (def.scaleRate) {
            this.scaleRate = def.scaleRate;
        }

        //创建canvas
        var width = def.wrapper.offsetWidth,
            height = def.wrapper.offsetHeight;

        this.canvas = document.createElement("canvas");
        this.canvas.width = width;
        this.canvas.height = height;

        //包含canvas的容器,主要用于设置背景(提高canvas性能)
        var bg = "background-color: #ccc;",
            canvasWrapper = document.createElement("div");

        canvasWrapper.setAttribute("id", "J_CanvasWrapper");
        canvasWrapper.style.cssText = ["position: relative;", "width" + width + "px;", "height:" + height + "px;", bg].join("");

        //canvas 用于呈现剪裁框
        this.canvas.style.cssText = "position:absolute; z-index:2;";
        this.ctx = this.canvas.getContext('2d');
        canvasWrapper.appendChild(this.canvas);

        //canvas 用于放背景图片和蒙层
        this.bgCanvas = document.createElement("canvas");
        this.bgCanvas.width = this.canvas.width;
        this.bgCanvas.height = this.canvas.height;
        this.bgCanvas.style.cssText = "position:absolute; z-index:1;";
        this.bgCtx = this.bgCanvas.getContext('2d');
        canvasWrapper.appendChild(this.bgCanvas);

        var oldElem = document.getElementById("J_CanvasWrapper");
        //删除原来的canvas
        if (oldElem) {
            def.wrapper.removeChild(oldElem);
        }
        def.wrapper.appendChild(canvasWrapper);

        var self = this;
        this.img = new Image();
        this.img.onload = function () {
            self.init();
        };
        this.img.src = def.imgUrl;
    }

    Crop.prototype = {
        step: 0,
        maxStep: 3,
        minStep: 0,
        init: function () {
            //画背景
            this.drawBg();
        },
        /*向右旋转*/
        rotateRight: function () {
            this.step++;
            if (this.step > this.maxStep) {
                this.step = this.minStep;
            }
            this.cropDeg = 90 * this.step;
            this.drawBg();
        },
        /*向左旋转*/
        rotateLeft: function () {
            this.step--;
            if (this.step < this.minStep) {
                this.step = this.maxStep;
            }
            this.cropDeg = 90 * this.step;
            this.drawBg();
        },
        drawBg: function () {
            this.bgCtx.clearRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);

            var width, height, imgW, imgH,
                degree = this.step * 90 * Math.PI / 180,
                swap = 0;

            switch (this.step) {
                case 0:
                    width = this.canvas.width;
                    height = this.canvas.height;
                    break;
                case 1:
                    height = this.canvas.width;
                    width = this.canvas.height;
                    swap = 1;
                    break;
                case 2:
                    width = this.canvas.width;
                    height = this.canvas.height;
                    break;
                case 3:
                    height = this.canvas.width;
                    width = this.canvas.height;
                    swap = 1;
                    break;
            }

            if (this.img.width / this.img.height < width / height) { //以高为准
                imgH = height;
                imgW = this.img.width / this.img.height * imgH;
            } else { //以宽为准
                imgW = width;
                imgH = imgW / this.img.width * this.img.height;
            }

            var offsetLeft = (this.bgCanvas.width - imgW) / 2,
                offsetTop = (this.bgCanvas.height - imgH) / 2;
            this.bgCtx.save();
            this.bgCtx.translate(this.bgCanvas.width / 2, this.bgCanvas.height / 2);
            this.bgCtx.rotate(degree);
            this.bgCtx.translate(-this.bgCanvas.width / 2, -this.bgCanvas.height / 2);
            this.bgCtx.drawImage(this.img, offsetLeft, offsetTop, imgW, imgH);
            this.bgCtx.restore();

            //背景蒙层
            this.bgCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.bgCtx.fillRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);
            //四个边角,用来限制剪裁框的移动范围
            //旋转 90deg 或 270deg宽高调换
            if (swap) {
                this.top = (this.bgCanvas.height - imgW) / 2;
                this.bottom = this.top + imgW;
                this.left = (this.bgCanvas.width - imgH) / 2;
                this.right = this.left + imgH;
                this.maxWidth = imgH;
            } else {
                this.top = (this.bgCanvas.height - imgH) / 2;
                this.bottom = this.top + imgH;
                this.left = (this.bgCanvas.width - imgW) / 2;
                this.right = this.left + imgW;
                this.maxWidth = imgW;
            }

            //定位剪裁框的位置
            var options = JSON.parse(JSON.stringify(this.copySet));
            this.posCropBox(options);
            options = null;
            //剪裁框
            this.drawCropBox();
            //给canvas绑定触摸事件
            this.bindEvent();
        },
        /* 定位剪裁框 */
        posCropBox: function (def) {
            var self = this;
            /*初始化剪裁框的大小和位置*/
            if (!def.w) {
                if (!def.scaleRate) {
                    if (!def.x) {
                        def.x = self.csize;
                        def.w = self.maxWidth - 2 * self.csize;
                    } else {
                        def.w = self.maxWidth - def.x - self.csize;
                    }

                    if (!def.y) {
                        def.h = self.bottom - self.top - 2 * self.csize;
                        def.y = self.csize;
                    } else {
                        def.h = self.bottom - self.top - def.y - self.csize;
                    }
                } else {
                    //以宽为准
                    if ((self.maxWidth - def.x) / (self.bottom - def.y - self.top) < def.scaleRate) {
                        if (!def.x) {
                            def.x = self.csize;
                            def.w = self.maxWidth - 2 * self.csize;
                        } else {
                            def.w = self.maxWidth - def.x - self.csize;
                        }

                        def.h = def.w / def.scaleRate;
                        if (!def.y) {
                            def.y = (self.bottom - self.top - def.h) / 2;
                        }
                    } else {
                        //以高为准
                        if (!def.y) {
                            def.h = self.bottom - self.top - 2 * self.csize;
                            def.y = self.csize;
                        } else {
                            if (def.y <= 0) {
                                def.y = 0;
                            }
                            if (def.y >= self.bottom - self.top) {
                                def.y = self.bottom - self.top;
                            }
                            def.h = self.bottom - self.top - def.y - self.csize;
                        }

                        def.w = def.h * def.scaleRate;
                        if (!def.x) {
                            def.x = (self.maxWidth - def.w) / 2;
                        }
                    }
                }
            } // end no width
            else {
                if (def.w > self.maxWidth) {
                    def.w = self.maxWidth;
                }

                if (!def.x) {
                    def.x = (self.maxWidth - def.w) / 2;
                } else {
                    if ((def.x + def.w) > self.maxWidth) {
                        def.w = self.maxWidth - def.x;
                    }
                }

                if (!def.scaleRate) {
                    if (!def.y) {
                        def.h = self.bottom - self.top - 2 * self.csize;
                        def.y = self.csize;
                    } else {
                        def.h = self.bottom - self.top - def.y - self.csize;
                    }
                } else {
                    def.h = def.w / def.scaleRate;
                    if (def.h > self.bottom - self.top) {
                        def.h = self.bottom - self.top;
                    }
                    if (!def.y) {
                        def.y = (self.bottom - self.top - def.h) / 2;
                    } else {
                        if (def.h + def.y > self.bottom) {
                            def.h = self.bottom - def.y;
                        }
                    }
                }
            }

            self.x = def.x + self.left;
            self.y = def.y + self.top;
            self.w = def.w;
            self.h = def.h;
        },
        /* 画剪裁框 */
        drawCropBox: function () {
            this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
            //直线
            this.ctx.strokeStyle = '#69f';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(this.x, this.y, this.w, this.h);

            //映射到真实的宽高
            this.ctx.save();

            var degree = this.step * 90 * Math.PI / 180;
            if (this.w > 0 && this.h > 0) {
                this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
                this.ctx.rotate(degree);

                //将剪裁框图片对应的宽高跟实际 的宽高对应起来(旋转90deg和270deg时图片的宽高调换)
                switch (this.step) {
                    case 0:
                    case 2:
                        var rate = this.img.width / this.maxWidth,
                            x = (this.x - this.left) * rate,
                            y = (this.y - this.top) * rate,
                            w = this.w * rate,
                            h = this.h * rate;
                        break;
                    case 1:
                    case 3:
                        var rate = this.img.height / this.maxWidth,
                            x = (this.x - this.left) * rate,
                            y = (this.y - this.top) * rate,
                            w = this.w * rate,
                            h = this.h * rate;
                        break;
                }
                //将坐标轴统一移到canvas的左上角
                var cornerX, cornerY,
                    sourceX, sourceY, sourceW, sourceH,
                    desX, desY, desW, desH;

                switch (this.step) {
                    case 0:
                        cornerX = -this.canvas.width / 2;
                        cornerY = -this.canvas.height / 2;
                        sourceX = x;
                        sourceY = y;
                        sourceW = w;
                        sourceH = h;
                        desX = this.x;
                        desY = this.y;
                        desW = this.w;
                        desH = this.h;
                        break;
                    case 1:
                        cornerX = -this.canvas.height / 2;
                        cornerY = this.canvas.width / 2;
                        sourceX = y;
                        sourceY = this.img.height - x - w;
                        sourceW = h;
                        sourceH = w;
                        desX = this.y;
                        desY = -(this.x + this.w);
                        desW = this.h;
                        desH = this.w;
                        break;
                    case 2:
                        cornerX = this.canvas.width / 2;
                        cornerY = this.canvas.height / 2;
                        sourceX = this.img.width - x - w;
                        sourceY = this.img.height - y - h;
                        sourceW = w;
                        sourceH = h;
                        desX = -(this.x + this.w);
                        desY = -(this.y + this.h);
                        desW = this.w;
                        desH = this.h;
                        break;
                    case 3:
                        cornerX = this.canvas.height / 2;
                        cornerY = -this.canvas.width / 2;
                        sourceX = this.img.width - y - h;
                        sourceY = x;
                        sourceW = h;
                        sourceH = w;
                        desX = -(this.y + this.h);
                        desY = this.x;
                        desW = this.h;
                        desH = this.w;
                        break;
                }

                //重置剪裁信息
                this.cropX = sourceX;
                this.cropY = sourceY;
                this.cropW = sourceW;
                this.cropH = sourceH;

                this.ctx.translate(cornerX, cornerY);
                this.ctx.drawImage(this.img, sourceX, sourceY, sourceW, sourceH, desX, desY, desW, desH);
            }
            this.ctx.restore();

            //四个角(手柄)
            this.ctx.fillStyle = '#69f';
            this.ctx.fillRect(this.x - this.iCSize[0], this.y - this.iCSize[0], this.iCSize[0] * 2, this.iCSize[0] * 2);
            this.ctx.fillRect(this.x + this.w - this.iCSize[1], this.y - this.iCSize[1], this.iCSize[1] * 2, this.iCSize[1] * 2);
            this.ctx.fillRect(this.x + this.w - this.iCSize[2], this.y + this.h - this.iCSize[2], this.iCSize[2] * 2, this.iCSize[2] * 2);
            this.ctx.fillRect(this.x - this.iCSize[3], this.y + this.h - this.iCSize[3], this.iCSize[3] * 2, this.iCSize[3] * 2);

            //虚线
            var dashLen = 3;
            for (var i = 1, len = 3; i <= len - 1; i++) {
                //竖线
                this.ctx.dashedLine((this.x + i / len * this.w), this.y, (this.x + i / len * this.w), (this.y + this.h), dashLen);
                //横线
                this.ctx.dashedLine(this.x, (this.y + i / len * this.h), this.x + this.w, (this.y + i / len * this.h), dashLen);
            }
        },
        /* 绑定鼠标(触摸)事件 */
        bindEvent: function () {
            var self = this;
            bindEvents(this.canvas, 'touchstart mousedown', function (event) {
                var touch = event.touches && event.touches[0] || event,
                    rect = self.canvas.getBoundingClientRect(),
                    top = rect.top + document.body.scrollTop,
                    left = rect.left + document.body.scrollLeft;

                iMouseX = Math.floor(touch.pageX - top);
                iMouseY = Math.floor(touch.pageY - left);

                for (i = 0; i < 4; i++) {
                    self.bHover[i] = false;
                    self.iCSize[i] = self.csize;
                }

                //鼠标放在左上角
                if (iMouseX > self.x - self.csizeh && iMouseX < self.x + self.csizeh &&
                    iMouseY > self.y - self.csizeh && iMouseY < self.y + self.csizeh) {
                    self.bHover[0] = true;
                }
                //鼠标放在右上角
                if (iMouseX > self.x + self.w - self.csizeh && iMouseX < self.x + self.w + self.csizeh &&
                    iMouseY > self.y - self.csizeh && iMouseY < self.y + self.csizeh) {
                    self.bHover[1] = true;
                }
                //鼠标放在右下角
                if (iMouseX > self.x + self.w - self.csizeh && iMouseX < self.x + self.w + self.csizeh &&
                    iMouseY > self.y + self.h - self.csizeh && iMouseY < self.y + self.h + self.csizeh) {
                    self.bHover[2] = true;
                }
                //鼠标放在左下角
                if (iMouseX > self.x - self.csizeh && iMouseX < self.x + self.csizeh &&
                    iMouseY > self.y + self.h - self.csizeh && iMouseY < self.y + self.h + self.csizeh) {
                    self.bHover[3] = true;
                }

                //整体移动
                if (iMouseX > self.x + self.csizeh && iMouseX < self.x + self.w - self.csizeh &&
                    iMouseY > self.y + self.csizeh && iMouseY < self.y + self.h - self.csizeh) {
                    self.bDragAll = true;
                }

                //调整鼠标与剪裁框四个角的位置
                self.px = iMouseX - self.x;
                self.py = iMouseY - self.y;

                if (self.bHover[0]) {
                    self.px = iMouseX - self.x;
                    self.py = iMouseY - self.y;
                }
                if (self.bHover[1]) {
                    self.px = iMouseX - self.x - self.w;
                    self.py = iMouseY - self.y;
                }
                if (self.bHover[2]) {
                    self.px = iMouseX - self.x - self.w;
                    self.py = iMouseY - self.y - self.h;
                }
                if (self.bHover[3]) {
                    self.px = iMouseX - self.x;
                    self.py = iMouseY - self.y - self.h;
                }
                event.stopPropagation();
                event.preventDefault();
            }, false);

            bindEvents(this.canvas, 'touchmove mousemove', function (event) {
                var touch = event.touches && event.touches[0] || event,
                    rect = self.canvas.getBoundingClientRect(),
                    top = rect.top + document.body.scrollTop,
                    left = rect.left + document.body.scrollLeft;

                iMouseX = Math.floor(touch.pageX - left);
                iMouseY = Math.floor(touch.pageY - top);

                for (i = 0; i < 4; i++) {
                    if (self.bHover[i]) {
                        self.bDrag[i] = true;
                    }
                }

                // 移动边角框
                var iFW, iFH;
                if (self.bDrag[0]) {
                    var iFX = iMouseX - self.px;
                    var iFY = iMouseY - self.py;
                    iFW = self.w + self.x - iFX;
                    if (self.scaleRate) {
                        iFH = iFW / self.scaleRate;
                    } else {
                        iFH = self.h + self.y - iFY;
                    }
                }
                if (self.bDrag[1]) {
                    var iFX = self.x;
                    var iFY = iMouseY - self.py;
                    iFW = iMouseX - self.px - iFX;
                    if (self.scaleRate) {
                        iFH = iFW / self.scaleRate;
                    } else {
                        iFH = self.h + self.y - iFY;
                    }
                }
                if (self.bDrag[2]) {
                    var iFX = self.x;
                    var iFY = self.y;
                    iFW = iMouseX - self.px - iFX;
                    if (self.scaleRate) {
                        iFH = iFW / self.scaleRate;
                    } else {
                        iFH = iMouseY - self.py - iFY;
                    }
                }
                if (self.bDrag[3]) {
                    var iFX = iMouseX - self.px;
                    var iFY = self.y;
                    iFW = self.w + self.x - iFX;
                    if (self.scaleRate) {
                        iFH = iFW / self.scaleRate;
                    } else {
                        iFH = iMouseY - self.py - iFY;
                    }
                }

                //限制移动位置在可移动范围内
                if (iFX >= self.left && iFY >= self.top && iFW > self.csizeh * 2 && iFH > self.csizeh * 2) {
                    if (iFX < self.left) {
                        iFX = self.left;
                    }
                    if (iFX + iFW > self.right) {
                        iFW = self.right - iFX;
                        if (self.scaleRate) {
                            iFH = iFW / self.scaleRate;
                        }
                    }

                    if (iFY < self.top) {
                        iFY = self.top;
                    }

                    if (iFY + iFH > self.bottom) {
                        iFH = self.bottom - iFY;
                        if (self.scaleRate) {
                            iFW = iFH * self.scaleRate;
                        }
                    }

                    self.w = iFW;
                    self.h = iFH;

                    self.x = iFX;
                    self.y = iFY;
                }

                // 移动整个剪裁框
                if (self.bDragAll) {
                    var x = iMouseX - self.px,
                        y = iMouseY - self.py;
                    if (x <= self.left) {
                        x = self.left;
                    }

                    if (x > self.right - self.w) {
                        x = self.right - self.w;
                    }

                    if (y <= self.top) {
                        y = self.top;
                    }

                    if (y > self.bottom - self.h) {
                        y = self.bottom - self.h;
                    }

                    self.x = x;
                    self.y = y;
                }

                self.drawCropBox();
                event.stopPropagation();
                event.preventDefault();
            });

            bindEvents(this.canvas, 'touchend mouseup mouseout', function (event) {
                self.bDragAll = false;

                for (i = 0; i < 4; i++) {
                    self.bHover[i] = false;
                    self.bDrag[i] = false;
                }
                self.px = 0;
                self.py = 0;
            });
        },
        /* 生成剪切后的图片 */
        cropDone: function (width, height) {
            var tempCanvas = document.createElement('canvas'),
                tempCtx = tempCanvas.getContext('2d'),
                canvasW, canvasH, imgH, imgW,
                degree = this.step * 90 * Math.PI / 180;

            imgW = canvasW = (width && this.cropW > width) ? width : this.cropW;
            imgH = canvasH = imgW / this.cropW * this.cropH;
            canvasH = (height && (canvasH > height)) ? height : canvasH;
            tempCanvas.width = canvasW;
            tempCanvas.height = canvasH;

            tempCtx.translate(canvasW / 2, canvasH / 2);
            tempCtx.rotate(degree);
            tempCtx.translate(-canvasW / 2, -canvasH / 2);
            tempCtx.drawImage(this.img, this.cropX, this.cropY, this.cropW, this.cropH, 0, 0, imgW, imgH);

            var cropData = tempCanvas.toDataURL("image/png");

            return cropData;
        },
        /* 得到剪切信息 */
        getCropData: function () {
            return [this.cropDeg, this.cropX, this.cropY, this.cropW, this.cropH];
        }
    };

    /* 画虚线 */
    CanvasRenderingContext2D.prototype.dashedLine = function (x1, y1, x2, y2, dashLen) {
        if (dashLen == undefined) dashLen = 2;
        this.lineWidth = 1;
        this.strokeStyle = '#fff';
        this.beginPath();
        this.moveTo(x1, y1);

        var dX = x2 - x1;
        var dY = y2 - y1;
        var dashes = Math.floor(Math.sqrt(dX * dX + dY * dY) / dashLen);
        var dashX = dX / dashes;
        var dashY = dY / dashes;

        var q = 0;
        while (q++ < dashes) {
            x1 += dashX;
            y1 += dashY;
            this[q % 2 == 0 ? 'moveTo' : 'lineTo'](x1, y1);
        }
        this[q % 2 == 0 ? 'moveTo' : 'lineTo'](x2, y2);
        this.stroke();
        this.closePath();
    };

    /* 绑定多个事件 */
    function bindEvents(obj, name, fn) {
        name.split(" ").forEach(function (eventType) {
            obj.addEventListener(eventType, fn, false);
        });
    }

    window.Crop = Crop;
}())