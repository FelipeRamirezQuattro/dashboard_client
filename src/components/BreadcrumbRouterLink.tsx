import React from "react";
import { useNavigate } from "react-router-dom";
import { BreadcrumbLink } from "@odessa-separator/ui";

interface BreadcrumbRouterLinkProps {
  to: string;
  children: React.ReactNode;
}

// The library's BreadcrumbLink renders a plain <a> (no asChild), so client-side
// navigation is wired here. Modified clicks keep the browser default.
const BreadcrumbRouterLink: React.FC<BreadcrumbRouterLinkProps> = ({
  to,
  children,
}) => {
  const navigate = useNavigate();

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    navigate(to);
  };

  return (
    <BreadcrumbLink href={to} onClick={handleClick}>
      {children}
    </BreadcrumbLink>
  );
};

export default BreadcrumbRouterLink;
