class ChatsController < ApplicationController
  include ActionController::Live

  def index
    @chats = Chat.all
  end

  def show
    @chat = Chat.find_by(session_id: params[:id])
  end

  def message
    reply = ChatService.new(parse_context, parse_messages).call
    render json: { reply: reply }
  rescue => e
    render json: { error: e.message }, status: 500
  end

  def stream
    response.headers["Content-Type"] = "text/event-stream"
    response.headers["Cache-Control"] = "no-cache"
    response.headers["X-Accel-Buffering"] = "no"

    service = ChatService.new(parse_context, parse_messages)
    service.stream do |chunk|
      response.stream.write "data: #{chunk.to_json}\n\n"
    end
    response.stream.write "data: [DONE]\n\n"
  rescue => e
    response.stream.write "data: #{{ error: e.message }.to_json}\n\n"
  ensure
    response.stream.close
  end

  private

  def parse_body
    @parse_body ||= JSON.parse(request.body.read)
  end

  def parse_context
    parse_body["context"] || {}
  end

  def parse_messages
    (parse_body["messages"] || []).map { |m| { role: m["role"], content: m["content"] } }
  end
end
