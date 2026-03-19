# frozen_string_literal: true

module ZenPlot
  class PointSubmissionsController < ApplicationController
    def create
      return render_active_record_unavailable unless active_record_available?

      submission = PointSubmission.new(submission_attributes)

      if submission.save
        render json: {
          id: submission.id,
          axis: submission.axis,
          points: submission.points,
          points_count: submission.points_count,
          created_at: submission.created_at&.iso8601
        }, status: :created
      else
        render json: { errors: submission.errors.full_messages }, status: :unprocessable_entity
      end
    end

    private

    def active_record_available?
      defined?(ActiveRecord::Base)
    end

    def render_active_record_unavailable
      render json: {
        errors: ["Point persistence requires ActiveRecord in the host application"]
      }, status: :service_unavailable
    end

    def submission_attributes
      permitted = payload_parameters
      {
        axis: permitted[:axis],
        points: normalize_points(permitted[:points])
      }
    end

    def payload_parameters
      if params[:submission].present?
        params.require(:submission).permit(:axis, points: [:id, :x, :y])
      else
        params.permit(:axis, points: [:id, :x, :y])
      end
    end

    def normalize_points(raw_points)
      return [] unless raw_points.is_a?(Array)

      raw_points.map.with_index(1) do |point, index|
        point_hash = point.respond_to?(:to_h) ? point.to_h : point
        {
          "id" => point_hash["id"] || point_hash[:id] || index,
          "x" => point_hash["x"] || point_hash[:x],
          "y" => point_hash["y"] || point_hash[:y]
        }
      end
    end
  end
end
