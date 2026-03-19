# frozen_string_literal: true

class CreateZenPlotPointSubmissions < ActiveRecord::Migration[7.0]
  def change
    create_table :zen_plot_point_submissions do |t|
      t.string :axis, null: false, default: "image"
      t.json :points, null: false, default: []

      t.timestamps
    end

    add_index :zen_plot_point_submissions, :created_at
  end
end
