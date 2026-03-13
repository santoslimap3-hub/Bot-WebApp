class CreateTrades < ActiveRecord::Migration[8.1]
  def change
    create_table :trades do |t|
      t.string :close_comment
      t.decimal :close_price
      t.string :close_reason
      t.integer :close_ticket
      t.datetime :close_time
      t.decimal :commission
      t.string :direction
      t.integer :magic
      t.decimal :net_profit
      t.string :open_comment
      t.decimal :open_price
      t.integer :open_ticket
      t.datetime :open_time
      t.integer :position_id
      t.decimal :profit
      t.decimal :swap
      t.string :symbol
      t.decimal :volume

      t.timestamps
    end
  end
end
