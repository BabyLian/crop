# 插件用途：
支持图片旋转，剪裁，适用于pc端和移动端

# 用法:
```
引入js文件
<script src='crop.js'></script>
```
```
创建对象,传入图片url, div元素(包含剪裁框的容器)
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
```
代码示例：
```
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
```
代码示例：
```
document.getElementById("J_RotateRight").onclick=function(){
        crop.rotateRight();
    };
```
3、向右旋转
```
fucntion rotateRight(){}
```
代码示例：
```
document.getElementById("J_RotateLeft").onclick=function(){
        crop.rotateLeft();
    };
```

#说明
由于canvas的图片同源问题，请在服务器环境下运行该插件

