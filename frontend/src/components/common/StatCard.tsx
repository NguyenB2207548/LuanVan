import React from "react";

interface StatCardProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    loading?: boolean;
}

const StatCard = ({ label, value, icon, loading }: StatCardProps) => {
    const renderIcon = () => {
        if (!icon) return null;
        if (React.isValidElement(icon)) {
            return React.cloneElement(icon as React.ReactElement<any>, {
                size: 16,
                strokeWidth: 2,
            });
        }
        const IconComponent = icon as any;
        return <IconComponent size={16} strokeWidth={2} />;
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex flex-col justify-center h-24">
            <div className="flex items-center gap-2.5 mb-1.5">
                <div className="text-gray-400 shrink-0 flex items-center justify-center">
                    {renderIcon()}
                </div>
                <span className="text-[13px] text-gray-500 font-normal">{label}</span>
            </div>
            <div>
                {loading ? (
                    <div className="h-7 w-12 bg-gray-100 rounded animate-pulse" />
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