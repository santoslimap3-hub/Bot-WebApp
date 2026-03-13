import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  connect() {
    fetch('http://127.0.0.1:5000/trade_history')
      .then(response => response.json())
      .then(data => {
        console.log(data);
      })
      .catch(error => {
        console.error('Error fetching dashboard data:', error);
      });
  }
}
