import React from 'react';
import { Link } from 'react-router';
import { Button } from '../../ui/Button';
import nexusLogoWhite from '../../../assets/brand/nexus-logo-white.svg';

interface NetworkErrorProps {
    onRetry: () => void;
    isPending?: boolean;
}

const NetworkError: React.FC<NetworkErrorProps> = ({ onRetry, isPending = false }) => {
    return (
        <>
            <Link to="/" className="absolute top-[28px] left-[32px] z-[5] inline-flex items-center no-underline">
                <img src={nexusLogoWhite} alt="Nexus Academy" className="w-auto block h-[50px]" />
            </Link>

            <div className="w-full max-w-[420px] mx-auto sm:mx-0 sm:ml-8 lg:ml-16 xl:ml-20 mt-[70px] sm:mt-0 flex-1 flex flex-col justify-center items-center text-center">
                {/* Icon */}
                <div className="h-[72px] w-[72px] rounded-full flex items-center justify-center mb-[20px]" style={{ backgroundColor: '#eed3cc' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-[32px] h-[32px]" style={{ color: '#b43b1f' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18m-4.545-6.818a7 7 0 00-9.9 0m2.828 2.828a3 3 0 004.244 0M19.07 9.429a11 11 0 00-14.14 0M21.9 6.6a15 15 0 00-19.8 0" />
                    </svg>
                </div>

                {/* Eyebrow Header */}
                <span className="block text-[12px] font-bold tracking-[0.14em] uppercase mb-[12px]" style={{ fontFamily: 'var(--font-sans)', color: 'rgba(255, 255, 255, 0.9)' }}>
                    CONNECTION
                </span>

                {/* Main Title */}
                <h1 className="text-[38px] font-extrabold tracking-[-0.02em] mb-[12px] leading-[1.08]" style={{ fontFamily: 'var(--font-sans)', color: '#ffffff' }}>
                    Connection lost
                </h1>

                {/* Subtitle */}
                <p className="text-[16px] leading-[1.5] mb-[32px]" style={{ fontFamily: 'var(--font-sans)', color: 'rgba(255, 255, 255, 0.9)' }}>
                    Check your internet connection and try again.
                </p>

                {/* Retry Button */}
                <Button
                    onClick={onRetry}
                    disabled={isPending}
                    type="button"
                    className="flex h-[52px] w-full items-center justify-center gap-[9px] rounded-full font-bold shadow-[0_6px_20px_-6px_#0006] transition-[transform,box-shadow] duration-150 hover:-translate-y-[1px] disabled:opacity-60 disabled:cursor-not-allowed mb-[24px] border-none outline-none"
                    style={{ backgroundColor: '#f1b020', color: '#141414', fontFamily: 'var(--font-sans)', fontSize: '16px' }}
                >
                    {isPending ? (
                        <>
                            <svg className="w-[20px] h-[20px] animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Retrying...
                        </>
                    ) : (
                        "Retry"
                    )}
                </Button>

                {/* Bottom subtext */}
                <p className="text-[14px] leading-[1.5] px-[8px]" style={{ fontFamily: 'var(--font-sans)', color: 'rgba(255, 255, 255, 0.8)' }}>
                    If this keeps happening, your network may be blocking the application.
                </p>
            </div>

            <div className="w-full text-[13px] max-w-[420px] mx-auto sm:mx-0 sm:ml-8 lg:ml-16 xl:ml-20 pb-[24px] sm:pb-[32px] flex flex-col sm:flex-row sm:items-center justify-between font-semibold" style={{ fontFamily: 'var(--font-sans)', color: 'rgba(255, 255, 255, 0.8)' }}>
                <div className="flex flex-wrap items-center gap-x-[16px] gap-y-[8px]">
                    <a href="#" className="hover:text-white transition-colors" style={{ textDecoration: 'none' }}>Site Map</a>
                    <span className="hidden sm:inline opacity-50">·</span>
                    <a href="#" className="hover:text-white transition-colors" style={{ textDecoration: 'none' }}>Privacy</a>
                    <span className="hidden sm:inline opacity-50">·</span>
                    <a href="#" className="hover:text-white transition-colors" style={{ textDecoration: 'none' }}>Terms of Use</a>
                    <span className="hidden sm:inline opacity-50">·</span>
                    <a href="#" className="hover:text-white transition-colors" style={{ textDecoration: 'none' }}>Cookie Policy</a>
                </div>
            </div>
        </>
    );
};

export default NetworkError;
