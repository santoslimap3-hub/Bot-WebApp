# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_03_13_045755) do
  create_table "trades", force: :cascade do |t|
    t.string "close_comment"
    t.decimal "close_price"
    t.string "close_reason"
    t.integer "close_ticket"
    t.datetime "close_time"
    t.decimal "commission"
    t.datetime "created_at", null: false
    t.string "direction"
    t.integer "magic"
    t.decimal "net_profit"
    t.string "open_comment"
    t.decimal "open_price"
    t.integer "open_ticket"
    t.datetime "open_time"
    t.integer "position_id"
    t.decimal "profit"
    t.decimal "swap"
    t.string "symbol"
    t.datetime "updated_at", null: false
    t.decimal "volume"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email"
    t.string "encrypted_password", default: "", null: false
    t.string "password_digest"
    t.datetime "remember_created_at"
    t.datetime "reset_password_sent_at"
    t.string "reset_password_token"
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end
end
