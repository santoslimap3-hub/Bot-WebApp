import { Controller } from "@hotwired/stimulus"
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

export default class extends Controller {
    static targets = ["canvas", "barCanvas", "customFrom", "customTo", "tradeTable"]

    connect() {
        this.trades = JSON.parse(this.element.dataset.trades)
        this.custom_from = null
        this.custom_to = null // null means no upper bound
        this.updateChartInfo()
        this.drawchart("line")
        this.drawchart("bar")
        this.updateTradeTable()
    }

    // Returns trades matching the current filter.
    // custom_from = null → all trades (no lower bound)
    // custom_to   = null → no upper bound (used for day-range buttons)
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

        this.filteredTrades().forEach(trade => {
            const current_date = new Date(trade.date)
            const profit = parseFloat(trade.profit)

            // Cumulative line chart
            this.dates.push(current_date.toLocaleDateString())
            this.cum_profits.push(
                (this.cum_profits.length === 0 ? 0 : this.cum_profits[this.cum_profits.length - 1]) + profit
            )

            // Daily bar chart (group same-day trades)
            if (last_date && current_date.toDateString() === last_date.toDateString()) {
                this.profits_per_day[this.profits_per_day.length - 1] += profit
            } else {
                this.profits_per_day.push(profit)
                this.days.push(current_date.toLocaleDateString())
            }

            last_date = current_date
        })
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
            this.chart = new Chart(this.canvasTarget, {
                type: 'line',
                data: {
                    labels: this.dates,
                    datasets: [{
                        label: 'Cumulative P&L',
                        data: this.cum_profits,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        fill: true
                    }]
                },
                options: { responsive: true, scales: { y: { beginAtZero: true } } },
                plugins: [noDataPlugin]
            })
        } else {
            this.barchat = new Chart(this.barCanvasTarget, {
                type: 'bar',
                data: {
                    labels: this.days,
                    datasets: [{
                        label: 'Daily P&L',
                        data: this.profits_per_day,
                        backgroundColor: this.profits_per_day.map(p => p >= 0 ? 'rgba(75,192,192,0.2)' : 'rgba(255,99,132,0.2)'),
                        borderColor: this.profits_per_day.map(p => p >= 0 ? 'rgba(75,192,192,1)' : 'rgba(255,99,132,1)'),
                        borderWidth: 1
                    }]
                },
                options: { responsive: true, scales: { y: { beginAtZero: true } } }
            })
        }
    }

    filterDays(event) {
        const days = event.params.days
        if (days === 0) {
            this.custom_from = null
            this.custom_to = null
        } else {
            this.custom_from = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
            this.custom_to = null // no upper bound — avoids clock-skew exclusions
        }
        this.updateChartInfo()
        this.updateChart()
    }

    applyCustom() {
        this.custom_from = new Date(this.customFromTarget.value)
        this.custom_to = new Date(this.customToTarget.value)
        this.custom_to.setHours(23, 59, 59, 999) // include the full end day
        this.updateChartInfo()
        this.updateChart()
    }

    updateChart() {
        this.chart.destroy()
        this.barchat.destroy()
        this.drawchart("line")
        this.drawchart("bar")
        this.updateTradeTable()
    }

    updateTradeTable() {
        this.tradeTableTarget.innerHTML = this.filteredTrades().map(t => `
            <tr>
                <td style="color: var(--text-muted);">${new Date(t.date).toLocaleString()}</td>
                <td><span class="${t.direction === 'BUY' ? 'badge-buy' : 'badge-sell'}">${t.direction}</span></td>
                <td style="font-weight:600;">${t.symbol}</td>
                <td class="${parseFloat(t.profit) >= 0 ? 'profit' : 'loss'} fw-semibold">$${parseFloat(t.profit).toFixed(2)}</td>
            </tr>
        `).join('')
    }
}