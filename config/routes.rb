Rails.application.routes.draw do
  get "chats/index"
  get "chats/show"
  devise_for :users
  get "pages/home"

  get "up" => "rails/health#show", as: :rails_health_check

  devise_scope :user do
  root "devise/sessions#new"
  end


  post "/signup", to: "users#create"

  get "/dashboard", to: "dashboards#dashboard"

  get "/overtime_stats", to: "dashboards#overtime_stats"

  get "/trade_outcomes", to: "dashboards#trade_outcomes"

  post "/chats/message", to: "chats#message"
  post "/chats/stream", to: "chats#stream"
end
