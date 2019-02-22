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
    let ArrowPath = L.Canvas.extend({

        options: {
            stepSize: 10,
            symbolText: null,
            symbolImg: null,
            textAlign: "center",
            textBaseline: "middle",
            aniOffset: 0.3,
            theta: 0,
            offsetX: 0,
            offsetY: 0,
            imgClipOffset: 0
        },

        initialize: function (options) {
            options = L.Util.setOptions(this, options);
            L.Util.stamp(this);
            // this._layers = this._layers || {};

        },

        _initContainer: function (options) {

            L.Canvas.prototype._initContainer.call(this);

            this._containerText = document.createElement('canvas');

            L.DomEvent.on(this._containerText, 'mousemove',
                L.Util.throttle(this._onMouseMove, 32, this), this).on(
                this._containerText,
                'click dblclick mousedown mouseup contextmenu',
                this._onClick, this).on(this._containerText,
                'mouseout', this._handleMouseOut, this);

            this._ctxLabel = this._containerText.getContext('2d');

            L.DomUtil
                .addClass(this._containerText, 'leaflet-zoom-animated');
            this.getPane().appendChild(this._containerText);

            //Register the add/remove layers event to update the annotations accordingly
            if (this._map) {
                let handleLayerChanges = function () {
                    this._reset();
                    this._redraw();
                }.bind(this);
                this._map.on("layerremove", L.Util.throttle(handleLayerChanges, 32, this));
            }
        },

        _text: function (ctx, layer) {
            let options = this.options;
            ctx.globalAlpha = 1;
            let p;

            // polygon or polyline
            if (layer._parts.length === 0 || layer._parts[0].length === 0) {
                return;
            }

            if (layer instanceof L.Polyline && this._map.hasLayer(layer)) {
                p = this._getCenter(layer._parts[0]);
            }

            if (!p || (!options.symbolImg && !options.symbolText)) {
                return;
            }

            /**
             * Render text alongside the polyline
             *
             **/
            if (layer._parts) {
                ctx.textAlign = options.textAlign;
                ctx.textBaseline = options.textBaseline;
                this._drawSymbol(layer._parts, ctx, options);

            }
        },

        _drawSymbol: function (parts, ctx, options) {
            parts.forEach((points) => {
                for (let i = 0, l = points.length - 1; i < l; i++) {
                    this._generatePoints(ctx, points[i], points[i + 1],
                        options.stepSize, options.aniOffset, options.symbolImg || options.symbolText,
                        options.theta, options.offsetX, options.offsetY, options.imgClipOffset)
                }
            });
        },

        _generatePoints: function (ctx, startP, endP, stepSize = 30, aniOffset = 0.5, img, theta, offsetX, offsetY, imgClipOffset) {
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
                if (img) {
                    this._drawImg(pX, pY, img, ctx, radA, theta, offsetX, offsetY, imgClipOffset);
                } else {
                    this._drawText(pX, pY, img, ctx, radA, theta, offsetX, offsetY);
                }
            }
        },

        _drawText: function (pX, pY, img, ctx, radA, theta, offsetX, offsetY) {
            ctx.fillText(img, pX + offsetX, pY + offsetY);
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
                L.DomUtil.setTransform(this._containerText, topLeftOffset,
                    scale);
            } else {
                L.DomUtil.setPosition(this._containerText, topLeftOffset);
            }
        },

        _update: function () {
            // textList
            this._textList = [];

            L.Renderer.prototype._update.call(this);
            let b = this._bounds, container = this._containerText, size = b
                .getSize(), m = L.Browser.retina ? 2 : 1;

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

        _getCenter: function (points) {

            let i, halfDist, segDist, dist, p1, p2, ratio, len = points.length;

            if (!len) {
                return null;
            }

            // polyline centroid algorithm; only uses the first ring if
            // there are multiple

            for (i = 0, halfDist = 0; i < len - 1; i++) {
                halfDist += points[i].distanceTo(points[i + 1]) / 2;
            }

            // The line is so small in the current view that all points are
            // on the same pixel.
            if (halfDist === 0) {
                return points[0];
            }

            for (i = 0, dist = 0; i < len - 1; i++) {
                p1 = points[i];
                p2 = points[i + 1];
                segDist = p1.distanceTo(p2);
                dist += segDist;

                if (dist > halfDist) {
                    ratio = (dist - halfDist) / segDist;
                    let resutl = [p2.x - ratio * (p2.x - p1.x),
                        p2.y - ratio * (p2.y - p1.y)];

                    return L.point(resutl[0], resutl[1]);
                }
            }
        },

        _getDynamicFontSize: function () {
            return parseInt(this._map.getZoom());
        },

    });
    // implement your plugin

    // return your plugin when you are done
    return ArrowPath;
}, window));


