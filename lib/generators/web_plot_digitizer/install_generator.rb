# frozen_string_literal: true

require "rails/generators"

module WebPlotDigitizer
  module Generators
    class InstallGenerator < Rails::Generators::Base
      source_root File.expand_path("templates", __dir__)
      desc "Creates an initializer for WebPlotDigitizer gem configuration"

      def copy_initializer
        template "web_plot_digitizer.rb", "config/initializers/web_plot_digitizer.rb"
      end

      def print_next_steps
        say <<~TEXT

          WebPlotDigitizer initializer created.

          Next steps:
            1) Mount the engine in your host app routes:
               mount WebPlotDigitizer::Engine => "/digitizer"
            2) Install and run migrations:
               bin/rails web_plot_digitizer:install:migrations
               bin/rails db:migrate
            3) Open /digitizer
        TEXT
      end
    end
  end
end
