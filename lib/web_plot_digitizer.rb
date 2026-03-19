# frozen_string_literal: true

require_relative "zen_plot"

# Backward-compatible constant alias for legacy integrations.
WebPlotDigitizer = ZenPlot unless defined?(WebPlotDigitizer)
