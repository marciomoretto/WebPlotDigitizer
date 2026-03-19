# frozen_string_literal: true

module WebPlotDigitizer
  module EmbedHelper
    def web_plot_digitizer_assets
      safe_join([
        stylesheet_link_tag("web_plot_digitizer", media: "all", "data-turbo-track": "reload"),
        javascript_include_tag("web_plot_digitizer", defer: true, "data-turbo-track": "reload")
      ], "\n")
    end

    def web_plot_digitizer_component(**overrides)
      render partial: "web_plot_digitizer/pages/component", locals: web_plot_digitizer_component_locals(overrides)
    end

    alias_method :render_web_plot_digitizer, :web_plot_digitizer_component

    private

    def web_plot_digitizer_component_locals(overrides = {})
      config = WebPlotDigitizer.configuration

      default_locals = {
        show_header: config.show_header,
        show_toolbar: config.show_toolbar,
        show_controls: config.show_controls,
        show_zoom_panel: config.show_zoom_panel,
        show_point_color: config.show_point_color,
        show_zoom_controls: config.show_zoom_controls,
        show_mode_control: config.show_mode_control,
        show_submit_control: config.show_submit_control,
        show_points_count: config.show_points_count,
        default_image_path: config.default_image_path.presence || asset_path("images/teste.jpg"),
        default_points_path: config.default_points_path,
        submit_url: config.submit_url.presence || default_web_plot_digitizer_submit_url
      }

      sanitized_overrides = overrides.to_h.each_with_object({}) do |(key, value), result|
        result[key.to_sym] = value
      end

      default_locals.merge(sanitized_overrides.compact)
    end

    def default_web_plot_digitizer_submit_url
      if respond_to?(:point_submissions_path)
        point_submissions_path(format: :json)
      elsif respond_to?(:web_plot_digitizer) && web_plot_digitizer.respond_to?(:point_submissions_path)
        web_plot_digitizer.point_submissions_path(format: :json)
      else
        "/digitizer/point_submissions.json"
      end
    end
  end
end
