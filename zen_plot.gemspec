# frozen_string_literal: true

require_relative "lib/zen_plot/version"

Gem::Specification.new do |spec|
  spec.name = "zen_plot"
  spec.version = ZenPlot::VERSION
  spec.authors = ["Ankit Rohatgi"]
  spec.email = ["plots@automeris.io"]

  spec.summary = "ZenPlot packaged as a Rails engine"
  spec.description = "Embeds the ZenPlot minimal interface as a mountable Rails engine with bundled assets."
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
      "lib/generators/zen_plot/templates/*.rb",
      "styles/*.css",
      "start.png",
      "favicon.ico",
      "lib/**/*",
      "LICENSE",
      "NOTICE",
      "README.md",
      "zen_plot.gemspec"
    ]
  end

  spec.require_paths = ["lib"]

  spec.add_dependency "rails", ">= 7.0", "< 8.0"
  spec.add_dependency "activerecord", ">= 7.0", "< 8.0"
  spec.add_dependency "sprockets-rails", ">= 3.4", "< 5.0"
end
