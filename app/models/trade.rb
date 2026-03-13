class Trade < ApplicationRecord
  scope :in_last, ->(days) { where(open_time: days.days.ago..Time.now) }
end
