class CreateSignalRecords < ActiveRecord::Migration[8.1]
  def change
    create_table :signal_records do |t|
      t.integer :msg_id
      t.string :side
      t.datetime :signal_time
      t.decimal :signal_price
      t.decimal :sl_price
      t.boolean :price_entered_zone
      t.decimal :price_extreme_at_zone_arrival
      t.boolean :tracking_active
      t.boolean :tracking_complete
      t.datetime :tracking_started_at
      t.datetime :tracking_ended_at
      t.datetime :last_updated
      t.json :tp_levels
      t.json :zone
      t.json :outcome_sequence
      t.json :level_times
      t.json :best_prices_per_tp
      t.json :bot_entries
      t.json :entry_events
      t.json :signal_to_worst_edge

      t.timestamps
    end
  end
end
