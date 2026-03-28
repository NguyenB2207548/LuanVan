import React from "react";

interface StatCardProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    loading?: boolean;
}

const StatCard = ({ label, value, icon, loading }: StatCardProps) => {
    return (
        <div className="bg-white p-5 
                        border border-gray-200
                        rounded-xl 
                        shadow-[0_2px_3px_rgba(0,0,0,0.02)] 
                        flex flex-col justify-center h-24">

            <div className="flex items-center gap-2.5 mb-2">
                <div className="text-gray-400 shrink-0">
                    {/* Ép kiểu sang any để pass check size */}
                    {React.cloneElement(icon as any, { size: 16 })}
                </div>
                <span className="text-[13px] text-gray-500 font-normal">
                    {label}
                </span>
            </div>

            <div>
                {loading ? (
                    <div className="h-7 w-12 bg-gray-50 rounded animate-pulse"></div>
                ) : (
                    <p className="text-2xl font-bold text-gray-900 tabular-nums">
                        {value}
                    </p>
                )}
            </div>
        </div>
    );
};

export default StatCard;