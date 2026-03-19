class Trade < ApplicationRecord
  scope :in_last, ->(days) { where("open_time >= ?", days.days.ago) }

  def self.win_rate
    total = count
    total > 0 ? (where("net_profit > 0").count.to_f / total * 100).round(1) : 0
  end

  def self.overtime_data
    order(:open_time).map { |t| { date: t.open_time, profit: t.net_profit, direction: t.direction, symbol: t.symbol } }
  end

  def self.sync(trades)
    trades.each { |t| sync_one(t) }
  end

  def self.sync_one(t)
    find_or_initialize_by(open_ticket: t["open_ticket"]).tap do |trade|
      trade.assign_attributes(
        close_comment: t["close_comment"], close_price: t["close_price"],
        close_reason: t["close_reason"], close_ticket: t["close_ticket"],
        close_time: t["close_time"], commission: t["commission"],
        direction: t["direction"], magic: t["magic"], net_profit: t["net_profit"],
        open_comment: t["open_comment"], open_price: t["open_price"],
        open_time: t["open_time"], position_id: t["position_id"],
        profit: t["profit"], swap: t["swap"], symbol: t["symbol"], volume: t["volume"]
      )
      trade.save!
    end
  end
  private_class_method :sync_one
end
