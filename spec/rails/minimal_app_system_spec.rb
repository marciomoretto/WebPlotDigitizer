# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Minimal digitizer embedded in Rails", type: :system, js: true do
  # This spec is intentionally illustrative: it shows how a Rails host app can
  # mount the WPD minimal app, drive it through the DOM, and capture the
  # bubbling `wpd:submit` event from the component root.

  it "updates the visible point counter from the mounted app instance" do
    visit rails_host_minimal_digitizer_path

    page.execute_script <<~JS
      (function() {
        var root = document.querySelector('[data-wpd-app]');
        var app = root.__wpdMinimalApp || wpd.mountMinimalApp(root);
        app.points = [{ x: 12, y: 18 }, { x: 40, y: 84 }];
        app.updatePointsCount();
      })();
    JS

    expect(page).to have_css("[data-wpd-points-count]", text: "2")
  end

  it "bubbles the submit payload so the Rails page can consume it" do
    visit rails_host_minimal_digitizer_path

    page.execute_script <<~JS
      (function() {
        var root = document.querySelector('[data-wpd-app]');
        window.__lastWpdPayload = null;

        root.addEventListener('wpd:submit', function(event) {
          window.__lastWpdPayload = event.detail;
        });

        var app = root.__wpdMinimalApp || wpd.mountMinimalApp(root);
        app.points = [{ x: 10.25, y: 25.75 }];
        app.updatePointsCount();
      })();
    JS

    find("[data-wpd-submit]").click

    payload = page.evaluate_script("window.__lastWpdPayload")

    expect(payload).to include("axis" => "image")
    expect(payload.fetch("points")).to eq([
      { "id" => 1, "x" => 10.25, "y" => 25.75 }
    ])
  end
end
