import { Controller } from "@hotwired/stimulus"
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

// Semantic colors: Entry Zone = orange, SL = red, TP1-5 = greens
const BAR_COLORS = [
    [232, 119, 34], // Entry zone — orange
    [239, 68, 68], // Stop loss — red
    [34, 197, 94], // TP1 — green
    [52, 211, 153], // TP2 — emerald
    [59, 130, 246], // TP3 — blue
    [168, 85, 247], // TP4 — purple
    [6, 182, 212] // TP5 — cyan
]

export default class extends Controller {
    static targets = ["canvas"]
    static values = { records: Object, total: Number }

    connect() {
        this.records = Object.values(this.recordsValue.records)
        this.total = this.totalValue || this.records.length
        this.outcomeData = [0, -1, 1, 2, 3, 4, 5].map(level => this.outcomeCount(level))
        this.drawChart()
    }

    outcomeCount(level) {
        if (level === 0) return this.records.filter(r => r.price_entered_zone === true).length
        return this.records.filter(r => r.outcome_sequence.includes(level)).length
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

    drawChart() {
        const labels = ["Entry zone", "Stop loss", "TP1", "TP2", "TP3", "TP4", "TP5"]
        const grid = { color: 'rgba(255,255,255,0.06)' }
        const ticks = { color: 'rgba(255,255,255,0.5)' }
        const total = this.total

        this.chart = new Chart(this.canvasTarget, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Number of trades',
                    data: this.outcomeData,
                    borderWidth: 1,
                    borderRadius: 8,
                    backgroundColor: (ctx) => this.backgroundColorFor(ctx),
                    borderColor: BAR_COLORS.map((_, i) => this.colorFor(i))
                }]
            },
            options: {
                maintainAspectRatio: false,
                animation: {
                    duration: 800,
                    easing: 'easeOutQuart'
                },
                layout: {
                    padding: { top: 32 }
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
                    x: { grid, ticks: {...ticks, stepSize: 1 } },
                    y: { beginAtZero: true, grace: '15%', grid, ticks: {...ticks, stepSize: 1 } }
                }
            },
            plugins: [{
                    id: 'percentLabels',
                    afterDatasetsDraw(chart) {
                        const { ctx } = chart
                        chart.data.datasets.forEach((dataset, i) => {
                            const meta = chart.getDatasetMeta(i)
                            meta.data.forEach((bar, index) => {
                                const value = dataset.data[index]
                                if (value > 0) {
                                    const pct = total > 0 ? ((value / total) * 100).toFixed(1) : 0
                                    ctx.save()
                                    ctx.fillStyle = 'rgba(255,255,255,0.9)'
                                    ctx.font = 'bold 12px Inter, sans-serif'
                                    ctx.textAlign = 'center'
                                    ctx.textBaseline = 'bottom'
                                    ctx.fillText(`${value}`, bar.x, bar.y - 20)
                                    ctx.fillStyle = 'rgba(255,255,255,0.45)'
                                    ctx.font = '10px Inter, sans-serif'
                                    ctx.fillText(`${pct}%`, bar.x, bar.y - 8)
                                    ctx.restore()
                                }
                            })
                        })
                    }
                },
                {
                    id: 'highlightMax',
                    afterDatasetsDraw(chart) {
                        const { ctx } = chart
                        const dataset = chart.data.datasets[0]
                        const maxVal = Math.max(...dataset.data)
                        const maxIdx = dataset.data.indexOf(maxVal)
                        if (maxVal <= 0) return
                        const meta = chart.getDatasetMeta(0)
                        const bar = meta.data[maxIdx]
                        const [r, g, b] = BAR_COLORS[maxIdx]
                        ctx.save()
                        ctx.shadowColor = `rgba(${r},${g},${b},0.4)`
                        ctx.shadowBlur = 20
                        ctx.strokeStyle = `rgba(${r},${g},${b},0.6)`
                        ctx.lineWidth = 2
                        ctx.beginPath()
                        ctx.roundRect(bar.x - bar.width / 2 - 2, bar.y - 2, bar.width + 4, chart.chartArea.bottom - bar.y + 4, 8)
                        ctx.stroke()
                        ctx.restore()
                    }
                }
            ]
        })
    }
}