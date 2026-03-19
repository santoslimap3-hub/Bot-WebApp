class ChatService
  def initialize(context, messages)
    @context = context
    @messages = messages
  end

  def call
    data = call_openai
    data.dig("choices", 0, "message", "content") || "Sorry, I couldn't generate a response."
  end

  def stream(&block)
    req = build_request(stream: true)
    http_client.request(req) do |response|
      buffer = ""
      response.read_body do |chunk|
        buffer += chunk
        while (line_end = buffer.index("\n"))
          line = buffer.slice!(0..line_end).strip
          next if line.empty? || line == "data: [DONE]"
          next unless line.start_with?("data: ")
          json = JSON.parse(line.sub(/\Adata: /, ""))
          content = json.dig("choices", 0, "delta", "content")
          block.call(content) if content
        end
      end
    end
  end

  private

  def system_content
    content = Chat.build_system_content
    return content unless @context.present?
    content + " The user currently has the following trade paths: #{@context["custom_paths"].to_json} the number of trades matching each path is #{@context["custom_paths_count"].to_json}."
  end

  def http_client
    h = Net::HTTP.new("api.openai.com", 443)
    h.use_ssl = true
    h
  end

  def build_request(stream: false)
    req = Net::HTTP::Post.new(URI("https://api.openai.com/v1/chat/completions"))
    req["Content-Type"] = "application/json"
    req["Authorization"] = "Bearer #{ENV['OPENAI_API_KEY']}"
    body = { model: "gpt-5.4", messages: [ { role: "system", content: system_content } ] + @messages }
    body[:stream] = true if stream
    req.body = body.to_json
    req
  end

  def call_openai
    JSON.parse(http_client.request(build_request).body)
  end
end
