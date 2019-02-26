(function (factory, window) {

    // define an AMD module that relies on 'leaflet'
    if (typeof define === 'function' && define.amd) {
        define(['leaflet'], factory);

        // define a Common JS module that relies on 'leaflet'
    } else if (typeof exports === 'object') {
        module.exports = factory(require('leaflet'));
    }

    // attach your plugin to the global 'L' variable
    if (typeof window !== 'undefined' && window.L) {
        window.L.ArrowPath = factory(L);
    }
}(function (L) {

    // implement your plugin
    let ArrowPath = L.Canvas.extend({

        options: {
            stepSize: 10,
            symbolText: null,
            symbolImg: null,
            aniOffset: 0.3,
            theta: 0,
            offsetX: 0,
            offsetY: 0,
            imgClipOffset: 0,
            textStyle: {
                fontSize: 14,
                fillStyle: '#ffffff',
                lineWidth: 8
            }
        },

        initialize: function (options) {
            L.Util.setOptions(this, options);
            L.Util.stamp(this);
        },

        _initContainer: function (options) {
            L.Canvas.prototype._initContainer.call(this);

            this._containerSymbol = document.createElement('canvas');
            this._ctxLabel = this._containerSymbol.getContext('2d');

            L.DomUtil
                .addClass(this._containerSymbol, 'leaflet-zoom-animated');
            this.getPane().appendChild(this._containerSymbol);

        },

        _text: function (ctx, layer) {
            // polygon or polyline
            if (!layer._parts || layer._parts.length === 0 || layer._parts[0].length === 0) {
                return;
            }
            let options = this.options;
            ctx.globalAlpha = 1;

            //Render symbols alongside the polyline
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            this._drawSymbol(layer._parts, ctx, options);
        },

        _drawSymbol: function (parts, ctx, options) {
            parts.forEach((points) => {
                for (let i = 0, l = points.length - 1; i < l; i++) {
                    this._generatePoints(ctx, points[i], points[i + 1],
                        options.stepSize, options.aniOffset, options.symbolImg || options.symbolText,
                        options.theta, options.offsetX, options.offsetY, options.imgClipOffset, options.textStyle)
                }
            });
        },

        _generatePoints: function (ctx, startP, endP, stepSize = 30, aniOffset = 0.5, img, theta, offsetX, offsetY, imgClipOffset, textStyle) {
            let radA = Math.atan((endP.y - startP.y) / (endP.x - startP.x));
            if ((endP.x - startP.x) < 0) {
                radA += Math.PI;
            }
            const dist = startP.distanceTo(endP);
            const stepNum = dist / stepSize;

            // gen points by stepSize.. if enable corner arrow, start s with (0~1) float number.
            for (let s = aniOffset; s <= stepNum; s++) {
                const pX = Math.round(startP.x + s * stepSize * Math.cos(radA));
                const pY = Math.round(startP.y + s * stepSize * Math.sin(radA));
                if (typeof img != 'string') {
                    this._drawImg(pX, pY, img, ctx, radA, theta, offsetX, offsetY, imgClipOffset);
                } else {
                    this._drawText(pX, pY, img, ctx, radA, theta, offsetX, offsetY, textStyle);
                }
            }
        },

        _drawText: function (pX, pY, text, ctx, radA, theta, offsetX, offsetY, textStyle) {

            ctx.save();
            ctx.font = textStyle.fontSize + "px 'Helvetica Neue',Helvetica,Arial,sans-serif";
            ctx.fillStyle = textStyle.fillStyle;
            ctx.lineWidth = textStyle.lineWidth;
            ctx.translate(pX + offsetX, pY + offsetY);
            ctx.rotate(radA + theta);
            ctx.fillText(text, 0, 1);

            ctx.restore();
        },

        _drawImg: function (pX, pY, img, ctx, radA, theta, offsetX, offsetY, imgClipOffset) {
            let width = img.width;
            let height = img.height;
            ctx.save();
            ctx.translate(pX + offsetX, pY + offsetY);  // consider img position and imgWidth/Height.
            ctx.rotate(radA + theta);
            ctx.drawImage(img, 0, 0, width, height, imgClipOffset, imgClipOffset, width - imgClipOffset, height - imgClipOffset);
            ctx.restore();
        },

        _updateTransform: function (center, zoom) {

            L.Canvas.prototype._updateTransform.call(this, center, zoom);

            let scale = this._map.getZoomScale(zoom, this._zoom),
                position = L.DomUtil.getPosition(this._container),
                viewHalf = this._map.getSize().multiplyBy(0.5 + this.options.padding),
                currentCenterPoint = this._map.project(this._center, zoom),
                destCenterPoint = this._map.project(center, zoom),
                centerOffset = destCenterPoint.subtract(currentCenterPoint),

                topLeftOffset = viewHalf.multiplyBy(-scale).add(position).add(
                    viewHalf).subtract(centerOffset);

            if (L.Browser.any3d) {
                L.DomUtil.setTransform(this._containerSymbol, topLeftOffset,
                    scale);
            } else {
                L.DomUtil.setPosition(this._containerSymbol, topLeftOffset);
            }
        },

        _update: function () {
            L.Renderer.prototype._update.call(this);

            let b = this._bounds,
                container = this._containerSymbol,
                size = b.getSize(),
                m = L.Browser.retina ? 2 : 1;

            L.DomUtil.setPosition(container, b.min);

            // set canvas size (also clearing it); use double size on retina
            container.width = m * size.x;
            container.height = m * size.y;
            container.style.width = size.x + 'px';
            container.style.height = size.y + 'px';

            // display text on the whole surface
            container.style.zIndex = '4';
            this._container.style.zIndex = '3';

            if (L.Browser.retina) {
                this._ctxLabel.scale(2, 2);
            }

            // translate so we use the same path coordinates after canvas
            // element moves
            this._ctxLabel.translate(-b.min.x, -b.min.y);
            L.Canvas.prototype._update.call(this);

        },

        _updatePoly: function (layer, closed) {
            L.Canvas.prototype._updatePoly.call(this, layer, closed);
            this._text(this._ctxLabel, layer);
        },

    });

    // return your plugin when you are done
    return ArrowPath;

}, window));


