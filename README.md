## Introduction

A plugin to draw arrows along path

## Demo

https://hugemountain.github.io/leaflet-arraw-path/

## npm

npm install leaflet.arrowpath


## options

new L.ArrowPath({
        stepSize: 10,              //箭头间间隔
        symbolText: null,          //用文本渲染的箭头文本（优先于canvas和image箭头）
        symbolImg: null,           //用图片渲染的箭头符号
        aniOffset: 0.3,            //箭头渲染沿着path方向的偏移
        theta: 0,                  //箭头旋转角度
        offsetX: 0,                //箭头在经度方向的偏移
        offsetY: 0,                //箭头在纬度方向的偏移
        imgClipOffset: 0,          //箭头图片箭头的剪切长度
        textStyle: {               //文本箭头样式
            fontSize: 14,
            fillStyle: '#ffffff',
            lineWidth: 8
        }
    })


## Usage

```
// Arrows rendered with canvas
 var canvasDir = document.createElement('canvas')
    var width = 7;
    canvasDir.width = width;
    canvasDir.height = width;
    var context = canvasDir.getContext('2d');
    context.strokeStyle = '#ffffff';
    context.lineJoin = 'round';
    context.lineWidth = 2;
    context.moveTo(-1, width - 1);
    context.lineTo(width / 2, 1);
    context.lineTo(width + 1, width - 1);
    context.stroke();

    var render = new L.ArrowPath({
        stepSize: 30,
        symbolText: null,
        symbolImg: canvasDir,
        theta: -80.1,
        offsetX: -4,
        offsetY: 2,
        imgClipOffset: 2
    });


// Arrows rendered with image
    var canvasImg = new Image();
    canvasImg.onload= function() {
        canvasImg.onload = null;
    }

    canvasImg.src="./arrow.png";

    var render = new L.ArrowPath({
        stepSize: 30,
        symbolText: null,
        symbolImg: canvasImg,
        theta: 0,
        offsetX: -9,
        offsetY: 4,
        imgClipOffset: 3
    });


// Arrows rendered with text
    var render = new L.ArrowPath({
        stepSize: 30,
        symbolText: '>',
        textStyle: {
            fontSize: 14,
            fillStyle: '#ffffff',
            lineWidth: 8
        }
    });

    L.geoJSON(lines, {
        style: (feature) => {
            return {
                color: '#ff0c68',
                weight: 5,
                renderer: render
            };
        },
        onEachFeature: (feature, layer) => {
            layer.bindPopup(`aa`, {});
        },
    }).addTo(map)

```

## Reference Document





