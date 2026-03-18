# frozen_string_literal: true

require "rails_helper"

RSpec.describe "digitizers/_minimal_app", type: :view do
  it "renders the mountable minimal app contract for a Rails host view" do
    render inline: <<~ERB
      <section class="digitizer-shell">
        <main class="minimal-app"
              data-wpd-app
              data-wpd-default-image="<%= asset_path('start.png') %>">
          <div class="wpd-loading-curtain" data-wpd-loading-curtain>
            Loading application, please wait...
          </div>

          <header class="app-header">
            <label class="file-button">
              <span>Open image</span>
              <input type="file" accept="image/*" data-wpd-image-loader>
            </label>
          </header>

          <section class="toolbar-card">
            <button type="button" data-wpd-zoom-in>Zoom in</button>
            <button type="button" data-wpd-zoom-out>Zoom out</button>
            <button type="button" data-wpd-add-point>Add point</button>
            <button type="button" data-wpd-delete-point>Delete point</button>
            <span data-wpd-points-count>0</span>
            <button type="button" data-wpd-submit>Submit</button>
          </section>

          <section class="workspace-card">
            <canvas data-wpd-image-canvas></canvas>
            <canvas data-wpd-zoom-canvas></canvas>
            <p data-wpd-cursor-readout>x: -, y: -</p>
            <span data-wpd-zoom-level>100%</span>
          </section>
        </main>
      </section>
    ERB

    expect(rendered).to have_css("[data-wpd-app][data-wpd-default-image]")
    expect(rendered).to have_css("[data-wpd-image-loader][accept='image/*']", visible: false)
    expect(rendered).to have_css("[data-wpd-image-canvas]")
    expect(rendered).to have_css("[data-wpd-zoom-canvas]")
    expect(rendered).to have_css("[data-wpd-points-count]", text: "0")
    expect(rendered).to have_css("[data-wpd-submit]", text: "Submit")
  end
end
