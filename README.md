# web_plot_digitizer (Rails Engine Gem)

`web_plot_digitizer` is a mountable Rails engine gem that provides a minimal image digitizer UI.

Install it in another Rails app, mount `/digitizer`, and start collecting points.

## Requirements

- Ruby `>= 3.0`
- Rails `>= 7.0`, `< 8.0`
- ActiveRecord enabled in the host app (required for point persistence)

## Install In Another Application

### Option 1: local path (during development)

In host app `Gemfile`:

```ruby
gem "web_plot_digitizer", path: "../WebPlotDigitizer"
```

### Option 2: git source

In host app `Gemfile`:

```ruby
gem "web_plot_digitizer", git: "https://github.com/ankitrohatgi/WebPlotDigitizer.git", branch: "main"
```

Then run:

```bash
bundle install
```

## Host App Setup

### 1) Generate initializer (recommended)

```bash
bin/rails generate web_plot_digitizer:install
```

This creates:

- `config/initializers/web_plot_digitizer.rb`

### 2) Mount the engine

In host app `config/routes.rb`:

```ruby
mount WebPlotDigitizer::Engine => "/digitizer"
```

### 3) Install and run migrations

```bash
bin/rails web_plot_digitizer:install:migrations
bin/rails db:migrate
```

### 4) Open the UI

- `http://localhost:3000/digitizer`

## Embed In Any Host Page

Besides `/digitizer`, the gem exposes helper methods so you can render the component in your own host views.

Helpers:

- `web_plot_digitizer_assets`
- `web_plot_digitizer_component(...)`

Example host page:

```erb
<%= web_plot_digitizer_assets %>

<%= web_plot_digitizer_component(
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

- Host file: `app/views/web_plot_digitizer/pages/_controls.html.erb`

That file takes precedence over the gem partial and is used in both:

- `GET /digitizer`
- `web_plot_digitizer_component(...)` embeds

This gives you full control over layout while keeping gem JS/events/contracts.

## What The Gem Provides

### UI endpoint

- `GET /digitizer`

### View helpers (host app)

- `web_plot_digitizer_assets`
- `web_plot_digitizer_component(**overrides)`

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

Use `config/initializers/web_plot_digitizer.rb`:

```ruby
WebPlotDigitizer.configure do |config|
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
gem build web_plot_digitizer.gemspec
```

This generates a package like:

- `web_plot_digitizer-5.3.0.gem`

## Notes

- The gem is a Rails engine (`WebPlotDigitizer::Engine`) and isolates its namespace.
- If host app does not load ActiveRecord railtie, persistence endpoint will not be available.

## License

GNU AGPL v3. See `LICENSE`.
