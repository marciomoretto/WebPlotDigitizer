/*
    WebPlotDigitizer - web based chart data extraction software (and more)

    Copyright (C) 2025 Ankit Rohatgi

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>
*/

var wpd = window.wpd || {};

wpd.MinimalApp = function(rootElement) {
    this.root = rootElement;
    this.scale = 1;
    this.minScale = 0.25;
    this.maxScale = 6;
    this.zoomStep = 1.25;
    this.mode = 'add';
    this.markerRadius = 5;
    this.points = [];
    this.hoverImagePoint = null;
    this.image = null;
    this.objectUrl = null;
    this.lastSubmittedPayload = null;
    this.elements = {};
};

wpd.MinimalApp.prototype.init = function() {
    this.cacheElements();
    this.bindEvents();
    this.updatePointsCount();
    this.loadDefaultImage();
    this.hideLoadingCurtain();
    this.root.dataset.wpdMounted = 'true';
};

wpd.MinimalApp.prototype.query = function(selector) {
    return this.root.querySelector(selector);
};

wpd.MinimalApp.prototype.cacheElements = function() {
    this.elements.loadingCurtain = this.query('[data-wpd-loading-curtain]');
    this.elements.canvas = this.query('[data-wpd-image-canvas]');
    this.elements.ctx = this.elements.canvas.getContext('2d');
    this.elements.zoomCanvas = this.query('[data-wpd-zoom-canvas]');
    this.elements.zoomCtx = this.elements.zoomCanvas.getContext('2d');
    this.elements.imageLoader = this.query('[data-wpd-image-loader]');
    this.elements.zoomInBtn = this.query('[data-wpd-zoom-in]');
    this.elements.zoomOutBtn = this.query('[data-wpd-zoom-out]');
    this.elements.addPointBtn = this.query('[data-wpd-add-point]');
    this.elements.deletePointBtn = this.query('[data-wpd-delete-point]');
    this.elements.submitBtn = this.query('[data-wpd-submit]');
    this.elements.pointsCountValue = this.query('[data-wpd-points-count]');
    this.elements.cursorReadout = this.query('[data-wpd-cursor-readout]');
    this.elements.zoomLevelLabel = this.query('[data-wpd-zoom-level]');
};

wpd.MinimalApp.prototype.bindEvents = function() {
    this.elements.imageLoader.addEventListener('change', this.handleImageUpload.bind(this));
    this.elements.zoomInBtn.addEventListener('click', this.zoomIn.bind(this));
    this.elements.zoomOutBtn.addEventListener('click', this.zoomOut.bind(this));
    this.elements.addPointBtn.addEventListener('click', this.setMode.bind(this, 'add'));
    this.elements.deletePointBtn.addEventListener('click', this.setMode.bind(this, 'delete'));
    this.elements.submitBtn.addEventListener('click', this.submit.bind(this));
    this.elements.canvas.addEventListener('click', this.handleCanvasClick.bind(this));
    this.elements.canvas.addEventListener('mousemove', this.handlePointerMove.bind(this));
    this.elements.canvas.addEventListener('mouseleave', this.handlePointerLeave.bind(this));
    window.addEventListener('resize', this.render.bind(this));
};

wpd.MinimalApp.prototype.hideLoadingCurtain = function() {
    if (this.elements.loadingCurtain != null) {
        this.elements.loadingCurtain.style.display = 'none';
    }
};

wpd.MinimalApp.prototype.getDefaultImageUrl = function() {
    return this.root.dataset.wpdDefaultImage || 'start.png';
};

wpd.MinimalApp.prototype.loadDefaultImage = function() {
    this.loadImageFromUrl(this.getDefaultImageUrl());
};

wpd.MinimalApp.prototype.handleImageUpload = function(event) {
    var file = event.target.files != null ? event.target.files[0] : null;
    if (file == null) {
        return;
    }

    if (this.objectUrl != null) {
        URL.revokeObjectURL(this.objectUrl);
    }

    this.objectUrl = URL.createObjectURL(file);
    this.loadImageFromUrl(this.objectUrl);
};

wpd.MinimalApp.prototype.loadImageFromUrl = function(url) {
    var app = this;
    var image = new Image();
    image.onload = function() {
        app.image = image;
        app.points = [];
        app.scale = 1;
        app.hoverImagePoint = {
            x: image.width / 2,
            y: image.height / 2
        };
        app.render();
        app.updatePointsCount();
    };
    image.src = url;
};

wpd.MinimalApp.prototype.setMode = function(mode) {
    this.mode = mode;
    this.elements.addPointBtn.classList.toggle('pressed-button', mode === 'add');
    this.elements.deletePointBtn.classList.toggle('pressed-button', mode === 'delete');
    this.elements.canvas.classList.toggle('delete-mode', mode === 'delete');
};

wpd.MinimalApp.prototype.zoomIn = function() {
    this.scale = Math.min(this.maxScale, this.scale * this.zoomStep);
    this.render();
};

wpd.MinimalApp.prototype.zoomOut = function() {
    this.scale = Math.max(this.minScale, this.scale / this.zoomStep);
    this.render();
};

wpd.MinimalApp.prototype.handleCanvasClick = function(event) {
    var imagePoint = this.getImagePointFromEvent(event);
    if (imagePoint == null) {
        return;
    }

    if (this.mode === 'add') {
        this.points.push(imagePoint);
    } else {
        this.deleteNearestPoint(imagePoint);
    }

    this.hoverImagePoint = imagePoint;
    this.render();
    this.updatePointsCount();
};

wpd.MinimalApp.prototype.handlePointerMove = function(event) {
    var imagePoint = this.getImagePointFromEvent(event);
    if (imagePoint == null) {
        this.handlePointerLeave();
        return;
    }

    this.hoverImagePoint = imagePoint;
    this.elements.cursorReadout.textContent = 'x: ' + imagePoint.x.toFixed(1) + ', y: ' + imagePoint.y.toFixed(1);
    this.renderZoom();
};

wpd.MinimalApp.prototype.handlePointerLeave = function() {
    this.hoverImagePoint = null;
    this.elements.cursorReadout.textContent = 'x: -, y: -';
    this.renderZoom();
};

wpd.MinimalApp.prototype.getImagePointFromEvent = function(event) {
    if (this.image == null) {
        return null;
    }

    var rect = this.elements.canvas.getBoundingClientRect();
    var x = (event.clientX - rect.left) / this.scale;
    var y = (event.clientY - rect.top) / this.scale;

    if (x < 0 || y < 0 || x > this.image.width || y > this.image.height) {
        return null;
    }

    return {
        x: x,
        y: y
    };
};

wpd.MinimalApp.prototype.deleteNearestPoint = function(imagePoint) {
    if (this.points.length === 0) {
        return;
    }

    var threshold = 14 / this.scale;
    var nearestIndex = -1;
    var nearestDistance = Infinity;

    for (var index = 0; index < this.points.length; index++) {
        var point = this.points[index];
        var dx = point.x - imagePoint.x;
        var dy = point.y - imagePoint.y;
        var distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = index;
        }
    }

    if (nearestIndex !== -1 && nearestDistance <= threshold) {
        this.points.splice(nearestIndex, 1);
    }
};

wpd.MinimalApp.prototype.render = function() {
    if (this.image == null) {
        return;
    }

    this.elements.canvas.width = Math.round(this.image.width * this.scale);
    this.elements.canvas.height = Math.round(this.image.height * this.scale);

    var ctx = this.elements.ctx;
    ctx.clearRect(0, 0, this.elements.canvas.width, this.elements.canvas.height);
    ctx.drawImage(this.image, 0, 0, this.elements.canvas.width, this.elements.canvas.height);

    for (var index = 0; index < this.points.length; index++) {
        var point = this.points[index];
        this.drawPoint(ctx, point, index + 1);
    }

    this.elements.zoomLevelLabel.textContent = Math.round(this.scale * 100) + '%';
    this.renderZoom();
};

wpd.MinimalApp.prototype.drawPoint = function(ctx, point, label) {
    var screenX = point.x * this.scale;
    var screenY = point.y * this.scale;
    var radius = this.markerRadius + Math.max(0, this.scale - 1.0);

    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = '#ef4444';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.arc(screenX, screenY, radius, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#111827';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(String(label), screenX + radius + 4, screenY - radius - 4);
    ctx.restore();
};

wpd.MinimalApp.prototype.renderZoom = function() {
    var ctx = this.elements.zoomCtx;
    var zoomCanvas = this.elements.zoomCanvas;
    ctx.clearRect(0, 0, zoomCanvas.width, zoomCanvas.height);
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, zoomCanvas.width, zoomCanvas.height);

    if (this.image == null || this.hoverImagePoint == null) {
        return;
    }

    var sourceSize = 40;
    var sx = Math.max(0, Math.min(this.image.width - sourceSize, this.hoverImagePoint.x - sourceSize / 2));
    var sy = Math.max(0, Math.min(this.image.height - sourceSize, this.hoverImagePoint.y - sourceSize / 2));

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.image, sx, sy, sourceSize, sourceSize, 0, 0, zoomCanvas.width, zoomCanvas.height);

    ctx.save();
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(zoomCanvas.width / 2, 0);
    ctx.lineTo(zoomCanvas.width / 2, zoomCanvas.height);
    ctx.moveTo(0, zoomCanvas.height / 2);
    ctx.lineTo(zoomCanvas.width, zoomCanvas.height / 2);
    ctx.stroke();
    ctx.restore();
};

wpd.MinimalApp.prototype.updatePointsCount = function() {
    if (this.elements.pointsCountValue != null) {
        this.elements.pointsCountValue.textContent = String(this.points.length);
    }
};

wpd.MinimalApp.prototype.submit = function() {
    var payload = {
        axis: 'image',
        points: this.points.map(function(point, index) {
            return {
                id: index + 1,
                x: Number(point.x.toFixed(2)),
                y: Number(point.y.toFixed(2))
            };
        })
    };

    this.lastSubmittedPayload = payload;
    this.root.dispatchEvent(new CustomEvent('wpd:submit', {
        bubbles: true,
        detail: payload
    }));
};

wpd.mountMinimalApp = function(rootElement) {
    if (rootElement == null) {
        return null;
    }

    if (rootElement.__wpdMinimalApp != null) {
        return rootElement.__wpdMinimalApp;
    }

    var app = new wpd.MinimalApp(rootElement);
    rootElement.__wpdMinimalApp = app;
    app.init();
    return app;
};

wpd.initMinimalApps = function() {
    var appRoots = document.querySelectorAll('[data-wpd-app]');
    for (var index = 0; index < appRoots.length; index++) {
        wpd.mountMinimalApp(appRoots[index]);
    }
};

document.addEventListener('DOMContentLoaded', function() {
    wpd.initMinimalApps();
}, true);
