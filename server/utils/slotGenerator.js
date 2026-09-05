const generateSlots = (start, end, duration) => {
  const slots = [];

  const [startHour, startMin] = start.split(":").map(Number);
  const [endHour, endMin] = end.split(":").map(Number);

  let current = new Date();
  current.setHours(startHour, startMin, 0);

  const endTime = new Date();
  endTime.setHours(endHour, endMin, 0);

  while (current < endTime) {
    let hours = current.getHours();
    let minutes = current.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;

    slots.push(
      `${hours}:${minutes.toString().padStart(2, "0")} ${ampm}`
    );

    current.setMinutes(current.getMinutes() + duration);
  }

  return slots;
};

module.exports = generateSlots;