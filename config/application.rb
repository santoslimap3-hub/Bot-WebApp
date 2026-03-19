require_relative "boot"

require "rails/all"

Bundler.require(*Rails.groups)

module BotWebapp
  class Application < Rails::Application
    config.load_defaults 8.1
    config.time_zone = "Singapore"

    config.autoload_lib(ignore: %w[assets tasks])
    config.autoload_paths << Rails.root.join("app/services")
  end
end
