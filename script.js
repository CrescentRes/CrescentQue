document.addEventListener('DOMContentLoaded', function() {
  const queueForm = document.getElementById('queueForm');
  const queueResult = document.getElementById('queueResult');
  const queueNumberDisplay = document.getElementById('queueNumberDisplay');
  const customerInfo = document.getElementById('customerInfo');
  const newCustomerBtn = document.getElementById('newCustomerBtn');
  
  // Initialize queue number from localStorage or start at 1
  let queueNumber = localStorage.getItem('lastQueueNumber') || 0;
  
  queueForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Get form values
      const name = document.getElementById('customerName').value;
      const partySize = document.getElementById('partySize').value;
      const timestamp = new Date().toLocaleString();
      
      // Increment queue number
      queueNumber++;
      localStorage.setItem('lastQueueNumber', queueNumber);
      
      // Format queue number with leading zeros
      const formattedQueueNumber = queueNumber.toString().padStart(3, '0');
      
      // Store customer data
      const customerData = {
          queueNumber: queueNumber,
          formattedNumber: formattedQueueNumber,
          name: name,
          partySize: partySize,
          timestamp: timestamp
      };
      
      // Add to queue list in localStorage
      let queueList = JSON.parse(localStorage.getItem('queueList')) || [];
      queueList.push(customerData);
      localStorage.setItem('queueList', JSON.stringify(queueList));
      
      // Display results
      queueNumberDisplay.textContent = `Q-${formattedQueueNumber}`;
      customerInfo.textContent = `Name: ${name} (Party of ${partySize})`;
      
      // Show result and hide form
      queueForm.reset();
      queueResult.classList.remove('d-none');
  });
  
  newCustomerBtn.addEventListener('click', function() {
      queueResult.classList.add('d-none');
  });
});