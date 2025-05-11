import React from "react";
import PropTypes from "prop-types";

/**
 * DashboardCard - Component thẻ cho dashboard với gradient và icon
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.icon - Icon component to display
 * @param {String} props.title - Card title
 * @param {String|Number} props.value - Main value to display
 * @param {String} props.subtitle - Optional subtitle text
 * @param {String} props.colorScheme - Color scheme: 'blue', 'green', 'purple', 'orange', 'red', 'pink'
 * @param {Number} props.iconSize - Size of the icon in rem (default: 3)
 * @returns {JSX.Element}
 */
const DashboardCard = ({
  icon,
  title,
  value,
  subtitle,
  colorScheme = "blue",
  iconSize = 3,
  onClick,
}) => {
  // Gradient map bằng tên màu
  const gradientMap = {
    blue: "linear-gradient(to right, #4facfe, #00f2fe)",
    green: "linear-gradient(to right, #43e97b, #38f9d7)",
    purple: "linear-gradient(to right, #6a11cb, #2575fc)",
    orange: "linear-gradient(to right, #fa709a, #fee140)",
    red: "linear-gradient(to right, #ff512f, #dd2476)",
    pink: "linear-gradient(to right, #fa709a, #fee140)",
    teal: "linear-gradient(to right, #209cff, #68e0cf)",
    indigo: "linear-gradient(to right, #6a11cb, #2575fc)",
  };

  // Chọn gradient dựa trên colorScheme
  const background = gradientMap[colorScheme] || gradientMap.blue;

  return (
    <div
      className={`card border-0 shadow-sm mb-3 bg-gradient h-100 ${
        onClick ? "cursor-pointer" : ""
      }`}
      style={{ background }}
      onClick={onClick}
    >
      <div className="card-body text-white">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h5 className="text-white mb-0">{title}</h5>
            <h2 className="my-2 text-white">{value}</h2>
            {subtitle && <p className="mb-0 small">{subtitle}</p>}
          </div>
          <div>
            {React.cloneElement(icon, {
              className: "text-white opacity-75",
              style: { fontSize: `${iconSize}rem` },
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

DashboardCard.propTypes = {
  icon: PropTypes.element.isRequired,
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  subtitle: PropTypes.string,
  colorScheme: PropTypes.oneOf([
    "blue",
    "green",
    "purple",
    "orange",
    "red",
    "pink",
    "teal",
    "indigo",
  ]),
  iconSize: PropTypes.number,
  onClick: PropTypes.func,
};

export default DashboardCard;
