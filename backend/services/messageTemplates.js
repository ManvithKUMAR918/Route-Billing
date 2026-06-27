function dueTodayMessage(parentName, studentName, amount, route) {
  return `Hello ${parentName},\n\nThis is a reminder that the transport fee of ₹${amount} for *${studentName}* is due *TODAY*.\n\nRoute: ${route}\n\nPlease make the payment to avoid late charges.\n\n- FirstCry Intellitots Transport Team`;
}

function upcomingDueMessage(parentName, studentName, amount, dueDate, route) {
  const formattedDate = new Date(dueDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  return `Hello ${parentName},\n\nFriendly reminder: Transport fee of ₹${amount} for *${studentName}* is due on *${formattedDate}*.\n\nRoute: ${route}\n\nKindly arrange the payment in advance.\n\n- FirstCry Intellitots Transport Team`;
}

function overdueMessage(parentName, studentName, amount, dueDate, route) {
  const formattedDate = new Date(dueDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  return `Hello ${parentName},\n\n⚠️ OVERDUE ALERT: Transport fee of ₹${amount} for *${studentName}* was due on *${formattedDate}* and is still unpaid.\n\nRoute: ${route}\n\nPlease pay immediately to avoid service disruption.\n\n- FirstCry Intellitots Transport Team`;
}

function paymentConfirmedMessage(parentName, studentName, amount, paidDate) {
  const formattedDate = new Date(paidDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  return `Hello ${parentName},\n\n✅ Payment Confirmed! We have received ₹${amount} transport fee for *${studentName}* on ${formattedDate}.\n\nThank you!\n\n- FirstCry Intellitots Transport Team`;
}

module.exports = { dueTodayMessage, upcomingDueMessage, overdueMessage, paymentConfirmedMessage };
