# frozen_string_literal: true

class CreateWebPlotDigitizerPointSubmissions < ActiveRecord::Migration[7.0]
  def change
    create_table :web_plot_digitizer_point_submissions do |t|
      t.string :axis, null: false, default: "image"
      t.json :points, null: false, default: []

      t.timestamps
    end

    add_index :web_plot_digitizer_point_submissions, :created_at
  end
end
