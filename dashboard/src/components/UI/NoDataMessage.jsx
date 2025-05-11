import React from "react";
import PropTypes from "prop-types";
import { FaExclamationTriangle, FaInfoCircle, FaSearch } from "react-icons/fa";

/**
 * NoDataMessage - Component to display when there is no data
 *
 * @param {Object} props - Component props
 * @param {String} props.title - Message title
 * @param {String} props.message - Message content
 * @param {String} props.type - Message type: 'warning', 'info', 'search'
 * @param {Function} props.onAction - Function to handle button click
 * @param {String} props.actionText - Button text
 * @returns {JSX.Element}
 */
const NoDataMessage = ({
  title = "No data found",
  message = "No data matching your request was found.",
  type = "info",
  onAction,
  actionText = "Try again",
}) => {
  // Choose icon based on message type
  let icon;
  let iconClass;

  switch (type) {
    case "warning":
      icon = (
        <FaExclamationTriangle className="mb-3" style={{ fontSize: "3rem" }} />
      );
      iconClass = "text-warning";
      break;
    case "search":
      icon = <FaSearch className="mb-3" style={{ fontSize: "3rem" }} />;
      iconClass = "text-info";
      break;
    case "info":
    default:
      icon = <FaInfoCircle className="mb-3" style={{ fontSize: "3rem" }} />;
      iconClass = "text-primary";
      break;
  }

  return (
    <div className="text-center py-5">
      <div className={iconClass}>{icon}</div>
      <h5>{title}</h5>
      <p className="text-muted">{message}</p>
      {onAction && (
        <button className="btn btn-outline-primary mt-2" onClick={onAction}>
          {actionText}
        </button>
      )}
    </div>
  );
};

NoDataMessage.propTypes = {
  title: PropTypes.string,
  message: PropTypes.string,
  type: PropTypes.oneOf(["warning", "info", "search"]),
  onAction: PropTypes.func,
  actionText: PropTypes.string,
};

export default NoDataMessage;
