import React from "react";

const TimeDisplay = ({ createdAt }) => {
  const createdDate = new Date(createdAt);
  const now = new Date();
  const diffMs = now - createdDate;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays >= 1) {
    return <span>{diffDays}d ago</span>;
  } else {
    const hours = String(createdDate.getHours()).padStart(2, "0");
    const minutes = String(createdDate.getMinutes()).padStart(2, "0");
    return (
      <span>
        {hours}:{minutes}
      </span>
    );
  }
};

export default TimeDisplay;
