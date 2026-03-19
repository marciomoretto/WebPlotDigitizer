# frozen_string_literal: true

require "rails"
require_relative "zen_plot/version"
require_relative "zen_plot/configuration"
require_relative "zen_plot/engine"

module ZenPlot
	class << self
		def configuration
			@configuration ||= Configuration.new
		end

		def configure
			yield(configuration)
		end

		def reset_configuration!
			@configuration = Configuration.new
		end
	end
end

# Backward compatibility with the previous namespace.
WebPlotDigitizer = ZenPlot unless defined?(WebPlotDigitizer)
