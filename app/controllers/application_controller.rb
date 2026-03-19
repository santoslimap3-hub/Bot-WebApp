class ApplicationController < ActionController::Base
  allow_browser versions: :modern

  stale_when_importmap_changes
  before_action :authenticate_user!

  def after_sign_in_path_for(resource)
    dashboard_path
  end

  def after_sign_out_path_for(resource)
    dashboard_path
  end

  private

  def sync_signal_records
    data = JSON.parse(URI.open(trading_api_url("signal_records")).read)
    SignalRecord.sync(data["records"] || {})
  rescue StandardError
  end

  def sync_trades
    data = JSON.parse(URI.open(trading_api_url("trade_history")).read)
    Trade.sync(data["trades"] || [])
  rescue StandardError
  end

  def trading_api_url(path)
    "#{ENV.fetch("TRADING_API_URL", "http://localhost:5000")}/#{path}"
  end
end
