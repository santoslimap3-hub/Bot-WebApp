import { Controller } from "@hotwired/stimulus"
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

export default class extends Controller {
    static targets = ["canvas", "barCanvas", "customFrom", "customTo", "filterBtn", "tradeTable"]
    updateChartInfo(from, to) {
        this.cum_profits = []
        this.dates = []
        this.days = []
        this.profits_per_day = []
        let last_date = null
        this.trades.forEach(trade => {
            const current_date = new Date(trade.date)
            if (this.custom_to === null) {
                //handles first graph data
                this.dates.push(new Date(trade.date).toLocaleDateString())
                if (this.cum_profits.length == 0) {
                    this.cum_profits.push(parseInt(trade.profit))
                } else {
                    this.cum_profits.push(this.cum_profits[this.cum_profits.length - 1] + parseInt(trade.profit))
                }
                //handles second graph data
                if (this.profits_per_day.length == 0) {
                    this.profits_per_day.push(parseInt(trade.profit))
                    this.days.push(current_date.toLocaleDateString())

                } else {
                    if (current_date.toDateString() === last_date.toDateString()) {
                        this.profits_per_day[this.profits_per_day.length - 1] += parseInt(trade.profit)
                    } else {
                        this.profits_per_day.push(parseInt(trade.profit))
                        this.days.push(current_date.toLocaleDateString())
                    }
                }
            } else if (new Date(trade.date) >= this.custom_from && new Date(trade.date) <= this.custom_to) {
                //handles first graph data
                this.dates.push(new Date(trade.date).toLocaleDateString())
                if (this.cum_profits.length == 0) {
                    this.cum_profits.push(parseInt(trade.profit))
                } else {
                    this.cum_profits.push(this.cum_profits[this.cum_profits.length - 1] + parseInt(trade.profit))
                }
                //handles second graph data
                if (this.profits_per_day.length == 0) {
                    this.profits_per_day.push(parseInt(trade.profit))
                    this.days.push(current_date.toLocaleDateString())
                } else if (current_date.toDateString() === last_date.toDateString()) {
                    this.profits_per_day[this.profits_per_day.length - 1] += parseInt(trade.profit)
                } else {
                    this.profits_per_day.push(parseInt(trade.profit))
                    this.days.push(current_date.toLocaleDateString())
                }
            }
            last_date = new Date(trade.date)
        });
    }
    connect() {
        this.trades = JSON.parse(this.element.dataset.trades)
        this.custom_from = null
        this.custom_to = null
        this.updateChartInfo(this.custom_from, this.custom_to)
        this.drawchart("line")
        this.drawchart("bar")
        this.updateTradeTable()
    }
    drawchart(type) {
        if (type == "line") {
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
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    },
                },
                plugins: [noDataPlugin]
            });
        } else if (type == "bar") {
            this.barchat = new Chart(this.barCanvasTarget, {
                type: 'bar',
                data: {
                    labels: this.days,
                    datasets: [{
                        label: 'Daily P&L',
                        data: this.profits_per_day,
                        backgroundColor: this.profits_per_day.map(p => p >= 0 ? 'rgba(75, 192, 192, 0.2)' : 'rgba(255, 99, 132, 0.2)'),
                        borderColor: this.profits_per_day.map(p => p >= 0 ? 'rgba(75, 192, 192, 1)' : 'rgba(255, 99, 132, 1)'),
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    },
                },
            });
        }
    }

    filterDays(event) {
        this.numdays = event.params.days;
        if (this.numdays === 0) {
            this.custom_from = null;
            this.custom_to = null;
        } else {
            this.custom_from = new Date(new Date() - this.numdays * 24 * 60 * 60 * 1000);
            this.custom_to = new Date();
            this.updateChartInfo(this.custom_from, this.custom_to);
            this.updateChart();
        }
    }

    updateChart() {
        this.chart.destroy()
        this.barchat.destroy()
        this.drawchart("line")
        this.drawchart("bar")
        this.updateTradeTable()
    }

    applyCustom() {
        this.custom_from = new Date(this.customFromTarget.value);
        this.custom_to = new Date(this.customToTarget.value);
        console.log(this.custom_from, this.custom_to);
        this.updateChartInfo(this.custom_from, this.custom_to);
        this.updateChart();
    }
    updateTradeTable() {
        const trades = this.custom_to === null ?
            this.trades :
            this.trades.filter(t => new Date(t.date) >= this.custom_from && new Date(t.date) <= this.custom_to)

        this.tradeTableTarget.innerHTML = trades.map(t => `
        <tr>
            <td>${new Date(t.date).toLocaleString()}</td>
            <td><span class="badge ${t.direction === 'BUY' ? 'bg-success' : 'bg-danger'}">${t.direction}</span></td>
            <td>${t.symbol}</td>
            <td class="${t.profit >= 0 ? 'text-success' : 'text-danger'} fw-semibold">$${t.profit}</td>
        </tr>
    `).join('')
    }

}