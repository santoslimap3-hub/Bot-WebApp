import { Controller } from "@hotwired/stimulus"

export default class extends Controller {

    static targets = ["warningsTable", "tradesTable"];

    connect() {
        this.fetchTradeHistory();
        this.fetchErrorRecords();
        this.applyDefaultTradeFilter();
    }

    applyDefaultTradeFilter() {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 1);
        this.tradesTableTarget.querySelectorAll('tbody tr[data-trade-time]').forEach(row => {
            const tradeTime = new Date(row.dataset.tradeTime);
            row.style.display = tradeTime >= cutoff ? '' : 'none';
        });
    }

    fetchTradeHistory() {
        fetch('http://38.180.65.159:5000/trade_history')
            .then(r => r.json())
            .catch(e => console.error('Error fetching dashboard data:', e));
    }

    fetchErrorRecords() {
        fetch('http://38.180.65.159:5000/error_records')
            .then(r => r.json()).then(d => this.handleErrorData(d))
            .catch(e => console.error('Error fetching dashboard data:', e));
    }

    handleErrorData(data) {
        this.errorData = data.errors;
        this.updateWarnings();
    }

    updateWarnings() {
        this.errorData.forEach(el =>
            this.warningsTableTarget.querySelector('tbody')
            .insertAdjacentHTML('beforeend', this.warningRowHTML(el)));
    }

    warningRowHTML({ level, message, time }) {
        const severity = level.toLowerCase();
        return `<tr>
            <td><span class="severity-dot ${severity}">${level}</span></td><td>${message}</td><td>${time}</td>
        </tr>`;
    }

    filterTrades(event) {
        const days = parseInt(event.currentTarget.dataset.days);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);

        // Update active button
        this.element.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        event.currentTarget.classList.add('active');

        // Filter rows
        this.tradesTableTarget.querySelectorAll('tbody tr[data-trade-time]').forEach(row => {
            const tradeTime = new Date(row.dataset.tradeTime);
            row.style.display = tradeTime >= cutoff ? '' : 'none';
        });
    }
}