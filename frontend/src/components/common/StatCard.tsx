import React from "react";

interface StatCardProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    loading?: boolean;
}

const StatCard = ({ label, value, icon, loading }: StatCardProps) => {
    // Hàm render icon an toàn
    const renderIcon = () => {
        if (!icon) return null;

        // Nếu icon là một React Element hợp lệ (ví dụ: <Palette />)
        if (React.isValidElement(icon)) {
            return React.cloneElement(icon as React.ReactElement<any>, {
                size: 16,
                strokeWidth: 2 // Thêm cái này cho icon thanh mảnh giống ảnh mẫu
            });
        }

        // Trường hợp truyền thẳng Component (ví dụ: Palette)
        const IconComponent = icon as any;
        return <IconComponent size={16} strokeWidth={2} />;
    };

    return (
        <div className="bg-white p-5 
                    border border-gray-100/60 
                    rounded-xl 
                    shadow-[0_1px_2px_rgba(0,0,0,0.02)] 
                    flex flex-col justify-center h-24">

            <div className="flex items-center gap-2.5 mb-1.5">
                <div className="text-gray-400 shrink-0 flex items-center justify-center">
                    {renderIcon()}
                </div>
                <span className="text-[13px] text-gray-500 font-normal">
                    {label}
                </span>
            </div>

            <div>
                {loading ? (
                    <div className="h-7 w-12 bg-gray-50 rounded animate-pulse"></div>
                ) : (
                    <p className="text-2xl font-bold text-gray-900 tabular-nums leading-none">
                        {value}
                    </p>
                )}
            </div>
        </div>
    );
};

export default StatCard;