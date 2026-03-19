# frozen_string_literal: true

ZenPlot::Engine.routes.draw do
  root to: "pages#index"
  resources :point_submissions, only: [:create]
end
