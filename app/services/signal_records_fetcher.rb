class SignalRecordsFetcher
  def self.call
    url = "#{ENV.fetch("TRADING_API_URL", "http://localhost:5000")}/signal_records"
    JSON.parse(URI.open(url).read)
  rescue StandardError => e
    Rails.logger.error "signal_records fetch failed: #{e.class} - #{e.message}"
    {}
  end
end
