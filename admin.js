document.addEventListener('DOMContentLoaded', function() {
  const queueTable = document.getElementById('queueTable');
  const refreshBtn = document.getElementById('refreshBtn');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const totalCount = document.getElementById('totalCount');
  
  function refreshQueue() {
      const queueList = JSON.parse(localStorage.getItem('queueList')) || [];
      queueTable.innerHTML = '';
      
      queueList.forEach(customer => {
          const row = document.createElement('tr');
          row.innerHTML = `
              <td>Q-${customer.formattedNumber}</td>
              <td>${customer.name}</td>
              <td>${customer.partySize}</td>
              <td>${customer.timestamp}</td>
              <td>
                  <button class="btn btn-sm btn-success complete-btn" data-id="${customer.queueNumber}">Complete</button>
                  <button class="btn btn-sm btn-danger remove-btn" data-id="${customer.queueNumber}">Remove</button>
              </td>
          `;
          queueTable.appendChild(row);
      });
      
      totalCount.textContent = queueList.length;
      
      // Add event listeners to new buttons
      document.querySelectorAll('.complete-btn').forEach(btn => {
          btn.addEventListener('click', function() {
              completeCustomer(parseInt(this.getAttribute('data-id')));
          });
      });
      
      document.querySelectorAll('.remove-btn').forEach(btn => {
          btn.addEventListener('click', function() {
              removeCustomer(parseInt(this.getAttribute('data-id')));
          });
      });
  }
  
  function completeCustomer(queueNumber) {
      let queueList = JSON.parse(localStorage.getItem('queueList')) || [];
      queueList = queueList.filter(customer => customer.queueNumber !== queueNumber);
      localStorage.setItem('queueList', JSON.stringify(queueList));
      refreshQueue();
  }
  
  function removeCustomer(queueNumber) {
      if (confirm('Are you sure you want to remove this customer from the queue?')) {
          completeCustomer(queueNumber);
      }
  }
  
  refreshBtn.addEventListener('click', refreshQueue);
  
  clearAllBtn.addEventListener('click', function() {
      if (confirm('Are you sure you want to clear the entire queue?')) {
          localStorage.removeItem('queueList');
          refreshQueue();
      }
  });
  
  // Initial load
  refreshQueue();
});