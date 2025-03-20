const formatTime = (ms) => {
  let seconds = Math.floor(ms / 1000);
  let minutes = Math.floor(seconds / 60);
  let hours = Math.floor(minutes / 60);
  let days = Math.floor(hours / 24);

  seconds = seconds % 60;
  minutes = minutes % 60;
  hours = hours % 24;

  let result = "";
  if (days > 0) result += days + " days ";
  if (hours > 0) result += hours + " hours ";
  if (minutes > 0) result += minutes + " minutes ";
  if (seconds > 0 || result === "") result += seconds + " seconds";

  return result.trim();
};

module.exports = formatTime;
