# frozen_string_literal: true

require "rails"
require_relative "web_plot_digitizer/version"
require_relative "web_plot_digitizer/configuration"
require_relative "web_plot_digitizer/engine"

module WebPlotDigitizer
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
