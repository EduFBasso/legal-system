// src/components/Sidebar.jsx
import './Sidebar.css';

export default function Sidebar({ children }) {
  return (
    <aside className="sidebar">
      {children}
    </aside>
  );
}
