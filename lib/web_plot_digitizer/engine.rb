# frozen_string_literal: true

module WebPlotDigitizer
  class Engine < ::Rails::Engine
    isolate_namespace WebPlotDigitizer

    initializer "web_plot_digitizer.helpers" do
      ActiveSupport.on_load(:action_controller_base) do
        helper WebPlotDigitizer::EmbedHelper
      end
    end

    initializer "web_plot_digitizer.assets" do |app|
      next unless app.config.respond_to?(:assets)

      app.config.assets.paths << root
      app.config.assets.paths << root.join("javascript")
      app.config.assets.paths << root.join("styles")

      app.config.assets.precompile += %w[
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
