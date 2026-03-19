import { Controller } from "@hotwired/stimulus"
import { Chart, registerables } from 'chart.js'
import { marked } from "marked"
Chart.register(...registerables)

const BAR_COLORS = [
    [232, 119, 34],
    [239, 68, 68],
    [34, 197, 94],
    [59, 130, 246],
    [168, 85, 247],
    [234, 179, 8],
    [6, 182, 212]
]

const LEVEL_MAP = {
    "Stop Loss": -1,
    "Entry Zone": 0,
    "BE": 0,
    "TP1": 1,
    "TP2": 2,
    "TP3": 3,
    "TP4": 4,
    "TP5": 5
}

export default class extends Controller {
    static targets = ["outcomesOverview", "customPathsOverview"]
    static values = { records: Object }

    connect() {
        this.chatMessages = document.getElementById("chat-messages")
        this.input = document.getElementById("chat-input")
        this.messageHistory = []
        this.runPage()
    }

    runPage() {
        this.updateData()
        this.drawBarchart()
        this.getData()
        this.drawCustomPathchart()
        this.updateDeleteButtons()
    }

    makeGradient(ctx, chartArea, r, g, b) {
        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
        gradient.addColorStop(0, `rgba(${r},${g},${b},0.95)`)
        gradient.addColorStop(1, `rgba(${r},${g},${b},0.15)`)
        return gradient
    }

    makeGradients(chart, colors) {
        const { ctx, chartArea } = chart
        if (!chartArea) return colors.map(([r, g, b]) => `rgba(${r},${g},${b},0.7)`)
        return colors.map(([r, g, b]) => this.makeGradient(ctx, chartArea, r, g, b))
    }

    colorFor(index, alpha = 1) {
        const [r, g, b] = BAR_COLORS[index % BAR_COLORS.length]
        return `rgba(${r},${g},${b},${alpha})`
    }

    backgroundColorFor(ctx) {
        return this.makeGradients(ctx.chart, BAR_COLORS)[ctx.dataIndex % BAR_COLORS.length] ||
            this.colorFor(ctx.dataIndex, 0.7)
    }

    borderColors() { return BAR_COLORS.map((_, i) => this.colorFor(i)) }

    baseDataset(data) {
        return {
            label: 'Number of trades',
            data,
            borderWidth: 1,
            borderRadius: 6,
            backgroundColor: (ctx) => this.backgroundColorFor(ctx),
            borderColor: this.borderColors()
        }
    }

    outcomeDataset() { return this.baseDataset(this.outcomeData) }
    customDataset() { return this.baseDataset(this.customPathsData) }

    chartScales(xTickOptions = {}) {
        const grid = { color: 'rgba(255,255,255,0.06)' },
            ticks = { color: 'rgba(255,255,255,0.5)' }
        return {
            x: { grid, ticks: {...ticks, ...xTickOptions } },
            y: { beginAtZero: true, grid, ticks: {...ticks, stepSize: 1 } }
        }
    }

    chartOptions(xTickOptions = {}) {
        return {
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: this.chartScales(xTickOptions)
        }
    }

    barChartConfig() {
        const labels = ["Entry zone", "Stop loss", "TP1", "TP2", "TP3", "TP4", "TP5"]
        return { type: 'bar', data: { labels, datasets: [this.outcomeDataset()] }, options: this.chartOptions({ stepSize: 1 }) }
    }

    customChartConfig() {
        return { type: 'bar', data: { labels: this.customPathLabels, datasets: [this.customDataset()] }, options: this.chartOptions() }
    }

    drawBarchart() {
        this.chart = new Chart(this.outcomesOverviewTarget, this.barChartConfig())
    }

    drawCustomPathchart() {
        if (this.customChart) this.customChart.destroy()
        this.customChart = new Chart(this.customPathsOverviewTarget, this.customChartConfig())
    }

    outcomeCount(level) {
        if (level === 0) return this.records.filter(r => r.price_entered_zone === true).length
        return this.records.filter(r => r.outcome_sequence.includes(level)).length
    }

    updateData() {
        this.records = Object.values(this.recordsValue.records)
        this.outcomeData = [0, -1, 1, 2, 3, 4, 5].map(level => this.outcomeCount(level))
    }

    containsSequence(needle, haystack) {
        if (needle.length === 0) return false
        for (let i = 0; i <= haystack.length - needle.length; i++) {
            if (needle.every((v, j) => haystack[i + j] === v)) return true
        }
        return false
    }

    pathMatchCount(path) {
        const sequence = path.map(level => LEVEL_MAP[level]).filter(v => v !== undefined)
        return this.records.filter(record => this.containsSequence(sequence, record.outcome_sequence)).length
    }

    getData() {
        this.getLevels()
        this.customPathsData = this.customPaths.map(path => this.pathMatchCount(path))
        this.customPathLabels = this.customPathsData.map((_, i) => `Path ${i + 1}`)
        this.drawCustomPathchart()
    }

    pathSelector(i) {
        return i === 0 ? document.querySelector('.trade-path') : document.querySelector(`.trade-path-${i + 1}`)
    }

    getLevels() {
        this.pathCount = this.pathCount || 1
        this.customPaths = Array.from({ length: this.pathCount }, (_, i) =>
            Array.from(this.pathSelector(i).querySelectorAll("input")).map(input => input.value)
        )
    }

    cloneInput(container) {
        const inputs = container.querySelectorAll("div:has(input)")
        const clone = inputs[inputs.length - 1].cloneNode(true)
        const match = clone.className.match(/input(\d+)/)
        clone.className = `input${(match ? parseInt(match[1]) : 0) + 1}`
        return clone
    }

    buildArrow() {
        const arrow = document.createElement("div")
        arrow.dataset.action = "mouseenter->trade-outcomes#toggleArrow mouseleave->trade-outcomes#toggleArrow"
        arrow.className = "arrow-wrapper d-flex align-items-center"
        arrow.innerHTML = '<span>→</span><button class="remove-btn d-none" data-action="trade-outcomes#removeLevel">-</button>'
        return arrow
    }

    addLevel(event) {
        const container = event.target.closest(".trade-path").querySelector(".levels-container")
        const addBtn = container.querySelector('[data-action*="addLevel"]')
        container.insertBefore(this.buildArrow(), addBtn)
        container.insertBefore(this.cloneInput(container), addBtn)
    }

    removeLevel(event) {
        const wrapper = event.target.closest(".arrow-wrapper")
        wrapper.nextElementSibling.remove()
        wrapper.remove()
        this.getData()
    }

    relabelPath(clone) {
        clone.classList.forEach(c => { if (/^trade-path-\d+$/.test(c)) clone.classList.remove(c) })
        clone.classList.add(`trade-path-${this.pathCount}`)
        clone.querySelector("h4").textContent = `Trade_Path_${this.pathCount}`
    }

    clonePath(container) {
        const paths = container.querySelectorAll(".trade-path")
        const clone = paths[paths.length - 1].cloneNode(true)
        this.relabelPath(clone)
        return clone
    }

    relinkDataLists(clone) {
        const inputs = clone.querySelectorAll("input[list]")
        clone.querySelectorAll("datalist").forEach((datalist, i) => {
            datalist.id = `levels-${this.pathCount}-${i}`
            if (inputs[i]) inputs[i].setAttribute("list", datalist.id)
        })
    }

    refreshPaths() {
        this.updateDeleteButtons()
        this.getData()
    }

    appendPath(container, clone) {
        this.relinkDataLists(clone)
        container.appendChild(clone)
        this.refreshPaths()
    }

    addPath() {
        this.pathCount = (this.pathCount || 1) + 1
        const container = document.querySelector(".paths-container")
        this.appendPath(container, this.clonePath(container))
    }

    toggleArrow(event) {
        const button = event.currentTarget.querySelector(".remove-btn")
        const arrow = event.currentTarget.querySelector("span")
        button.classList.toggle("d-none")
        arrow.classList.toggle("d-none")
    }

    updateDeleteButtons() {
        const paths = document.querySelectorAll(".paths-container .trade-path")
        const hide = paths.length === 1
        paths.forEach(p => {
            const btn = p.querySelector("[data-action*='deletePath']")
            if (btn) btn.classList.toggle("d-none", hide)
        })
    }

    renumberPath(p, i) {
        p.classList.forEach(c => { if (/^trade-path-\d+$/.test(c)) p.classList.remove(c) })
        if (i > 0) p.classList.add(`trade-path-${i + 1}`)
        p.querySelector("h4").textContent = `Trade_Path_${i + 1}`
    }

    renumberAllPaths(container) {
        const remaining = container.querySelectorAll(".trade-path")
        remaining.forEach((p, i) => this.renumberPath(p, i))
        this.pathCount = remaining.length
    }

    deletePath(event) {
        const container = document.querySelector(".paths-container")
        event.target.closest(".trade-path").remove()
        this.renumberAllPaths(container)
        this.refreshPaths()
    }

    createMessageElement(message) {
        const el = document.createElement("div")
        el.className = "chat-message m-2 p-2 bg-primary text-white rounded"
        el.textContent = message.value.trim()
        return el
    }

    createResponseElement(message) {
        const el = document.createElement("div")
        el.className = "chat-message m-2 p-2 bg-white text-black rounded"
        el.style.alignSelf = "flex-start"
        el.innerHTML = marked.parse(message.value.trim())
        return el
    }

    appendMessage(message) {
        const messageElement = this.createMessageElement(message)
        this.chatMessages.prepend(messageElement)
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight
        this.input.value = ""
    }

    appendResponse(data) {
        const responseElement = this.createResponseElement(data)
        this.chatMessages.prepend(responseElement)
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight
    }

    chatRequestBody() {
        return JSON.stringify({
            messages: this.messageHistory,
            context: { custom_paths: this.customPaths, custom_paths_count: this.customPathsData }
        })
    }

    fetchOptions(csrfToken) {
        return { method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken }, body: this.chatRequestBody() }
    }

    async fetchReply() {
        const csrfToken = document.querySelector('meta[name="csrf-token"]').content
        const response = await fetch("/chats/message", this.fetchOptions(csrfToken))
        return (await response.json()).reply
    }

    processResponse(reply) {
        this.messageHistory.push({ role: "assistant", content: reply })
        this.appendResponse({ value: reply })
    }

    async sendMessage() {
        const input = document.getElementById("chat-input"),
            message = input.value.trim()
        if (!message) return
        this.appendMessage(input)
        this.messageHistory.push({ role: "user", content: message })
        this.processResponse(await this.fetchReply())
    }

    toggleChat() {
        const chat = document.getElementById("chat-box")
        chat.classList.toggle("d-none")
    }
}