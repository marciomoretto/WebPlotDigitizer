# frozen_string_literal: true

module ZenPlot
  class PointSubmission < ActiveRecord::Base
    validates :axis, presence: true
    validate :points_must_be_an_array
    validate :points_must_contain_valid_coordinates

    before_validation :normalize_axis
    before_validation :normalize_points

    def points_count
      points.is_a?(Array) ? points.length : 0
    end

    private

    def normalize_axis
      normalized_axis = axis.to_s.strip
      self.axis = normalized_axis.empty? ? "image" : normalized_axis
    end

    def normalize_points
      self.points = [] if points.nil?
    end

    def points_must_be_an_array
      return if points.is_a?(Array)

      errors.add(:points, "must be an array")
    end

    def points_must_contain_valid_coordinates
      return unless points.is_a?(Array)

      points.each_with_index do |point, index|
        unless point.is_a?(Hash)
          errors.add(:points, "entry #{index + 1} must be an object")
          next
        end

        x = point["x"] || point[:x]
        y = point["y"] || point[:y]

        if x.nil? || y.nil?
          errors.add(:points, "entry #{index + 1} must include x and y")
          next
        end

        unless numeric?(x) && numeric?(y)
          errors.add(:points, "entry #{index + 1} must include numeric x and y")
        end
      end
    end

    def numeric?(value)
      Float(value)
      true
    rescue ArgumentError, TypeError
      false
    end
  end
end
