/*
    ZenPlot - web based chart data extraction software (and more)

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

QUnit.module("Minimal app tests", {
    beforeEach: () => {
        const fixture = document.getElementById("qunit-fixture");
        fixture.innerHTML = "";
    },
    afterEach: () => {
        sinon.restore();
        const fixture = document.getElementById("qunit-fixture");
        fixture.innerHTML = "";
    }
});

QUnit.test("mountMinimalApp mounts once per root", (assert) => {
    const fixture = document.getElementById("qunit-fixture");
    const root = document.createElement("main");
    root.setAttribute("data-wpd-app", "");
    fixture.appendChild(root);

    const initStub = sinon.stub(wpd.MinimalApp.prototype, "init").callsFake(function() {
        this.root.dataset.wpdMounted = "true";
    });

    const first = wpd.mountMinimalApp(root);
    const second = wpd.mountMinimalApp(root);

    assert.strictEqual(first, second, "returns existing mounted instance");
    assert.true(initStub.calledOnce, "init called once");
    assert.strictEqual(root.dataset.wpdMounted, "true", "marks root as mounted");
});

QUnit.test("submit emits payload with point ids and rounded coordinates", (assert) => {
    const done = assert.async();
    const root = document.createElement("main");
    const app = new wpd.MinimalApp(root);

    app.points = [
        { x: 10.236, y: 25.754 },
        { x: 2, y: 3.2 }
    ];

    root.addEventListener("wpd:submit", (event) => {
        assert.deepEqual(event.detail, {
            axis: "image",
            points: [
                { id: 1, x: 10.24, y: 25.75 },
                { id: 2, x: 2, y: 3.2 }
            ]
        }, "submit event payload matches contract");

        assert.deepEqual(app.lastSubmittedPayload, event.detail, "lastSubmittedPayload cached");
        done();
    });

    app.submit();
});

QUnit.test("loadDefaultPoints loads points from data-wpd-default-points", (assert) => {
    const done = assert.async();
    const root = document.createElement("main");
    root.dataset.wpdDefaultPoints = "/points/default.json";

    const app = new wpd.MinimalApp(root);
    const renderStub = sinon.stub(app, "render");
    const updateCountStub = sinon.stub(app, "updatePointsCount");

    sinon.stub(window, "fetch").resolves({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
            axis: "image",
            points: [
                { x: 1.5, y: 2.5 },
                { id: 9, x: "3", y: "4.75" }
            ]
        })
    });

    root.addEventListener("wpd:points:loaded", (event) => {
        assert.deepEqual(app.points, [{ x: 1.5, y: 2.5 }, { x: 3, y: 4.75 }], "normalized points are applied to app state");
        assert.strictEqual(updateCountStub.callCount, 1, "updates points counter after loading");
        assert.strictEqual(renderStub.callCount, 1, "re-renders after loading points");
        assert.strictEqual(event.detail.points_count, 2, "event exposes loaded points count");
        assert.deepEqual(event.detail.points, [
            { id: 1, x: 1.5, y: 2.5 },
            { id: 9, x: 3, y: 4.75 }
        ], "event preserves payload ids and normalized coordinates");
        done();
    });

    app.loadDefaultPoints(Promise.resolve());
});

QUnit.test("loadDefaultPoints emits error event when payload is invalid", (assert) => {
    const done = assert.async();
    const root = document.createElement("main");
    root.dataset.wpdDefaultPoints = "/points/default.json";

    const app = new wpd.MinimalApp(root);

    sinon.stub(window, "fetch").resolves({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
            points: [{ x: "abc", y: 10 }]
        })
    });

    root.addEventListener("wpd:points:load-error", (event) => {
        assert.true(event.detail.message.indexOf("Point entry 1") !== -1, "event includes a useful validation error message");
        done();
    });

    app.loadDefaultPoints(Promise.resolve());
});

QUnit.test("updatePointsCount syncs visible point counter", (assert) => {
    const root = document.createElement("main");
    const counter = document.createElement("span");
    counter.setAttribute("data-wpd-points-count", "");
    counter.textContent = "0";
    root.appendChild(counter);

    const app = new wpd.MinimalApp(root);
    app.elements.pointsCountValue = counter;
    app.points = [{ x: 1, y: 2 }, { x: 3, y: 4 }, { x: 5, y: 6 }];

    app.updatePointsCount();

    assert.strictEqual(counter.textContent, "3", "counter updated with current points length");
});

QUnit.test("setMode toggles button and canvas classes", (assert) => {
    const addPointBtn = document.createElement("button");
    const deletePointBtn = document.createElement("button");
    const canvas = document.createElement("canvas");

    const app = new wpd.MinimalApp(document.createElement("main"));
    app.elements.addPointBtn = addPointBtn;
    app.elements.deletePointBtn = deletePointBtn;
    app.elements.canvas = canvas;

    app.setMode("delete");

    assert.true(deletePointBtn.classList.contains("pressed-button"), "delete button is active");
    assert.false(addPointBtn.classList.contains("pressed-button"), "add button is inactive");
    assert.true(canvas.classList.contains("delete-mode"), "canvas shows delete mode");

    app.setMode("add");

    assert.true(addPointBtn.classList.contains("pressed-button"), "add button is active");
    assert.false(deletePointBtn.classList.contains("pressed-button"), "delete button is inactive");
    assert.false(canvas.classList.contains("delete-mode"), "canvas exits delete mode");
});

QUnit.test("setMarkerColor only accepts valid hex colors", (assert) => {
    const picker = document.createElement("input");
    picker.type = "color";
    picker.value = "#ef4444";

    const app = new wpd.MinimalApp(document.createElement("main"));
    app.elements.pointColorPicker = picker;

    const renderStub = sinon.stub(app, "render");

    app.setMarkerColor("#112233");
    assert.strictEqual(app.markerColor, "#112233", "valid hex color is accepted");
    assert.strictEqual(picker.value, "#112233", "picker stays in sync with marker color");
    assert.true(renderStub.calledOnce, "render triggered on valid color");

    app.setMarkerColor("red");
    assert.strictEqual(app.markerColor, "#112233", "invalid color is ignored");
    assert.true(renderStub.calledOnce, "render not called on invalid color");
});

QUnit.test("toggleZoomPanel updates collapsed class and accessibility labels", (assert) => {
    const panel = document.createElement("div");
    panel.className = "zoom-panel";

    const toggleBtn = document.createElement("button");
    toggleBtn.dataset.labelExpand = "Maximize zoom";
    toggleBtn.dataset.labelCollapse = "Minimize zoom";

    const app = new wpd.MinimalApp(document.createElement("main"));
    app.elements.zoomPanel = panel;
    app.elements.zoomToggleBtn = toggleBtn;

    app.updateZoomToggleButton();
    assert.strictEqual(toggleBtn.getAttribute("aria-label"), "Minimize zoom", "expanded label shown by default");

    app.toggleZoomPanel();

    assert.true(panel.classList.contains("is-collapsed"), "panel collapsed");
    assert.strictEqual(toggleBtn.getAttribute("aria-expanded"), "false", "aria-expanded updated");
    assert.strictEqual(toggleBtn.getAttribute("aria-label"), "Maximize zoom", "collapsed label shown");
});

QUnit.test("submit posts to data-wpd-submit-url and emits stored event", (assert) => {
    const done = assert.async();
    const root = document.createElement("main");
    root.dataset.wpdSubmitUrl = "/digitizer/point_submissions.json";

    const app = new wpd.MinimalApp(root);
    app.points = [{ x: 12.3, y: 45.6 }];

    const csrf = document.createElement("meta");
    csrf.setAttribute("name", "csrf-token");
    csrf.setAttribute("content", "token-123");
    document.head.appendChild(csrf);

    const fetchStub = sinon.stub(window, "fetch").resolves({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ id: 99, points_count: 1 })
    });

    root.addEventListener("wpd:submit:stored", (event) => {
        assert.strictEqual(fetchStub.callCount, 1, "fetch called once");
        assert.strictEqual(fetchStub.firstCall.args[0], "/digitizer/point_submissions.json", "uses configured endpoint");

        const request = fetchStub.firstCall.args[1];
        assert.strictEqual(request.method, "POST", "uses POST");
        assert.strictEqual(request.credentials, "same-origin", "sends same-origin credentials");
        assert.strictEqual(request.headers["X-CSRF-Token"], "token-123", "forwards csrf token");

        const postedPayload = JSON.parse(request.body);
        assert.deepEqual(postedPayload.points, [{ id: 1, x: 12.3, y: 45.6 }], "posts rounded payload contract");
        assert.strictEqual(event.detail.id, 99, "stored event returns backend response");

        document.head.removeChild(csrf);
        done();
    });

    app.submit();
});

QUnit.test("submit emits storage error event when backend request fails", (assert) => {
    const done = assert.async();
    const root = document.createElement("main");
    root.dataset.wpdSubmitUrl = "/digitizer/point_submissions.json";

    const app = new wpd.MinimalApp(root);

    sinon.stub(window, "fetch").resolves({
        ok: false,
        status: 422,
        json: () => Promise.resolve({ errors: ["Invalid points"] })
    });

    root.addEventListener("wpd:submit:storage-error", (event) => {
        assert.strictEqual(event.detail.status, 422, "includes HTTP status");
        assert.deepEqual(event.detail.errors, ["Invalid points"], "forwards backend validation messages");
        done();
    });

    app.submit();
});