class DashboardsController < ApplicationController
  before_action :sync_trades, only: [ :dashboard, :overtime_stats ]
  before_action :sync_signal_records, only: [ :trade_outcomes ]

  def dashboard
    @recent_trades = Trade.in_last(7).order(open_time: :desc)
    @net_profit = Trade.sum(:net_profit)
    @total_trades = Trade.count
    @win_rate = Trade.win_rate
    @today_profit = Trade.where("close_time >= ?", Time.current.beginning_of_day).sum(:net_profit)
  end

  def overtime_stats
    @all_trades = Trade.overtime_data
  end

  def trade_outcomes
    @data = SignalRecord.as_records_hash
    records = @data[:records]&.values || []
    @total_signals = records.size
    @zone_entries = records.count { |r| r["price_entered_zone"] == true }
    @hit_rate = @total_signals > 0 ? (@zone_entries.to_f / @total_signals * 100).round(1) : 0
    tp_depths = records.filter_map { |r| r["outcome_sequence"]&.select { |l| l.is_a?(Integer) && l > 0 }&.max }
    @avg_tp_depth = tp_depths.any? ? (tp_depths.sum.to_f / tp_depths.size).round(1) : 0
    @sl_hits = records.count { |r| r["outcome_sequence"]&.include?(-1) }
  end
end
