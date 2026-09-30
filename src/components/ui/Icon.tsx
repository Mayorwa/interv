import type { FC } from "react";

interface IconProps {
  name: string;
  viewBox?: string;
  width?: string;
  height?: string;
  className?: string;
}

const Icon: FC<IconProps> = ({
  name,
  viewBox = "0 0 32 32",
  width = "18px",
  height = "18px",
  className = "",
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox={viewBox}
      className={`icon ${className}`}
      fill="currentColor"
      xmlnsXlink="http://www.w3.org/1999/xlink"
    >
      <use xlinkHref={`/sprite.svg#icon-${name}`} />
    </svg>
  );
};

export default Icon;
