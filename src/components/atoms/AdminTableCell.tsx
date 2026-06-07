interface AdminTableCellProps {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
}

const alignClass = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

export function AdminTableCell({
  children,
  className = "",
  align = "left",
}: AdminTableCellProps) {
  return (
    <td
      className={`px-4 py-3 text-sm text-[var(--slate-200)] ${alignClass[align]} ${className}`}
    >
      {children}
    </td>
  );
}
