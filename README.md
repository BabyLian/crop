# 插件用途：
支持图片旋转，剪裁，适用于pc端和移动端


![image](https://github.com/BabyLian/crop/raw/master/screenshots.png)
# 用法:
```
1、引入js文件
<script src='crop.js'></script>

2、创建对象,传入图片url, div元素(包含剪裁框的容器)
var wrapper = document.getElementById("J_Wrapper");
var crop = new  Crop({imgUrl:"1.jpg",wrapper:wrapper});
```

#参数说明:
```
scaleRate ：图片剪裁的比例（宽 : 高）
x : 选择框距离图片左边的距离
w: 剪裁框的宽度
h: 剪裁框的高度
wrapper: 放置剪裁框的div
```

#方法使用:
1、获得剪裁后的图片，传入参数可限制最大宽度和高度
```
fucntion cropDone(width, height){}
代码示例：
document.getElementById("J_Btn").onclick=function(){
        var imgUrl = crop.cropDone(200,200);
        var img=new Image();
        img.onload=function(){
            document.getElementById("crop-result").innerHTML="";
            document.getElementById("crop-result").appendChild(this)
        }
        img.src=imgUrl;
    };
  ```
  
2、向左旋转
```
fucntion rotateRight(){}
代码示例：
document.getElementById("J_RotateRight").onclick=function(){
        crop.rotateRight();
    };
```
3、向右旋转
```
fucntion rotateLeft(){}
代码示例：
document.getElementById("J_RotateLeft").onclick=function(){
        crop.rotateLeft();
    };
```
4、获得剪裁图片的实际信息(对应图片真实的像素) ,返回一个数组 [旋转角度, x坐标, y坐标, 宽度, 高度]
```
function getCropData(){}
代码示例
crop.getCropData();
```
#说明
由于canvas的图片同源问题，请在服务器环境下运行该插件


#相关问题的解释(怕自己忘记)
###问题1、当canvas清除画布时,历史中的图像没有被清除


当我画虚线的时候就遇到了这个问题, 导致这个问题的原因是: 我们没有发出beginPath和closePath的命令,这样所有的drawing命令就会在内存中堆积,一旦再次接收到stroke或其他命令时, 所有的路径都会被画出来。可参考[http://codetheory.in/why-clearrect-might-not-be-clearing-canvas-pixels/](http://codetheory.in/why-clearrect-might-not-be-clearing-canvas-pixels/)

解决方法: 在画图像之前,调用beginPath命令, 结束之后使用 closePath命令
```
ctx.beginPath();
ctx.stroke();
ctx.closePath();
```

###问题2、 旋转图片时的坐标问题
canvas旋转时，其实旋转的是整个坐标系，为了实现以坐标中心为旋转中心进行旋转，可以先将坐标系移到中央，然后再移到左上角或右上角（方便计算）可参考[http://codetheory.in/canvas-rotating-and-scaling-images-around-a-particular-point/](http://codetheory.in/canvas-rotating-and-scaling-images-around-a-particular-point/)
```
this.bgCtx.translate(this.bgCanvas.width / 2, this.bgCanvas.height / 2);
this.bgCtx.rotate(degree);
//此处坐标已经旋转过了,所以位移的坐标值和位移方向是对应旋转后的坐标系
this.bgCtx.translate(-this.bgCanvas.width / 2, -this.bgCanvas.height / 2);
```

