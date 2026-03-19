# frozen_string_literal: true

module ZenPlot
  class Configuration
    attr_accessor :show_header,
                  :show_toolbar,
                  :show_controls,
                  :show_zoom_panel,
                  :show_point_color,
                  :show_zoom_controls,
                  :show_mode_control,
                  :show_submit_control,
                  :show_points_count,
                  :default_image_path,
                  :default_points_path,
                  :submit_url

    def initialize
      @show_header = false
      @show_toolbar = false
      @show_controls = true
      @show_zoom_panel = true

      @show_point_color = true
      @show_zoom_controls = true
      @show_mode_control = true
      @show_submit_control = true
      @show_points_count = true

      @default_image_path = nil
      @default_points_path = nil
      @submit_url = nil
    end
  end
end
