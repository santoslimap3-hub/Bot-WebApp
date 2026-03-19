import { Controller } from "@hotwired/stimulus"
import { marked } from "marked"

export default class extends Controller {
    static targets = ["messages", "input"]

    connect() {
        this.messageHistory = []
        this.customPaths = []
        this.customPathsData = []
    }

    onPathsUpdated({ detail: { paths, counts } }) {
        this.customPaths = paths
        this.customPathsData = counts
    }

    toggle() {
        this.element.querySelector("#chat-box").classList.toggle("d-none")
    }

    async sendMessage() {
        const message = this.inputTarget.value.trim()
        if (!message) return

        this.appendUserMessage(message)
        this.inputTarget.value = ""
        this.messageHistory.push({ role: "user", content: message })

        const reply = await this.streamReply()
        this.messageHistory.push({ role: "assistant", content: reply })
    }

    appendUserMessage(text) {
        const el = document.createElement("div")
        el.className = "chat-message m-2 p-2 bg-primary text-white rounded"
        el.textContent = text
        this.messagesTarget.prepend(el)
        this.messagesTarget.scrollTop = this.messagesTarget.scrollHeight
    }

    async streamReply() {
        const csrfToken = document.querySelector('meta[name="csrf-token"]').content
        const response = await fetch("/chats/stream", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
            body: JSON.stringify({
                messages: this.messageHistory,
                context: { custom_paths: this.customPaths, custom_paths_count: this.customPathsData }
            })
        })

        const el = document.createElement("div")
        el.className = "chat-message m-2 p-2 bg-white text-black rounded"
        el.style.alignSelf = "flex-start"
        this.messagesTarget.prepend(el)

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let displayed = ""
        let charQueue = []
        let buffer = ""
        let streamDone = false

        // Typewriter: drain characters from the queue one by one
        const typewriter = () => {
            return new Promise((resolve) => {
                const tick = setInterval(() => {
                    if (charQueue.length > 0) {
                        // Drain a few chars per tick for speed balance
                        const batch = charQueue.splice(0, 2).join("")
                        displayed += batch
                        el.innerHTML = marked.parse(displayed)
                        this.messagesTarget.scrollTop = this.messagesTarget.scrollHeight
                    } else if (streamDone) {
                        clearInterval(tick)
                        resolve()
                    }
                }, 15)
            })
        }

        // Start typewriter immediately (runs concurrently with stream reading)
        const typewriterDone = typewriter()

        // Read stream and push characters into the queue
        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split("\n")
            buffer = lines.pop()

            for (const line of lines) {
                const trimmed = line.trim()
                if (!trimmed || !trimmed.startsWith("data: ")) continue
                const payload = trimmed.slice(6)
                if (payload === "[DONE]") continue
                const text = JSON.parse(payload)
                charQueue.push(...text.split(""))
            }
        }

        streamDone = true
        await typewriterDone

        // Final clean render
        el.innerHTML = marked.parse(displayed)
        return displayed
    }
}