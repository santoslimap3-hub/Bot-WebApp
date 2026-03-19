import { Controller } from "@hotwired/stimulus"
import { Chart, registerables } from 'chart.js'
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

const LEVEL_CLASSES = {
    "Stop Loss": "level-sl",
    "Entry Zone": "level-entry",
    "BE": "level-be",
    "TP1": "level-tp",
    "TP2": "level-tp",
    "TP3": "level-tp",
    "TP4": "level-tp",
    "TP5": "level-tp"
}

export default class extends Controller {
    static targets = ["canvas", "emptyState"]
    static values = { records: Object }

    connect() {
        this.records = Object.values(this.recordsValue.records)
        this.pathCount = 1
        this.getData()
    }

    getData() {
        this.getLevels()
        this.customPathsData = this.customPaths.map(path => this.pathMatchCount(path))
        this.customPathLabels = this.customPathsData.map((_, i) => `Path ${i + 1}`)
        this.updateEmptyState()
        this.drawChart()
        this.dispatch("updated", { detail: { paths: this.customPaths, counts: this.customPathsData }, bubbles: true })
    }

    updateEmptyState() {
        if (!this.hasEmptyStateTarget) return
        const hasData = this.customPaths.some(path => path.some(v => v.length > 0))
        this.emptyStateTarget.classList.toggle("d-none", hasData)
    }

    onLevelSelect(event) {
        const input = event.target
        const value = input.value.trim()
        input.classList.remove("level-sl", "level-entry", "level-be", "level-tp")
        if (LEVEL_CLASSES[value]) {
            input.classList.add(LEVEL_CLASSES[value])
        }
    }

    drawChart() {
        if (this.chart) this.chart.destroy()
        const grid = { color: 'rgba(255,255,255,0.06)' }
        const ticks = { color: 'rgba(255,255,255,0.5)' }
        const total = this.records.length

        this.chart = new Chart(this.canvasTarget, {
            type: 'bar',
            data: {
                labels: this.customPathLabels,
                datasets: [{
                    label: 'Number of trades',
                    data: this.customPathsData,
                    borderWidth: 1,
                    borderRadius: 8,
                    backgroundColor: (ctx) => this.backgroundColorFor(ctx),
                    borderColor: BAR_COLORS.map((_, i) => this.colorFor(i))
                }]
            },
            options: {
                maintainAspectRatio: false,
                animation: {
                    duration: 600,
                    easing: 'easeOutQuart'
                },
                layout: {
                    padding: { top: 24 }
                },
                plugins: {
                    dataLabels: false,
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(15,15,19,0.92)',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        cornerRadius: 12,
                        padding: 12,
                        titleFont: { family: 'Inter', weight: '700', size: 13 },
                        bodyFont: { family: 'Inter', size: 12 },
                        titleColor: '#f0f0f5',
                        bodyColor: 'rgba(255,255,255,0.7)',
                        displayColors: true,
                        boxWidth: 8,
                        boxHeight: 8,
                        boxPadding: 4,
                        callbacks: {
                            label: (ctx) => {
                                const pct = total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : 0
                                return ` ${ctx.raw} trades (${pct}%)`
                            }
                        }
                    }
                },
                scales: {
                    x: { grid, ticks },
                    y: { beginAtZero: true, grace: '15%', grid, ticks: {...ticks, stepSize: 1 } }
                }
            }
        })
    }

    // --- Path matching ---

    containsSequence(needle, haystack) {
        if (needle.length === 0) return false
        let ni = 0
        for (let hi = 0; hi < haystack.length; hi++) {
            if (haystack[hi] === needle[ni]) ni++
                if (ni === needle.length) return true
        }
        return false
    }

    pathMatchCount(path) {
        const sequence = path.map(level => LEVEL_MAP[level]).filter(v => v !== undefined)
        return this.records.filter(record => this.containsSequence(sequence, record.outcome_sequence)).length
    }

    // --- Level management ---

    getLevels() {
        this.customPaths = Array.from({ length: this.pathCount }, (_, i) =>
            Array.from(this.pathSelector(i).querySelectorAll("input")).map(input => input.value)
        )
    }

    pathSelector(i) {
        return i === 0 ? this.element.querySelector('.trade-path') : this.element.querySelector(`.trade-path-${i + 1}`)
    }

    cloneInput(container) {
        const inputs = container.querySelectorAll("div:has(input)")
        const clone = inputs[inputs.length - 1].cloneNode(true)
        const match = clone.className.match(/input(\d+)/)
        clone.className = `input${(match ? parseInt(match[1]) : 0) + 1} level-input-wrapper`
        return clone
    }

    buildArrow() {
        const arrow = document.createElement("div")
        arrow.dataset.action = "mouseenter->path-builder#toggleArrow mouseleave->path-builder#toggleArrow"
        arrow.className = "arrow-connector d-flex align-items-center"
        arrow.innerHTML = '<span class="connector-line"></span><span class="connector-arrow">›</span><button class="remove-btn d-none" data-action="path-builder#removeLevel">×</button>'
        return arrow
    }

    addLevel(event) {
        const container = event.target.closest(".trade-path").querySelector(".levels-container")
        const addBtn = container.querySelector('[data-action*="addLevel"]')
        container.insertBefore(this.buildArrow(), addBtn)
        container.insertBefore(this.cloneInput(container), addBtn)
    }

    removeLevel(event) {
        const wrapper = event.target.closest(".arrow-connector")
        wrapper.nextElementSibling.remove()
        wrapper.remove()
        this.getData()
    }

    // --- Path management ---

    relabelPath(clone) {
        clone.classList.forEach(c => { if (/^trade-path-\d+$/.test(c)) clone.classList.remove(c) })
        clone.classList.add(`trade-path-${this.pathCount}`)
        clone.querySelector("h4").textContent = `Path ${this.pathCount}`
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

    addPath() {
        this.pathCount = (this.pathCount || 1) + 1
        const container = this.element.querySelector(".paths-container")
        const clone = this.clonePath(container)
        this.relinkDataLists(clone)
        container.appendChild(clone)
        this.updateDeleteButtons()
        this.getData()
    }

    deletePath(event) {
        const container = this.element.querySelector(".paths-container")
        event.target.closest(".trade-path").remove()
        this.renumberAllPaths(container)
        this.updateDeleteButtons()
        this.getData()
    }

    renumberPath(p, i) {
        p.classList.forEach(c => { if (/^trade-path-\d+$/.test(c)) p.classList.remove(c) })
        if (i > 0) p.classList.add(`trade-path-${i + 1}`)
        p.querySelector("h4").textContent = `Path ${i + 1}`
    }

    renumberAllPaths(container) {
        const remaining = container.querySelectorAll(".trade-path")
        remaining.forEach((p, i) => this.renumberPath(p, i))
        this.pathCount = remaining.length
    }

    updateDeleteButtons() {
        const paths = this.element.querySelectorAll(".paths-container .trade-path")
        const hide = paths.length === 1
        paths.forEach(p => {
            const btn = p.querySelector("[data-action*='deletePath']")
            if (btn) btn.classList.toggle("d-none", hide)
        })
    }

    toggleArrow(event) {
        const button = event.currentTarget.querySelector(".remove-btn")
        const line = event.currentTarget.querySelector(".connector-line")
        const arrow = event.currentTarget.querySelector(".connector-arrow")
        button.classList.toggle("d-none")
        if (line) line.classList.toggle("d-none")
        if (arrow) arrow.classList.toggle("d-none")
    }

    // --- Color helpers ---

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
}