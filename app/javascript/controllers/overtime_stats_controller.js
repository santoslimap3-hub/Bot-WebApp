import { Controller } from "@hotwired/stimulus"
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

export default class extends Controller {
    static targets = ["canvas", "customFrom", "customTo", "filterBtn"]
    updateChartInfo(from, to) {
        this.cum_profits = []
        this.dates = []
        this.profits_per_day = []
        this.days = []
        this.trades.forEach(trade => {
            if (this.custom_to - this.custom_from === 0) {
                //handles first graph data
                this.dates.push(new Date(trade.date).toLocaleDateString())
                if (this.cum_profits.length == 0) {
                    this.cum_profits.push(parseInt(trade.profit))
                } else {
                    this.cum_profits.push(this.cum_profits[this.cum_profits.length - 1] + parseInt(trade.profit))
                }
                //handles second graph data
                //to be coded
            } else {
                if (new Date(trade.date) >= this.custom_from && new Date(trade.date) <= this.custom_to) {
                    this.dates.push(new Date(trade.date).toLocaleDateString())
                    if (this.cum_profits.length == 0) {
                        this.cum_profits.push(parseInt(trade.profit))
                    } else {
                        this.cum_profits.push(this.cum_profits[this.cum_profits.length - 1] + parseInt(trade.profit))
                    }
                }

            }
        });
    }
    connect() {
        this.trades = JSON.parse(this.element.dataset.trades)
        this.custom_from = new Date()
        this.custom_to = new Date()
        this.updateChartInfo(this.custom_from, this.custom_to)
        this.drawchart("line")
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
        }
        filterDays(event) {
            this.numdays = event.params.days
            this.custom_from = new Date(new Date() - this.numdays * 24 * 60 * 60 * 1000)
            this.custom_to = new Date()
            this.updateChartInfo(this.numdays)
            this.updateChart()
        }
        updateChart() {
            this.chart.destroy()
            this.drawchart()
        }
        applyCustom() {
            this.custom_from = new Date(this.customFromTarget.value)
            this.custom_to = new Date(this.customToTarget.value)
            console.log(this.custom_from, this.custom_to)
            this.updateChartInfo(this.custom_from, this.custom_to)
            this.updateChart()
        }
    }
    elseif(type === "bar") {

    }
}