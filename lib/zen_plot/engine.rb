# frozen_string_literal: true

module ZenPlot
  class Engine < ::Rails::Engine
    isolate_namespace ZenPlot

    initializer "zen_plot.helpers" do
      ActiveSupport.on_load(:action_controller_base) do
        helper ZenPlot::EmbedHelper
      end
    end

    initializer "zen_plot.assets" do |app|
      next unless app.config.respond_to?(:assets)

      app.config.assets.paths << root
      app.config.assets.paths << root.join("javascript")
      app.config.assets.paths << root.join("styles")

      app.config.assets.precompile += %w[
        zen_plot.js
        zen_plot.css
        web_plot_digitizer.js
        web_plot_digitizer.css
        main.js
        styles.css
        widgets.css
        constants.css
        start.png
        images/teste.jpg
        favicon.ico
      ]
    end
  end
end
