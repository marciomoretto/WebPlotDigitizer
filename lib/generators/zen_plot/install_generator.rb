# frozen_string_literal: true

require "rails/generators"

module ZenPlot
  module Generators
    class InstallGenerator < Rails::Generators::Base
      source_root File.expand_path("templates", __dir__)
      desc "Creates an initializer for ZenPlot gem configuration"

      def copy_initializer
        template "zen_plot.rb", "config/initializers/zen_plot.rb"
      end

      def print_next_steps
        say <<~TEXT

          ZenPlot initializer created.

          Next steps:
            1) Mount the engine in your host app routes:
               mount ZenPlot::Engine => "/digitizer"
            2) Install and run migrations:
               bin/rails zen_plot:install:migrations
               bin/rails db:migrate
            3) Open /digitizer
        TEXT
      end
    end
  end
end
