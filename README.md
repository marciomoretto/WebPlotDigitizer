# ZenPlot (Rails Engine Gem)

`zen_plot` is a mountable Rails engine gem that provides a minimal image digitizer UI.

Install it in another Rails app, mount `/digitizer`, and start collecting points.

## Requirements

- Ruby `>= 3.0`
- Rails `>= 7.0`, `< 8.0`
- ActiveRecord enabled in the host app (required for point persistence)

## Install In Another Application

### Option 1: local path (during development)

In host app `Gemfile`:

```ruby
gem "zen_plot", path: "../ZenPlot"
```

### Option 2: git source

In host app `Gemfile`:

```ruby
gem "zen_plot", git: "https://github.com/marciomoretto/ZenPlot.git", branch: "main"
```

Then run:

```bash
bundle install
```

## Host App Setup

### 1) Generate initializer (recommended)

```bash
bin/rails generate zen_plot:install
```

This creates:

- `config/initializers/zen_plot.rb`

### 2) Mount the engine

In host app `config/routes.rb`:

```ruby
mount ZenPlot::Engine => "/digitizer"
```

### 3) Install and run migrations

```bash
bin/rails zen_plot:install:migrations
bin/rails db:migrate
```

### 4) Open the UI

- `http://localhost:3000/digitizer`

## Embed In Any Host Page

Besides `/digitizer`, the gem exposes helper methods so you can render the component in your own host views.

Helpers:

- `zen_plot_assets`
- `zen_plot_component(...)`

Example host page:

```erb
<%= zen_plot_assets %>

<%= zen_plot_component(
  show_header: true,
  show_toolbar: false,
  show_controls: true,
  show_zoom_panel: true,
  default_points_path: "/points/default.json"
) %>
```

You can pass any configuration key used in the initializer as an override for that specific render.

## Override Partials In Host App

If you want to customize structure/markup, create files in your host app with the same virtual path used by the engine.

Example override:

- Host file: `app/views/zen_plot/pages/_controls.html.erb`

That file takes precedence over the gem partial and is used in both:

- `GET /digitizer`
- `zen_plot_component(...)` embeds

This gives you full control over layout while keeping gem JS/events/contracts.

## What The Gem Provides

### UI endpoint

- `GET /digitizer`

### View helpers (host app)

- `zen_plot_assets`
- `zen_plot_component(**overrides)`

### Persistence endpoint

- `POST /digitizer/point_submissions.json`

Request:

```json
{
  "axis": "image",
  "points": [
    { "id": 1, "x": 10.24, "y": 25.75 },
    { "id": 2, "x": 2, "y": 3.2 }
  ]
}
```

Responses:

- `201`: `{ id, axis, points, points_count, created_at }`
- `422`: `{ errors: [...] }`

## Configuration (Initializer)

Use `config/initializers/zen_plot.rb`:

```ruby
ZenPlot.configure do |config|
  # Regions
  config.show_header = false
  config.show_toolbar = false
  config.show_controls = true
  config.show_zoom_panel = true

  # Controls
  config.show_point_color = true
  config.show_zoom_controls = true
  config.show_mode_control = true
  config.show_submit_control = true
  config.show_points_count = true

  # Default data
  # config.default_image_path = ActionController::Base.helpers.asset_path("images/teste.jpg")
  # config.default_points_path = "/points/default.json"

  # Submission endpoint (if nil, gem uses /digitizer/point_submissions.json)
  # config.submit_url = "/digitizer/point_submissions.json"
end
```

## Frontend Integration Contract

The mounted component dispatches browser events:

- `wpd:submit` whenever user clicks submit
- `wpd:submit:stored` when backend persistence succeeds
- `wpd:submit:storage-error` when backend persistence fails
- `wpd:points:loaded` when default points file is loaded
- `wpd:points:load-error` when default points loading fails

Host listener example:

```js
document.addEventListener("wpd:submit", (event) => {
  console.log("submitted points", event.detail.points);
});

document.addEventListener("wpd:submit:stored", (event) => {
  console.log("stored submission id", event.detail.id);
});
```

## Default Points File Format

If `config.default_points_path` is set, the gem will fetch points on load.

Supported payloads:

```json
{
  "axis": "image",
  "points": [
    { "id": 1, "x": 10.24, "y": 25.75 },
    { "id": 2, "x": 2, "y": 3.2 }
  ]
}
```

or:

```json
[
  { "x": 10.24, "y": 25.75 },
  { "x": 2, "y": 3.2 }
]
```

## Build The Gem

From this repository:

```bash
gem build zen_plot.gemspec
```

This generates a package like:

- `zen_plot-5.3.0.gem`

## Notes

- The gem is a Rails engine (`ZenPlot::Engine`) and isolates its namespace.
- If host app does not load ActiveRecord railtie, persistence endpoint will not be available.

## Attribution and Origin

ZenPlot is a derivative work based on the original WebPlotDigitizer project by Ankit Rohatgi.

- Original project: https://github.com/ankitrohatgi/WebPlotDigitizer
- License: GNU AGPL v3
- This repository contains modifications and repackaging performed by the ZenCrowd team.

See `NOTICE` for attribution details.

## License

GNU AGPL v3. See `LICENSE`.
