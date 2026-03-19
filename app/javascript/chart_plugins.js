import { Chart } from 'chart.js'

Chart.register({
    id: 'dataLabels',
    afterDatasetsDraw(chart) {
        if (chart.options.plugins.dataLabels === false) return
        const { ctx } = chart
        chart.data.datasets.forEach((dataset, i) => {
            const meta = chart.getDatasetMeta(i)
            meta.data.forEach((bar, index) => {
                const value = dataset.data[index]
                if (value > 0) {
                    ctx.save()
                    ctx.fillStyle = 'rgba(255,255,255,0.85)'
                    ctx.font = 'bold 12px Inter, sans-serif'
                    ctx.textAlign = 'center'
                    ctx.textBaseline = 'bottom'
                    ctx.fillText(parseFloat(value.toFixed(2)), bar.x, bar.y - 4)
                    ctx.restore()
                }
            })
        })
    }
})