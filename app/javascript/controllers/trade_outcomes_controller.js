import { Controller } from "@hotwired/stimulus"
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

export default class extends Controller {
    static targets = ["outcomesOverview", "customPathsOverview"]
    static values = { records: Object }

    connect() {
        this.updateData()
        this.drawBarchart()
        this.getData()
        this.drawCustomPathchart()
    }

    drawBarchart() {
        this.chart = new Chart(this.outcomesOverviewTarget, {
            type: 'bar',
            data: {
                labels: ["Entry zone", "Stop loss", "TP1", "TP2", "TP3", "tp4", "TP5"],
                datasets: [{
                    label: 'Number of trades',
                    data: this.outcomeData,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.2)',
                        'rgba(255, 159, 64, 0.2)',
                        'rgba(255, 205, 86, 0.2)',
                        'rgba(75, 192, 192, 0.2)',
                        'rgba(54, 162, 235, 0.2)',
                        'rgba(153, 102, 255, 0.2)',
                        'rgba(201, 203, 207, 0.2)'
                    ],
                    borderColor: [
                        'rgb(255, 99, 132)',
                        'rgb(255, 159, 64)',
                        'rgb(255, 205, 86)',
                        'rgb(75, 192, 192)',
                        'rgb(54, 162, 235)',
                        'rgb(153, 102, 255)',
                        'rgb(201, 203, 207)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        })
    }

    drawCustomPathchart() {
        if (this.customChart) this.customChart.destroy()
        this.customChart = new Chart(this.customPathsOverviewTarget, {
            type: 'bar',
            data: {
                labels: this.customPathLabels,
                datasets: [{
                    label: 'Number of trades',
                    data: this.customPathsData,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.2)',
                        'rgba(255, 159, 64, 0.2)',
                        'rgba(255, 205, 86, 0.2)',
                        'rgba(75, 192, 192, 0.2)',
                        'rgba(54, 162, 235, 0.2)',
                        'rgba(153, 102, 255, 0.2)',
                        'rgba(201, 203, 207, 0.2)'
                    ],
                    borderColor: [
                        'rgb(255, 99, 132)',
                        'rgb(255, 159, 64)',
                        'rgb(255, 205, 86)',
                        'rgb(75, 192, 192)',
                        'rgb(54, 162, 235)',
                        'rgb(153, 102, 255)',
                        'rgb(201, 203, 207)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        })
    }

    updateData() {
        // Implementation for updating chart data
        this.outcomeData = []
        this.records = Object.values(this.recordsValue.records)
        this.outcomeData.push(this.records.filter(r => r.price_entered_zone === true).length)
        this.outcomeData.push(this.records.filter(r => r.outcome_sequence.includes(-1)).length)
        this.outcomeData.push(this.records.filter(r => r.outcome_sequence.includes(1)).length)
        this.outcomeData.push(this.records.filter(r => r.outcome_sequence.includes(2)).length)
        this.outcomeData.push(this.records.filter(r => r.outcome_sequence.includes(3)).length)
        this.outcomeData.push(this.records.filter(r => r.outcome_sequence.includes(4)).length)
        this.outcomeData.push(this.records.filter(r => r.outcome_sequence.includes(5)).length)
    }
    addLevel(event) {
        const target = event.target.closest(".trade-path")
        const container = target.querySelector(".levels-container")
        const inputs = container.querySelectorAll("div:has(input)")
        const original = inputs[inputs.length - 1]
        const clone = original.cloneNode(true)
        const match = clone.className.match(/input(\d+)/)
        const i = match ? parseInt(match[1]) : 0
        clone.className = `input${i + 1}`
        const arrow = document.createElement("div")
        arrow.dataset.action = "mouseenter->trade-outcomes#toggleArrow mouseleave->trade-outcomes#toggleArrow"
        arrow.className = "arrow-wrapper"
        arrow.innerHTML = '<span>→</span><button class="remove-btn d-none" data-action="trade-outcomes#removeLevel">-</button>'
        container.appendChild(arrow)
        container.appendChild(clone)
    }

    removeLevel(event) {
        const wrapper = event.target.closest(".arrow-wrapper")
        wrapper.nextElementSibling.remove()
        wrapper.remove()
        this.getData()
    }

    addPath() {
        if (!this.pathCount) { this.pathCount = 1 }

        this.pathCount++

            const container = document.querySelector(".paths-container")
        const paths = container.querySelectorAll(".trade-path")
        const original = paths[paths.length - 1]
        const clone = original.cloneNode(true)
        clone.classList.forEach(c => { if (/^trade-path-\d+$/.test(c)) clone.classList.remove(c) })
        clone.classList.add(`trade-path-${this.pathCount}`)

        clone.classList.add(`trade-path-${this.pathCount}`)
        clone.querySelector("h4").textContent = `Trade_Path_${this.pathCount}`

        const inputs = clone.querySelectorAll("input[list]")
        const datalists = clone.querySelectorAll("datalist")
        datalists.forEach((datalist, i) => {
            const newId = `levels-${this.pathCount}-${i}`
            datalist.id = newId
            if (inputs[i]) inputs[i].setAttribute("list", newId)
        })

        container.appendChild(clone)
        this.getData()
    }

    toggleArrow(event) {
        const button = event.currentTarget.querySelector(".remove-btn")
        const arrow = event.currentTarget.querySelector("span")
        button.classList.toggle("d-none")
        arrow.classList.toggle("d-none")
    }

    getData() {
        this.customPaths = []
        this.customPathsData = []
        this.pathCount = this.pathCount || 1
        for (let i = 0; i < this.pathCount; i++) {
            if (i === 0) {
                this.path = document.querySelector(`.trade-path`)
            } else {
                console.log(i)
                this.path = document.querySelector(`.trade-path-${i+1}`)
            }
            const inputs = this.path.querySelectorAll("input")
            const levels = Array.from(inputs).map(input => input.value)
            this.customPaths[i] = levels
        }
        const levelMap = {
            "Stop Loss": -1,
            "Entry Zone": 0,
            "BE": 0,
            "TP1": 1,
            "TP2": 2,
            "TP3": 3,
            "TP4": 4,
            "TP5": 5
        }

        this.customPaths.forEach(path => {
            const sequence = path.map(level => levelMap[level])
            this.outcome_sequences = []
            this.records.forEach(record => {
                this.outcome_sequences.push(record.outcome_sequence)
            })
            let filtered_outcome_sequences = []
            this.outcome_sequences.forEach(element => {
                let output_sequence = []
                element.forEach(outcome => {
                    if (sequence.includes(outcome)) {
                        output_sequence.push(outcome)
                    }
                })
                filtered_outcome_sequences.push(output_sequence)
            });
            const match_count = filtered_outcome_sequences.filter(s => s.toString().includes(sequence.toString())).length
            this.customPathsData.push(match_count)
        });
        this.customPathLabels = Array.from({ length: this.customPathsData.length }, (_, i) => `Path ${i + 1}`)
        console.log(this.customPathLabels)
        console.log(this.customPathsData)
        this.drawCustomPathchart()
    }
}