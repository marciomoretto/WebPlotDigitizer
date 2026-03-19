# frozen_string_literal: true

WebPlotDigitizer::Engine.routes.draw do
  root to: "pages#index"
  resources :point_submissions, only: [:create]
end
