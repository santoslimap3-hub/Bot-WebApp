import { Controller } from "@hotwired/stimulus"
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

export default class extends Controller {
    static targets = ["canvas", "barCanvas", "customFrom", "customTo", "tradeTable", "totalTrades", "pnl", "winRate", "rR", "avgWin", "avgLoss"]

    connect() {
        this.trades = JSON.parse(this.element.dataset.trades)
        this.custom_from = null
        this.custom_to = null
        this.updateChartInfo()
        this.drawchart("line")
        this.drawchart("bar")
        this.updateTradeTable()
        this.updateStats()
    }

    filteredTrades() {
        return this.trades.filter(t => {
            const d = new Date(t.date)
            if (this.custom_from && d < this.custom_from) return false
            if (this.custom_to && d > this.custom_to) return false
            return true
        })
    }

    updateChartInfo() {
        this.cum_profits = []
        this.dates = []
        this.days = []
        this.profits_per_day = []
        let last_date = null

        const filtered = this.filteredTrades()
        if (filtered.length > 0) {
            if (this.custom_from) {
                this.dates.push(this.custom_from.toLocaleDateString())
            } else {
                const firstDate = new Date(filtered[0].date)
                const startDate = new Date(firstDate)
                startDate.setDate(startDate.getDate() - 1)
                this.dates.push(startDate.toLocaleDateString())
            }
            this.cum_profits.push(0)
        }

        filtered.forEach(trade => {
            const current_date = new Date(trade.date)
            const profit = parseFloat(trade.profit)

            this.dates.push(current_date.toLocaleDateString())
            this.cum_profits.push(this.cum_profits[this.cum_profits.length - 1] + profit)

            if (last_date && current_date.toDateString() === last_date.toDateString()) {
                this.profits_per_day[this.profits_per_day.length - 1] += profit
            } else {
                this.profits_per_day.push(profit)
                this.days.push(current_date.toLocaleDateString())
            }

            last_date = current_date
        })

        this.PNL = this.cum_profits.length > 0 ? this.cum_profits[this.cum_profits.length - 1] : 0
        this.numTrade = this.filteredTrades().length
        this.winningTrades = this.filteredTrades().filter(t => parseFloat(t.profit) > 0)
        this.losingTrades = this.filteredTrades().filter(t => parseFloat(t.profit) < 0)
        this.winRate = this.numTrade > 0 ? (this.winningTrades.length / this.numTrade * 100).toFixed(2) : "0.00"
        this.avgWin = this.winningTrades.length > 0 ? (this.winningTrades.reduce((sum, t) => sum + parseFloat(t.profit), 0) / this.winningTrades.length).toFixed(2) : "0.00"
        this.avgLoss = this.losingTrades.length > 0 ? (this.losingTrades.reduce((sum, t) => sum + parseFloat(t.profit), 0) / this.losingTrades.length).toFixed(2) : "0.00"
    }
    updateStats() {
        const pnl = this.PNL.toFixed(2)
        const rr = this.avgWin > 0 ? (Math.abs(parseFloat(this.avgLoss)) / parseFloat(this.avgWin)).toFixed(2) : "N/A"
        this.totalTradesTarget.innerHTML = `<span class="dash-stat-number">${this.numTrade}</span><span class="dash-stat-label">Total Trades</span>`
        this.pnlTarget.innerHTML = `<span class="dash-stat-number ${parseFloat(pnl) >= 0 ? 'profit' : 'loss'}">$${pnl}</span><span class="dash-stat-label">P&amp;L</span>`
        this.winRateTarget.innerHTML = `<span class="dash-stat-number">${this.winRate}%</span><span class="dash-stat-label">Win Rate</span>`
        this.rRTarget.innerHTML = `<span class="dash-stat-number">${rr}</span><span class="dash-stat-label">R:R</span>`
        this.avgWinTarget.innerHTML = `<span class="dash-stat-number profit">$${this.avgWin}</span><span class="dash-stat-label">Avg Win</span>`
        this.avgLossTarget.innerHTML = `<span class="dash-stat-number loss">$${this.avgLoss}</span><span class="dash-stat-label">Avg Loss</span>`
    }
    drawchart(type) {
        if (type === "line") {
            const noDataPlugin = {
                id: 'noData',
                afterDraw(chart) {
                    if (chart.data.datasets[0].data.length > 0) return
                    const { ctx, width, height } = chart
                    ctx.save()
                    ctx.textAlign = 'center'
                    ctx.textBaseline = 'middle'
                    ctx.font = '16px sans-serif'
                    ctx.fillStyle = '#888'
                    ctx.fillText('No data', width / 2, height / 2)
                    ctx.restore()
                }
            }
            const peakLabelsPlugin = {
                id: 'peakLabels',
                afterDatasetsDraw(chart) {
                    const { ctx } = chart
                    chart.data.datasets.forEach((dataset, i) => {
                        const meta = chart.getDatasetMeta(i)
                        const data = dataset.data
                        if (data.length === 0) return
                        let maxIdx = 0, minIdx = 0
                        data.forEach((v, idx) => {
                            if (v > data[maxIdx]) maxIdx = idx
                            if (v < data[minIdx]) minIdx = idx
                        })
                        ;[maxIdx, minIdx].forEach(idx => {
                            const point = meta.data[idx]
                            const isMax = idx === maxIdx
                            ctx.save()
                            ctx.fillStyle = 'rgba(255,255,255,0.85)'
                            ctx.font = 'bold 12px Inter, sans-serif'
                            ctx.textAlign = 'center'
                            ctx.textBaseline = isMax ? 'bottom' : 'top'
                            ctx.fillText(parseFloat(data[idx].toFixed(2)), point.x, isMax ? point.y - 6 : point.y + 6)
                            ctx.restore()
                        })
                    })
                }
            }
            const darkScales = {
                x: {
                    grid: { color: 'rgba(255,255,255,0.06)' },
                    ticks: { color: 'rgba(255,255,255,0.5)' }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.06)' },
                    ticks: { color: 'rgba(255,255,255,0.5)' }
                }
            }
            this.chart = new Chart(this.canvasTarget, {
                type: 'line',
                data: {
                    labels: this.dates,
                    datasets: [{
                        label: 'Cumulative P&L',
                        data: this.cum_profits,
                        borderColor: 'rgba(232, 119, 34, 1)',
                        backgroundColor: 'rgba(232, 119, 34, 0.15)',
                        pointBackgroundColor: 'rgba(232, 119, 34, 1)',
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { labels: { color: 'rgba(255,255,255,0.6)' } },
                        tooltip: {
                            callbacks: {
                                label: ctx => `${ctx.dataset.label}: $${ctx.parsed.y.toFixed(2)}`
                            }
                        },
                        dataLabels: false
                    },
                    scales: darkScales
                },
                plugins: [noDataPlugin, peakLabelsPlugin]
            })
        } else {
            this.barchat = new Chart(this.barCanvasTarget, {
                type: 'bar',
                data: {
                    labels: this.days,
                    datasets: [{
                        label: 'Daily P&L',
                        data: this.profits_per_day,
                        backgroundColor: this.profits_per_day.map(p => p >= 0 ? 'rgba(34,197,94,0.7)' : 'rgba(239,68,68,0.7)'),
                        borderColor: this.profits_per_day.map(p => p >= 0 ? 'rgba(34,197,94,1)' : 'rgba(239,68,68,1)'),
                        borderWidth: 1,
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { labels: { color: 'rgba(255,255,255,0.6)' } },
                        tooltip: {
                            callbacks: {
                                label: ctx => `${ctx.dataset.label}: $${ctx.parsed.y.toFixed(2)}`
                            }
                        },
                        dataLabels: false
                    },
                    scales: {
                        x: {
                            grid: { color: 'rgba(255,255,255,0.06)' },
                            ticks: { color: 'rgba(255,255,255,0.5)' }
                        },
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(255,255,255,0.06)' },
                            ticks: {
                                color: 'rgba(255,255,255,0.5)',
                                callback: v => `$${v.toFixed(0)}`
                            }
                        }
                    }
                }
            })
        }
    }

    filterDays(event) {
        const days = event.params.days
        this.element.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'))
        event.currentTarget.classList.add('active')
        if (days === 0) {
            this.custom_from = null
            this.custom_to = null
        } else {
            this.custom_from = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
            this.custom_to = null
        }
        this.updateChartInfo()
        this.updateChart()
        this.updateStats()
    }

    applyCustom() {
        this.custom_from = new Date(this.customFromTarget.value)
        this.custom_to = new Date(this.customToTarget.value)
        this.custom_to.setHours(23, 59, 59, 999)
        this.updateChartInfo()
        this.updateChart()
        this.updateStats()
    }

    updateChart() {
        this.chart.destroy()
        this.barchat.destroy()
        this.drawchart("line")
        this.drawchart("bar")
        this.updateTradeTable()
    }

    updateTradeTable() {
        this.tradeTableTarget.innerHTML = this.filteredTrades().map(t => {
            const profit = parseFloat(t.profit)
            const rowClass = profit >= 0 ? 'profit-row' : 'loss-row'
            return `
            <tr class="trade-row-indicator ${rowClass}">
                <td style="color: rgba(255,255,255,0.45);">${new Date(t.date).toLocaleString()}</td>
                <td><span class="${t.direction === 'BUY' ? 'badge-buy' : 'badge-sell'}">${t.direction}</span></td>
                <td style="font-weight:600;">${t.symbol}</td>
                <td class="${profit >= 0 ? 'profit' : 'loss'} fw-semibold">$${profit.toFixed(2)}</td>
            </tr>`
        }).join('')
    }
}