export function calculateStay(checkIn: Date, checkOut?: Date): string {
    const checkInDate = new Date(checkIn);
    const out = checkOut ? new Date(checkOut) : new Date();
  
    // Calculate the difference in milliseconds
    const diffInMs = out.getTime() - checkInDate.getTime();
  
    // Convert to seconds, minutes, hours, and days
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
  
    // Return a human-readable format
    if (diffInDays > 0) {
      return `${diffInDays} d`;
    } else if (diffInHours > 0) {
      return `${diffInHours} h`;
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes} m`;
    } else {
      return `${diffInSeconds} s`;
    }
  }

export  function formatDatetime(dateTime: Date): string {
    if(!dateTime) return "";
    const dateTimeDate = new Date(dateTime);
  
    // Extract day, month, year, hour, and minute
    const day = String(dateTimeDate.getDate()).padStart(2, '0');
    const month = String(dateTimeDate.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
    const year = dateTimeDate.getFullYear();
    const hours = String(dateTimeDate.getHours()).padStart(2, '0');
    const minutes = String(dateTimeDate.getMinutes()).padStart(2, '0');
  
    // Format as dd-mm-yyyy hh:mm
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  }