export function PageContainer({ children, className = '' }) {
  return (
    <div className={`p-4 md:p-5 max-w-[1600px] mx-auto w-full ${className}`}>
      {children}
    </div>
  );
}
