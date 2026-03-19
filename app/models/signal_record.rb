class SignalRecord < ApplicationRecord
  def self.as_records_hash
    { records: all.index_by(&:msg_id).transform_values(&:attributes) }
  end

  def self.sync(records)
    records.each_value { |r| sync_one(r) }
  end

  def self.sync_one(r)
    find_or_initialize_by(msg_id: r["msg_id"]).tap do |sr|
      sr.assign_attributes(
        side: r["side"], signal_time: r["signal_time"], signal_price: r["signal_price"],
        sl_price: r["sl_price"], price_entered_zone: r["price_entered_zone"],
        price_extreme_at_zone_arrival: r["price_extreme_at_zone_arrival"],
        tracking_active: r["tracking_active"], tracking_complete: r["tracking_complete"],
        tracking_started_at: r["tracking_started_at"], tracking_ended_at: r["tracking_ended_at"],
        last_updated: r["last_updated"], tp_levels: r["tp_levels"], zone: r["zone"],
        outcome_sequence: r["outcome_sequence"], level_times: r["_level_times"],
        best_prices_per_tp: r["best_prices_per_tp"], bot_entries: r["bot_entries"],
        entry_events: r["entry_events"], signal_to_worst_edge: r["signal_to_worst_edge"]
      )
      sr.save
    end
  end
  private_class_method :sync_one
end
