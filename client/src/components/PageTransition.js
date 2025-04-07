import React from "react";
import "./PageTransition.css";

const PageTransition = ({ children }) => {
  return <div className="page-fade">{children}</div>;
};

export default PageTransition;