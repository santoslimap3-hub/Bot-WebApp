require "json"
require "open-uri"
class PagesController < ApplicationController
  def home
  end
  def login
  end
  def dashboard
    url = "#{ENV.fetch("TRADING_API_URL", "http://localhost:5000")}/trade_history"
    response = URI.open(url).read
    @data = JSON.parse(response)

    @data["trades"].each do |t|
      Trade.find_or_create_by(open_ticket: t["open_ticket"]) do |trade|
        trade.close_comment = t["close_comment"]
        trade.close_price   = t["close_price"]
        trade.close_reason  = t["close_reason"]
        trade.close_ticket  = t["close_ticket"]
        trade.close_time    = t["close_time"]
        trade.commission    = t["commission"]
        trade.direction     = t["direction"]
        trade.magic         = t["magic"]
        trade.net_profit    = t["net_profit"]
        trade.open_comment  = t["open_comment"]
        trade.open_price    = t["open_price"]
        trade.open_time     = t["open_time"]
        trade.position_id   = t["position_id"]
        trade.profit        = t["profit"]
        trade.swap          = t["swap"]
        trade.symbol        = t["symbol"]
        trade.volume        = t["volume"]
      end
    end

    @trades = Trade.all.order(open_time: :desc)
    @net_profit = @trades.sum(:net_profit)
  end

  def overtime_stats
    @all_trades = Trade.order(:open_time).pluck(:open_time, :net_profit).map do |time, profit|
      { date: time, profit: profit }
    end
  end
end
