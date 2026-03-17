class DashboardsController < ApplicationController
  before_action :authenticate_user!
  before_action :sync_trades

  def dashboard
    @recent_trades = Trade.in_last(1).order(open_time: :desc)
    @net_profit = Trade.sum(:net_profit)
  end

  def overtime_stats
    @all_trades = Trade.order(:open_time).map do |t|
      { date: t.open_time, profit: t.net_profit, direction: t.direction, symbol: t.symbol }
    end
  end

  def trade_outcomes
    url = "#{ENV.fetch("TRADING_API_URL", "http://localhost:5000")}/signal_records"
    @data = JSON.parse(URI.open(url).read)
  rescue StandardError => e
    Rails.logger.error "signal_records fetch failed: #{e.class} - #{e.message}"
    @data = {}
  end

  private

  def sync_trades
    url = "#{ENV.fetch("TRADING_API_URL", "http://localhost:5000")}/trade_history"
    data = JSON.parse(URI.open(url).read)
    return unless data["trades"]

    data["trades"].each do |t|
      trade = Trade.find_or_initialize_by(open_ticket: t["open_ticket"])
      trade.assign_attributes(
        close_comment: t["close_comment"],
        close_price:   t["close_price"],
        close_reason:  t["close_reason"],
        close_ticket:  t["close_ticket"],
        close_time:    t["close_time"],
        commission:    t["commission"],
        direction:     t["direction"],
        magic:         t["magic"],
        net_profit:    t["net_profit"],
        open_comment:  t["open_comment"],
        open_price:    t["open_price"],
        open_time:     t["open_time"],
        position_id:   t["position_id"],
        profit:        t["profit"],
        swap:          t["swap"],
        symbol:        t["symbol"],
        volume:        t["volume"]
      )
      trade.save!
    end
  rescue StandardError
    # API unreachable — continue with existing DB data
  end

end
