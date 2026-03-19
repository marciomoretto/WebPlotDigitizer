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
    this.markerColor = '#ef4444';
    this.points = [];
    this.hoverImagePoint = null;
    this.image = null;
    this.objectUrl = null;
    this.lastSubmittedPayload = null;
    this.lastStoredSubmission = null;
    this.lastLoadedPointsPayload = null;
    this.elements = {};
    this.zoomDrag = {
        active: false,
        pointerId: null,
        offsetX: 0,
        offsetY: 0
    };
    this.handleZoomDragMoveBound = this.handleZoomDragMove.bind(this);
    this.handleZoomDragEndBound = this.handleZoomDragEnd.bind(this);
};

wpd.MinimalApp.prototype.init = function() {
    try {
        this.cacheElements();
        // Hide the loading curtain as soon as core elements are cached.
        this.hideLoadingCurtain();
        this.bindEvents();
        this.applyMarkerColorFromPicker();
        this.updatePointsCount();
        var defaultImageRequest = this.loadDefaultImage();
        if (defaultImageRequest != null && typeof defaultImageRequest.catch === 'function') {
            defaultImageRequest.catch(function() {
                return null;
            });
        }
        this.loadDefaultPoints(defaultImageRequest);
        this.root.dataset.wpdMounted = 'true';
    } catch (error) {
        this.hideLoadingCurtain();
        this.root.dataset.wpdMounted = 'error';
        if (window.console != null && typeof window.console.error === 'function') {
            window.console.error('WebPlotDigitizer minimal app initialization failed:', error);
        }
    }
};

wpd.MinimalApp.prototype.query = function(selector) {
    return this.root.querySelector(selector);
};

wpd.MinimalApp.prototype.cacheElements = function() {
    this.elements.loadingCurtain = this.query('[data-wpd-loading-curtain]');
    this.elements.canvas = this.query('[data-wpd-image-canvas]');
    this.elements.ctx = this.elements.canvas.getContext('2d');
    this.elements.zoomPanel = this.query('.zoom-panel');
    this.elements.zoomHeader = this.query('.zoom-header');
    this.elements.zoomCanvas = this.query('[data-wpd-zoom-canvas]');
    this.elements.zoomCtx = this.elements.zoomCanvas != null ? this.elements.zoomCanvas.getContext('2d') : null;
    this.elements.zoomToggleBtn = this.query('[data-wpd-zoom-toggle]');
    this.elements.imageLoader = this.query('[data-wpd-image-loader]');
    this.elements.zoomInBtn = this.query('[data-wpd-zoom-in]');
    this.elements.zoomOutBtn = this.query('[data-wpd-zoom-out]');
    this.elements.addPointBtn = this.query('[data-wpd-add-point]');
    this.elements.deletePointBtn = this.query('[data-wpd-delete-point]');
    this.elements.submitBtn = this.query('[data-wpd-submit]');
    this.elements.pointsCountValue = this.query('[data-wpd-points-count]');
    this.elements.pointColorPicker = this.query('[data-wpd-point-color-picker]');
    this.elements.hotkeysScope = this.query('[data-wpd-hotkeys-scope]');
    this.elements.cursorReadout = this.query('[data-wpd-cursor-readout]');
    this.elements.zoomLevelLabel = this.query('[data-wpd-zoom-level]');
};

wpd.MinimalApp.prototype.bindEvents = function() {
    if (this.elements.imageLoader != null) {
        this.elements.imageLoader.addEventListener('change', this.handleImageUpload.bind(this));
    }

    if (this.elements.zoomInBtn != null) {
        this.elements.zoomInBtn.addEventListener('click', this.zoomIn.bind(this));
    }

    if (this.elements.zoomOutBtn != null) {
        this.elements.zoomOutBtn.addEventListener('click', this.zoomOut.bind(this));
    }

    if (this.elements.zoomToggleBtn != null) {
        this.elements.zoomToggleBtn.addEventListener('click', this.toggleZoomPanel.bind(this));
    }

    if (this.elements.zoomHeader != null) {
        this.elements.zoomHeader.addEventListener('pointerdown', this.handleZoomDragStart.bind(this));
    }

    if (this.elements.addPointBtn != null) {
        this.elements.addPointBtn.addEventListener('click', this.setMode.bind(this, 'add'));
    }

    if (this.elements.deletePointBtn != null) {
        this.elements.deletePointBtn.addEventListener('click', this.setMode.bind(this, 'delete'));
    }

    if (this.elements.submitBtn != null) {
        this.elements.submitBtn.addEventListener('click', this.submit.bind(this));
    }

    if (this.elements.pointColorPicker != null) {
        this.elements.pointColorPicker.addEventListener('input', this.handlePointColorChange.bind(this));
        this.elements.pointColorPicker.addEventListener('change', this.handlePointColorChange.bind(this));
    }

    if (this.elements.hotkeysScope != null) {
        this.elements.hotkeysScope.addEventListener('keydown', this.handleHotkeys.bind(this));
    }

    if (this.elements.canvas != null) {
        this.elements.canvas.addEventListener('click', this.handleCanvasClick.bind(this));
        this.elements.canvas.addEventListener('mousemove', this.handlePointerMove.bind(this));
        this.elements.canvas.addEventListener('mouseleave', this.handlePointerLeave.bind(this));
    }

    window.addEventListener('resize', this.render.bind(this));
};

wpd.MinimalApp.prototype.isValidHexColor = function(colorValue) {
    return typeof colorValue === 'string' && /^#[0-9a-fA-F]{6}$/.test(colorValue);
};

wpd.MinimalApp.prototype.applyMarkerColorFromPicker = function() {
    if (this.elements.pointColorPicker == null) {
        return;
    }

    this.setMarkerColor(this.elements.pointColorPicker.value, false);
};

wpd.MinimalApp.prototype.setMarkerColor = function(colorValue, shouldRender) {
    if (!this.isValidHexColor(colorValue)) {
        return;
    }

    this.markerColor = colorValue;

    if (this.elements.pointColorPicker != null && this.elements.pointColorPicker.value !== colorValue) {
        this.elements.pointColorPicker.value = colorValue;
    }

    if (shouldRender !== false) {
        this.render();
    }
};

wpd.MinimalApp.prototype.handlePointColorChange = function(event) {
    this.setMarkerColor(event.target.value);
};

wpd.MinimalApp.prototype.canDragZoomPanel = function() {
    if (this.elements.zoomPanel == null) {
        return false;
    }

    return window.getComputedStyle(this.elements.zoomPanel).position === 'fixed';
};

wpd.MinimalApp.prototype.handleZoomDragStart = function(event) {
    if (!this.canDragZoomPanel()) {
        return;
    }

    if (event.button != null && event.button !== 0) {
        return;
    }

    if (event.target != null && typeof event.target.closest === 'function' && event.target.closest('[data-wpd-zoom-toggle]') != null) {
        return;
    }

    var panelRect = this.elements.zoomPanel.getBoundingClientRect();
    this.zoomDrag.active = true;
    this.zoomDrag.pointerId = event.pointerId;
    this.zoomDrag.offsetX = event.clientX - panelRect.left;
    this.zoomDrag.offsetY = event.clientY - panelRect.top;

    this.elements.zoomPanel.classList.add('is-dragging');

    if (this.elements.zoomHeader != null && typeof this.elements.zoomHeader.setPointerCapture === 'function' && event.pointerId != null) {
        this.elements.zoomHeader.setPointerCapture(event.pointerId);
    }

    window.addEventListener('pointermove', this.handleZoomDragMoveBound);
    window.addEventListener('pointerup', this.handleZoomDragEndBound);
    window.addEventListener('pointercancel', this.handleZoomDragEndBound);

    event.preventDefault();
};

wpd.MinimalApp.prototype.handleZoomDragMove = function(event) {
    if (!this.zoomDrag.active || this.elements.zoomPanel == null) {
        return;
    }

    if (this.zoomDrag.pointerId != null && event.pointerId != null && event.pointerId !== this.zoomDrag.pointerId) {
        return;
    }

    var margin = 8;
    var panelWidth = this.elements.zoomPanel.offsetWidth;
    var panelHeight = this.elements.zoomPanel.offsetHeight;
    var maxLeft = Math.max(margin, window.innerWidth - panelWidth - margin);
    var maxTop = Math.max(margin, window.innerHeight - panelHeight - margin);

    var nextLeft = event.clientX - this.zoomDrag.offsetX;
    var nextTop = event.clientY - this.zoomDrag.offsetY;

    nextLeft = Math.max(margin, Math.min(nextLeft, maxLeft));
    nextTop = Math.max(margin, Math.min(nextTop, maxTop));

    this.elements.zoomPanel.style.left = nextLeft + 'px';
    this.elements.zoomPanel.style.top = nextTop + 'px';
    this.elements.zoomPanel.style.right = 'auto';
    this.elements.zoomPanel.style.bottom = 'auto';
};

wpd.MinimalApp.prototype.handleZoomDragEnd = function(event) {
    if (!this.zoomDrag.active) {
        return;
    }

    if (this.zoomDrag.pointerId != null && event.pointerId != null && event.pointerId !== this.zoomDrag.pointerId) {
        return;
    }

    this.zoomDrag.active = false;

    if (this.elements.zoomPanel != null) {
        this.elements.zoomPanel.classList.remove('is-dragging');
    }

    if (this.elements.zoomHeader != null && typeof this.elements.zoomHeader.releasePointerCapture === 'function' && event.pointerId != null) {
        try {
            this.elements.zoomHeader.releasePointerCapture(event.pointerId);
        } catch (error) {
            // Ignore capture release errors from already-released pointers.
        }
    }

    this.zoomDrag.pointerId = null;
    window.removeEventListener('pointermove', this.handleZoomDragMoveBound);
    window.removeEventListener('pointerup', this.handleZoomDragEndBound);
    window.removeEventListener('pointercancel', this.handleZoomDragEndBound);
};

wpd.MinimalApp.prototype.isZoomPanelCollapsed = function() {
    return this.elements.zoomPanel != null && this.elements.zoomPanel.classList.contains('is-collapsed');
};

wpd.MinimalApp.prototype.updateZoomToggleButton = function() {
    if (this.elements.zoomToggleBtn == null) {
        return;
    }

    var isCollapsed = this.isZoomPanelCollapsed();
    var expandLabel = this.elements.zoomToggleBtn.dataset.labelExpand || 'Maximize zoom';
    var collapseLabel = this.elements.zoomToggleBtn.dataset.labelCollapse || 'Minimize zoom';
    var label = isCollapsed ? expandLabel : collapseLabel;

    this.elements.zoomToggleBtn.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');
    this.elements.zoomToggleBtn.setAttribute('aria-label', label);
    this.elements.zoomToggleBtn.setAttribute('title', label);
};

wpd.MinimalApp.prototype.toggleZoomPanel = function() {
    if (this.elements.zoomPanel == null) {
        return;
    }

    this.elements.zoomPanel.classList.toggle('is-collapsed');
    this.updateZoomToggleButton();
};

wpd.MinimalApp.prototype.hideLoadingCurtain = function() {
    var loadingCurtain = this.elements.loadingCurtain;
    if (loadingCurtain == null) {
        loadingCurtain = this.query('[data-wpd-loading-curtain]');
    }

    if (loadingCurtain != null) {
        loadingCurtain.style.display = 'none';
    }
};

wpd.MinimalApp.prototype.getDefaultImageUrl = function() {
    return this.root.dataset.wpdDefaultImage || 'start.png';
};

wpd.MinimalApp.prototype.getDefaultPointsUrl = function() {
    return this.root.dataset.wpdDefaultPoints || '';
};

wpd.MinimalApp.prototype.loadDefaultImage = function() {
    this.updateZoomToggleButton();
    return this.loadImageFromUrl(this.getDefaultImageUrl());
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
    this.loadImageFromUrl(this.objectUrl).catch(function() {
        // Keep the current image if the uploaded file cannot be decoded.
    });
};

wpd.MinimalApp.prototype.loadImageFromUrl = function(url) {
    var app = this;

    return new Promise(function(resolve, reject) {
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
            resolve(image);
        };

        image.onerror = function() {
            reject(new Error('Failed to load image'));
        };

        image.src = url;
    });
};

wpd.MinimalApp.prototype.loadDefaultPoints = function(waitForImagePromise) {
    var pointsUrl = this.getDefaultPointsUrl();
    if (typeof pointsUrl !== 'string' || pointsUrl.trim() === '' || typeof window.fetch !== 'function') {
        return;
    }

    var app = this;
    var imageReady = waitForImagePromise;
    if (imageReady == null || typeof imageReady.then !== 'function') {
        imageReady = Promise.resolve();
    }

    imageReady.catch(function() {
        return null;
    }).then(function() {
        return window.fetch(pointsUrl, {
            method: 'GET',
            credentials: 'same-origin',
            headers: {
                'Accept': 'application/json'
            }
        });
    }).then(function(response) {
        return response.json().then(function(body) {
            return {
                ok: response.ok,
                status: response.status,
                body: body
            };
        }).catch(function() {
            return {
                ok: response.ok,
                status: response.status,
                body: null
            };
        });
    }).then(function(result) {
        if (!result.ok) {
            throw new Error('Failed to load default points (status ' + result.status + ')');
        }

        var parsed = app.parseDefaultPointsPayload(result.body);
        app.points = parsed.points;
        app.lastLoadedPointsPayload = parsed.payload;
        app.updatePointsCount();
        app.render();
        app.root.dispatchEvent(new CustomEvent('wpd:points:loaded', {
            bubbles: true,
            detail: {
                axis: parsed.axis,
                points: parsed.payload.points,
                points_count: parsed.points.length
            }
        }));
    }).catch(function(error) {
        app.root.dispatchEvent(new CustomEvent('wpd:points:load-error', {
            bubbles: true,
            detail: {
                message: error.message
            }
        }));
    });
};

wpd.MinimalApp.prototype.parseDefaultPointsPayload = function(payload) {
    var axis = 'image';
    var rawPoints = payload;

    if (payload != null && !Array.isArray(payload) && typeof payload === 'object') {
        axis = typeof payload.axis === 'string' && payload.axis.trim() !== '' ? payload.axis : 'image';
        rawPoints = payload.points;
    }

    if (!Array.isArray(rawPoints)) {
        throw new Error('Default points payload must be an array or include a points array');
    }

    var normalizedPayloadPoints = [];
    var normalizedPoints = [];

    for (var index = 0; index < rawPoints.length; index++) {
        var point = rawPoints[index];
        if (point == null || typeof point !== 'object') {
            throw new Error('Point entry ' + (index + 1) + ' must be an object');
        }

        var x = this.toFiniteNumber(point.x);
        var y = this.toFiniteNumber(point.y);

        if (x == null || y == null) {
            throw new Error('Point entry ' + (index + 1) + ' must include numeric x and y');
        }

        normalizedPoints.push({
            x: x,
            y: y
        });

        normalizedPayloadPoints.push({
            id: point.id == null ? (index + 1) : point.id,
            x: x,
            y: y
        });
    }

    return {
        axis: axis,
        points: normalizedPoints,
        payload: {
            axis: axis,
            points: normalizedPayloadPoints
        }
    };
};

wpd.MinimalApp.prototype.toFiniteNumber = function(value) {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null;
    }

    if (typeof value === 'string' && value.trim() !== '') {
        var parsedValue = Number(value);
        return Number.isFinite(parsedValue) ? parsedValue : null;
    }

    return null;
};

wpd.MinimalApp.prototype.setMode = function(mode) {
    this.mode = mode;

    if (this.elements.addPointBtn != null) {
        this.elements.addPointBtn.classList.toggle('pressed-button', mode === 'add');
    }

    if (this.elements.deletePointBtn != null) {
        this.elements.deletePointBtn.classList.toggle('pressed-button', mode === 'delete');
    }

    if (this.elements.canvas != null) {
        this.elements.canvas.classList.toggle('delete-mode', mode === 'delete');
    }
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

    if (this.elements.hotkeysScope != null) {
        this.elements.hotkeysScope.focus();
    }
    this.hoverImagePoint = imagePoint;
    this.render();
    this.updatePointsCount();
};

wpd.MinimalApp.prototype.handleHotkeys = function(event) {
    if (event.altKey || event.ctrlKey || event.metaKey) {
        return;
    }

    if (event.key === 'a' || event.key === 'A') {
        this.setMode('add');
        event.preventDefault();
        return;
    }

    if (event.key === 'd' || event.key === 'D') {
        this.setMode('delete');
        event.preventDefault();
        return;
    }

    if (event.key === '+' || event.key === '=') {
        this.zoomIn();
        event.preventDefault();
        return;
    }

    if (event.key === '-' || event.key === '_') {
        this.zoomOut();
        event.preventDefault();
    }
};

wpd.MinimalApp.prototype.handlePointerMove = function(event) {
    var imagePoint = this.getImagePointFromEvent(event);
    if (imagePoint == null) {
        this.handlePointerLeave();
        return;
    }

    this.hoverImagePoint = imagePoint;
    if (this.elements.cursorReadout != null) {
        this.elements.cursorReadout.textContent = 'x: ' + imagePoint.x.toFixed(1) + ', y: ' + imagePoint.y.toFixed(1);
    }
    this.renderZoom();
};

wpd.MinimalApp.prototype.handlePointerLeave = function() {
    this.hoverImagePoint = null;
    if (this.elements.cursorReadout != null) {
        this.elements.cursorReadout.textContent = 'x: -, y: -';
    }
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
        this.drawPoint(ctx, point);
    }

    if (this.elements.zoomLevelLabel != null) {
        this.elements.zoomLevelLabel.textContent = Math.round(this.scale * 100) + '%';
    }
    this.renderZoom();
};

wpd.MinimalApp.prototype.drawPoint = function(ctx, point) {
    var screenX = point.x * this.scale;
    var screenY = point.y * this.scale;
    var radius = this.markerRadius + Math.max(0, this.scale - 1.0);

    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = this.markerColor;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.arc(screenX, screenY, radius, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
};

wpd.MinimalApp.prototype.renderZoom = function() {
    var ctx = this.elements.zoomCtx;
    var zoomCanvas = this.elements.zoomCanvas;

    if (ctx == null || zoomCanvas == null) {
        return;
    }

    ctx.clearRect(0, 0, zoomCanvas.width, zoomCanvas.height);
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, zoomCanvas.width, zoomCanvas.height);

    if (this.image == null || this.hoverImagePoint == null) {
        return;
    }

    var sourceSize = 40;
    var sx = Math.max(0, Math.min(this.image.width - sourceSize, this.hoverImagePoint.x - sourceSize / 2));
    var sy = Math.max(0, Math.min(this.image.height - sourceSize, this.hoverImagePoint.y - sourceSize / 2));
    var zoomScaleX = zoomCanvas.width / sourceSize;
    var zoomScaleY = zoomCanvas.height / sourceSize;

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.image, sx, sy, sourceSize, sourceSize, 0, 0, zoomCanvas.width, zoomCanvas.height);

    for (var index = 0; index < this.points.length; index++) {
        var point = this.points[index];
        if (point.x < sx || point.y < sy || point.x > (sx + sourceSize) || point.y > (sy + sourceSize)) {
            continue;
        }

        var zoomX = (point.x - sx) * zoomScaleX;
        var zoomY = (point.y - sy) * zoomScaleY;

        ctx.save();
        ctx.beginPath();
        ctx.fillStyle = this.markerColor;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.arc(zoomX, zoomY, 10, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

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
    this.persistSubmission(payload);
    this.root.dispatchEvent(new CustomEvent('wpd:submit', {
        bubbles: true,
        detail: payload
    }));
};

wpd.MinimalApp.prototype.persistSubmission = function(payload) {
    var submitUrl = this.root.dataset.wpdSubmitUrl;

    if (typeof submitUrl !== 'string' || submitUrl.trim() === '' || typeof window.fetch !== 'function') {
        return;
    }

    var app = this;
    var requestHeaders = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };
    var csrfTokenMeta = document.querySelector('meta[name="csrf-token"]');

    if (csrfTokenMeta != null) {
        requestHeaders['X-CSRF-Token'] = csrfTokenMeta.content;
    }

    window.fetch(submitUrl, {
        method: 'POST',
        credentials: 'same-origin',
        headers: requestHeaders,
        body: JSON.stringify(payload)
    }).then(function(response) {
        return response.json().then(function(body) {
            return {
                ok: response.ok,
                status: response.status,
                body: body
            };
        }).catch(function() {
            return {
                ok: response.ok,
                status: response.status,
                body: null
            };
        });
    }).then(function(result) {
        if (result.ok) {
            app.lastStoredSubmission = result.body;
            app.root.dispatchEvent(new CustomEvent('wpd:submit:stored', {
                bubbles: true,
                detail: result.body
            }));
            return;
        }

        app.root.dispatchEvent(new CustomEvent('wpd:submit:storage-error', {
            bubbles: true,
            detail: {
                status: result.status,
                errors: result.body != null && Array.isArray(result.body.errors) ? result.body.errors : ['Failed to persist submission']
            }
        }));
    }).catch(function(error) {
        app.root.dispatchEvent(new CustomEvent('wpd:submit:storage-error', {
            bubbles: true,
            detail: {
                status: 0,
                errors: [error.message]
            }
        }));
    });
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
