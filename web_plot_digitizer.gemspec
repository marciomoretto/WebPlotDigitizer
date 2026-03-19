# frozen_string_literal: true

require_relative "lib/web_plot_digitizer/version"

Gem::Specification.new do |spec|
  spec.name = "web_plot_digitizer"
  spec.version = WebPlotDigitizer::VERSION
  spec.authors = ["Ankit Rohatgi"]
  spec.email = ["plots@automeris.io"]

  spec.summary = "WebPlotDigitizer packaged as a Rails engine"
  spec.description = "Embeds the WebPlotDigitizer minimal interface as a mountable Rails engine with bundled assets."
  spec.homepage = "https://automeris.io"
  spec.license = "AGPL-3.0"
  spec.required_ruby_version = ">= 3.0"

  spec.metadata["homepage_uri"] = spec.homepage
  spec.metadata["source_code_uri"] = "https://github.com/ankitrohatgi/WebPlotDigitizer"
  spec.metadata["changelog_uri"] = "https://github.com/ankitrohatgi/WebPlotDigitizer"

  spec.files = Dir.chdir(__dir__) do
    Dir[
      "app/**/*",
      "config/routes.rb",
      "db/migrate/*.rb",
      "javascript/main.js",
      "lib/generators/web_plot_digitizer/templates/*.rb",
      "styles/*.css",
      "start.png",
      "favicon.ico",
      "lib/**/*",
      "LICENSE",
      "README.md",
      "web_plot_digitizer.gemspec"
    ]
  end

  spec.require_paths = ["lib"]

  spec.add_dependency "rails", ">= 7.0", "< 8.0"
  spec.add_dependency "activerecord", ">= 7.0", "< 8.0"
  spec.add_dependency "sprockets-rails", ">= 3.4", "< 5.0"
end
