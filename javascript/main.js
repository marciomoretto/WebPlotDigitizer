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

wpd.app = {
    scale: 1,
    minScale: 0.25,
    maxScale: 6,
    zoomStep: 1.25,
    mode: 'add',
    markerRadius: 5,
    points: [],
    hoverImagePoint: null,
    image: null,
    objectUrl: null,
    elements: {},

    init: function() {
        this.cacheElements();
        this.bindEvents();
        this.loadDefaultImage();
        this.hideLoadingCurtain();
    },

    cacheElements: function() {
        this.elements.canvas = document.getElementById('imageCanvas');
        this.elements.ctx = this.elements.canvas.getContext('2d');
        this.elements.zoomCanvas = document.getElementById('zoomCanvas');
        this.elements.zoomCtx = this.elements.zoomCanvas.getContext('2d');
        this.elements.imageLoader = document.getElementById('imageLoader');
        this.elements.zoomInBtn = document.getElementById('zoomInBtn');
        this.elements.zoomOutBtn = document.getElementById('zoomOutBtn');
        this.elements.addPointBtn = document.getElementById('addPointBtn');
        this.elements.deletePointBtn = document.getElementById('deletePointBtn');
        this.elements.submitBtn = document.getElementById('submitBtn');
        this.elements.pointsCountValue = document.getElementById('pointsCountValue');
        this.elements.pointsList = document.getElementById('pointsList');
        this.elements.submitOutput = document.getElementById('submitOutput');
        this.elements.cursorReadout = document.getElementById('cursorReadout');
        this.elements.zoomLevelLabel = document.getElementById('zoomLevelLabel');
    },

    bindEvents: function() {
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
    },

    hideLoadingCurtain: function() {
        var loadingCurtain = document.getElementById('loadingCurtain');
        if (loadingCurtain != null) {
            loadingCurtain.style.display = 'none';
        }
    },

    loadDefaultImage: function() {
        this.loadImageFromUrl('start.png');
    },

    handleImageUpload: function(event) {
        var file = event.target.files != null ? event.target.files[0] : null;
        if (file == null) {
            return;
        }

        if (this.objectUrl != null) {
            URL.revokeObjectURL(this.objectUrl);
        }

        this.objectUrl = URL.createObjectURL(file);
        this.loadImageFromUrl(this.objectUrl);
    },

    loadImageFromUrl: function(url) {
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
            app.renderPointsList();
            app.updatePointsCount();
            app.updateSubmitOutput('');
        };
        image.src = url;
    },

    setMode: function(mode) {
        this.mode = mode;
        this.elements.addPointBtn.classList.toggle('pressed-button', mode === 'add');
        this.elements.deletePointBtn.classList.toggle('pressed-button', mode === 'delete');
        this.elements.canvas.classList.toggle('delete-mode', mode === 'delete');
    },

    zoomIn: function() {
        this.scale = Math.min(this.maxScale, this.scale * this.zoomStep);
        this.render();
    },

    zoomOut: function() {
        this.scale = Math.max(this.minScale, this.scale / this.zoomStep);
        this.render();
    },

    handleCanvasClick: function(event) {
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
        this.renderPointsList();
        this.updatePointsCount();
    },

    handlePointerMove: function(event) {
        var imagePoint = this.getImagePointFromEvent(event);
        if (imagePoint == null) {
            this.handlePointerLeave();
            return;
        }

        this.hoverImagePoint = imagePoint;
        this.elements.cursorReadout.textContent = 'x: ' + imagePoint.x.toFixed(1) + ', y: ' + imagePoint.y.toFixed(1);
        this.renderZoom();
    },

    handlePointerLeave: function() {
        this.hoverImagePoint = null;
        this.elements.cursorReadout.textContent = 'x: -, y: -';
        this.renderZoom();
    },

    getImagePointFromEvent: function(event) {
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
    },

    deleteNearestPoint: function(imagePoint) {
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
    },

    render: function() {
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
    },

    drawPoint: function(ctx, point, label) {
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
    },

    renderZoom: function() {
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
    },

    renderPointsList: function() {
        var list = this.elements.pointsList;
        list.innerHTML = '';

        if (this.points.length === 0) {
            var emptyItem = document.createElement('li');
            emptyItem.textContent = 'No points added yet.';
            emptyItem.className = 'empty-state';
            list.appendChild(emptyItem);
            return;
        }

        for (var index = 0; index < this.points.length; index++) {
            var point = this.points[index];
            var item = document.createElement('li');
            item.textContent = '#' + (index + 1) + ' — x: ' + point.x.toFixed(1) + ', y: ' + point.y.toFixed(1);
            list.appendChild(item);
        }
    },

    updatePointsCount: function() {
        this.elements.pointsCountValue.textContent = String(this.points.length);
    },

    updateSubmitOutput: function(value) {
        this.elements.submitOutput.value = value;
    },

    submit: function() {
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
        var serializedPayload = JSON.stringify(payload, null, 2);
        this.updateSubmitOutput(serializedPayload);
        window.dispatchEvent(new CustomEvent('wpd:submit', {
            detail: payload
        }));
    }
};

document.addEventListener('DOMContentLoaded', function() {
    wpd.app.init();
}, true);
