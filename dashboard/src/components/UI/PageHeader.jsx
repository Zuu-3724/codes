import React from "react";
import PropTypes from "prop-types";
import { FaRedo } from "react-icons/fa";

/**
 * PageHeader - Tiêu đề trang với icon và các nút hành động
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.icon - Icon component để hiển thị
 * @param {String} props.title - Tiêu đề trang
 * @param {Array} props.actions - Mảng các nút hành động, mỗi nút có {icon, label, onClick, variant, disabled}
 * @param {Boolean} props.loading - Trạng thái đang tải
 * @param {Function} props.onRefresh - Hàm xử lý khi nhấn nút Refresh
 * @returns {JSX.Element}
 */
const PageHeader = ({
  icon,
  title,
  actions = [],
  loading = false,
  onRefresh,
}) => {
  return (
    <div className="d-flex justify-content-between align-items-center mb-4">
      <h2 className="mb-0">
        {icon}
        {title}
      </h2>

      <div className="d-flex">
        {onRefresh && (
          <button
            className="btn btn-outline-primary me-2"
            onClick={onRefresh}
            disabled={loading}
          >
            <FaRedo className={loading ? "me-2 fa-spin" : "me-2"} /> Refresh
          </button>
        )}

        {actions.map((action, index) => (
          <button
            key={index}
            className={`btn btn-${action.variant || "primary"} ${
              index > 0 ? "ms-2" : ""
            }`}
            onClick={action.onClick}
            disabled={action.disabled || loading}
            title={action.tooltip}
          >
            {action.icon && <span className="me-2">{action.icon}</span>}
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
};

PageHeader.propTypes = {
  icon: PropTypes.element,
  title: PropTypes.string.isRequired,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      icon: PropTypes.element,
      label: PropTypes.string.isRequired,
      onClick: PropTypes.func.isRequired,
      variant: PropTypes.string,
      disabled: PropTypes.bool,
      tooltip: PropTypes.string,
    })
  ),
  loading: PropTypes.bool,
  onRefresh: PropTypes.func,
};

export default PageHeader;
